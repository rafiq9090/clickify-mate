import type { ReactionDecision, AgentUnderstanding, AgentContext } from './agent_types'

export function decideReaction(
    understanding: AgentUnderstanding,
    context?: AgentContext
): ReactionDecision {
    // 1. Order confirmation - celebrate!
    if (understanding.intent === 'ORDER_CONFIRM') {
        return {
            shouldReact: true,
            reactionType: 'LOVE',
            emoji: '❤️',
            reason: 'Customer confirmed order'
        }
    }

    // 2. Advance payment transaction ID sent
    if (understanding.intent === 'PAYMENT_QUERY' && understanding.entities.trxId) {
        return {
            shouldReact: true,
            reactionType: 'LIKE',
            emoji: '👍',
            reason: 'Received payment transaction ID'
        }
    }

    // 3. Positive feedback / satisfaction
    if (understanding.sentiment === 'positive' && understanding.intent === 'GREETING') {
        return {
            shouldReact: true,
            reactionType: 'LIKE',
            emoji: '👍',
            reason: 'Friendly greeting'
        }
    }

    // 4. Frustrated / complaint / sensitive support - do not send happy reactions
    if (understanding.sentiment === 'frustrated' || understanding.intent === 'COMPLAINT' || understanding.intent === 'HUMAN_REQUEST') {
        return {
            shouldReact: false,
            reason: 'Support/Complaint query'
        }
    }

    return {
        shouldReact: false,
        reason: 'No reaction needed'
    }
}

export async function sendTelegramReaction(
    chatId: string | number,
    messageId: string | number,
    emoji: string,
    botToken: string
): Promise<boolean> {
    try {
        await $fetch(`https://api.telegram.org/bot${botToken}/setMessageReaction`, {
            method: 'POST',
            body: {
                chat_id: chatId,
                message_id: messageId,
                reaction: [{ type: 'emoji', emoji }]
            },
            timeout: 5000
        })
        return true
    } catch (e: any) {
        console.warn(`[TELEGRAM REACTION NON-FATAL]:`, e.message)
        return false
    }
}
