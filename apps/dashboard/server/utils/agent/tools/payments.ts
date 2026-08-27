export interface PaymentVerificationResult {
    valid: boolean
    reviewRequired?: boolean
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
    const amount = args.amount || 0

    if (!trxId) {
        return {
            valid: false,
            trxId: '',
            amount: 0,
            method,
            message: 'Transaction ID is missing.'
        }
    }

    // A transaction ID or screenshot is untrusted input. Format checks can help a
    // reviewer find typos, but only a provider API response can complete an order.
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
        valid: false,
        reviewRequired: true,
        trxId,
        amount,
        method,
        senderPhone: args.senderPhone,
        timestamp: new Date().toISOString(),
        message: `Transaction ID ${trxId} has a plausible format but is not verified. Use the order's hosted checkout link, or send this proof for manual merchant review. The order must remain unpaid.`
    }
}
