import type { AgentResult, AgentUnderstanding, AgentContext, AgentToolCall } from './agent_types'
import { useSupabaseAdmin } from '../supabase'
import { maskPII } from './pii_masker'

export async function logAgentTrace(
    context: AgentContext,
    understanding: AgentUnderstanding,
    result: AgentResult,
    startTime: number
): Promise<string> {
    const latencyMs = Date.now() - startTime
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const supabase = useSupabaseAdmin()
    if (supabase && supabase.from) {
        try {
            await supabase.from('token_usage').insert({
                session_id: context.customerId,
                model: 'clickify-agent-v2',
                feature: `agent_${context.channel}`,
                total_tokens: result.tokensUsed || 0,
                prompt_tokens: Math.round((result.tokensUsed || 0) * 0.7),
                completion_tokens: Math.round((result.tokensUsed || 0) * 0.3)
            })
        } catch (e: any) {
            // Non-blocking trace error
        }
    }

    // PII-safe audit logging
    const safeCustomer = maskPII(context.customerName || context.customerId)
    console.log(`[AGENT TRACE ${traceId}]: Latency: ${latencyMs}ms | Channel: ${context.channel} | State: ${result.state} | Customer: ${safeCustomer}`)

    return traceId
}
