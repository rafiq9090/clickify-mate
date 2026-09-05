import type { AgentChannel, ConversationState } from './agent_types'
import { useSupabaseAdmin } from '../supabase'

export function computeNextState(
    currentState: ConversationState,
    event: {
        intent?: string
        hasProductSelection?: boolean
        hasStockConfirmed?: boolean
        hasName?: boolean
        hasPhone?: boolean
        hasAddress?: boolean
        requiresAdvance?: boolean
        hasTrxId?: boolean
        isConfirmed?: boolean
        isCorrection?: boolean
        isComplaint?: boolean
    }
): { nextState: ConversationState; previousValidState?: ConversationState } {
    // 1. Temporary Repair State: preserve previous valid state
    if (event.isCorrection) {
        return {
            nextState: 'REPAIR',
            previousValidState: currentState === 'REPAIR' ? 'VARIANT_SELECTION' : currentState
        }
    }

    // 2. Complaint / Support / Human Handoff
    if (event.isComplaint || event.intent === 'HUMAN_HANDOFF' || event.intent === 'HUMAN_REQUEST') {
        return { nextState: 'SUPPORT', previousValidState: currentState }
    }

    // 2.1 Switch Back to Previous Product Selection
    if (event.intent === 'SWITCH_BACK') {
        return { nextState: 'VARIANT_SELECTION', previousValidState: currentState }
    }

    // 3. Greeting: Greetings are conversational interrupts, NEVER overwrite business state!
    if (event.intent === 'GREETING') {
        return { nextState: currentState, previousValidState: currentState }
    }

    // 4. Product / Stock / Delivery / Image Inquiries (Pure Discovery & Consultation)
    // Never force customer into checkout collection when they are simply inquiring!
    if (
        event.intent === 'PRODUCT_DISCOVERY' ||
        event.intent === 'PRICE_QUERY' ||
        event.intent === 'STOCK_QUERY' ||
        event.intent === 'DELIVERY_QUERY' ||
        event.intent === 'IMAGE_REQUEST' ||
        event.intent === 'OUT_OF_CATALOG'
    ) {
        if (currentState === 'ORDER_CONFIRMED' || currentState === 'COMPLETED') {
            return { nextState: currentState, previousValidState: currentState }
        }
        return {
            nextState: 'PRODUCT_DISCOVERY',
            previousValidState: currentState
        }
    }

    // 5. Normal Order Confirmation Progression
    if (event.isConfirmed) {
        return { nextState: 'ORDER_CONFIRMED' }
    }

    if (event.requiresAdvance && !event.hasTrxId) {
        return { nextState: 'AWAIT_PAYMENT' }
    }

    if (event.hasName && event.hasPhone && event.hasAddress) {
        return { nextState: 'VERIFY_ORDER' }
    }

    if (event.hasName && event.hasPhone && !event.hasAddress) {
        return { nextState: 'COLLECT_ADDRESS' }
    }

    if (event.hasName && !event.hasPhone) {
        return { nextState: 'COLLECT_PHONE' }
    }

    if (event.intent === 'ORDER_START') {
        return { nextState: 'COLLECT_NAME' }
    }

    if (event.hasProductSelection && event.hasStockConfirmed) {
        return { nextState: 'VARIANT_SELECTION' }
    }

    return { nextState: currentState }
}

export async function saveFsmState(
    agentId: string,
    customerId: string,
    state: ConversationState,
    previousValidState?: ConversationState,
    collectedDetails?: Record<string, any>,
    channel: AgentChannel = 'telegram'
): Promise<void> {
    const supabase = useSupabaseAdmin()
    if (!supabase || !supabase.from) return

    try {
        const emailKey = `${customerId}@${channel}.org`
        const { data: existing } = await supabase
            .from('leads')
            .select('id, data')
            .eq('email', emailKey)
            .eq('data->>agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        const mergedData = {
            ...(existing?.data || {}),
            customer: customerId,
            agent_id: agentId,
            platform: channel,
            current_state: state,
            previous_valid_state: previousValidState || existing?.data?.previous_valid_state || state,
            collected_details: {
                ...(existing?.data?.collected_details || {}),
                ...(collectedDetails || {})
            }
        }

        const isExistingFinalized = existing?.data?.status === 'confirmed' ||
            existing?.data?.payment_status === 'paid'

        if (existing?.id && !isExistingFinalized) {
            await supabase.from('leads').update({ data: mergedData }).eq('id', existing.id)
        } else {
            const newLeadData = {
                customer: customerId,
                agent_id: agentId,
                platform: channel,
                current_state: state,
                previous_valid_state: previousValidState || state,
                name: collectedDetails?.name || existing?.data?.name,
                phone: collectedDetails?.phone || existing?.data?.phone,
                address: collectedDetails?.address || existing?.data?.address,
                collected_details: {
                    ...(collectedDetails || {})
                }
            }
            await supabase.from('leads').insert({
                email: emailKey,
                source: 'ai_agent',
                data: newLeadData
            })
        }
    } catch (e: any) {
        console.error('[FSM STATE SAVE ERROR]:', e.message)
    }
}
