use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};

pub fn decrypt(payload: &str, key_hex: &str) -> Result<String, String> {
    let parts: Vec<&str> = payload.split(':').collect();
    if parts.len() != 3 {
        return Err("Invalid payload format. Expected iv:tag:ciphertext".to_string());
    }

    let iv_bytes = hex::decode(parts[0]).map_err(|e| format!("IV decode err: {}", e))?;
    let tag_bytes = hex::decode(parts[1]).map_err(|e| format!("Tag decode err: {}", e))?;
    let cipher_bytes = hex::decode(parts[2]).map_err(|e| format!("Cipher decode err: {}", e))?;
    let key_bytes = hex::decode(key_hex).map_err(|e| format!("Key decode err: {}", e))?;

    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&iv_bytes);

    let mut encrypted_payload = cipher_bytes;
    encrypted_payload.extend_from_slice(&tag_bytes);

    let decrypted_bytes = cipher.decrypt(nonce, encrypted_payload.as_slice())
        .map_err(|e| format!("Decryption cipher err: {:?}", e))?;
        
    String::from_utf8(decrypted_bytes).map_err(|e| format!("UTF8 convert err: {}", e))
}
