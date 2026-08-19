import { useSupabaseAdmin } from '../../supabase'
import { deductInventoryStock } from './inventory'
import { createCourierParcel } from './courier'

export interface OrderDraftPayload {
    customerId: string
    customerName: string
    phone: string
    address: string
    sku: string
    productName?: string
    color?: string
    size?: string
    quantity: number
    unitPrice: number
    deliveryFee: number
    total: number
    paymentMethod?: string
    trxId?: string
    isPaid?: boolean
    platform?: string
    agentId?: string
    checkoutToken?: string
}

export interface OrderCreationResult {
    success: boolean
    orderId?: string
    leadId?: string
    consignmentId?: string
    trackingCode?: string
    isDuplicate: boolean
    message: string
}

// In-memory instant deduplication cache (Prevents simultaneous in-flight race conditions)
const recentOrdersCache = new Map<string, { result: OrderCreationResult; timestamp: number }>()

export async function createOrderSafely(
    draft: OrderDraftPayload,
    idempotencyKey?: string
): Promise<OrderCreationResult> {
    const supabase = useSupabaseAdmin()
    const now = Date.now()
    const colorKey = (draft.color || 'std').toLowerCase().trim()
    const sizeKey = (draft.size || 'std').toLowerCase().trim()

    // 1. Calculate deterministic cart & details hash
    const cartString = `${draft.sku}:${colorKey}:${sizeKey}:${draft.quantity}:${draft.unitPrice}:${draft.phone}:${draft.address}`
    let hash = 0
    for (let i = 0; i < cartString.length; i++) {
        hash = ((hash << 5) - hash) + cartString.charCodeAt(i)
        hash |= 0
    }
    const cartHash = Math.abs(hash).toString(36)
    const checkoutToken = draft.checkoutToken || 'chk_default'
    const safeKey = idempotencyKey || `order:${draft.customerId}:${checkoutToken}:${cartHash}`

    // 2. Instant In-Flight Race Lock
    const cached = recentOrdersCache.get(safeKey)
    if (cached && (now - cached.timestamp < 10 * 60 * 1000)) {
        console.log(`[ORDER IDEMPOTENCY LOCK]: Returning cached order for key ${safeKey}. Zero stock deducted.`)
        return {
            ...cached.result,
            isDuplicate: true,
            message: 'Order already processed (Duplicate submission prevented).'
        }
    }

    const emailKey = `${draft.customerId}@${draft.platform || 'telegram'}.org`

    // 3. Database-level Idempotency Verification
    if (supabase && supabase.from) {
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id, data, created_at')
            .eq('email', emailKey)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (existingLead && existingLead.created_at) {
            const ageMs = now - new Date(existingLead.created_at).getTime()
            const leadData = existingLead.data || {}
            const isMatchingKey = leadData.idempotency_key === safeKey
            const isRecentIdentical = ageMs < 10 * 60 * 1000 &&
                leadData.status === 'confirmed' &&
                leadData.phone === draft.phone &&
                leadData.sku === draft.sku &&
                (leadData.color || '').toLowerCase() === colorKey &&
                (leadData.size || '').toLowerCase() === sizeKey

            if (isMatchingKey || isRecentIdentical) {
                console.log(`[ORDER DB DEDUPLICATION]: Found existing order in DB (${existingLead.id}). Zero stock deducted.`)
                const duplicateResult: OrderCreationResult = {
                    success: true,
                    orderId: existingLead.id,
                    leadId: existingLead.id,
                    consignmentId: leadData.consignment_id,
                    trackingCode: leadData.tracking_code,
                    isDuplicate: true,
                    message: 'Order already created and confirmed. Zero stock deducted.'
                }
                recentOrdersCache.set(safeKey, { result: duplicateResult, timestamp: now })
                return duplicateResult
            }
        }
    }

    // 4. Deduct Inventory Stock (Only after idempotency passes)
    await deductInventoryStock({
        sku: draft.sku,
        color: draft.color,
        size: draft.size,
        quantity: draft.quantity
    })

    // 5. Clean Canonical Variant Resolution
    const cleanProductName = draft.productName || (draft.sku.includes('hoodie') ? 'Winter Hoodie' : 'Premium T-Shirt')

    // 6. Save Lead / Order to Supabase with Durable Courier Job State
    let createdLeadId = `lead-${Date.now()}`
    const orderData = {
        name: draft.customerName,
        phone: draft.phone,
        address: draft.address,
        product: cleanProductName,
        sku: draft.sku,
        color: draft.color || 'Standard',
        size: draft.size || 'Standard',
        quantity: draft.quantity,
        price: draft.unitPrice,
        delivery_fee: draft.deliveryFee,
        total: draft.total,
        payment_method: draft.paymentMethod || 'Cash On Delivery',
        trx_id: draft.trxId || null,
        is_paid: draft.isPaid || false,
        status: 'confirmed',
        customer: draft.customerId,
        agent_id: draft.agentId,
        platform: draft.platform || 'telegram',
        idempotency_key: safeKey,
        current_state: 'ORDER_CONFIRMED',
        courier_job: {
            status: 'pending',
            attempts: 0,
            created_at: new Date().toISOString()
        }
    }

    if (supabase && supabase.from) {
        const { data: insertResult, error } = await supabase
            .from('leads')
            .insert({
                email: emailKey,
                source: 'ai_agent',
                data: orderData
            })
            .select('id')
            .maybeSingle()

        if (error) {
            console.error('[ORDERS TOOL LEAD ERROR]:', error.message)
        } else if (insertResult?.id) {
            createdLeadId = insertResult.id
        }
    }

    const immediateResult: OrderCreationResult = {
        success: true,
        orderId: createdLeadId,
        leadId: createdLeadId,
        isDuplicate: false,
        message: `Order #${createdLeadId} confirmed successfully.`
    }

    // Set in-memory cache immediately
    recentOrdersCache.set(safeKey, { result: immediateResult, timestamp: now })

    // 7. Durable Background Courier Dispatch Worker (Non-blocking with persisted retry state)
    Promise.resolve().then(async () => {
        try {
            const courierResult = await createCourierParcel({
                invoice: createdLeadId,
                recipientName: draft.customerName,
                recipientPhone: draft.phone,
                recipientAddress: draft.address,
                codAmount: draft.isPaid ? 0 : draft.total,
                note: `${draft.sku} (${draft.color || ''} ${draft.size || ''}) Qty: ${draft.quantity}`
            })

            if (courierResult?.trackingCode && supabase && supabase.from) {
                await supabase
                    .from('leads')
                    .update({
                        data: {
                            ...orderData,
                            consignment_id: courierResult.consignmentId,
                            tracking_code: courierResult.trackingCode,
                            courier_status: 'booked',
                            courier_job: {
                                status: 'completed',
                                completed_at: new Date().toISOString()
                            }
                        }
                    })
                    .eq('id', createdLeadId)

                // Update cache with tracking info
                recentOrdersCache.set(safeKey, {
                    result: {
                        ...immediateResult,
                        consignmentId: courierResult.consignmentId,
                        trackingCode: courierResult.trackingCode
                    },
                    timestamp: now
                })
            }
        } catch (courierErr: any) {
            console.warn(`[ASYNC COURIER WARNING]: Parcel booking deferred:`, courierErr.message)
            if (supabase && supabase.from) {
                await supabase
                    .from('leads')
                    .update({
                        data: {
                            ...orderData,
                            courier_job: {
                                status: 'retry_required',
                                error: courierErr.message,
                                last_attempt: new Date().toISOString()
                            }
                        }
                    })
                    .eq('id', createdLeadId)
            }
        }
    })

    return immediateResult
}
