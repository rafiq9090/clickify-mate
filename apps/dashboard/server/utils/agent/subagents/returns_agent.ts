import type { SubAgent, SubAgentInput, SubAgentOutput } from './types'

export class ReturnsAgent implements SubAgent {
    id = 'returns' as const
    name = 'Returns & RMA Exchange Agent'
    description = 'Specialized in return requests, damaged product photo inspection, warranty, and reverse courier pickups.'
    allowedTools = ['get_customer_profile', 'get_tracking_status']

    canHandle(understanding: any, context: any): boolean {
        const isReturnIntent = understanding.intent === 'COMPLAINT' || 
            (understanding.intent === 'PRODUCT_INFO' && /return|refund|exchange|ফেরত|বদল/i.test(understanding.rawSummary || ''))
        return isReturnIntent || context.session.state === 'SUPPORT'
    }

    async execute(input: SubAgentInput): Promise<SubAgentOutput> {
        const { event, context, understanding } = input
        const lang = context.session.language || 'bn'

        // 1. Check if user sent a photo or complaint of damaged item
        const hasMedia = Boolean(event.media?.url)
        if (hasMedia || /damage|defect|নষ্ট|ছেঁড়া|ভাঙ্গা/i.test(event.text || '')) {
            const text = lang === 'en'
                ? 'We are truly sorry for the inconvenience! We offer free 7-day exchanges for damaged or incorrect items. Please share your Order ID and photo, and our support team will dispatch a replacement immediately.'
                : 'অনাকাঙ্ক্ষিত সমস্যার জন্য আমরা আন্তরিকভাবে দুঃখিত! ক্ষতিগ্রস্ত বা ভুল প্রোডাক্টের ক্ষেত্রে আমরা ৭ দিনের মধ্যে ফ্রি এক্সচেঞ্জ সুবিধা দেই। অনুগ্রহ করে আপনার অর্ডার আইডি ও ছবিটি পাঠান, আমরা দ্রুত এক্সচেঞ্জের ব্যবস্থা নিচ্ছি।'
            
            return {
                text,
                state: 'SUPPORT',
                requiresHumanHandoff: false,
                confidence: 0.95
            }
        }

        // 2. General Return Policy explanation
        const text = lang === 'en'
            ? 'Our Return & Exchange Policy:\n• 7 days free exchange for size or manufacturing issues.\n• Product tags and original packaging must be intact.\n• Reverse courier pickup is available nationwide.\nWould you like to initiate an exchange for an order?'
            : 'আমাদের রিটার্ন ও এক্সচেঞ্জ পলিসি:\n• সাইজ বা যেকোনো ত্রুটির জন্য ৭ দিনের মধ্যে এক্সচেঞ্জ সুবিধা।\n• প্রোডাক্টের ট্যাগ ও প্যাকেট অক্ষত থাকতে হবে।\n• দেশব্যাপী হোম পিকআপ সুবিধা উপলব্ধ।\nআপনি কি কোনো অর্ডারের এক্সচেঞ্জ করতে চান?'

        return {
            text,
            state: 'SUPPORT',
            confidence: 0.9
        }
    }
}

export const returnsAgent = new ReturnsAgent()
