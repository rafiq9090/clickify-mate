/**
 * Enterprise PII & Sensitive Data Redaction Utility
 * Prevents customer PII (phone numbers, addresses, bKash/Nagad TrxIDs) from leaking into logs, analytics, or traces.
 */

export function maskPhoneNumber(phone: string): string {
    if (!phone) return ''
    const cleaned = phone.replace(/[\s-]/g, '')
    // Match standard 11-digit or international BD phone numbers: e.g. 01712345678 -> 0171****678
    return cleaned.replace(/(\+?8801[3-9]\d|01[3-9]\d)(\d{4})(\d{2,3})/g, '$1****$3')
}

export function maskPII(text: string): string {
    if (!text || typeof text !== 'string') return text || ''

    let sanitized = text

    // 1. Redact Bangladesh Phone Numbers (013/014/015/016/017/018/019...)
    sanitized = sanitized.replace(/(\+?8801[3-9]\d|01[3-9]\d)(\d{4})(\d{2,3})/g, '$1****$3')

    // 2. Redact Transaction IDs (bKash/Nagad/Rocket alphanumeric TrxIDs)
    sanitized = sanitized.replace(/(?:trx|trxid|transaction|trnx)\s*[:#=\-]?\s*([A-Za-z0-9]{8,15})/gi, 'TrxID: [REDACTED_TRX]')

    // 3. Redact Email addresses
    sanitized = sanitized.replace(/([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g, (_, user, domain) => {
        const maskedUser = user.length > 2 ? `${user.slice(0, 2)}***` : '***'
        return `${maskedUser}@${domain}`
    })

    return sanitized
}

export function redactObject<T = any>(obj: T, depth = 0): T {
    if (!obj || depth > 4) return obj
    if (typeof obj === 'string') return maskPII(obj) as any
    if (Array.isArray(obj)) {
        return obj.map(item => redactObject(item, depth + 1)) as any
    }
    if (typeof obj === 'object') {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase()
            if (lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('encrypted')) {
                result[key] = '[REDACTED_SECRET]'
            } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
                result[key] = typeof value === 'string' ? maskPhoneNumber(value) : value
            } else if (lowerKey.includes('trx') || lowerKey.includes('transaction_id')) {
                result[key] = '[REDACTED_TRX]'
            } else if (typeof value === 'string') {
                result[key] = maskPII(value)
            } else {
                result[key] = redactObject(value, depth + 1)
            }
        }
        return result
    }
    return obj
}
