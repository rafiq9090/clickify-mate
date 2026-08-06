use sha2::{Digest, Sha256};
use tonic::{transport::Server, Request, Response, Status};

// Import code generated from protobuf specifications
pub mod verifier {
    tonic::include_proto!("verifier");
}

use verifier::image_verifier_server::{ImageVerifier, ImageVerifierServer};
use verifier::{VerifyRequest, VerifyResponse};

#[derive(Debug, Default)]
pub struct ImageVerifierService;

#[tonic::async_trait]
impl ImageVerifier for ImageVerifierService {
    async fn verify_receipt(
        &self,
        request: Request<VerifyRequest>,
    ) -> Result<Response<VerifyResponse>, Status> {
        let req = request.into_inner();
        println!(
            "[VERIFIER] Received verification request for event: {}",
            req.event_id
        );

        if req.image_base64.is_empty() {
            return Ok(Response::new(VerifyResponse {
                is_valid: false,
                transaction_id: "".to_string(),
                amount_detected: 0.0,
                hash_signature: "".to_string(),
                error_message: "Empty image payload".to_string(),
            }));
        }

        // 1. Decode base64 image data
        let image_bytes = match base64::decode(&req.image_base64) {
            Ok(bytes) => bytes,
            Err(e) => {
                return Ok(Response::new(VerifyResponse {
                    is_valid: false,
                    transaction_id: "".to_string(),
                    amount_detected: 0.0,
                    hash_signature: "".to_string(),
                    error_message: format!("Base64 decoding failed: {}", e),
                }));
            }
        };

        // 2. Generate a SHA-256 fingerprint of the image bytes
        // This ensures users cannot replay the exact same screenshot file to claim multiple order payments.
        let mut hasher = Sha256::new();
        hasher.update(&image_bytes);
        let hash_result = hasher.finalize();
        let hash_sig = hex::encode(hash_result);

        println!("[VERIFIER] Cryptographic fingerprint calculated: {}", hash_sig);

        // 3. Extract transaction details (Mocking OCR detection logic)
        let transaction_id = format!("TXN{}", hash_sig[0..10].to_uppercase());
        let amount_detected = req.expected_amount;

        println!(
            "[VERIFIER] Success. Extracted TxID: {}, Amount: ৳{}",
            transaction_id, amount_detected
        );

        Ok(Response::new(VerifyResponse {
            is_valid: true,
            transaction_id,
            amount_detected,
            hash_signature: hash_sig,
            error_message: "".to_string(),
        }))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "0.0.0.0:5002".parse()?;
    let verifier_service = ImageVerifierService::default();

    println!("[+] Rust Image Verifier gRPC Service listening on port 5002");

    Server::builder()
        .add_service(ImageVerifierServer::new(verifier_service))
        .serve(addr)
        .await?;

    Ok(())
}
