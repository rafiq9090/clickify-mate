import type { IncomingAgentEvent, AgentResult, AgentContext, AgentToolResult, AgentToolCall } from './agent_types'
import { buildAgentContext } from './agent_context'
import { understandMessageFast } from './agent_nlu'
import { classifyComplexity } from './agent_complexity'
import { runConversationRepair } from './agent_repair'
import { chooseModelRoute, getProviderByName } from './providers/router'
import { getAllToolDefinitions, executeToolSafely } from './agent_tools'
import { verifyResponseLightweight } from './agent_critic'
import { decideReaction } from './agent_reactions'
import { computeNextState, saveFsmState } from './agent_fsm'
import { logAgentTrace } from './agent_trace'
import { recordKnowledgeGap } from './agent_knowledge_gap'
import { resolveIntelligentProductImages } from '../mock_shop'
import type { ModelMessage } from './providers/types'

const MAX_TOOL_ITERATIONS = 4

export async function runAgent(
    event: IncomingAgentEvent,
    agent: any
): Promise<AgentResult & { aiPaused?: boolean }> {
    const startTime = Date.now()

    // 1. Build Context
    const context = await buildAgentContext(event, agent)

    if (context.aiDisabled || agent.is_active === false) {
        return {
            text: '',
            state: context.session.state,
            aiPaused: true
        }
    }

    // 2. Understand Message (NLU + Correction Detection)
    const userText = event.text || ''
    const previousAgentMessage = context.recentMessages.find(m => m.role === 'assistant')?.content
    const understanding = understandMessageFast(userText, previousAgentMessage)

    // Checkout Token Lifecycle: If customer starts a new purchase after an order was confirmed, start fresh session
    if (context.session.state === 'ORDER_CONFIRMED' && (understanding.intent === 'ORDER_START' || understanding.intent === 'PRODUCT_DISCOVERY' || understanding.entities.sku)) {
        context.session.checkoutToken = 'chk_' + Math.random().toString(36).slice(2, 9)
    }

    // Context switching: if customer specifically asks about Hoodie, switch active SKU
    if (understanding.entities.sku) {
        context.selection.sku = understanding.entities.sku
    }

    // 3. Customer Correction Priority (Verified Self-Correction & Repair)
    if (understanding.customerCorrection) {
        const repairResult = await runConversationRepair(context, understanding)
        await logAgentTrace(context, understanding, repairResult, startTime)
        return repairResult
    }

    // 4. Complexity & Model Routing
    const complexity = classifyComplexity(understanding)
    const route = chooseModelRoute({ complexity })

    const tools = getAllToolDefinitions()
    const provider = route.provider || getProviderByName('groq')

    // 5. System Prompt Construction
    const systemPrompt = `You are a friendly, highly intelligent, and helpful AI Sales Representative for "${context.agentConfig.businessName || 'our store'}".
Tone & Style: ${context.agentConfig.tone}

Merchant Knowledge & Rules:
${context.agentConfig.knowledge || 'We offer premium apparel with cash on delivery and fast shipping in Bangladesh.'}

Live Product Catalog:
${JSON.stringify(context.agentConfig.catalog || [])}

Current State: ${context.session.state}
Active Product Selection: ${JSON.stringify(context.selection)}
Active Order Draft: ${JSON.stringify(context.orderDraft)}

CORE BEHAVIORAL RULES:
1. FACTUAL GROUNDING: ALWAYS use tools (check_inventory, get_current_price, calculate_delivery_fee, search_products) before giving facts. Never make up stock numbers, prices, or discounts.
2. INTERRUPTIBLE INQUIRIES: If the customer asks about stock, delivery charges, discounts, coupons, photos, or a different product (like Hoodie) at ANY stage—even during or after checkout—ALWAYS answer their question directly, thoroughly, and factually using tools. Never give canned "I am working on your order" responses to questions.
3. GREETINGS: If customer greets you ("Assalamu Alaikum", "Hi", "Hello"), greet back warmly and politely.
4. ORDER PLACEMENT: When customer confirms ("yes", "confirm", "order korun", or provides full name, phone, address): Call the create_order tool immediately!
5. NO MARKDOWN IMAGES: Never output markdown image links ![alt](url) in your text. The system automatically sends product gallery photos via official chat channels.
6. COUPON EXPLANATION: If coupon cannot stack with a higher bundle discount, explain politely that the higher discount is active.
7. LANGUAGE: Respond naturally in the EXACT language/script (Bengali / Banglish / English) used by the customer.
8. Output concise, polite, human responses (under 60 words).`

    const messages: ModelMessage[] = [
        { role: 'system', content: systemPrompt }
    ]

    // Append recent chat history (working memory)
    for (const msg of context.recentMessages) {
        messages.push({
            role: msg.role,
            content: msg.content
        })
    }

    // Append current customer message (including quoted reply context if any)
    const currentPromptText = event.replyTo?.text
        ? `[In reply to "${event.replyTo.text}"]: ${userText}`
        : userText

    messages.push({
        role: 'user',
        content: currentPromptText
    })

    // 6. Application-Controlled ReAct Execution Loop
    let iterations = 0
    let finalReplyText = ''
    let totalTokens = 0
    const executedToolCalls: AgentToolCall[] = []
    const executedToolResults: AgentToolResult[] = []

    while (iterations < MAX_TOOL_ITERATIONS) {
        iterations++

        let modelRes: any
        try {
            modelRes = await provider.runWithTools({
                messages,
                tools,
                model: route.model,
                temperature: 0.1
            })
        } catch (provErr: any) {
            console.warn(`[AGENT PROVIDER WARNING]: ${route.providerName} failed (${provErr.message}). Falling back to alternate provider...`)
            const altProviderName = route.providerName === 'nvidia' ? 'groq' : 'nvidia'
            const fallbackProvider = getProviderByName(altProviderName)
            modelRes = await fallbackProvider.runWithTools({
                messages,
                tools,
                temperature: 0.1
            })
        }

        totalTokens += modelRes.totalTokens

        if (modelRes.text && modelRes.text.trim() !== '') {
            finalReplyText = modelRes.text
        }

        // If model produced final text without tool calls, we're done
        if (!modelRes.toolCalls || modelRes.toolCalls.length === 0) {
            break
        }

        // Execute requested tools
        for (const tc of modelRes.toolCalls) {
            executedToolCalls.push(tc)
            const execRes = await executeToolSafely(tc.name, tc.arguments, context)
            executedToolResults.push({
                toolCallId: tc.id,
                name: tc.name,
                output: execRes.data,
                error: execRes.error
            })

            // Push assistant tool call and tool result to messages
            messages.push({
                role: 'assistant',
                content: modelRes.text || '',
                tool_calls: [{
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.arguments)
                    }
                }]
            })

            messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                name: tc.name,
                content: JSON.stringify(execRes.data || { error: execRes.error })
            })
        }
    }

    // Dynamic Intelligent Fallback if model returned empty text
    if (!finalReplyText || finalReplyText.trim() === '') {
        const orderResult = executedToolResults.find(t => t.name === 'create_order')
        const stockResult = executedToolResults.find(t => t.name === 'check_inventory')
        const deliveryResult = executedToolResults.find(t => t.name === 'calculate_delivery_fee')
        const priceResult = executedToolResults.find(t => t.name === 'get_current_price')

        if (orderResult?.output?.success) {
            finalReplyText = `ধন্যবাদ! আপনার অর্ডারটি #${orderResult.output.orderId || ''} সফলভাবে কনফার্ম করা হয়েছে। আমরা দ্রুত পার্সেলটি পাঠিয়ে দেব। 😊`
        } else if (stockResult?.output) {
            finalReplyText = stockResult.output.available
                ? `জি, ${stockResult.output.productName} (${stockResult.output.availableQuantity} পিস) স্টকে এভেইলেবল রয়েছে। আপনি কি অর্ডার করতে চান?`
                : `দুঃখিত, এই ভ্যারিয়েন্টটি বর্তমানে স্টকে নেই। অন্য কোনো কালার বা সাইজ দেখতে পারেন।`
        } else if (deliveryResult?.output) {
            finalReplyText = deliveryResult.output.explanation || `ডেলিভারি চার্জ: ${deliveryResult.output.deliveryFee} টাকা।`
        } else if (priceResult?.output) {
            finalReplyText = priceResult.output.explanation || `মূল্য: ৳${priceResult.output.finalItemTotal} BDT।`
        } else if (understanding.intent === 'GREETING') {
            finalReplyText = `ওয়ালাইকুম আসসালাম! কেমন আছেন? আমাদের পণ্য সম্পর্কে কোনো তথ্য জানতে চাইলে বলুন। 😊`
        } else {
            finalReplyText = `জি, আমি আপনাকে সাহায্য করতে প্রস্তুত। আপনার কোনো প্রশ্ন বা পছন্দের প্রোডাক্ট থাকলে জানান।`
            // Safe Knowledge Gap Detection
            recordKnowledgeGap({
                agentId: context.agentId,
                question: userText,
                customerContext: context.selection.sku || undefined,
                category: 'general',
                suggestedAnswer: finalReplyText
            }).catch(() => {})
        }
    }

    // Clean any unwanted markdown image tags from text
    finalReplyText = finalReplyText.replace(/!\[.*?\]\(.*?\)/g, '').trim()

    // 7. Lightweight Pre-Response Critic Verification
    const criticResult = verifyResponseLightweight(finalReplyText, executedToolResults, context)

    // 8. Exact Catalog Image Resolution
    let imagesToSend: string[] = []
    const imageToolResult = executedToolResults.find(t => t.name === 'resolve_product_images' && t.output?.images)
    if (imageToolResult && Array.isArray(imageToolResult.output.images) && imageToolResult.output.images.length > 0) {
        imagesToSend = imageToolResult.output.images
    } else if (
        understanding.intent === 'IMAGE_REQUEST' ||
        userText.toLowerCase().includes('pic') ||
        userText.toLowerCase().includes('photo') ||
        userText.toLowerCase().includes('image') ||
        userText.toLowerCase().includes('chobi') ||
        userText.toLowerCase().includes('ছবি') ||
        userText.toLowerCase().includes('পিক')
    ) {
        const query = [userText, context.selection.sku, understanding.entities.color].filter(Boolean).join(' ')
        imagesToSend = resolveIntelligentProductImages(context.agentConfig.catalog || [], query, finalReplyText, context.session)
    }

    // 9. Compute Next FSM State
    const orderCreated = executedToolResults.some(t => t.name === 'create_order' && t.output?.success)
    const { nextState } = computeNextState(context.session.state, {
        intent: understanding.intent,
        hasProductSelection: Boolean(context.selection.sku || understanding.entities.sku),
        hasStockConfirmed: executedToolResults.some(t => t.name === 'check_inventory' && t.output?.available),
        hasName: Boolean(context.orderDraft?.name || understanding.entities.name),
        hasPhone: Boolean(context.orderDraft?.phone || understanding.entities.phone),
        hasAddress: Boolean(context.orderDraft?.address || understanding.entities.address),
        requiresAdvance: context.orderDraft?.isAdvanceRequired,
        hasTrxId: Boolean(context.orderDraft?.trxId || understanding.entities.trxId),
        isConfirmed: orderCreated || understanding.intent === 'ORDER_CONFIRM'
    })

    // Save State & Keep Active Checkout Token Attached
    await saveFsmState(context.agentId, context.customerId, nextState, context.session.state, {
        ...understanding.entities,
        checkout_token: context.session.checkoutToken,
        ...(orderCreated ? { status: 'confirmed' } : {})
    })

    // 10. Social Reaction Decision
    const reaction = decideReaction(understanding, context)

    const result: AgentResult = {
        text: finalReplyText,
        state: nextState,
        imagesToSend: imagesToSend.length > 0 ? imagesToSend : undefined,
        orderCreated,
        reaction,
        tokensUsed: totalTokens,
        toolCalls: executedToolCalls.length > 0 ? executedToolCalls : undefined,
        latencyMs: Date.now() - startTime
    }

    await logAgentTrace(context, understanding, result, startTime)

    return result
}
