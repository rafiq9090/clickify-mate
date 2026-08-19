import type { AgentComplexity, AgentUnderstanding } from './agent_types'

export function classifyComplexity(understanding: AgentUnderstanding): AgentComplexity {
    // 1. Customer corrections and complaints need reasoning and repair
    if (understanding.customerCorrection || understanding.intent === 'COMPLAINT') {
        return 'COMPLEX'
    }

    // 2. High risk intents (disputes / payment verification problems)
    if (understanding.intent === 'HUMAN_REQUEST') {
        return 'HIGH_RISK'
    }

    // 3. Simple queries (Fast path)
    if (understanding.intent === 'GREETING') {
        return 'SIMPLE'
    }

    if (understanding.intent === 'PRICE_QUERY' || understanding.intent === 'STOCK_QUERY') {
        return 'SIMPLE'
    }

    // 4. Medium complexity (Multi-step sales, details collection, delivery fee)
    if (
        understanding.intent === 'ORDER_START' ||
        understanding.intent === 'ORDER_CONFIRM' ||
        understanding.intent === 'DELIVERY_QUERY' ||
        understanding.intent === 'PRODUCT_DISCOVERY' ||
        understanding.intent === 'PAYMENT_QUERY'
    ) {
        return 'MEDIUM'
    }

    return 'MEDIUM'
}
