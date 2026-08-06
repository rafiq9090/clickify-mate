use axum::{
    extract::{Query, State},
    Json,
};
use reqwest::Client;
use sqlx::PgPool;
use std::collections::HashMap;
use uuid::Uuid;
use chrono::Utc;
use serde_json::Value;

use crate::db;
use crate::crypto;
use crate::groq;

pub async fn handle_telegram(
    State((pool, client, enc_key)): State<(PgPool, Client, String)>,
    Query(params): Query<HashMap<String, String>>,
    Json(payload): Json<Value>,
) -> Json<Value> {
    crate::HTTP_REQUESTS_TOTAL.fetch_add(1, std::sync::atomic::Ordering::Relaxed);

    // 1. Get agent_id
    let agent_id_str = match params.get("agent_id") {
        Some(id) => id,
        None => return Json(serde_json::json!({ "success": false, "error": "Missing agent_id" })),
    };
    let agent_id = match Uuid::parse_str(agent_id_str) {
        Ok(uid) => uid,
        Err(_) => return Json(serde_json::json!({ "success": false, "error": "Invalid agent_id" })),
    };

    // 2. Parse Telegram message payload
    let message = payload.get("message").or_else(|| payload.get("edited_message"));
    let message_obj = match message {
        Some(m) => m,
        None => return Json(serde_json::json!({ "success": true })), // ignore non-message events
    };

    let chat_id = match message_obj.get("chat").and_then(|c| c.get("id")).and_then(|id| id.as_i64()) {
        Some(id) => id,
        None => return Json(serde_json::json!({ "success": true })),
    };

    let message_id = message_obj.get("message_id").and_then(|id| id.as_i64()).unwrap_or(0);
    
    // We get text
    let user_text = message_obj.get("text").and_then(|t| t.as_str()).unwrap_or("").to_string();

    // 3. Load Groq API key from settings
    let groq_key = match db::get_groq_api_key(&pool).await {
        Ok(Some(k)) => k,
        _ => return Json(serde_json::json!({ "success": false, "error": "Missing Groq API Key in settings" })),
    };

    // 4. Load agent config
    let mut agent = match db::get_agent_config(&pool, agent_id).await {
        Ok(Some(a)) => a,
        _ => return Json(serde_json::json!({ "success": false, "error": "Agent not found" })),
    };

    // Smart fallback if knowledge is empty
    if agent.knowledge.as_deref().unwrap_or("").len() < 5 {
        if let Ok(Some(fallback)) = db::get_user_fallback_agent(&pool, agent.user_id, &agent.platform).await {
            agent = fallback;
        }
    }

    // 5. Decrypt bot token
    let enc_token = match &agent.encrypted_token {
        Some(t) => t,
        None => return Json(serde_json::json!({ "success": false, "error": "Agent token not configured" })),
    };
    let bot_token = match crypto::decrypt(enc_token, &enc_key) {
        Ok(t) => t,
        Err(e) => return Json(serde_json::json!({ "success": false, "error": format!("Token decrypt failed: {}", e) })),
    };

    // Auto-Bind Fix: If agent was found via agent_id, ensure its external_id matches the current Bot ID / Chat ID
    let current_ext_id = chat_id.to_string();
    if agent.external_id.as_deref().unwrap_or("") != current_ext_id {
        let _ = db::update_agent_external_id(&pool, agent.id, &current_ext_id).await;
    }

    // 6. Save User message to history
    let _ = db::save_chat_message(&pool, agent.id, &current_ext_id, "user", &user_text, 0).await;

    // 7. Load previous chat history
    let limit_time = Utc::now() - chrono::Duration::hours(24);
    let history_db = db::get_chat_history(&pool, agent.id, &current_ext_id, limit_time).await.unwrap_or_default();
    
    // Convert db::ChatMessage to groq::ChatMessage
    let history: Vec<groq::ChatMessage> = history_db.into_iter().map(|m| groq::ChatMessage {
        role: m.role,
        content: m.content,
    }).collect();

    // 8. Load lead state or create it
    let email_key = format!("{}@telegram.org", chat_id);
    let mut session_lead = db::get_lead_by_email(&pool, &email_key).await.unwrap_or_default();
    
    let mut session_state = serde_json::json!({ "current_state": "sales", "collected_details": {} });
    if let Some(ref lead) = session_lead {
        if let Some(ref data) = lead.data {
            if let Some(cs) = data.get("current_state") {
                session_state["current_state"] = cs.clone();
            }
            if let Some(cd) = data.get("collected_details") {
                session_state["collected_details"] = cd.clone();
            }
        }
    }

    // 9. Generate Reaction and AI reply
    let behavior = agent.agent_behavior.clone().unwrap_or_else(|| serde_json::json!({ "tone": "Mixed" }));
    let tone = behavior.get("tone").and_then(|t| t.as_str()).unwrap_or("Mixed");

    // Sentiment Reaction
    let emoji = groq::analyze_sentiment_and_pick_emoji(&client, &groq_key, &user_text, &history).await;
    if emoji != "none" {
        // Send reaction to Telegram API
        let reaction_url = format!("https://api.telegram.org/bot{}/setMessageReaction", bot_token);
        let reaction_body = serde_json::json!({
            "chat_id": chat_id,
            "message_id": message_id,
            "reaction": [{ "type": "emoji", "emoji": emoji }]
        });
        let _ = client.post(&reaction_url).json(&reaction_body).send().await;
    }

    // AI Reply
    let ai_result = match groq::generate_ai_reply(
        &client,
        &groq_key,
        &user_text,
        tone,
        agent.knowledge.as_deref().unwrap_or(""),
        &history,
        session_state,
        0,
        &agent.updated_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
    ).await {
        Ok(res) => res,
        Err(e) => return Json(serde_json::json!({ "success": false, "error": format!("AI generation failed: {}", e) })),
    };

    let mut ai_reply = ai_result.reply.clone();

    // 10. Extract payment transaction ID
    let mut payment_transaction_id = None;
    let user_text_lower = user_text.to_lowercase();
    if user_text_lower.contains("bkash") || user_text_lower.contains("nagad") || user_text_lower.contains("trx") {
        // extract candidate transaction ID
        let parts: Vec<&str> = user_text.split_whitespace().collect();
        for part in parts {
            let clean = part.replace(|c: char| !c.is_alphanumeric(), "");
            if clean.len() >= 8 && clean.len() <= 15 {
                payment_transaction_id = Some(clean.to_string());
                break;
            }
        }
    }

    // 11. Update session state in Lead
    let updated_details = ai_result.updated_state.get("collected_details").cloned().unwrap_or_else(|| serde_json::json!({}));
    let updated_state = ai_result.updated_state.get("current_state").and_then(|v| v.as_str()).unwrap_or("sales");

    let final_tx_id = payment_transaction_id.or_else(|| {
        session_lead.as_ref().and_then(|l| l.data.as_ref()).and_then(|d| d.get("payment_transaction_id")).and_then(|v| v.as_str().map(|s| s.to_string()))
    });

    if let Some(ref mut lead) = session_lead {
        let mut lead_data = lead.data.clone().unwrap_or_else(|| serde_json::json!({}));
        lead_data["current_state"] = serde_json::json!(updated_state);
        lead_data["collected_details"] = updated_details;
        if let Some(ref tx) = final_tx_id {
            lead_data["payment_transaction_id"] = serde_json::json!(tx);
        }
        let _ = db::update_lead_data(&pool, lead.id, lead_data).await;
    } else {
        let lead_data = serde_json::json!({
            "platform": "telegram",
            "customer": chat_id.to_string(),
            "agent_id": agent.id,
            "user_id": agent.user_id,
            "current_state": updated_state,
            "collected_details": updated_details,
            "payment_transaction_id": final_tx_id
        });
        if let Ok(inserted) = db::insert_lead(&pool, &email_key, "ai_agent", lead_data).await {
            session_lead = Some(inserted);
        }
    }

    // 12. Parse Order Data tag
    if let Some(caps) = ai_reply.clone().find("[ORDER_DATA:") {
        if let Some(end) = ai_reply[caps..].find(']') {
            let full_tag = ai_reply[caps..caps + end + 1].to_string();
            let order_info = ai_reply[caps + 12..caps + end].to_string();
            ai_reply = ai_reply.replace(&full_tag, "").trim().to_string();

            // Append order status
            ai_reply.push_str("\n\n[STOCK RESERVED]: Order successfully placed. Stock synced!");

            // Update lead with final order info
            if let Some(ref lead) = session_lead {
                let mut lead_data = lead.data.clone().unwrap_or_else(|| serde_json::json!({}));
                lead_data["order"] = serde_json::json!(order_info);
                lead_data["current_state"] = serde_json::json!("sales");
                lead_data["collected_details"] = serde_json::json!({});
                let _ = db::update_lead_data(&pool, lead.id, lead_data).await;
            }
        }
    }

    // Prevent Telegram empty message error
    if ai_reply.trim().is_empty() {
        ai_reply = "I am checking that for you. What else can I help you with?".to_string();
    }

    // 13. Save response message to history
    let _ = db::save_chat_message(&pool, agent.id, &current_ext_id, "assistant", &ai_reply, ai_result.tokens).await;

    // 14. Send Message back to Telegram API
    let send_message_url = format!("https://api.telegram.org/bot{}/sendMessage", bot_token);
    let send_body = serde_json::json!({
        "chat_id": chat_id,
        "text": ai_reply
    });
    let _ = client.post(&send_message_url).json(&send_body).send().await;

    // 15. Check if images need to be sent [SEND_IMAGES: ...]
    let mut images_to_send = Vec::new();
    let product_images = agent.product_images.clone().unwrap_or_else(|| serde_json::json!([]));
    let all_images: Vec<String> = if let Some(arr) = product_images.as_array() {
        arr.iter().filter_map(|item| {
            if let Some(s) = item.as_str() {
                Some(s.to_string())
            } else if let Some(obj) = item.as_object() {
                obj.get("url").and_then(|v| v.as_str().map(|s| s.to_string()))
            } else {
                None
            }
        }).collect()
    } else {
        Vec::new()
    };

    if let Some(caps) = ai_reply.clone().find("[SEND_IMAGES:") {
        if let Some(end) = ai_reply[caps..].find(']') {
            let full_tag = ai_reply[caps..caps + end + 1].to_string();
            ai_reply = ai_reply.replace(&full_tag, "").trim().to_string();
            if !all_images.is_empty() {
                images_to_send.push(all_images[0].clone());
            }
        }
    }

    if !images_to_send.is_empty() {
        let send_photo_url = format!("https://api.telegram.org/bot{}/sendPhoto", bot_token);
        let send_photo_body = serde_json::json!({
            "chat_id": chat_id,
            "photo": images_to_send[0]
        });
        let _ = client.post(&send_photo_url).json(&send_photo_body).send().await;
    }

    Json(serde_json::json!({ "success": true }))
}
