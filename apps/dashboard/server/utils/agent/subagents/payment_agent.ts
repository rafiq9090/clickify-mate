import type { SubAgent, SubAgentInput, SubAgentOutput } from './types'
import { executeToolSafely } from '../agent_tools'

export class PaymentAgent implements SubAgent {
    id = 'payment' as const
    name = 'Payment & Transaction Verification Agent'
    description = 'Specialized in payment gateways (bKash/Nagad/Cards), advance fee rules, and transaction proof handling.'
    allowedTools = ['verify_payment', 'calculate_delivery_fee']

    canHandle(understanding: any, context: any): boolean {
        const paymentIntents = [
            'PAYMENT_QUERY',
            'PAYMENT_SELECTION'
        ]
        const paymentStates = [
            'AWAIT_PAYMENT',
            'VERIFY_PAYMENT'
        ]
        return paymentIntents.includes(understanding.intent) || paymentStates.includes(context.session.state) || Boolean(understanding.entities.trxId)
    }

    async execute(input: SubAgentInput): Promise<SubAgentOutput> {
        const { event, context, understanding } = input
        const lang = context.session.language || 'bn'
        const toolCalls: any[] = []
        const toolResults: any[] = []

        // 1. Customer provided a TrxID
        const trxId = understanding.entities.trxId || (event.text?.match(/\b[A-Za-z0-9]{8,12}\b/)?.[0])
        if (trxId) {
            const toolCallId = `pay_verify_${Date.now()}`
            toolCalls.push({ id: toolCallId, name: 'verify_payment', arguments: { trxId, method: understanding.entities.paymentMethod || 'bkash' } })
            
            const executed = await executeToolSafely('verify_payment', {
                trxId,
                method: understanding.entities.paymentMethod || 'bkash'
            }, context)
            toolResults.push({ toolCallId, name: 'verify_payment', output: executed.data, error: executed.error })

            // We report submission received for manual/gateway audit without falsely marking confirmed
            const text = lang === 'en'
                ? `Thank you! Your Transaction ID (${trxId}) has been received for manual verification. Our accounts team will confirm within 15 minutes.`
                : `ধন্যবাদ! আপনার ট্রানজেকশন আইডি (${trxId}) পর্যালোচনার জন্য জমা নেওয়া হয়েছে। আমাদের অ্যাকাউন্টস টিম দ্রুত যাচাই করে অর্ডার কনফার্ম করবে।`
            
            return {
                text,
                state: 'VERIFY_PAYMENT',
                toolCalls,
                toolResults,
                confidence: 0.95
            }
        }

        // 2. Payment Method Query / Options
        const text = lang === 'en'
            ? 'We accept Cash on Delivery (COD), bKash, Nagad, Rocket, and Visa/MasterCard. Which payment method do you prefer?'
            : 'আমাদের ক্যাশ অন ডেলিভারি (COD), বিকাশ, নগদ, রকেট এবং ভিসা/মাস্টারকার্ডের সুবিধা রয়েছে। আপনি কোন মাধ্যমে পেমেন্ট করতে চান?'

        return {
            text,
            state: context.session.state === 'AWAIT_PAYMENT' ? 'AWAIT_PAYMENT' : 'SALES_INQUIRING',
            confidence: 0.9
        }
    }
}

export const paymentAgent = new PaymentAgent()
