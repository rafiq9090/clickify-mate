import type { SubAgent, SubAgentInput, SubAgentOutput } from './types'
import { executeToolSafely } from '../agent_tools'

export class LogisticsAgent implements SubAgent {
    id = 'logistics' as const
    name = 'Logistics & Live Courier Tracking Agent'
    description = 'Specialized in courier tracking (Steadfast, Pathao, RedX), delivery fees, and estimated delivery dates.'
    allowedTools = ['get_tracking_status', 'calculate_delivery_fee']

    canHandle(understanding: any, context: any): boolean {
        const logisticsIntents = [
            'ORDER_TRACKING',
            'DELIVERY_QUERY'
        ]
        return logisticsIntents.includes(understanding.intent)
    }

    async execute(input: SubAgentInput): Promise<SubAgentOutput> {
        const { event, context, understanding } = input
        const lang = context.session.language || 'bn'
        const toolCalls: any[] = []
        const toolResults: any[] = []

        // 1. Order Tracking by Tracking Code or Order ID
        const trackingCode = understanding.entities.orderId || (event.text?.match(/\b(?:TRK|ORD|INV|CM)-[A-Za-z0-9-]+\b/i)?.[0])
        if (trackingCode || understanding.intent === 'ORDER_TRACKING') {
            if (trackingCode) {
                const toolCallId = `log_track_${Date.now()}`
                toolCalls.push({ id: toolCallId, name: 'get_tracking_status', arguments: { trackingCode } })
                
                const executed = await executeToolSafely('get_tracking_status', { trackingCode }, context)
                toolResults.push({ toolCallId, name: 'get_tracking_status', output: executed.data, error: executed.error })

                if (executed.data?.status) {
                    const status = executed.data.status
                    const courier = executed.data.courier || 'Steadfast Courier'
                    const location = executed.data.currentLocation ? ` (Location: ${executed.data.currentLocation})` : ''
                    
                    const text = lang === 'en'
                        ? `Tracking status for *${trackingCode}*:\n• Status: *${status}*${location}\n• Carrier: ${courier}\nEstimated delivery: 24-48 hours.`
                        : `আপনার পার্সেল ট্র্যাকিং (*${trackingCode}*):\n• বর্তমান অবস্থা: *${status}*${location}\n• কুরিয়ার: ${courier}\nআনুমানিক ডেলিভারি সময়: ২৪-৪৮ ঘণ্টার মধ্যে।`
                    
                    return {
                        text,
                        state: 'SALES_INQUIRING',
                        toolCalls,
                        toolResults,
                        confidence: 0.95
                    }
                }
            }

            // If no tracking code was provided, ask for it
            const text = lang === 'en'
                ? 'Please share your Order Invoice ID or Courier Tracking Code to check live tracking.'
                : 'আপনার পার্সেলের লাইভ লোকেশন জানতে অনুগ্রহ করে আপনার অর্ডার আইডি বা ট্র্যাকিং কোড দিন।'
            
            return {
                text,
                state: 'SALES_INQUIRING',
                confidence: 0.9
            }
        }

        // 2. Delivery Fee & Turnaround Query
        const district = understanding.entities.district || (event.text?.toLowerCase().includes('dhaka') ? 'Dhaka' : 'Outside Dhaka')
        const toolCallId = `log_fee_${Date.now()}`
        toolCalls.push({ id: toolCallId, name: 'calculate_delivery_fee', arguments: { district } })
        
        const executed = await executeToolSafely('calculate_delivery_fee', { district }, context)
        toolResults.push({ toolCallId, name: 'calculate_delivery_fee', output: executed.data, error: executed.error })

        const fee = executed.data?.deliveryFee ?? 80
        const isDhaka = district.toLowerCase() === 'dhaka'
        const timeline = isDhaka ? (lang === 'en' ? '24 to 48 hours' : '২৪ থেকে ৪৮ ঘণ্টার মধ্যে') : (lang === 'en' ? '2 to 3 days' : '২ থেকে ৩ কার্যদিবস')

        const text = lang === 'en'
            ? `Delivery fee for ${district} is ৳${fee}. Estimated delivery time: ${timeline}. We deliver all over Bangladesh!`
            : `${district}-তে ডেলিভারি চার্জ ৳${fee}। ডেলিভারি সময়: ${timeline}। আমরা সারা বাংলাদেশে হোম ডেলিভারি দিয়ে থাকি!`

        return {
            text,
            state: 'SALES_INQUIRING',
            toolCalls,
            toolResults,
            confidence: 0.92
        }
    }
}

export const logisticsAgent = new LogisticsAgent()
