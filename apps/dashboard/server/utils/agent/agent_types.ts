/**
 * Canonical Domain Types for Clickify AI Agent 2.0 (Architecture V2)
 */

export type AgentChannel = 'telegram' | 'whatsapp' | 'messenger' | 'facebook_comment'

export interface IncomingAgentEvent {
    channel: AgentChannel
    eventId: string
    customerId: string
    customerName?: string
    customerAvatar?: string
    messageId: string
    text?: string
    media?: {
        type: 'image' | 'audio' | 'video' | 'document'
        url?: string
        caption?: string
    }
    replyTo?: {
        messageId?: string
        text?: string
        author?: string
    }
    timestamp: number
    rawPayload?: any
}

export type AgentIntent =
    | 'GREETING'
    | 'PRODUCT_DISCOVERY'
    | 'PRODUCT_INFO'
    | 'IMAGE_REQUEST'
    | 'STOCK_QUERY'
    | 'PRICE_QUERY'
    | 'ORDER_START'
    | 'ORDER_CONFIRM'
    | 'ORDER_TRACKING'
    | 'DELIVERY_QUERY'
    | 'PAYMENT_QUERY'
    | 'CUSTOMER_CORRECTION'
    | 'COMPLAINT'
    | 'HUMAN_REQUEST'
    | 'UNKNOWN'

export type AgentComplexity =
    | 'DETERMINISTIC'
    | 'SIMPLE'
    | 'MEDIUM'
    | 'COMPLEX'
    | 'HIGH_RISK'

export type ConversationState =
    | 'SALES_INQUIRING'
    | 'PRODUCT_DISCOVERY'
    | 'VARIANT_SELECTION'
    | 'STOCK_VERIFICATION'
    | 'COLLECT_NAME'
    | 'COLLECT_PHONE'
    | 'COLLECT_ADDRESS'
    | 'VERIFY_ORDER'
    | 'AWAIT_PAYMENT'
    | 'VERIFY_PAYMENT'
    | 'ORDER_CONFIRMED'
    | 'COMPLETED'
    | 'SUPPORT'
    | 'REPAIR'

export interface AgentEntities {
    productId?: string
    sku?: string
    productName?: string
    color?: string
    size?: string
    quantity?: number
    name?: string
    phone?: string
    address?: string
    district?: string
    orderId?: string
    trxId?: string
    paymentMethod?: string
    couponCode?: string
}

export interface AgentUnderstanding {
    intent: AgentIntent
    entities: AgentEntities
    sentiment: 'positive' | 'neutral' | 'confused' | 'frustrated' | 'negative'
    customerCorrection: boolean
    repeatedQuestion: boolean
    possibleErrorType?: 'WRONG_VARIANT' | 'WRONG_PRICE' | 'WRONG_STOCK' | 'MISUNDERSTOOD_INTENT' | 'STATE_ERROR'
    confidence: number
    rawSummary?: string
}

export interface AgentContext {
    agentId: string
    channel: AgentChannel
    customerId: string
    customerName?: string
    customerAvatar?: string
    aiDisabled?: boolean
    customer: {
        id: string
        name?: string
        phone?: string
        address?: string
        preferredLanguage?: string
        orderCount?: number
    }
    session: {
        state: ConversationState
        previousValidState?: ConversationState
        leadId?: string
        aiDisabled?: boolean
        checkoutToken?: string
    }
    selection: {
        productId?: string
        sku?: string
        productName?: string
        color?: string
        size?: string
        quantity?: number
        price?: number
    }
    orderDraft?: {
        name?: string
        phone?: string
        address?: string
        district?: string
        sku?: string
        color?: string
        size?: string
        quantity?: number
        unitPrice?: number
        deliveryFee?: number
        total?: number
        trxId?: string
        isAdvanceRequired?: boolean
    }
    recentMessages: Array<{
        role: 'user' | 'assistant' | 'system'
        content: string
        created_at?: string
    }>
    agentConfig: {
        name?: string
        businessName?: string
        tone?: string
        knowledge?: string
        orderForm?: string
        catalog?: any[]
    }
}

export interface AgentToolDefinition {
    name: string
    description: string
    parameters: {
        type: string
        properties: Record<string, any>
        required?: string[]
    }
    isSideEffect?: boolean
    execute: (args: any, context?: AgentContext) => Promise<any>
}

export interface AgentToolCall {
    id: string
    name: string
    arguments: Record<string, any>
}

export interface AgentToolResult {
    toolCallId: string
    name: string
    output: any
    error?: string
}

export interface CriticResult {
    pass: boolean
    level: 'NONE' | 'RULE_BASED' | 'LLM_CRITIC'
    issues?: Array<{
        type: string
        severity: 'low' | 'medium' | 'high'
        description: string
    }>
    suggestedFix?: string
}

export interface ReactionDecision {
    shouldReact: boolean
    reactionType?: 'LIKE' | 'LOVE' | 'CELEBRATE' | 'SUPPORT' | 'AFFIRMATION'
    emoji?: string
    reason?: string
}

export interface AgentResult {
    text: string
    state: ConversationState
    imagesToSend?: string[]
    orderCreated?: boolean
    orderData?: any
    reaction?: ReactionDecision
    tokensUsed?: number
    latencyMs?: number
    toolCalls?: AgentToolCall[]
    traceId?: string
    repaired?: boolean
    requiresHumanHandoff?: boolean
}
