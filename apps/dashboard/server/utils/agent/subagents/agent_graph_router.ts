import type { AgentContext, AgentResult, AgentUnderstanding, IncomingAgentEvent } from '../agent_types'
import type { SubAgent, SubAgentId, SubAgentInput, SubAgentOutput } from './types'
import { discoveryAgent } from './discovery_agent'
import { salesAgent } from './sales_agent'
import { paymentAgent } from './payment_agent'
import { logisticsAgent } from './logistics_agent'
import { returnsAgent } from './returns_agent'
import { supportAgent } from './support_agent'
import { verifyResponseLightweight } from '../agent_critic'
import { saveFsmState } from '../agent_fsm'
import { formatReplyForChannel } from '../agent_dialogue'

export const subAgentRegistry: Record<SubAgentId, SubAgent> = {
    discovery: discoveryAgent,
    sales: salesAgent,
    payment: paymentAgent,
    logistics: logisticsAgent,
    returns: returnsAgent,
    support: supportAgent
}

/**
 * Deterministic Hierarchical Graph Router.
 * Determines the target sub-agent based on structured NLU, current state, and context.
 */
export function resolveSubAgent(
    understanding: AgentUnderstanding,
    context: AgentContext
): SubAgent {
    // 1. Support & Human Handoff Priority
    if (supportAgent.canHandle(understanding, context)) {
        return supportAgent
    }

    // 2. Returns & Complaints
    if (returnsAgent.canHandle(understanding, context)) {
        return returnsAgent
    }

    // 3. Payment & TrxID Handling
    if (paymentAgent.canHandle(understanding, context)) {
        return paymentAgent
    }

    // 4. Logistics & Order Tracking
    if (logisticsAgent.canHandle(understanding, context)) {
        return logisticsAgent
    }

    // 5. Sales, Checkout & Order Progression
    if (salesAgent.canHandle(understanding, context)) {
        return salesAgent
    }

    // 6. Product Discovery, Image Search & Catalog
    if (discoveryAgent.canHandle(understanding, context)) {
        return discoveryAgent
    }

    // Default Fallback to Sales Agent
    return salesAgent
}

/**
 * Execute the Sub-Agent Graph with Closed-Loop Critic Validation
 */
export async function executeSubAgentGraph(
    event: IncomingAgentEvent,
    context: AgentContext,
    understanding: AgentUnderstanding
): Promise<AgentResult> {
    const startTime = Date.now()
    const targetAgent = resolveSubAgent(understanding, context)

    // Update Context session telemetry
    context.session.activeSubAgent = targetAgent.id
    if (!context.session.subAgentHistory) {
        context.session.subAgentHistory = []
    }
    context.session.subAgentHistory.push(targetAgent.id)

    // Execute Target Sub-Agent
    const input: SubAgentInput = {
        event,
        context,
        understanding
    }
    const output: SubAgentOutput = await targetAgent.execute(input)

    // Run Closed-Loop Critic on Sub-Agent Output
    const criticReview = verifyResponseLightweight(
        output.text,
        output.toolResults || [],
        context,
        { userText: event.text, hadImage: Boolean(event.media?.url) }
    )

    let finalText = output.text
    let repaired = false

    // If critic detects ungrounded claims or hallucination, repair text
    if (!criticReview.pass) {
        repaired = true
        console.warn(`[SUBAGENT CRITIC REJECT] Subagent "${targetAgent.id}" produced issues:`, criticReview.issues)
        const lang = context.session.language || 'bn'
        finalText = lang === 'en'
            ? 'I am verifying those details with our catalog. Could you please specify your preferred size or color?'
            : 'আমি আপনার পছন্দের প্রোডাক্টের সঠিক বিবরণ চেক করছি। অনুগ্রহ করে সাইজ বা কালারটি পুনরায় জানাবেন কি?'
    }

    const formattedText = formatReplyForChannel(finalText, event)

    // Save FSM State
    await saveFsmState(
        context.agentId,
        context.customerId,
        output.state,
        context.session.state,
        undefined,
        context.channel
    )

    return {
        text: formattedText,
        state: output.state,
        imagesToSend: output.imagesToSend,
        orderCreated: output.orderCreated,
        orderData: output.orderData,
        toolCalls: output.toolCalls,
        requiresHumanHandoff: output.requiresHumanHandoff,
        activeSubAgent: targetAgent.id,
        repaired,
        latencyMs: Date.now() - startTime
    }
}
