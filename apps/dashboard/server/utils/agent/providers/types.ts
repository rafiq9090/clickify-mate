import type { AgentToolDefinition, AgentToolCall } from '../agent_types'

export interface ModelMessage {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content?: string
    name?: string
    tool_call_id?: string
    tool_calls?: Array<{
        id: string
        type: 'function'
        function: {
            name: string
            arguments: string
        }
    }>
}

export interface ModelResult {
    text: string
    toolCalls?: AgentToolCall[]
    finishReason?: string
    promptTokens: number
    completionTokens: number
    totalTokens: number
    model: string
    provider: string
}

export interface GenerateOptions {
    messages: ModelMessage[]
    temperature?: number
    maxTokens?: number
    responseFormat?: any
    model?: string
}

export interface ToolCallingOptions extends GenerateOptions {
    tools: AgentToolDefinition[]
}

export interface AgentModelProvider {
    name: string
    generate(options: GenerateOptions): Promise<ModelResult>
    generateStructured<T>(options: GenerateOptions & { schema?: any }): Promise<{ data: T; usage: { totalTokens: number } }>
    runWithTools(options: ToolCallingOptions): Promise<ModelResult>
}
