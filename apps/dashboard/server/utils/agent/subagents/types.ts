import type {
    AgentChannel,
    AgentContext,
    AgentIntent,
    AgentResult,
    AgentToolCall,
    AgentToolResult,
    AgentUnderstanding,
    ConversationState,
    IncomingAgentEvent
} from '../agent_types'

export type SubAgentId =
    | 'discovery'
    | 'sales'
    | 'payment'
    | 'logistics'
    | 'returns'
    | 'support'

export interface SubAgentInput {
    event: IncomingAgentEvent
    context: AgentContext
    understanding: AgentUnderstanding
    sharedState?: Record<string, any>
}

export interface SubAgentOutput {
    text: string
    state: ConversationState
    toolCalls?: AgentToolCall[]
    toolResults?: AgentToolResult[]
    imagesToSend?: string[]
    orderCreated?: boolean
    orderData?: any
    confidence: number
    requiresHumanHandoff?: boolean
    metadata?: Record<string, any>
}

export interface SubAgent {
    id: SubAgentId
    name: string
    description: string
    allowedTools: string[]
    canHandle(understanding: AgentUnderstanding, context: AgentContext): boolean
    execute(input: SubAgentInput): Promise<SubAgentOutput>
}
