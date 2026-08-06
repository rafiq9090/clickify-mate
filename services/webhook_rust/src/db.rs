use sqlx::{PgPool, FromRow};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(FromRow, Clone, Debug, Serialize, Deserialize)]
pub struct AgentConfig {
    pub id: Uuid,
    pub user_id: Uuid,
    pub platform: String,
    pub external_id: Option<String>,
    pub is_active: Option<bool>,
    pub encrypted_token: Option<String>,
    pub agent_behavior: Option<serde_json::Value>,
    pub knowledge: Option<String>,
    pub product_images: Option<serde_json::Value>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(FromRow, Clone, Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(FromRow, Clone, Debug, Serialize, Deserialize)]
pub struct Lead {
    pub id: Uuid,
    pub created_at: Option<DateTime<Utc>>,
    pub email: String,
    pub source: Option<String>,
    pub data: Option<serde_json::Value>,
}

pub async fn get_groq_api_key(pool: &PgPool) -> Result<Option<String>, sqlx::Error> {
    let row: Option<(Option<String>,)> = sqlx::query_as(
        "SELECT groq_api_key FROM public.settings LIMIT 1"
    )
    .fetch_optional(pool)
    .await?;

    Ok(row.and_then(|r| r.0))
}

pub async fn get_agent_config(pool: &PgPool, id: Uuid) -> Result<Option<AgentConfig>, sqlx::Error> {
    sqlx::query_as::<_, AgentConfig>(
        "SELECT * FROM public.agent_configs WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn get_user_fallback_agent(pool: &PgPool, user_id: Uuid, platform: &str) -> Result<Option<AgentConfig>, sqlx::Error> {
    sqlx::query_as::<_, AgentConfig>(
        "SELECT * FROM public.agent_configs WHERE user_id = $1 AND platform = $2 AND knowledge != '' ORDER BY updated_at DESC LIMIT 1"
    )
    .bind(user_id)
    .bind(platform)
    .fetch_optional(pool)
    .await
}

pub async fn get_chat_history(pool: &PgPool, agent_id: Uuid, user_external_id: &str, limit_time: DateTime<Utc>) -> Result<Vec<ChatMessage>, sqlx::Error> {
    sqlx::query_as::<_, ChatMessage>(
        "SELECT role, content FROM public.chat_history \
         WHERE agent_id = $1 AND user_external_id = $2 AND created_at >= $3 \
         ORDER BY created_at ASC LIMIT 10"
    )
    .bind(agent_id)
    .bind(user_external_id)
    .bind(limit_time)
    .fetch_all(pool)
    .await
}

pub async fn save_chat_message(pool: &PgPool, agent_id: Uuid, user_external_id: &str, role: &str, content: &str, tokens_used: i32) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO public.chat_history (agent_id, user_external_id, role, content, tokens_used) \
         VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(agent_id)
    .bind(user_external_id)
    .bind(role)
    .bind(content)
    .bind(tokens_used)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_lead_by_email(pool: &PgPool, email: &str) -> Result<Option<Lead>, sqlx::Error> {
    sqlx::query_as::<_, Lead>(
        "SELECT * FROM public.leads WHERE email = $1 ORDER BY created_at DESC LIMIT 1"
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

pub async fn update_lead_data(pool: &PgPool, lead_id: Uuid, data: serde_json::Value) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE public.leads SET data = $1 WHERE id = $2"
    )
    .bind(data)
    .bind(lead_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn insert_lead(pool: &PgPool, email: &str, source: &str, data: serde_json::Value) -> Result<Lead, sqlx::Error> {
    let row = sqlx::query_as::<_, Lead>(
        "INSERT INTO public.leads (email, source, data) \
         VALUES ($1, $2, $3) RETURNING *"
    )
    .bind(email)
    .bind(source)
    .bind(data)
    .fetch_one(pool)
    .await?;

    Ok(row)
}

pub async fn update_agent_external_id(pool: &PgPool, agent_id: Uuid, external_id: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE public.agent_configs SET external_id = $1 WHERE id = $2"
    )
    .bind(external_id)
    .bind(agent_id)
    .execute(pool)
    .await?;

    Ok(())
}
