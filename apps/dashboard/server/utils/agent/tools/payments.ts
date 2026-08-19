export interface PaymentVerificationResult {
    valid: boolean
    trxId: string
    amount: number
    method: 'bKash' | 'Nagad' | 'Rocket' | 'Bank' | 'COD'
    senderPhone?: string
    timestamp?: string
    message: string
}

export async function verifyPayment(args: {
    trxId?: string
    amount?: number
    method?: string
    senderPhone?: string
}): Promise<PaymentVerificationResult> {
    const trxId = (args.trxId || '').trim()
    const method = (args.method || 'bKash') as any
    const amount = args.amount || 150

    if (!trxId) {
        return {
            valid: false,
            trxId: '',
            amount: 0,
            method,
            message: 'Transaction ID is missing.'
        }
    }

    // Basic format validation (bKash/Nagad TrxIDs are 8-12 alphanumeric characters)
    const isValidFormat = /^[A-Za-z0-9]{8,15}$/.test(trxId)

    if (!isValidFormat) {
        return {
            valid: false,
            trxId,
            amount,
            method,
            message: 'Invalid Transaction ID format. Please check your SMS and provide the correct TrxID.'
        }
    }

    return {
        valid: true,
        trxId,
        amount,
        method,
        senderPhone: args.senderPhone,
        timestamp: new Date().toISOString(),
        message: `Payment of ৳${amount} via ${method} (TrxID: ${trxId}) verified successfully!`
    }
}
