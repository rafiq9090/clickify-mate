#!/bin/bash
# scripts/test_backend.sh
# Tests backend microservices health and cryptography features.

set -e

# Change directory to the root of the project
cd "$(dirname "$0")/.."

echo "=== Clickify Mate Backend Verification Test ==="

# 1. Load environment variables
if [ -f .env ]; then
    echo "[+] Loading environment from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "[-] .env file not found. Exiting."
    exit 1
fi

if [ -z "$AGENT_ENCRYPTION_KEY" ]; then
    echo "[-] AGENT_ENCRYPTION_KEY is empty in .env. Exiting."
    exit 1
fi

# 2. Check Go Ingestor / Orchestrator Health
echo -n "[+] Testing Go Orchestrator Health on port 5001... "
GO_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health)
if [ "$GO_HEALTH" -eq 200 ]; then
    echo -e "\e[32mPASSED\e[0m"
else
    echo -e "\e[31mFAILED (HTTP $GO_HEALTH)\e[0m"
    exit 1
fi

# 3. Check Rust Webhook Health
echo -n "[+] Testing Rust Webhook Health on port 5004... "
RUST_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5004/health)
if [ "$RUST_HEALTH" -eq 200 ]; then
    echo -e "\e[32mPASSED\e[0m"
else
    echo -e "\e[31mFAILED (HTTP $RUST_HEALTH)\e[0m"
    exit 1
fi

# 4. Check Rust Cryptography Decryption Loop
echo -n "[+] Testing AES-256-GCM Cryptography loop with Rust service... "
PAYLOAD=$(node -e "
const crypto = require('crypto');
const keyHex = process.env.AGENT_ENCRYPTION_KEY;
if (!keyHex) { process.exit(1); }
const key = Buffer.from(keyHex, 'hex');
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const enc = Buffer.concat([cipher.update('Hello Rust Webhook!', 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
console.log([iv, tag, enc].map(b => b.toString('hex')).join(':'));
")

if [ -z "$PAYLOAD" ]; then
    echo -e "\e[31mFAILED (Node encryption failed)\e[0m"
    exit 1
fi

RUST_DECRYPT=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"payload\": \"$PAYLOAD\", \"key_hex\": \"$AGENT_ENCRYPTION_KEY\"}" \
  http://localhost:5004/decrypt)

IS_SUCCESS=$(echo "$RUST_DECRYPT" | node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf-8'));
if (data.success && data.decrypted === 'Hello Rust Webhook!') {
    console.log('success');
} else {
    console.log('failed');
}
")

if [ "$IS_SUCCESS" = "success" ]; then
    echo -e "\e[32mPASSED\e[0m"
else
    echo -e "\e[31mFAILED (Decryption output mismatch: $RUST_DECRYPT)\e[0m"
    exit 1
fi

echo -e "\n\e[32m=== All backend verification tests passed successfully! ===\e[0m"
exit 0
