use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize, Debug)]
struct GroqChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
}

#[derive(Deserialize, Debug)]
struct Choice {
    message: MessageContent,
}

#[derive(Deserialize, Debug)]
struct MessageContent {
    content: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct Usage {
    pub prompt_tokens: i32,
    pub completion_tokens: i32,
    pub total_tokens: i32,
}

#[derive(Deserialize, Debug)]
struct GroqChatResponse {
    choices: Vec<Choice>,
    usage: Option<Usage>,
}

pub struct AIReplyResult {
    pub reply: String,
    pub tokens: i32,
    pub updated_state: serde_json::Value,
}

async fn fetch_groq_completions(
    client: &Client,
    api_key: &str,
    model: &str,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: Option<u32>,
) -> Result<(String, Usage), String> {
    let req_body = GroqChatRequest {
        model: model.to_string(),
        messages,
        temperature,
        max_tokens,
    };

    let response = client
        .post("https://api.groq.com/openai/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("Groq API status err: {}", err_text));
    }

    let parsed: GroqChatResponse = response
        .json()
        .await
        .map_err(|e| format!("JSON parse failed: {}", e))?;

    let text = parsed
        .choices
        .first()
        .and_then(|c| c.message.content.clone())
        .unwrap_or_default();

    let usage = parsed.usage.unwrap_or(Usage {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
    });

    Ok((text, usage))
}

pub async fn classify_intent(
    client: &Client,
    api_key: &str,
    prompt: &str,
    history: &[ChatMessage],
    current_state: &str,
) -> String {
    let mut history_context = String::new();
    let history_slice = if history.len() > 3 {
        &history[history.len() - 3..]
    } else {
        history
    };

    for m in history_slice {
        history_context.push_str(&format!("{}: {}\n", m.role, m.content));
    }

    let system_prompt = format!(
        "You are an intent classifier for an e-commerce assistant.\n\
         Analyze the customer's new message and the recent conversation history to classify the intent.\n\n\
         ALLOWED INTENTS:\n\
         1. \"sales\": Expressing intent to buy, checkout, providing shipping details (name, phone, address, quantity), confirming order summary.\n\
         2. \"faq\": Questions about shipping policies, shop location, return/exchange guidelines, shipping times, refund policies, complaints, quality issues, damaged items, color fading/running issues, customer support, or general troubleshooting help.\n\
         3. \"sizing\": Questions about size charts, height/weight recommendation, choosing colors/fit/fabric for buying, catalog inquiry, checking stock, or asking to see product pictures/photos.\n\
         4. \"negotiation\": Asking for discounts, promo codes, bulk pricing, or free delivery.\n\n\
         RULES:\n\
         1. Output EXACTLY one lowercase word: \"sales\", \"faq\", \"sizing\", or \"negotiation\".\n\
         2. The user's message can be in any language (English, Bengali, Arabic, Hindi, Spanish, etc.) or transliterated forms. Map them to the correct intent category regardless of the language.\n\
         3. If the user message is vague, a simple greeting, or a neutral answer, default to the current conversation state: \"{}\".\n\
         4. Return ONLY the single word. No explanation, no markdown, no punctuation.",
        current_state
    );

    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: system_prompt,
        },
        ChatMessage {
            role: "user".to_string(),
            content: format!("Recent History:\n{}\n\nCustomer Message: \"{}\"", history_context, prompt),
        },
    ];

    match fetch_groq_completions(client, api_key, "llama-3.1-8b-instant", messages, 0.1, Some(10)).await {
        Ok((text, _)) => {
            let clean = text.trim().to_lowercase();
            if vec!["sales", "faq", "sizing", "negotiation"].contains(&clean.as_str()) {
                clean
            } else {
                current_state.to_string()
            }
        }
        Err(_) => current_state.to_string(),
    }
}

pub async fn analyze_sentiment_and_pick_emoji(
    client: &Client,
    api_key: &str,
    prompt: &str,
    history: &[ChatMessage],
) -> String {
    let mut messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: "You are a sentiment analyzer. Analyze the user's message and pick EXACTLY ONE emoji reaction from this list:\n\
                     👍 (Agreement, General)\n\
                     ❤️ (Love, Happy, Appreciation)\n\
                     🤔 (Question, Confused)\n\
                     😂 (Funny, Laughing)\n\
                     😟 (Issue, Sad, Complaint)\n\
                     😮 (Surprised, Wow)\n\
                     🚨 (Urgent, Emergency)\n\n\
                     CRITICAL RULES:\n\
                     1. Return ONLY the emoji character.\n\
                     2. No text, no explanation.\n\
                     3. If unsure or message is neutral, return 'none'.\n\
                     4. Be smart about sarcasm—check context if provided.".to_string(),
        }
    ];

    let history_slice = if history.len() > 3 {
        &history[history.len() - 3..]
    } else {
        history
    };

    for msg in history_slice {
        messages.push(msg.clone());
    }

    messages.push(ChatMessage {
        role: "user".to_string(),
        content: format!("Analyze this: \"{}\"", prompt),
    });

    match fetch_groq_completions(client, api_key, "llama-3.1-8b-instant", messages, 0.1, Some(5)).await {
        Ok((emoji, _)) => {
            let trimmed = emoji.trim().to_string();
            if trimmed.chars().count() > 3 {
                "none".to_string()
            } else {
                trimmed
            }
        }
        Err(_) => "none".to_string(),
    }
}

pub async fn filter_relevant_knowledge(
    client: &Client,
    api_key: &str,
    query: &str,
    full_knowledge: &str,
) -> String {
    if full_knowledge.len() < 10000 {
        return full_knowledge.to_string();
    }

    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: "You are a Knowledge Filter. Your task is to extract ONLY the parts of the provided Knowledge Base that are relevant to the user's query.\n\n\
                     RULES:\n\
                     1. The user's query can be in any language or Romanized transliterations (e.g. Banglish/Hinglish). Understand the semantic meaning in any language and extract the matching facts.\n\
                     2. If the knowledge base is irrelevant to the query, return \"No relevant information found.\"\n\
                     3. Keep the extracted text concise.\n\
                     4. Preserve specific facts like prices, links, or names.\n\
                     5. Return ONLY the relevant snippets.".to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: format!("Query: {}\n\nFull Knowledge Base:\n{}", query, full_knowledge),
        },
    ];

    match fetch_groq_completions(client, api_key, "llama-3.1-8b-instant", messages, 0.1, Some(500)).await {
        Ok((filtered, _)) => {
            let trimmed = filtered.trim().to_string();
            if trimmed.is_empty() {
                full_knowledge.to_string()
            } else {
                trimmed
            }
        }
        Err(_) => full_knowledge.to_string(),
    }
}

fn extract_order_form(knowledge: &str) -> String {
    let lines: Vec<&str> = knowledge.lines().collect();
    let mut start_index = -1;
    let mut header_level = 2;

    for (i, line) in lines.iter().enumerate() {
        let clean = line.trim().to_lowercase();
        if clean.contains("order confirmation form")
            || clean.contains("order form")
            || clean.contains("order (")
            || clean == "## order"
            || clean.starts_with("## order ")
        {
            start_index = i as i32;
            if let Some(caps) = line.trim().split_whitespace().next() {
                if caps.starts_with('#') {
                    header_level = caps.len();
                }
            }
            break;
        }
    }

    if start_index == -1 {
        return "".to_string();
    }

    let mut result_lines = Vec::new();
    result_lines.push(lines[start_index as usize]);

    for i in (start_index as usize + 1)..lines.len() {
        let line = lines[i];
        let trimmed = line.trim();
        if trimmed.starts_with('#') {
            if let Some(caps) = trimmed.split_whitespace().next() {
                if caps.len() <= header_level {
                    break;
                }
            }
        }
        result_lines.push(line);
    }

    result_lines.join("\n").trim().to_string()
}

pub async fn generate_ai_reply(
    client: &Client,
    api_key: &str,
    prompt: &str,
    tone: &str,
    knowledge: &str,
    history: &[ChatMessage],
    state: serde_json::Value,
    depth: u32,
    last_updated: &str,
) -> Result<AIReplyResult, String> {
    let mut current_state = state.get("current_state")
        .and_then(|v| v.as_str())
        .unwrap_or("sales")
        .to_string();
        
    let mut collected_details = state.get("collected_details")
        .cloned()
        .unwrap_or_else(|| serde_json::json!({}));

    // Extract order confirmation fields
    let order_form = extract_order_form(knowledge);

    // Intent Classification
    let intent = classify_intent(client, api_key, prompt, history, &current_state).await;
    current_state = intent.clone();

    // RAG filtering
    let filtered_knowledge = if intent == "faq" || intent == "sizing" {
        filter_relevant_knowledge(client, api_key, prompt, knowledge).await
    } else {
        "".to_string()
    };

    let mut system_prompt = if intent == "faq" {
        format!(
            "You are a Customer Support FAQ Expert.\nTone: {}\n\n\
             Use ONLY the following context to answer the user's questions:\n{}\n\n\
             Customer's Session Details:\n{}\n\n\
             STRICT RULES:\n\
             1. Rely ONLY on the provided context. If the answer is not in the context, say you are checking with the team.\n\
             2. Do NOT collect order details or checkout information.\n\
             3. If the user is ready to order, wants to checkout, or asks how to place an order, say: \"Perfect! Let's get your order completed.\" and append the tag: [ROUTE: sales]\n\
             4. Keep replies friendly, concise (under 50 words).\n\
             5. LANGUAGE RULE: Always respond in the EXACT same language or transliterated form that the customer is using.\n\
             6. EMOJI RULE: Do NOT generate, output, or use any emojis in your responses under any circumstances. Keep responses completely emoji-free.",
            tone,
            if filtered_knowledge.is_empty() { "No specific policy info." } else { &filtered_knowledge },
            collected_details
        )
    } else if intent == "sizing" {
        format!(
            "You are a Sizing & Style Advisor.\nTone: {}\n\n\
             Use the business size charts and catalog details to recommend the correct product size:\n{}\n\n\
             Customer's Session Details:\n{}\n\n\
             STRICT RULES:\n\
             1. Recommend the correct size based on customer measurements (S, M, L, XL, XXL).\n\
             2. ONLY when the customer's CURRENT message explicitly asks for pictures, photos, or images of a product, you MUST output the corresponding image tag at the end of your response: [SEND_IMAGES: <Product ID>].\n\
             3. Once they agree on a size and product, say: \"Would you like me to proceed to checkout?\" and append the tag: [ROUTE: sales]\n\
             4. Do NOT collect address or checkout information.\n\
             5. Keep replies helpful and concise (under 50 words).\n\
             6. LANGUAGE RULE: Always respond in the EXACT same language or transliterated form that the customer is using.\n\
             7. EMOJI RULE: Do NOT generate, output, or use any emojis in your responses under any circumstances. Keep responses completely emoji-free.",
            tone,
            if filtered_knowledge.is_empty() { "No sizing details." } else { &filtered_knowledge },
            collected_details
        )
    } else if intent == "negotiation" {
        format!(
            "You are a Sales Negotiator.\nTone: {}\n\n\
             Approved Discount Rules:\n\
             - Buy 2 items: 10% discount\n\
             - Buy 3 or more: 15% discount\n\
             - Free Shipping for orders over ৳1500\n\
             - Maximum manual discount allowed: 10% coupon code (SAVE10) if hesitant.\n\n\
             STRICT RULES:\n\
             1. Never offer the discount immediately. Highlight the product's value first.\n\
             2. If they ask for discounts, offer standard bundle deals.\n\
             3. If they are hesitant, give them the coupon code (SAVE10).\n\
             4. Once they accept the offer or discount, append the tag: [ROUTE: sales]\n\
             5. Keep replies persuasive and concise (under 50 words).\n\
             6. LANGUAGE RULE: Always respond in the EXACT same language or transliterated form that the customer is using.\n\
             7. EMOJI RULE: Do NOT generate, output, or use any emojis in your responses under any circumstances. Keep responses completely emoji-free.",
            tone
        )
    } else {
        format!(
            "You are a High-Conversion Human Sales Assistant.\nGOAL: Complete the customer's checkout details.\nTone: {}\n\n\
             Business details:\n{}\n\n\
             Required Order Details:\n{}\n\n\
             Currently Collected Details:\n{}\n\n\
             STRICT FLOW:\n\
             1. Check what required details are missing. Ask for them politely, one by one or in a single list.\n\
             2. OUTSIDE DHAKA RULE:\n\
                - If outside Dhaka city:\n\
                  * Inform them delivery charge ৳150 must be paid in advance.\n\
                  * Tell them exactly: \"Delivery charge ৳150 age pathate hobe amader bKash/Nagad-e: [FILL: NUMBER]. Transaction ID share korun, order book kore nebo\".\n\
                  * Payment Transaction ID is a REQUIRED detail.\n\
             3. If the user provides a detail, update understanding.\n\
             4. Once ALL required details are collected, present a summary and ask for explicit confirmation.\n\
             5. ONLY when you or the customer confirms the order, you MUST append the confirmation tag: [ORDER_DATA: Item: <Item> | Qty: <Qty> | Price: <Price> | Total: <Total> | Name: <Name> | Phone: <Phone> | Address: <Address> | Size: <Size> | Color: <Color>]\n\
             6. NEVER output [ORDER_DATA] tag if details are missing.\n\
             7. If user provides new details, append: [STATE_UPDATE: key: value | key: value].\n\
             8. Do NOT answer FAQs. Redirect with: [ROUTE: faq] or [ROUTE: sizing].\n\
             9. Keep responses under 50 words.\n\
             10. LANGUAGE RULE: Always respond in the EXACT same language or transliterated form that the customer is using.\n\
             11. EMOJI RULE: Do NOT generate, output, or use any emojis in your responses under any circumstances. Keep responses completely emoji-free.",
            tone,
            knowledge,
            if order_form.is_empty() { "1. Product Name\n2. Qty\n3. Name\n4. Phone\n5. Address" } else { &order_form },
            collected_details
        )
    };

    let staleness_guard = format!(
        "\n\n[STALENESS GUARD]\n\
         - Active knowledge base is current truth (last updated: {}).\n\
         - Prioritize active knowledge base over previous chat history.\n\
         - Acknowledge changes politely.",
        if last_updated.is_empty() { "recently" } else { last_updated }
    );
    system_prompt.push_str(&staleness_guard);

    let mut messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: system_prompt,
        }
    ];

    // Smart trim: Filter out history before last order
    let mut clean_history: Vec<ChatMessage> = history.to_vec();
    let success_idx = clean_history.iter().rposition(|h| {
        let content_lower = h.content.to_lowercase();
        content_lower.contains("order placed successfully")
            || content_lower.contains("order successful")
            || content_lower.contains("[order_data")
    });

    if let Some(idx) = success_idx {
        clean_history = clean_history.split_off(idx + 1);
    }

    let start_idx = if clean_history.len() > 10 {
        clean_history.len() - 10
    } else {
        0
    };

    for msg in &clean_history[start_idx..] {
        let trimmed_content = if msg.content.len() > 200 {
            format!("{}...", &msg.content[..200])
        } else {
            msg.content.clone()
        };
        messages.push(ChatMessage {
            role: msg.role.clone(),
            content: trimmed_content,
        });
    }

    messages.push(ChatMessage {
        role: "user".to_string(),
        content: prompt.to_string(),
    });

    // Make request to Groq (llama-3.3-70b-versatile) with instant fallback
    let (mut reply, mut usage) = match fetch_groq_completions(client, api_key, "llama-3.3-70b-versatile", messages.clone(), 0.2, None).await {
        Ok(res) => res,
        Err(e) => {
            println!("[GROQ WARNING] Primary model failed: {}. Retrying fallback...", e);
            fetch_groq_completions(client, api_key, "llama-3.1-8b-instant", messages, 0.2, None)
                .await
                .map_err(|err| format!("Groq API failed completely: {}", err))?
        }
    };

    // Parse STATE_UPDATE
    if let Some(caps) = reply.clone().find("[STATE_UPDATE:") {
        if let Some(end) = reply[caps..].find(']') {
            let full_tag = reply[caps..caps + end + 1].to_string();
            let inner = reply[caps + 14..caps + end].to_string();
            
            reply = reply.replace(&full_tag, "").trim().to_string();

            let mut updates = HashMap::new();
            for part in inner.split('|') {
                let kv: Vec<&str> = part.split(':').collect();
                if kv.len() >= 2 {
                    let k = kv[0].trim().to_lowercase();
                    let v = kv[1..].join(":").trim().to_string();
                    if !v.starts_with('<') {
                        updates.insert(k, v);
                    }
                }
            }

            if let Some(obj) = collected_details.as_object_mut() {
                for (k, v) in updates {
                    obj.insert(k, serde_json::Value::String(v));
                }
            }
        }
    }

    // Parse ROUTE
    if let Some(caps) = reply.clone().find("[ROUTE:") {
        if let Some(end) = reply[caps..].find(']') {
            let full_tag = reply[caps..caps + end + 1].to_string();
            let new_route = reply[caps + 7..caps + end].trim().to_lowercase();
            
            reply = reply.replace(&full_tag, "").trim().to_string();

            if vec!["sales", "faq", "sizing", "negotiation"].contains(&new_route.as_str()) {
                current_state = new_route;
                let mut target_state = serde_json::json!({
                    "current_state": current_state,
                    "collected_details": collected_details
                });

                if depth == 0 {
                    println!("[ROUTER REDIRECT]: Routing to {}. Re-evaluating...", current_state);
                    let recur = Box::pin(generate_ai_reply(
                        client,
                        api_key,
                        prompt,
                        tone,
                        knowledge,
                        history,
                        target_state,
                        depth + 1,
                        last_updated,
                    )).await?;
                    
                    return Ok(AIReplyResult {
                        reply: recur.reply,
                        tokens: usage.total_tokens + recur.tokens,
                        updated_state: recur.updated_state,
                    });
                }
            }
        }
    }

    let final_state = serde_json::json!({
        "current_state": current_state,
        "collected_details": collected_details
    });

    Ok(AIReplyResult {
        reply,
        tokens: usage.total_tokens,
        updated_state: final_state,
    })
}
