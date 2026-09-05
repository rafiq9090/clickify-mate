import crypto from 'node:crypto'

const VERSION = 'v1'
const IV_LENGTH = 12

function paymentKey() {
  const keyHex = process.env.PAYMENT_CREDENTIALS_KEY || process.env.AGENT_ENCRYPTION_KEY || ''
  if (!/^[0-9a-f]{64}$/i.test(keyHex)) {
    throw new Error('PAYMENT_CREDENTIALS_KEY or AGENT_ENCRYPTION_KEY must be a 64-character hexadecimal key.')
  }
  return Buffer.from(keyHex, 'hex')
}

export function encryptPaymentCredentials(plaintext: string) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-gcm', paymentKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [VERSION, iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':')
}

export async function decryptPaymentCredentials(payload: string) {
  const parts = payload.split(':')

  // Credentials saved before the dedicated payment key was introduced used the
  // agent encryption helper. They remain readable and are re-encrypted on save.
  if (parts.length === 3) {
    const { decrypt: decryptLegacy } = await import('../encryption')
    return decryptLegacy(payload)
  }
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error('Unsupported credential payload.')

  try {
    const iv = Buffer.from(parts[1]!, 'hex')
    const authTag = Buffer.from(parts[2]!, 'hex')
    const ciphertext = Buffer.from(parts[3]!, 'hex')
    if (iv.length !== IV_LENGTH || authTag.length !== 16) throw new Error('Invalid credential payload.')

    const decipher = crypto.createDecipheriv('aes-256-gcm', paymentKey(), iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  } catch {
    throw new Error('Payment credentials could not be decrypted with the configured key.')
  }
}
