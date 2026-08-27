use axum::{
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use sqlx::PgPool;
use reqwest::Client;
use std::sync::atomic::{AtomicU64, Ordering};

mod crypto;
mod db;
mod groq;
mod telegram;
mod facebook;

// Prometheus metrics counters (Lock-free thread-safe atomic variables)
pub static HTTP_REQUESTS_TOTAL: AtomicU64 = AtomicU64::new(0);
pub static DECRYPT_REQUESTS_TOTAL: AtomicU64 = AtomicU64::new(0);
pub static DECRYPT_ERRORS_TOTAL: AtomicU64 = AtomicU64::new(0);

#[derive(Deserialize)]
struct DecryptRequest {
    payload: String, // format "iv:tag:ciphertext" in hex
    key_hex: String, // 64-character hex key
}

#[derive(Serialize)]
struct DecryptResponse {
    success: bool,
    decrypted: String,
    error: String,
}

async fn decrypt_handler(Json(payload): Json<DecryptRequest>) -> Json<DecryptResponse> {
    HTTP_REQUESTS_TOTAL.fetch_add(1, Ordering::Relaxed);
    DECRYPT_REQUESTS_TOTAL.fetch_add(1, Ordering::Relaxed);

    let parts: Vec<&str> = payload.payload.split(':').collect();
    if parts.len() != 3 {
        DECRYPT_ERRORS_TOTAL.fetch_add(1, Ordering::Relaxed);
        return Json(DecryptResponse {
            success: false,
            decrypted: "".to_string(),
            error: "Invalid payload format. Expected iv:tag:ciphertext".to_string(),
        });
    }

    let iv_hex = parts[0];
    let tag_hex = parts[1];
    let cipher_hex = parts[2];

    let key_bytes = match hex::decode(&payload.key_hex) {
        Ok(b) => b,
        Err(e) => {
            DECRYPT_ERRORS_TOTAL.fetch_add(1, Ordering::Relaxed);
            return Json(DecryptResponse {
                success: false,
                decrypted: "".to_string(),
                error: format!("Key hex decoding failed: {}", e),
            });
        }
    };

    let iv_bytes = match hex::decode(iv_hex) {
        Ok(b) => b,
        Err(e) => {
            DECRYPT_ERRORS_TOTAL.fetch_add(1, Ordering::Relaxed);
            return Json(DecryptResponse {
                success: false,
                decrypted: "".to_string(),
                error: format!("IV hex decoding failed: {}", e),
            });
        }
    };

    let tag_bytes = match hex::decode(tag_hex) {
        Ok(b) => b,
        Err(e) => {
            DECRYPT_ERRORS_TOTAL.fetch_add(1, Ordering::Relaxed);
            return Json(DecryptResponse {
                success: false,
                decrypted: "".to_string(),
                error: format!("Tag hex decoding failed: {}", e),
            });
        }
    };

    let cipher_bytes = match hex::decode(cipher_hex) {
        Ok(b) => b,
        Err(e) => {
            DECRYPT_ERRORS_TOTAL.fetch_add(1, Ordering::Relaxed);
            return Json(DecryptResponse {
                success: false,
                decrypted: "".to_string(),
                error: format!("Ciphertext hex decoding failed: {}", e),
            });
        }
    };

    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&iv_bytes);

    let mut encrypted_payload = cipher_bytes;
    encrypted_payload.extend_from_slice(&tag_bytes);

    match cipher.decrypt(nonce, encrypted_payload.as_slice()) {
        Ok(decrypted_bytes) => {
            match String::from_utf8(decrypted_bytes) {
                Ok(s) => Json(DecryptResponse {
                    success: true,
                    decrypted: s,
                    error: "".to_string(),
                }),
                Err(e) => {
                    DECRYPT_ERRORS_TOTAL.fetch_add(1, Ordering::Relaxed);
                    Json(DecryptResponse {
                        success: false,
                        decrypted: "".to_string(),
                        error: format!("UTF-8 conversion failed: {}", e),
                    })
                }
            }
        }
        Err(e) => {
            DECRYPT_ERRORS_TOTAL.fetch_add(1, Ordering::Relaxed);
            Json(DecryptResponse {
                success: false,
                decrypted: "".to_string(),
                error: format!("Decryption failed: {:?}", e),
            })
        }
    }
}

async fn health_handler() -> Json<serde_json::Value> {
    HTTP_REQUESTS_TOTAL.fetch_add(1, Ordering::Relaxed);
    Json(serde_json::json!({
        "status": "healthy",
        "engine": "rust",
        "version": "1.0.0"
    }))
}

async fn metrics_handler() -> String {
    let http_requests = HTTP_REQUESTS_TOTAL.load(Ordering::Relaxed);
    let decrypt_requests = DECRYPT_REQUESTS_TOTAL.load(Ordering::Relaxed);
    let decrypt_errors = DECRYPT_ERRORS_TOTAL.load(Ordering::Relaxed);

    format!(
        "# HELP http_requests_total Total number of HTTP requests processed\n\
         # TYPE http_requests_total counter\n\
         http_requests_total {}\n\n\
         # HELP decrypt_requests_total Total number of decryption requests processed\n\
         # TYPE decrypt_requests_total counter\n\
         decrypt_requests_total {}\n\n\
         # HELP decrypt_errors_total Total number of decryption errors encountered\n\
         # TYPE decrypt_errors_total counter\n\
         decrypt_errors_total {}\n",
        http_requests, decrypt_requests, decrypt_errors
    )
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be configured");
    let encryption_key = std::env::var("AGENT_ENCRYPTION_KEY")
        .or_else(|_| std::env::var("ENCRYPTION_KEY"))
        .expect("AGENT_ENCRYPTION_KEY must be configured");

    println!("[+] Connecting to Postgres database...");
    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to Postgres database");
    println!("[+] Database connection pool initialized successfully.");

    let client = Client::new();
    let state = (pool, client, encryption_key);

    let app = Router::new()
        .route("/health", axum::routing::get(health_handler))
        .route("/metrics", axum::routing::get(metrics_handler))
        .route("/webhook/telegram", post(telegram::handle_telegram))
        .route("/webhook/facebook", post(facebook::handle_facebook))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 5004));
    println!("[+] Rust Webhook & Cryptography Service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
