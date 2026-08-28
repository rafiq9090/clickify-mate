import type { IncomingAgentEvent, AgentContext, ConversationState } from './agent_types'
import { listCatalogForAgent, shopIdForAgent } from '../catalog-store'
import { useSupabaseAdmin } from '../supabase'

export async function buildAgentContext(
    event: IncomingAgentEvent,
    agent: any
): Promise<AgentContext> {
    const supabase = useSupabaseAdmin()
    const shopId = await shopIdForAgent(agent.id)

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
        const { data: leads } = await supabase
            .from('leads')
            .select('*')
            .eq('email', emailKey)
            .eq('data->>agent_id', agent.id)
            .order('created_at', { ascending: false })

        if (Array.isArray(leads) && leads.length > 0) {
            const lead = leads[0]
            leadId = lead.id
            aiDisabled = leads.some(l => l.data?.ai_disabled === true)
            currentState = (lead.data?.current_state as ConversationState) || 'SALES_INQUIRING'
            previousValidState = (lead.data?.previous_valid_state as ConversationState) || currentState
            collectedDetails = lead.data?.collected_details || {}
            customerPhone = lead.phone || collectedDetails.phone
            customerAddress = collectedDetails.address
        }
    }

    // 2. Fetch last 25 recent messages for rich conversational memory
    const recentMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; created_at?: string }> = []
    if (supabase && supabase.from) {
        const { data: history } = await supabase
            .from('chat_history')
            .select('role, content, created_at')
            .eq('agent_id', agent.id)
            .eq('user_external_id', event.customerId)
            .order('created_at', { ascending: false })
            .limit(25)

        if (Array.isArray(history)) {
            // Sort ascending chronologically
            const sortedHistory = [...history].sort((a: any, b: any) => {
                const timeA = new Date(a.created_at || 0).getTime()
                const timeB = new Date(b.created_at || 0).getTime()
                return timeA - timeB
            })
            for (const h of sortedHistory) {
                if (h.role === 'user' || h.role === 'assistant') {
                    recentMessages.push({
                        role: h.role,
                        content: h.content,
                        created_at: h.created_at
                    })
                }
            }

            // Messenger/WhatsApp persist the incoming message before invoking the
            // agent, while Telegram/Instagram persist it afterward. Remove only an
            // exact latest copy so every channel presents the current turn once.
            const latest = recentMessages[recentMessages.length - 1]
            if (latest?.role === 'user' &&
                latest.content.trim() === String(event.text || '').trim()) {
                recentMessages.pop()
            }
        }
    }

    // 3. Catalog context
    const catalog = await listCatalogForAgent(agent.id)
    const assignedProducts = catalog.filter((p: any) =>
        !p.assigned_agent || p.assigned_agent === 'all' || p.assigned_agent === agent.id
    )

        // Match product from Facebook / Instagram post context if customer has not selected one yet
        let resolvedSku = collectedDetails.sku || collectedDetails.product
        let resolvedProductName = collectedDetails.productName
        let resolvedPrice = collectedDetails.price ? Number(collectedDetails.price) : undefined

        if (!resolvedSku && event.postContext?.postCaption && assignedProducts.length > 0) {
            const captionLower = event.postContext.postCaption.toLowerCase()
            const matched = assignedProducts.find((p: any) => {
                const nameLower = (p.name || '').toLowerCase()
                const skuLower = (p.sku || '').toLowerCase()
                return (nameLower && captionLower.includes(nameLower)) || (skuLower && captionLower.includes(skuLower))
            })
            if (matched) {
                resolvedSku = matched.sku || matched.name
                resolvedProductName = matched.name
                resolvedPrice = matched.price
            }
        }

        return {
        agentId: agent.id,
        shopId: shopId || undefined,
        channel: event.channel,
        customerId: event.customerId,
        customerName: event.customerName,
        customerAvatar: event.customerAvatar,
        aiDisabled,
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
            checkoutToken: collectedDetails.checkout_token || ('chk_' + Math.random().toString(36).slice(2, 9)),
            lastPresentedOptions: collectedDetails.last_presented_options || {},
            lastAskedField: collectedDetails.last_asked_field,
            fallbackCount: Number(collectedDetails.fallback_count || 0)
        },
        selection: {
            sku: resolvedSku,
            productName: resolvedProductName,
            color: collectedDetails.color,
            size: collectedDetails.size,
            quantity: collectedDetails.quantity ? Number(collectedDetails.quantity) : 1,
            price: resolvedPrice
        },
        previousSelection: collectedDetails.previous_selection || undefined,
        orderDraft: {
            name: collectedDetails.name || event.customerName,
            phone: collectedDetails.phone || customerPhone,
            address: collectedDetails.address || customerAddress,
            district: collectedDetails.district,
            sku: resolvedSku,
            productName: resolvedProductName,
            color: collectedDetails.color,
            size: collectedDetails.size,
            quantity: collectedDetails.quantity ? Number(collectedDetails.quantity) : 1,
            unitPrice: resolvedPrice || collectedDetails.unitPrice,
            deliveryFee: collectedDetails.delivery_fee,
            total: collectedDetails.total,
            trxId: collectedDetails.trxId || collectedDetails.PaymentTransactionId,
            paymentMethod: collectedDetails.paymentMethod || collectedDetails.payment_method
        },
        recentMessages,
        agentConfig: {
            name: agent.name,
            businessName: agent.agent_behavior?.business_name || (/^(?:mess|faceb|fb|telegr|tg|whats|wa|insta|ig|direct|agent|bot)/i.test(String(agent.name || '').trim()) ? '' : agent.name) || '',
            tone: agent.agent_behavior?.tone || agent.agent_behavior?.personality || 'Friendly and professional in Bengali & Banglish',
            knowledge: agent.knowledge || '',
            orderForm: agent.agent_behavior?.order_form || '',
            catalog: assignedProducts
        }
    }
}
