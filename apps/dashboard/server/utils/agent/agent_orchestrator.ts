import type { IncomingAgentEvent, AgentResult, AgentContext, AgentToolResult, AgentToolCall, AgentUnderstanding, ConversationState } from './agent_types'
import { buildAgentContext } from './agent_context'
import { understandMessageFast, evaluateCatalogMatch } from './agent_nlu'
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
import { useSupabaseAdmin } from '../supabase'
import type { ModelMessage } from './providers/types'
import { performHybridSearch } from './rag/hybrid_search'
import { rerankCandidates } from './rag/reranker'
import {
    buildProductListReply,
    buildProgressReply,
    buildConfirmedOrderReceipt,
    buildOrderReviewReply,
    buildPendingPaymentReceipt,
    buildGreetingReply,
    collectedDetailsForSave,
    formatReplyForChannel,
    getMissingOrderField,
    mergeCurrentTurn,
    shouldRetrieveKnowledge,
    stateForMissingField
} from './agent_dialogue'

const MAX_TOOL_ITERATIONS = 4

const ORDER_COLLECTION_STATES: ConversationState[] = [
    'VARIANT_SELECTION', 'COLLECT_NAME', 'COLLECT_PHONE', 'COLLECT_ADDRESS', 'VERIFY_ORDER'
]

function knowledgeTypesForIntent(intent: AgentUnderstanding['intent']): string[] | undefined {
    if (intent === 'DELIVERY_QUERY') return ['shipping_rules', 'policy', 'faq']
    if (intent === 'COMPLAINT') return ['policy', 'warranty', 'care_instructions', 'faq']
    if (intent === 'PRODUCT_INFO') return ['product_spec', 'sizing_guide', 'care_instructions', 'warranty']
    if (intent === 'UNKNOWN') return ['faq', 'general', 'policy']
    return undefined
}

async function mergeLeadData(supabase: any, leadId: string | undefined, patch: Record<string, any>) {
    if (!leadId || !supabase?.from) return
    try {
        const { data: lead } = await supabase.from('leads').select('data').eq('id', leadId).maybeSingle()
        await supabase.from('leads').update({ data: { ...(lead?.data || {}), ...patch } }).eq('id', leadId)
    } catch (error: any) {
        console.warn(`[AGENT LEAD UPDATE WARN]: ${error?.message || 'Unable to update lead metadata'}`)
    }
}

async function runDeterministicTurn(
    event: IncomingAgentEvent,
    context: AgentContext,
    understanding: AgentUnderstanding
): Promise<AgentResult | null> {
    const originalState = context.session.state
    const toolCalls: AgentToolCall[] = []
    const toolResults: AgentToolResult[] = []
    const allowedUrls: string[] = []
    const lang = context.session.language || 'bn'

    const runTool = async (name: string, args: Record<string, any>) => {
        const id = `det_${name}_${toolCalls.length + 1}`
        toolCalls.push({ id, name, arguments: args })
        const executed = await executeToolSafely(name, args, context)
        const result: AgentToolResult = {
            toolCallId: id,
            name,
            output: executed.data,
            error: executed.error
        }
        toolResults.push(result)
        return result
    }

    const finish = async (
        rawText: string,
        state: ConversationState,
        extras: Partial<AgentResult> = {},
        saved: Record<string, any> = {}
    ): Promise<AgentResult> => {
        const text = formatReplyForChannel(rawText, event, allowedUrls)
        await saveFsmState(
            context.agentId,
            context.customerId,
            state,
            originalState,
            { ...collectedDetailsForSave(context, understanding.entities), ...saved },
            context.channel
        )
        return {
            text,
            state,
            toolCalls: toolCalls.length ? toolCalls : undefined,
            ...extras
        }
    }

    if (understanding.intent === 'GREETING') {
        context.session.lastAskedField = undefined
        return finish(
            buildGreetingReply(context, event.text),
            'SALES_INQUIRING'
        )
    }

    if (understanding.intent === 'NEGATION') {
        context.session.lastAskedField = undefined
        return finish(
            lang === 'en'
                ? 'Alright, no problem. How else can I assist you?'
                : 'ঠিক আছে—কোনো সমস্যা নেই। অন্য কোনো প্রোডাক্ট বা তথ্য দেখতে চান কি?',
            'SALES_INQUIRING'
        )
    }

    if (understanding.intent === 'NEW_ORDER') {
        context.orderDraft = {
            name: context.customer?.name || context.customerName,
            phone: context.customer?.phone,
            address: context.customer?.address,
            quantity: 1
        }
        context.selection = { quantity: 1 }
        context.session.state = 'SALES_INQUIRING'
        context.session.lastAskedField = 'product'
        context.session.checkoutToken = 'chk_' + Math.random().toString(36).slice(2, 9)

        const list = buildProductListReply(context)
        context.session.lastPresentedOptions = list.options
        const replyText = lang === 'en'
            ? `Sure! Which product would you like to order next? Here is our available catalog:\n\n${list.text}`
            : `অবশ্যই! আপনি পরবর্তীতে কোন পণ্যটি অর্ডার করতে চান? আমাদের প্রোডাক্ট তালিকা:\n\n${list.text}`

        return finish(
            replyText,
            'PRODUCT_DISCOVERY',
            {},
            {
                sku: null,
                color: null,
                size: null,
                quantity: null,
                total: null,
                unitPrice: null,
                delivery_fee: null,
                status: null,
                payment_status: null,
                awaiting_confirmation: false,
                last_asked_field: 'product'
            }
        )
    }

    if (originalState === 'AWAIT_PAYMENT' && understanding.intent === 'AFFIRMATION') {
        return finish(
            lang === 'en'
                ? 'Your order is still awaiting verified payment. Complete the secure link previously sent; the order will confirm automatically after the provider webhook is verified.'
                : 'আপনার অর্ডারটি এখনো যাচাইকৃত পেমেন্টের অপেক্ষায় আছে। আগে পাঠানো নিরাপদ লিংকে পেমেন্ট সম্পন্ন করুন; গেটওয়ে যাচাই হলে অর্ডার স্বয়ংক্রিয়ভাবে কনফার্ম হবে।',
            'AWAIT_PAYMENT'
        )
    }

    if (understanding.intent === 'PRODUCT_DISCOVERY') {
        context.session.lastAskedField = 'product'
        const list = buildProductListReply(context)
        context.session.lastPresentedOptions = list.options
        return finish(list.text, 'PRODUCT_DISCOVERY')
    }

    if (understanding.intent === 'OPTION_SELECTION' && !understanding.entities.sku) {
        const list = buildProductListReply(context)
        context.session.lastPresentedOptions = list.options
        context.session.lastAskedField = 'product'
        return finish(`এই নম্বরটির আগের অপশন খুঁজে পাইনি।\n${list.text}`, 'PRODUCT_DISCOVERY')
    }

    const selectedSku = context.orderDraft?.sku || context.selection.sku || understanding.entities.sku
    if (understanding.intent === 'PRICE_QUERY') {
        if (!selectedSku) {
            const list = buildProductListReply(context)
            context.session.lastPresentedOptions = list.options
            context.session.lastAskedField = 'product'
            return finish(`কোন প্রোডাক্টের দাম জানতে চান?\n${list.text}`, 'PRODUCT_DISCOVERY')
        }
        const price = await runTool('get_current_price', {
            sku: selectedSku,
            quantity: context.orderDraft?.quantity || context.selection.quantity || 1
        })
        if (price.error || !price.output) {
            return finish('দুঃখিত, এই প্রোডাক্টের যাচাইকৃত দাম এখন পাওয়া যাচ্ছে না। একজন প্রতিনিধি ক্যাটালগটি যাচাই করবেন।', originalState)
        }
        context.orderDraft = { ...context.orderDraft, unitPrice: price.output.unitPrice }
        context.selection.price = price.output.unitPrice
        return finish(`${price.output.productName}-এর বর্তমান মূল্য ৳${price.output.unitPrice}।`, originalState)
    }

    if (understanding.intent === 'STOCK_QUERY') {
        if (!selectedSku) {
            const list = buildProductListReply(context)
            context.session.lastPresentedOptions = list.options
            context.session.lastAskedField = 'product'
            return finish(`কোন প্রোডাক্টের স্টক জানতে চান?\n${list.text}`, 'PRODUCT_DISCOVERY')
        }
        const stock = await runTool('check_inventory', {
            sku: selectedSku,
            color: context.orderDraft?.color || context.selection.color,
            size: context.orderDraft?.size || context.selection.size,
            quantity: context.orderDraft?.quantity || context.selection.quantity || 1
        })
        if (stock.error || !stock.output) {
            return finish('দুঃখিত, এই প্রোডাক্টের লাইভ স্টক এখন যাচাই করা যাচ্ছে না।', originalState)
        }
        const reply = stock.output.available
            ? `${stock.output.productName}${stock.output.color ? ` (${stock.output.color}${stock.output.size ? `, ${stock.output.size}` : ''})` : ''} স্টকে আছে।`
            : `দুঃখিত, নির্বাচিত ভ্যারিয়েন্টটি প্রয়োজনীয় পরিমাণে স্টকে নেই। অন্য রং বা সাইজ বেছে নিতে পারেন।`
        return finish(reply, originalState)
    }

    if (understanding.intent === 'DELIVERY_QUERY') {
        const address = understanding.entities.address || context.orderDraft?.address
        if (!address) {
            return finish('সঠিক ডেলিভারি চার্জ ও সময় জানতে আপনার জেলা বা ডেলিভারি এলাকা বলুন।', originalState)
        }
        const delivery = await runTool('calculate_delivery_fee', {
            address,
            district: understanding.entities.district || context.orderDraft?.district || address,
            orderTotal: context.orderDraft?.unitPrice || context.selection.price || 0
        })
        return finish(
            delivery.output?.explanation || 'দুঃখিত, এই ঠিকানার ডেলিভারি চার্জ এখন যাচাই করা যাচ্ছে না।',
            originalState
        )
    }

    if (understanding.intent === 'PAYMENT_QUERY' && understanding.entities.trxId) {
        const proof = await runTool('verify_payment', {
            trxId: understanding.entities.trxId,
            method: context.orderDraft?.paymentMethod || understanding.entities.paymentMethod || 'bKash'
        })
        const reply = proof.output?.reviewRequired
            ? `TrxID ${understanding.entities.trxId} গ্রহণ করা হয়েছে, কিন্তু এটি দিয়ে পেমেন্ট কনফার্ম করা হয়নি। গেটওয়ে API/webhook নিশ্চিত না করা পর্যন্ত অর্ডার unpaid থাকবে; প্রয়োজনে মার্চেন্ট ম্যানুয়ালি যাচাই করবেন।`
            : 'TrxID-এর ফরম্যাট সঠিক নয়। SMS থেকে সম্পূর্ণ TrxID আবার দিন, অথবা নিরাপদ hosted payment link ব্যবহার করুন।'
        return finish(reply, 'VERIFY_PAYMENT')
    }

    if (understanding.intent === 'PAYMENT_QUERY' && !understanding.entities.trxId) {
        if (context.orderDraft) {
            context.orderDraft.paymentMethod = undefined
            context.session.lastAskedField = 'payment'
            return finish(
                lang === 'en'
                    ? 'Sure! Which payment method would you prefer: bKash, Nagad, Bank, or Cash on Delivery (COD)?'
                    : 'অবশ্যই! আপনি কোন মাধ্যমে পেমেন্ট করতে চান: bKash, Nagad, ব্যাংক অথবা Cash on Delivery (COD)?',
                'VERIFY_ORDER'
            )
        }
        return finish(
            lang === 'en'
                ? 'We accept bKash, Nagad, Bank (Cards & Net Banking), and Cash on Delivery (COD). Which do you prefer?'
                : 'আমরা bKash, Nagad, ব্যাংক (কার্ড ও নেট ব্যাংকিং) এবং Cash on Delivery (COD) গ্রহণ করি। আপনি কোনটি বেছে নিতে চান?',
            context.session.state
        )
    }

    if (understanding.intent === 'IMAGE_REQUEST') {
        if (!selectedSku) {
            const list = buildProductListReply(context)
            context.session.lastPresentedOptions = list.options
            context.session.lastAskedField = 'product'
            return finish(`কোন প্রোডাক্টের ছবি চান?\n${list.text}`, 'PRODUCT_DISCOVERY')
        }
        const query = [selectedSku, context.selection.color].filter(Boolean).join(' ')
        const images = resolveIntelligentProductImages(context.agentConfig.catalog || [], query, '', context.session)
        return finish(
            images.length ? 'নির্বাচিত প্রোডাক্টের অফিসিয়াল ছবি পাঠালাম।' : 'দুঃখিত, নির্বাচিত প্রোডাক্টের অফিসিয়াল ছবি এখন পাওয়া যাচ্ছে না।',
            originalState,
            { imagesToSend: images.length ? images : undefined }
        )
    }

    const hasOrderEntity = Boolean(
        understanding.entities.sku || understanding.entities.color || understanding.entities.size ||
        understanding.entities.quantity || understanding.entities.phone || understanding.entities.address ||
        understanding.entities.paymentMethod
    )
    const isOrderProgress = understanding.intent === 'ORDER_START' ||
        understanding.intent === 'ORDER_CONFIRM' ||
        understanding.intent === 'OPTION_SELECTION' ||
        understanding.intent === 'PAYMENT_SELECTION' ||
        understanding.intent === 'AFFIRMATION' ||
        (ORDER_COLLECTION_STATES.includes(originalState) && hasOrderEntity)

    if (!isOrderProgress) return null

    const paymentMethod = context.orderDraft?.paymentMethod
    if (paymentMethod && !['bkash', 'nagad', 'stripe', 'cod', 'sslcommerz', 'bank'].includes(paymentMethod)) {
        context.orderDraft!.paymentMethod = undefined
        context.session.lastAskedField = 'payment'
        return finish('এই পেমেন্ট গেটওয়েটি এখন কনফিগার করা নেই। bKash, Nagad, ব্যাংক অথবা COD বেছে নিন।', 'VERIFY_ORDER')
    }

    const missing = getMissingOrderField(context)
    if (missing) {
        context.session.lastAskedField = missing
        if (missing === 'product') {
            const list = buildProductListReply(context)
            context.session.lastPresentedOptions = list.options
        }
        return finish(buildProgressReply(context, missing), stateForMissingField(missing, originalState))
    }

    const draft = context.orderDraft!
    const stock = await runTool('check_inventory', {
        sku: draft.sku,
        color: draft.color,
        size: draft.size,
        quantity: draft.quantity || 1
    })
    if (stock.error || !stock.output?.available) {
        context.session.lastAskedField = draft.size ? 'color' : 'size'
        return finish(
            stock.error
                ? 'অর্ডার দেওয়ার আগে লাইভ স্টক যাচাই করা যায়নি। একটু পরে চেষ্টা করুন বা একজন প্রতিনিধির সাহায্য নিন।'
                : 'দুঃখিত, নির্বাচিত ভ্যারিয়েন্টটি প্রয়োজনীয় পরিমাণে স্টকে নেই। অন্য রং বা সাইজ বেছে নিন।',
            'VARIANT_SELECTION'
        )
    }

    const price = await runTool('get_current_price', { sku: draft.sku, quantity: draft.quantity || 1 })
    if (price.error || !price.output) {
        return finish('অর্ডার দেওয়ার আগে যাচাইকৃত মূল্য পাওয়া যায়নি। কোনো অর্ডার তৈরি করা হয়নি।', 'VERIFY_ORDER')
    }

    const delivery = await runTool('calculate_delivery_fee', {
        address: draft.address,
        district: draft.district || draft.address,
        orderTotal: price.output.finalItemTotal
    })
    if (delivery.error || !delivery.output) {
        return finish('ডেলিভারি চার্জ যাচাই করা যায়নি। কোনো অর্ডার তৈরি করা হয়নি।', 'VERIFY_ORDER')
    }

    draft.unitPrice = price.output.unitPrice
    draft.deliveryFee = delivery.output.deliveryFee
    draft.total = Number(price.output.finalItemTotal) + Number(delivery.output.deliveryFee)
    draft.isAdvanceRequired = delivery.output.advancePaymentRequired

    const explicitlyConfirmed = context.session.lastAskedField === 'confirmation' &&
        (understanding.intent === 'AFFIRMATION' || understanding.intent === 'ORDER_CONFIRM')
    if (!explicitlyConfirmed) {
        context.session.lastAskedField = 'confirmation'
        return finish(
            buildOrderReviewReply(context),
            'VERIFY_ORDER',
            { orderCreated: false },
            {
                awaiting_confirmation: true,
                unitPrice: draft.unitPrice,
                delivery_fee: draft.deliveryFee,
                total: draft.total
            }
        )
    }

    const order = await runTool('create_order', {
        customerName: draft.name || context.customerName || 'Customer',
        phone: draft.phone,
        address: draft.address,
        sku: draft.sku,
        color: draft.color,
        size: draft.size,
        quantity: draft.quantity || 1,
        unitPrice: draft.unitPrice,
        deliveryFee: draft.deliveryFee,
        total: draft.total,
        paymentProvider: draft.paymentMethod
    })

    if (order.output?.checkoutUrl) allowedUrls.push(order.output.checkoutUrl)
    if (order.output?.success && order.output.status === 'pending_payment' && order.output.checkoutUrl) {
        context.session.lastAskedField = 'confirmation'
        return finish(
            buildPendingPaymentReceipt(context, order.output),
            'AWAIT_PAYMENT',
            { orderCreated: false },
            { status: 'pending_payment', payment_status: 'pending' }
        )
    }
    if (order.output?.success && order.output.status === 'confirmed') {
        const receipt = buildConfirmedOrderReceipt(context, order.output)
        context.orderDraft = {
            name: context.customer?.name || context.customerName,
            phone: context.customer?.phone,
            address: context.customer?.address,
            quantity: 1
        }
        context.selection = { quantity: 1 }
        context.session.lastAskedField = undefined
        context.session.checkoutToken = 'chk_' + Math.random().toString(36).slice(2, 9)
        return finish(
            receipt,
            'ORDER_CONFIRMED',
            { orderCreated: true },
            {
                status: 'confirmed',
                sku: null,
                color: null,
                size: null,
                quantity: null,
                total: null,
                unitPrice: null,
                delivery_fee: null,
                payment_method: null,
                awaiting_confirmation: false
            }
        )
    }

    return finish(
        order.output?.status === 'pending_payment'
            ? (lang === 'en'
                ? 'Your order details have been recorded, but a secure payment link could not be generated. Please contact the shop owner to check the payment gateway configuration.'
                : 'আপনার অর্ডারের তথ্য সংরক্ষিত আছে, কিন্তু নিরাপদ পেমেন্ট লিংক তৈরি হয়নি। কোনো পেমেন্ট বা COD কনফার্ম হয়নি—শপ মালিককে গেটওয়ে কনফিগারেশন যাচাই করতে হবে।')
            : (lang === 'en'
                ? (order.output?.message || 'Sorry, the order could not be placed. Your details are saved; no payment or order was confirmed.')
                : (order.output?.message || 'দুঃখিত, অর্ডারটি তৈরি করা যায়নি। আপনার তথ্য সংরক্ষিত আছে; কোনো পেমেন্ট বা অর্ডার কনফার্ম হয়নি।')),
        order.output?.status === 'pending_payment' ? 'AWAIT_PAYMENT' : 'VERIFY_ORDER'
    )
}

export async function runAgent(
    event: IncomingAgentEvent,
    agent: any
): Promise<AgentResult & { aiPaused?: boolean }> {
    const startTime = Date.now()
    const supabase = useSupabaseAdmin()

    // 1. Build Context
    const context = await buildAgentContext(event, agent)

    if (context.aiDisabled || context.session.aiDisabled || agent.is_active === false) {
        return {
            text: '',
            state: context.session.state,
            aiPaused: true
        }
    }

    // 2. Understand Message (NLU + Correction Detection)
    const userText = event.text || ''
    const previousAgentMessage = [...context.recentMessages].reverse().find(message => message.role === 'assistant')?.content
    const understanding = understandMessageFast(userText, previousAgentMessage, context.agentConfig.catalog || [])
    mergeCurrentTurn(context, understanding, userText)

    // 2.1 Human Agent Handoff Intercept
    if (understanding.intent === 'HUMAN_HANDOFF') {
        await mergeLeadData(supabase, context.session.leadId, { ai_disabled: true, handoff_reason: userText })
        const handoffText = 'জি অবশ্যই! আপনাকে আমাদের লাইভ কাস্টমার সাপোর্ট টিমের একজন প্রতিনিধির সাথে কানেক্ট করে দেওয়া হচ্ছে। কিছুক্ষণের মধ্যে আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন। ধন্যবাদ!'
        const handoffResult: AgentResult = {
            text: handoffText,
            state: 'SUPPORT',
            aiPaused: true,
            latencyMs: Date.now() - startTime
        }
        await logAgentTrace(context, understanding, handoffResult, startTime)
        return handoffResult
    }

    // 2.1.1 Defect & Damage Complaint Priority Escalation (e.g. Unboxing Videos / Defect Reports)
    if (understanding.intent === 'COMPLAINT') {
        await mergeLeadData(supabase, context.session.leadId, { support_status: 'priority_defect', complaint_details: userText })
        const complaintText = 'আমরা আন্তরিকভাবে দুঃখিত এই অসুবিধার জন্য! আপনার দেওয়া তথ্য/ভিডিওটি আমাদের কাস্টমার সাপোর্ট টিমের কাছে পাঠানো হয়েছে। খুব দ্রুত আমাদের টিম আপনার সাথে যোগাযোগ করে এটি সমাধান করে দেবে। ধন্যবাদ!'
        const complaintResult: AgentResult = {
            text: complaintText,
            state: 'SUPPORT',
            latencyMs: Date.now() - startTime
        }
        await logAgentTrace(context, understanding, complaintResult, startTime)
        return complaintResult
    }

    // 2.2 Catalog Grounding Match
    const catalogMatch = evaluateCatalogMatch(userText, context.agentConfig.catalog || [])

    // 2.1.2 Long / Heavy Video Review Acknowledgment
    if (userText.includes('[Customer uploaded long video')) {
        await mergeLeadData(supabase, context.session.leadId, { support_status: 'long_video_review', video_details: userText })
        // If vision caught an in-catalog item (e.g. t-shirt), allow discovery flow, otherwise give immediate human-review confirmation
        const isApparelMention = userText.toLowerCase().includes('shirt') || userText.toLowerCase().includes('hoodie') || userText.toLowerCase().includes('t-shirt')
        if (!isApparelMention && !catalogMatch.isMatch) {
            const longVideoText = 'ধন্যবাদ! আপনার পাঠানো ভিডিওটি আমাদের সাপোর্ট টিমের কাছে পৌঁছেছে। আমাদের প্রতিনিধি ভিডিওটি দেখে খুব দ্রুত আপনার সাথে যোগাযোগ করবে। আপনি চাইলে সংক্ষেপে বিস্তারিত লিখেও জানাতে পারেন।'
            const longVidResult: AgentResult = {
                text: longVideoText,
                state: 'SUPPORT',
                latencyMs: Date.now() - startTime
            }
            await logAgentTrace(context, understanding, longVidResult, startTime)
            return longVidResult
        }
    }

    // 2.2.1 Out-of-Catalog Grounding Verification for Image Uploads (Prevent Hallucinations on Non-Store Images)
    const lowerUserText = userText.toLowerCase()
    const isImageUpload = lowerUserText.includes('[user sent image:') ||
        lowerUserText.includes('[customer uploaded image:') ||
        lowerUserText.startsWith('user sent an image')

    if (isImageUpload && !catalogMatch.isMatch) {
        understanding.intent = 'OUT_OF_CATALOG'
        const outOfCatalogText = 'ধন্যবাদ আপনার ছবির জন্য। তবে এটি আমাদের বর্তমান ক্যাটালগের কোনো প্রোডাক্টের সাথে মিলছে না। আমাদের বর্তমান প্রোডাক্ট ক্যাটালগ দেখতে চাইলে জানাতে পারেন, অথবা অন্য কোনোভাবে সাহায্য করতে পারি কি?'
        const outResult: AgentResult = {
            text: outOfCatalogText,
            state: 'PRODUCT_DISCOVERY',
            latencyMs: Date.now() - startTime
        }
        await logAgentTrace(context, understanding, outResult, startTime)
        return outResult
    }

    // New Order Lifecycle: If customer requests another order or starts a new purchase after an order was confirmed, start fresh session
    if (understanding.intent === 'NEW_ORDER' ||
        (context.session.state === 'ORDER_CONFIRMED' && (understanding.intent === 'ORDER_START' || understanding.intent === 'PRODUCT_DISCOVERY'))) {
        context.session.state = 'SALES_INQUIRING'
        context.session.lastAskedField = 'product'
        context.session.checkoutToken = 'chk_' + Math.random().toString(36).slice(2, 9)
        context.selection = { quantity: 1 }
        context.orderDraft = {
            name: context.customer?.name || context.customerName,
            phone: context.customer?.phone,
            address: context.customer?.address,
            quantity: 1
        }
    }

    // Deterministic state transitions handle identity, address, variants, payment,
    // price, stock and order creation before a language model can improvise.
    const deterministicResult = await runDeterministicTurn(event, context, understanding)
    if (deterministicResult) {
        deterministicResult.latencyMs = Date.now() - startTime
        deterministicResult.reaction = decideReaction(understanding, context)
        await logAgentTrace(context, understanding, deterministicResult, startTime)
        return deterministicResult
    }

    if (understanding.intent === 'CUSTOMER_CORRECTION') {
        understanding.rawSummary = userText
        const repaired = await runConversationRepair(context, understanding)
        repaired.text = formatReplyForChannel(repaired.text, event)
        repaired.latencyMs = Date.now() - startTime
        await logAgentTrace(context, understanding, repaired, startTime)
        return repaired
    }

    // 2.3 Switch Back to Previous Product Selection ("Ager ta dao")
    if (understanding.intent === 'SWITCH_BACK' && context.previousSelection) {
        const temp = { ...context.selection }
        context.selection = { ...context.previousSelection }
        context.previousSelection = temp

        const restoredItemName = context.selection.productName || context.selection.sku || 'টি-শার্ট'
        const restoredDetails = [context.selection.color, context.selection.size].filter(Boolean).join(' ')
        const switchText = `ঠিক আছে! আপনার আগের পছন্দ অনুযায়ী ${restoredItemName} ${restoredDetails ? `(${restoredDetails})` : ''} সিলেক্ট করা হলো। আপনি কি এটি কনফার্ম করতে চান?`

        // Check if there are images for restored item
        const imagesToSend = resolveIntelligentProductImages(context.agentConfig.catalog || [], restoredItemName, switchText, context.session)
        const switchResult: AgentResult = {
            text: switchText,
            state: 'VARIANT_SELECTION',
            imagesToSend: imagesToSend.length > 0 ? imagesToSend : undefined,
            latencyMs: Date.now() - startTime
        }
        await logAgentTrace(context, understanding, switchResult, startTime)
        return switchResult
    }

    // Checkout Token Lifecycle: If customer starts a new purchase after an order was confirmed, start fresh session
    if (context.session.state === 'ORDER_CONFIRMED' && (understanding.intent === 'ORDER_START' || understanding.intent === 'PRODUCT_DISCOVERY' || understanding.entities.sku)) {
        context.session.checkoutToken = 'chk_' + Math.random().toString(36).slice(2, 9)
    }

    // 3. Routing
    const complexity = classifyComplexity(understanding)
    const route = chooseModelRoute({ complexity })
    console.log(`[AGENT MODEL ROUTE]: provider=${route.providerName} model=${route.model || 'rules'} complexity=${complexity}`)

    // Order creation is deliberately application-controlled above. The model may
    // read facts through tools, but it cannot independently trigger a side effect.
    const tools = getAllToolDefinitions().filter(tool => tool.name !== 'create_order')
    const provider = route.provider || getProviderByName('groq')

    // 5. Multi-Tenant RAG Hybrid Search & Knowledge Retrieval
    let relevantKnowledgeText = (context.agentConfig.knowledge || '').slice(0, 6000)

    if (context.shopId && shouldRetrieveKnowledge(understanding.intent)) {
        try {
            const rawMatches = await performHybridSearch({
                query: userText,
                shopId: context.shopId,
                agentId: context.agentId,
                docTypes: knowledgeTypesForIntent(understanding.intent),
                limit: 8
            })

            const topChunks = rerankCandidates(rawMatches, {
                query: userText,
                intent: understanding.intent,
                entities: understanding.entities,
                maxResults: 3
            })

            if (topChunks.length > 0) {
                const chunkSummaries = topChunks.map(c => `• ${c.content}`).join('\n\n')
                relevantKnowledgeText = `${relevantKnowledgeText ? `${relevantKnowledgeText}\n\n` : ''}Authoritative Retrieved Knowledge & Policies:\n${chunkSummaries}`
            }
        } catch (ragErr: any) {
            console.warn(`[AGENT_RAG_WARN]: Knowledge retrieval skipped (${ragErr?.message})`)
        }
    }

    if (!relevantKnowledgeText.trim()) {
        relevantKnowledgeText = 'No verified merchant knowledge matched this question. Do not invent facts; ask one concise clarification or offer human support.'
    }

    // 5.1 System Prompt Construction
    const systemPrompt = `You are a friendly, highly intelligent, and helpful AI Sales Representative for "${context.agentConfig.businessName || 'our store'}".
Tone & Style: ${context.agentConfig.tone}

Merchant Knowledge & Relevant Policies:
${relevantKnowledgeText}

Live Product Catalog:
${JSON.stringify(context.agentConfig.catalog || [])}

Current State: ${context.session.state}
Active Language: ${context.session.language || 'dynamic'}
Active Product Selection: ${JSON.stringify(context.selection)}
Active Order Draft: ${JSON.stringify(context.orderDraft)}

CORE BEHAVIORAL RULES:
1. RESPECTFUL TONE: ALWAYS address the customer respectfully using "আপনি / আপনার" (never use "তুমি / তুই" under any circumstance). Maintain a warm, polite, and helpful sales assistant demeanor.
2. CONTEXTUAL & NUMBERED SELECTION: Read the recent conversation history carefully. When you previously listed numbered items (e.g. 1️⃣ T-Shirt, 2️⃣ Jacket), and the customer says "1", "1 number", "১", "first ta", or "hum ami eita cai", understand that they are referring to item #1 from your previous list.
3. BANGLADESH ADDRESS ACCEPTANCE: Any address provided with Area/Village/Thana and District (e.g. "Cumilla, Burichang, Ramchandrapur" or "মিরপুর ১০, ঢাকা") is 100% VALID and SUFFICIENT for courier delivery. NEVER ask for house numbers, flat numbers, road numbers, or postal codes. NEVER ask the customer to repeat their address if they already provided it in the chat history.
4. ORDER SAFETY: The application controls order creation. Never claim an order or payment is confirmed unless a tool result in this turn explicitly proves it.
5. FACTUAL GROUNDING: ALWAYS use tools (check_inventory, get_current_price, calculate_delivery_fee, search_products) before giving facts. Never make up stock numbers, prices, or discounts.
6. NO MULTI-ROW TABLES FOR ADDRESSES: When calculating delivery fee for a customer's location, calculate it for their specific district once. Never print multi-row tables breaking down every word of their address.
7. NO FALSE IMAGE CLAIMS: Never claim or assume that the customer uploaded an image unless the message explicitly begins with "[user sent image:".
8. PAYMENT METHODS: Supported options are bKash, Nagad, Bank (Cards & Net Banking via SSLCOMMERZ), and Cash on Delivery (COD). Present these options clearly as "bKash, Nagad, Bank, or Cash on Delivery (COD)". Never mention Stripe or SSLCOMMERZ brand names directly to customers unless specifically asked. Never treat a screenshot or typed TrxID as provider verification.
9. NO MARKDOWN IMAGES: Never output markdown image links ![alt](url) in your text. The system automatically sends product photos via chat channels.
10. MULTILINGUAL FLUENCY: You are fluent in all languages (English, Bengali, Hindi, Arabic, German, Spanish, French, Urdu, etc.). ALWAYS respond in the exact language the customer is speaking or requesting. If the customer asks you to speak in German or asks about the company in German, answer fluently in German. If in Arabic, answer in Arabic. If in Hindi, answer in Hindi. If in Spanish, answer in Spanish. If in English, answer in English. If in Bengali/Banglish, answer in Bengali. Keep responses concise, clear, and under 60 words.`

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
            try {
                modelRes = await fallbackProvider.runWithTools({
                    messages,
                    tools,
                    temperature: 0.1
                })
            } catch (fallbackError: any) {
                console.error(`[AGENT PROVIDER FAILURE]: Both providers failed (${fallbackError?.message || 'unknown error'}).`)
                context.session.fallbackCount = (context.session.fallbackCount || 0) + 1
                finalReplyText = 'দুঃখিত, এই মুহূর্তে AI সেবায় সাময়িক সমস্যা হচ্ছে। আপনার তথ্য সংরক্ষিত আছে—একটু পরে আবার চেষ্টা করুন বা “human agent” লিখুন।'
                break
            }
        }

        totalTokens += Number(modelRes.totalTokens || 0)

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

        if (orderResult?.output?.success && orderResult.output.status === 'pending_payment') {
            finalReplyText = buildPendingPaymentReceipt(context, orderResult.output)
        } else if (orderResult?.output?.success) {
            finalReplyText = buildConfirmedOrderReceipt(context, orderResult.output)
        } else if (stockResult?.output) {
            finalReplyText = stockResult.output.available
                ? `জি, ${stockResult.output.productName} (${stockResult.output.availableQuantity} পিস) স্টকে এভেইলেবল রয়েছে। আপনি কি অর্ডার করতে চান?`
                : `দুঃখিত, এই ভ্যারিয়েন্টটি বর্তমানে স্টকে নেই। অন্য কোনো কালার বা সাইজ দেখতে পারেন।`
        } else if (deliveryResult?.output) {
            finalReplyText = deliveryResult.output.explanation || `ডেলিভারি চার্জ: ${deliveryResult.output.deliveryFee} টাকা।`
        } else if (priceResult?.output) {
            finalReplyText = priceResult.output.explanation || `মূল্য: ৳${priceResult.output.finalItemTotal} BDT।`
        } else if (understanding.intent === 'GREETING') {
            finalReplyText = buildGreetingReply(context, userText)
        } else {
            const missing = getMissingOrderField(context)
            if (ORDER_COLLECTION_STATES.includes(context.session.state) && missing) {
                context.session.lastAskedField = missing
                finalReplyText = buildProgressReply(context, missing)
            } else {
                context.session.fallbackCount = (context.session.fallbackCount || 0) + 1
                finalReplyText = context.session.fallbackCount >= 2
                    ? 'দুঃখিত, আপনার কথাটি নিশ্চিতভাবে বুঝতে পারিনি। প্রোডাক্টের নাম, অর্ডার সমস্যা, অথবা প্রয়োজনটি আরেকটু বিস্তারিত লিখুন; চাইলে “human agent” লিখে প্রতিনিধির সাহায্য নিন।'
                    : 'দুঃখিত, আপনার কথাটি পুরোপুরি বুঝতে পারিনি। আপনি প্রোডাক্ট, দাম, স্টক, ডেলিভারি নাকি অর্ডার সম্পর্কে জানতে চান—একটু পরিষ্কার করে বলুন।'
            }
            // Safe Knowledge Gap Detection
            recordKnowledgeGap({
                agentId: context.agentId,
                question: userText,
                customerContext: context.selection.sku || undefined,
                category: 'general',
                suggestedAnswer: finalReplyText
            }).catch(() => { })
        }
    }

    const allowedReplyUrls = executedToolResults
        .map(result => result.output?.checkoutUrl)
        .filter((url): url is string => typeof url === 'string' && url.length > 0)
    finalReplyText = formatReplyForChannel(finalReplyText, event, allowedReplyUrls.length > 0 ? allowedReplyUrls : undefined)

    // 7. Lightweight Pre-Response Critic Verification
    const criticResult = verifyResponseLightweight(finalReplyText, executedToolResults, context, {
        userText,
        hadImage: event.media?.type === 'image'
    })
    if (!criticResult.pass && criticResult.issues?.some(issue => issue.severity === 'high')) {
        const missing = getMissingOrderField(context)
        finalReplyText = missing && ORDER_COLLECTION_STATES.includes(context.session.state)
            ? buildProgressReply(context, missing)
            : 'দুঃখিত, উত্তরটি নির্ভরযোগ্যভাবে যাচাই করা যায়নি। আপনার তথ্য সংরক্ষিত আছে—একজন প্রতিনিধি বিষয়টি যাচাই করবেন।'
    }

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
    const confirmedOrderCreated = executedToolResults.some(t =>
        t.name === 'create_order' && t.output?.success && t.output?.status === 'confirmed'
    )
    const pendingPaymentOrderCreated = executedToolResults.some(t =>
        t.name === 'create_order' && t.output?.success && t.output?.status === 'pending_payment'
    )
    const { nextState } = computeNextState(context.session.state, {
        intent: understanding.intent,
        hasProductSelection: Boolean(context.selection.sku || understanding.entities.sku),
        hasStockConfirmed: executedToolResults.some(t => t.name === 'check_inventory' && t.output?.available),
        hasName: Boolean(context.orderDraft?.name || understanding.entities.name),
        hasPhone: Boolean(context.orderDraft?.phone || understanding.entities.phone),
        hasAddress: Boolean(context.orderDraft?.address || understanding.entities.address),
        requiresAdvance: context.orderDraft?.isAdvanceRequired,
        hasTrxId: Boolean(context.orderDraft?.trxId || understanding.entities.trxId),
        isConfirmed: confirmedOrderCreated
    })

    const resolvedNextState = pendingPaymentOrderCreated ? 'AWAIT_PAYMENT' : nextState

    // Save State & Keep Active Checkout Token Attached
    await saveFsmState(context.agentId, context.customerId, resolvedNextState, context.session.state, {
        ...collectedDetailsForSave(context, understanding.entities),
        ...(confirmedOrderCreated ? { status: 'confirmed' } : {}),
        ...(pendingPaymentOrderCreated ? { status: 'pending_payment', payment_status: 'pending' } : {})
    }, context.channel)

    // 10. Social Reaction Decision
    const reaction = decideReaction(understanding, context)

    const result: AgentResult = {
        text: finalReplyText,
        state: resolvedNextState,
        imagesToSend: imagesToSend.length > 0 ? imagesToSend : undefined,
        orderCreated: confirmedOrderCreated,
        reaction,
        tokensUsed: totalTokens,
        toolCalls: executedToolCalls.length > 0 ? executedToolCalls : undefined,
        latencyMs: Date.now() - startTime
    }

    await logAgentTrace(context, understanding, result, startTime)

    return result
}
