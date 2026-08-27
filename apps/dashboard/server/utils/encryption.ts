// server/utils/encryption.ts
import crypto from 'crypto'

const KEY_HEX = process.env.AGENT_ENCRYPTION_KEY

if (!KEY_HEX) {
  // In a real environment, we should throw. To avoid breaking the dev server immediately,
  // we will log a critical warning but you should add this key to your .env
  console.error('CRITICAL: AGENT_ENCRYPTION_KEY environment variable is not set!')
}

// Key must be a 64-char hex string (32 bytes = 256 bits)
const ENCRYPTION_KEY = KEY_HEX && /^[0-9a-f]{64}$/i.test(KEY_HEX)
  ? Buffer.from(KEY_HEX, 'hex')
  : Buffer.alloc(32)

const IV_LENGTH = 12   // 12 bytes is standard for GCM
const AUTH_TAG_LENGTH = 16

export const encrypt = (text: string): string => {
  if (!KEY_HEX || !/^[0-9a-f]{64}$/i.test(KEY_HEX)) throw new Error('Encryption failed: valid 32-byte hex key missing')
  
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:ciphertext (all hex)
  return [iv, authTag, encrypted].map(b => b.toString('hex')).join(':')
}

export const decrypt = async (payload: string): Promise<string> => {
  if (!KEY_HEX || !/^[0-9a-f]{64}$/i.test(KEY_HEX)) throw new Error('Decryption failed: valid 32-byte hex key missing')

  try {
    const parts = payload.split(':')
    if (parts.length !== 3) throw new Error('Invalid payload format')

    const [ivHex, authTagHex, encryptedHex] = parts
    const iv          = Buffer.from(ivHex!, 'hex')
    const authTag     = Buffer.from(authTagHex!, 'hex')
    const encrypted   = Buffer.from(encryptedHex!, 'hex')

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(), // throws if auth tag doesn't match
    ])

    return decrypted.toString('utf8')
  } catch (e: any) {
    throw new Error('Decryption failed: invalid payload or wrong key')
  }
}
