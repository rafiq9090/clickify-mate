import type { SubAgent, SubAgentInput, SubAgentOutput } from './types'

export class SupportAgent implements SubAgent {
    id = 'support' as const
    name = 'Customer Support & Human Escalation Agent'
    description = 'Specialized in customer de-escalation, dispute resolution, and live merchant staff handoff.'
    allowedTools = ['get_customer_profile']

    canHandle(understanding: any, context: any): boolean {
        const supportIntents = [
            'HUMAN_REQUEST',
            'HUMAN_HANDOFF',
            'COMPLAINT'
        ]
        return supportIntents.includes(understanding.intent) || understanding.sentiment === 'frustrated'
    }

    async execute(input: SubAgentInput): Promise<SubAgentOutput> {
        const { context } = input
        const lang = context.session.language || 'bn'

        const text = lang === 'en'
            ? 'I understand and am transferring your conversation to a live customer service representative. Our support agent will reply to you shortly. Thank you for your patience!'
            : 'আপনার অনুরোধটি আমাদের কাস্টমার সাপোর্ট টিমের কাছে পাঠানো হয়েছে। একজন সাপোর্ট এক্সিকিউটিভ খুব শীঘ্রই আপনার সাথে চ্যাটে যুক্ত হবেন। একটু অপেক্ষা করার জন্য ধন্যবাদ!'

        return {
            text,
            state: 'SUPPORT',
            requiresHumanHandoff: true,
            confidence: 0.98
        }
    }
}

export const supportAgent = new SupportAgent()
