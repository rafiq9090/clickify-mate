import crypto from 'crypto'
import type { H3Event } from 'h3'

/**
 * Enterprise Webhook Cryptographic Signature Verification
 * Validates authenticity of incoming webhook payloads from Meta (Facebook/WhatsApp) and Telegram.
 */

/**
 * Validates Meta (Facebook Messenger, Instagram, WhatsApp) SHA256 signature.
 * Header: `x-hub-signature-256: sha256=<signature>`
 */
export function verifyMetaSignature(
    event: H3Event,
    rawBody: string | Buffer | undefined | null,
    appSecret?: string
): { isValid: boolean; reason?: string } {
    const config = useRuntimeConfig()
    const rawSecret = appSecret || (config.metaAppSecret as string | undefined) || process.env.META_APP_SECRET || process.env.FB_APP_SECRET
    const secret = typeof rawSecret === 'string' ? rawSecret : undefined

    if (!secret) {
        return process.env.NODE_ENV === 'production'
            ? { isValid: false, reason: 'META_APP_SECRET is required in production' }
            : { isValid: true, reason: 'META_APP_SECRET not configured (development only)' }
    }

    const signatureHeader = getHeader(event, 'x-hub-signature-256') || getHeader(event, 'X-Hub-Signature-256')
    if (!signatureHeader || typeof signatureHeader !== 'string') {
        return { isValid: false, reason: 'Missing X-Hub-Signature-256 header' }
    }

    const parts = signatureHeader.split('=')
    if (parts.length !== 2 || parts[0] !== 'sha256' || !parts[1]) {
        return { isValid: false, reason: 'Malformed signature header format' }
    }

    const remoteHash = parts[1]
    const bodyBuffer: Buffer = Buffer.isBuffer(rawBody)
        ? rawBody
        : Buffer.from(typeof rawBody === 'string' ? rawBody : '')

    const localHmac = crypto.createHmac('sha256', secret).update(bodyBuffer).digest('hex')

    if (remoteHash.length !== localHmac.length) {
        return { isValid: false, reason: 'Signature length mismatch' }
    }

    const isMatch = crypto.timingSafeEqual(Buffer.from(remoteHash, 'utf-8'), Buffer.from(localHmac, 'utf-8'))
    return {
        isValid: isMatch,
        reason: isMatch ? undefined : 'Cryptographic HMAC mismatch'
    }
}

/**
 * Validates Telegram Webhook Secret Token.
 * Header: `x-telegram-bot-api-secret-token`
 */
export function verifyTelegramSecret(
    event: H3Event,
    expectedSecret?: string
): { isValid: boolean; reason?: string } {
    const config = useRuntimeConfig()
    const rawSecret = expectedSecret || (config.telegramWebhookSecret as string | undefined) || process.env.TELEGRAM_WEBHOOK_SECRET
    const secret = typeof rawSecret === 'string' ? rawSecret : undefined

    if (!secret) {
        return process.env.NODE_ENV === 'production'
            ? { isValid: false, reason: 'TELEGRAM_WEBHOOK_SECRET is required in production' }
            : { isValid: true, reason: 'TELEGRAM_WEBHOOK_SECRET not configured (development only)' }
    }

    const incomingToken = getHeader(event, 'x-telegram-bot-api-secret-token') || getHeader(event, 'X-Telegram-Bot-Api-Secret-Token')
    if (!incomingToken || typeof incomingToken !== 'string') {
        return { isValid: false, reason: 'Missing X-Telegram-Bot-Api-Secret-Token header' }
    }

    if (incomingToken.length !== secret.length) {
        return { isValid: false, reason: 'Token length mismatch' }
    }

    const isMatch = crypto.timingSafeEqual(Buffer.from(incomingToken, 'utf-8'), Buffer.from(secret, 'utf-8'))
    return {
        isValid: isMatch,
        reason: isMatch ? undefined : 'Invalid secret token'
    }
}
