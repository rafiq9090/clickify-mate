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

pub async fn handle_facebook(
    State((pool, client, enc_key)): State<(PgPool, Client, String)>,
    Query(params): Query<HashMap<String, String>>,
    Json(payload): Json<Value>,
) -> Json<Value> {
    crate::HTTP_REQUESTS_TOTAL.fetch_add(1, std::sync::atomic::Ordering::Relaxed);

    let agent_id_str = params.get("agent_id");
    let entry = match payload.get("entry").and_then(|e| e.as_array()).and_then(|a| a.first()) {
        Some(e) => e,
        None => return Json(serde_json::json!({ "success": true })),
    };

    let page_id = entry.get("id").or_else(|| entry.get("uid")).and_then(|id| id.as_str()).unwrap_or("");
    if page_id.is_empty() {
        return Json(serde_json::json!({ "success": true }));
    }

    // Load agent config
    let mut agent = None;
    if let Some(id_str) = agent_id_str {
        if let Ok(uid) = Uuid::parse_str(id_str) {
            if let Ok(Some(a)) = db::get_agent_config(&pool, uid).await {
                agent = Some(a);
            }
        }
    }

    if agent.is_none() {
        // Find by pageId
        if let Ok(Some(a)) = sqlx::query_as::<_, db::AgentConfig>(
            "SELECT * FROM public.agent_configs WHERE external_id = $1 AND platform = 'messenger'"
        )
        .bind(page_id)
        .fetch_optional(&pool)
        .await {
            agent = Some(a);
        }
    }

    if agent.is_none() {
        // Fallback: search any platform match
        if let Ok(Some(a)) = sqlx::query_as::<_, db::AgentConfig>(
            "SELECT * FROM public.agent_configs WHERE external_id = $1 LIMIT 1"
        )
        .bind(page_id)
        .fetch_optional(&pool)
        .await {
            agent = Some(a);
        }
    }

    let mut agent = match agent {
        Some(a) => a,
        None => return Json(serde_json::json!({ "success": false, "error": "Agent not registered" })),
    };

    // Auto-bind Page ID
    if agent.external_id.as_deref().unwrap_or("") != page_id {
        let _ = db::update_agent_external_id(&pool, agent.id, page_id).await;
    }

    // Fallback knowledge check
    if agent.knowledge.as_deref().unwrap_or("").len() < 5 {
        if let Ok(Some(fallback)) = db::get_user_fallback_agent(&pool, agent.user_id, &agent.platform).await {
            agent = fallback;
        }
    }

    let enc_token = match &agent.encrypted_token {
        Some(t) => t,
        None => return Json(serde_json::json!({ "success": false, "error": "Agent token missing" })),
    };
    let page_access_token = match crypto::decrypt(enc_token, &enc_key) {
        Ok(t) => t,
        Err(e) => return Json(serde_json::json!({ "success": false, "error": format!("Token decrypt failed: {}", e) })),
    };

    let groq_key = match db::get_groq_api_key(&pool).await {
        Ok(Some(k)) => k,
        _ => return Json(serde_json::json!({ "success": false, "error": "Groq Key missing" })),
    };

    // Handle Messenger
    if let Some(messaging_arr) = entry.get("messaging").and_then(|m| m.as_array()) {
        if let Some(msg_event) = messaging_arr.first() {
            let sender_id = msg_event.get("sender").and_then(|s| s.get("id")).and_then(|id| id.as_str()).unwrap_or("");
            let user_text = msg_event.get("message").and_then(|m| m.get("text")).and_then(|t| t.as_str()).unwrap_or("").to_string();

            if sender_id.is_empty() {
                return Json(serde_json::json!({ "success": true }));
            }

            // Save user msg to history
            let _ = db::save_chat_message(&pool, agent.id, sender_id, "user", &user_text, 0).await;

            // Load history
            let limit_time = Utc::now() - chrono::Duration::hours(24);
            let history_db = db::get_chat_history(&pool, agent.id, sender_id, limit_time).await.unwrap_or_default();
            let history: Vec<groq::ChatMessage> = history_db.into_iter().map(|m| groq::ChatMessage {
                role: m.role,
                content: m.content,
            }).collect();

            // Load lead
            let email_key = format!("{}@messenger.facebook.com", sender_id);
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

            // AI Reply
            let behavior = agent.agent_behavior.clone().unwrap_or_else(|| serde_json::json!({ "tone": "Mixed" }));
            let tone = behavior.get("tone").and_then(|t| t.as_str()).unwrap_or("Mixed");

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
                Err(e) => return Json(serde_json::json!({ "success": false, "error": format!("AI reply failed: {}", e) })),
            };

            let mut ai_reply = ai_result.reply.clone();

            // Extract payment transaction ID
            let mut payment_transaction_id = None;
            let user_text_lower = user_text.to_lowercase();
            if user_text_lower.contains("bkash") || user_text_lower.contains("nagad") || user_text_lower.contains("trx") {
                let parts: Vec<&str> = user_text.split_whitespace().collect();
                for part in parts {
                    let clean = part.replace(|c: char| !c.is_alphanumeric(), "");
                    if clean.len() >= 8 && clean.len() <= 15 {
                        payment_transaction_id = Some(clean.to_string());
                        break;
                    }
                }
            }

            // Update session state in Lead
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
                    "platform": "messenger",
                    "customer": sender_id,
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

            // Parse Order Data tag
            if let Some(caps) = ai_reply.clone().find("[ORDER_DATA:") {
                if let Some(end) = ai_reply[caps..].find(']') {
                    let full_tag = ai_reply[caps..caps + end + 1].to_string();
                    let order_info = ai_reply[caps + 12..caps + end].to_string();
                    ai_reply = ai_reply.replace(&full_tag, "").trim().to_string();
                    ai_reply.push_str("\n\n[STOCK RESERVED]: Order successfully placed. Stock synced!");

                    if let Some(ref lead) = session_lead {
                        let mut lead_data = lead.data.clone().unwrap_or_else(|| serde_json::json!({}));
                        lead_data["order"] = serde_json::json!(order_info);
                        lead_data["current_state"] = serde_json::json!("sales");
                        lead_data["collected_details"] = serde_json::json!({});
                        let _ = db::update_lead_data(&pool, lead.id, lead_data).await;
                    }
                }
            }

            // Parse SEND_IMAGES tag
            if let Some(caps) = ai_reply.clone().find("[SEND_IMAGES:") {
                if let Some(end) = ai_reply[caps..].find(']') {
                    let full_tag = ai_reply[caps..caps + end + 1].to_string();
                    ai_reply = ai_reply.replace(&full_tag, "").trim().to_string();
                }
            }

            if ai_reply.trim().is_empty() {
                ai_reply = "I am checking that for you. What else can I help you with?".to_string();
            }

            // Save assistant msg to history
            let _ = db::save_chat_message(&pool, agent.id, sender_id, "assistant", &ai_reply, ai_result.tokens).await;

            // Send message back to Facebook Graph API
            let send_msg_url = format!("https://graph.facebook.com/v19.0/me/messages?access_token={}", page_access_token);
            let send_body = serde_json::json!({
                "recipient": { "id": sender_id },
                "message": { "text": ai_reply }
            });
            let _ = client.post(&send_msg_url).json(&send_body).send().await;
        }
    }

    Json(serde_json::json!({ "success": true }))
}
