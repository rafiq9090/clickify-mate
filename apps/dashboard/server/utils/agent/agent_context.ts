import type { IncomingAgentEvent, AgentContext, ConversationState } from './agent_types'
import { getMockInventory } from '../mock_shop'

export async function buildAgentContext(
    event: IncomingAgentEvent,
    agent: any
): Promise<AgentContext> {
    const supabase = useSupabaseAdmin()

    // 1. Fetch latest lead state if exists
    let currentState: ConversationState = 'SALES_INQUIRING'
    let previousValidState: ConversationState = 'SALES_INQUIRING'
    let leadId: string | undefined = undefined
    let collectedDetails: any = {}
    let customerPhone: string | undefined = undefined
    let customerAddress: string | undefined = undefined
    let aiDisabled = false

    if (supabase && supabase.from) {
        const emailKey = `${event.customerId}@${event.channel || 'telegram'}.org`
        const { data: lead } = await supabase
            .from('leads')
            .select('*')
            .eq('email', emailKey)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (lead) {
            leadId = lead.id
            aiDisabled = lead.data?.ai_disabled === true
            currentState = (lead.data?.current_state as ConversationState) || 'SALES_INQUIRING'
            previousValidState = (lead.data?.previous_valid_state as ConversationState) || currentState
            collectedDetails = lead.data?.collected_details || {}
            customerPhone = lead.phone || collectedDetails.phone
            customerAddress = collectedDetails.address
        }
    }

    // 2. Fetch last 8 recent messages for working memory
    const recentMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; created_at?: string }> = []
    if (supabase && supabase.from) {
        const { data: history } = await supabase
            .from('chat_history')
            .select('role, content, created_at')
            .eq('agent_id', agent.id)
            .eq('user_external_id', event.customerId)
            .order('created_at', { ascending: false })
            .limit(8)

        if (Array.isArray(history)) {
            // Reverse so oldest of recent is first
            for (const h of history.reverse()) {
                if (h.role === 'user' || h.role === 'assistant') {
                    recentMessages.push({
                        role: h.role,
                        content: h.content,
                        created_at: h.created_at
                    })
                }
            }
        }
    }

    // 3. Catalog context
    const catalog = getMockInventory()
    const assignedProducts = catalog.filter((p: any) =>
        !p.assigned_agent || p.assigned_agent === 'all' || p.assigned_agent === agent.id
    )

    return {
        agentId: agent.id,
        channel: event.channel,
        customerId: event.customerId,
        customerName: event.customerName,
        customerAvatar: event.customerAvatar,
        customer: {
            id: event.customerId,
            name: event.customerName,
            phone: customerPhone,
            address: customerAddress
        },
        session: {
            state: currentState,
            previousValidState,
            leadId,
            aiDisabled,
            checkoutToken: collectedDetails.checkout_token || ('chk_' + Math.random().toString(36).slice(2, 9))
        },
        selection: {
            sku: collectedDetails.sku || collectedDetails.product,
            productName: collectedDetails.productName,
            color: collectedDetails.color,
            size: collectedDetails.size,
            quantity: collectedDetails.quantity ? Number(collectedDetails.quantity) : 1,
            price: collectedDetails.price ? Number(collectedDetails.price) : undefined
        },
        orderDraft: {
            name: collectedDetails.name || event.customerName,
            phone: collectedDetails.phone || customerPhone,
            address: collectedDetails.address || customerAddress,
            district: collectedDetails.district,
            sku: collectedDetails.sku || collectedDetails.product,
            color: collectedDetails.color,
            size: collectedDetails.size,
            quantity: collectedDetails.quantity ? Number(collectedDetails.quantity) : 1,
            unitPrice: collectedDetails.unitPrice || collectedDetails.price,
            deliveryFee: collectedDetails.delivery_fee,
            total: collectedDetails.total,
            trxId: collectedDetails.trxId || collectedDetails.PaymentTransactionId
        },
        recentMessages,
        agentConfig: {
            name: agent.name,
            businessName: agent.business_name || agent.name,
            tone: agent.tone || 'Friendly and professional in Bengali & Banglish',
            knowledge: agent.prompt || '',
            orderForm: agent.order_form || '',
            catalog: assignedProducts
        }
    }
}
