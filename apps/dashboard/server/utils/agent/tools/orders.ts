import { useSupabaseAdmin } from '../../supabase'
import { deductInventoryStock } from './inventory'
import { reserveCatalogStock } from '../../catalog-store'
import { createCourierParcel } from './courier'
import { queryPg, withPgTransaction } from '../../db'
import { createHostedCheckoutForOrder } from '../../payments/service'
import type { PaymentProviderName } from '../../payments/providers'

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
    status?: 'pending_payment' | 'confirmed'
    paymentProvider?: PaymentProviderName
    paymentAttemptId?: string
    checkoutUrl?: string
    paymentExpiresAt?: string
    isDuplicate: boolean
    message: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function resolveShopOwnerId(agentId?: string) {
    if (!agentId || !UUID_PATTERN.test(agentId)) return null
    const result = await queryPg(
        `SELECT user_id FROM public.agent_configs WHERE id = $1 LIMIT 1`,
        [agentId]
    )
    return result.rows[0]?.user_id ? String(result.rows[0].user_id) : null
}

async function createCanonicalCommerceOrder(args: {
    ownerUserId: string
    legacyLeadId: string
    idempotencyKey: string
    draft: OrderDraftPayload
    invoiceNumber: string
    status: 'pending_payment' | 'confirmed'
}) {
    return withPgTransaction(async client => {
        const shopResult = await client.query('SELECT id FROM public.shops WHERE owner_user_id = $1 LIMIT 1', [args.ownerUserId])
        const shopId = shopResult.rows[0]?.id
        if (!shopId) throw new Error('Shop profile is not configured.')

        const channel = args.draft.platform || 'telegram'
        const customerResult = await client.query(
            `INSERT INTO public.customers (
               shop_id, external_reference, primary_channel, name, phone, metadata
             ) VALUES ($1,$2,$3,$4,$5,$6::jsonb)
             ON CONFLICT (shop_id, primary_channel, external_reference) DO UPDATE
               SET name = EXCLUDED.name, phone = EXCLUDED.phone,
                   metadata = public.customers.metadata || EXCLUDED.metadata,
                   updated_at = now()
             RETURNING id`,
            [shopId, args.draft.customerId, channel, args.draft.customerName, args.draft.phone, JSON.stringify({ agent_id: args.draft.agentId })]
        )
        const customerId = customerResult.rows[0].id

        const existing = await client.query(
            'SELECT id FROM public.orders WHERE shop_id = $1 AND idempotency_key = $2 LIMIT 1',
            [shopId, args.idempotencyKey]
        )
        if (existing.rows[0]) return String(existing.rows[0].id)

        const orderResult = await client.query(
            `INSERT INTO public.orders (
               shop_id, customer_id, legacy_lead_id, invoice_number, channel, status,
               payment_status, currency, subtotal, delivery_total, grand_total,
               customer_snapshot, shipping_address, idempotency_key, placed_at, metadata
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,'BDT',$8,$9,$10,$11::jsonb,$12::jsonb,$13,now(),$14::jsonb)
             RETURNING id`,
            [
                shopId, customerId, args.legacyLeadId, args.invoiceNumber, channel, args.status,
                args.status === 'pending_payment' ? 'unpaid' : 'cod_due',
                args.draft.unitPrice * args.draft.quantity, args.draft.deliveryFee, args.draft.total,
                JSON.stringify({ name: args.draft.customerName, phone: args.draft.phone }),
                JSON.stringify({ address: args.draft.address }), args.idempotencyKey,
                JSON.stringify({ agent_id: args.draft.agentId, payment_method: args.draft.paymentMethod || 'cod' })
            ]
        )
        const orderId = orderResult.rows[0].id
        const variantResult = await client.query(
            `SELECT pv.id AS variant_id, pv.product_id
               FROM public.product_variants pv
              WHERE pv.shop_id = $1 AND pv.is_active = true
                AND (lower(pv.sku) = lower($2) OR lower(pv.metadata->>'base_sku') = lower($2))
              ORDER BY pv.created_at ASC LIMIT 1`,
            [shopId, args.draft.sku]
        )
        const variant = variantResult.rows[0]
        await client.query(
            `INSERT INTO public.order_items (
               order_id, shop_id, product_id, variant_id, sku, product_name,
               variant_snapshot, quantity, unit_price, line_total
             ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)`,
            [
                orderId, shopId, variant?.product_id || null, variant?.variant_id || null,
                args.draft.sku, args.draft.productName || args.draft.sku,
                JSON.stringify({ color: args.draft.color, size: args.draft.size }),
                args.draft.quantity, args.draft.unitPrice, args.draft.unitPrice * args.draft.quantity
            ]
        )
        return String(orderId)
    })
}

function normalizeOnlineProvider(paymentMethod?: string): PaymentProviderName | null {
    const normalized = String(paymentMethod || '').toLowerCase().replace(/[^a-z]/g, '')
    if (normalized === 'bkash') return 'bkash'
    if (normalized === 'nagad' || normalized === 'nogot') return 'nagad'
    if (normalized === 'stripe') return 'stripe'
    return null
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
    const paymentKey = (draft.paymentMethod || 'cod').toLowerCase().trim()
    const cartString = `${draft.sku}:${colorKey}:${sizeKey}:${draft.quantity}:${draft.unitPrice}:${draft.phone}:${draft.address}:${paymentKey}`
    let hash = 0
    for (let i = 0; i < cartString.length; i++) {
        hash = ((hash << 5) - hash) + cartString.charCodeAt(i)
        hash |= 0
    }
    const cartHash = Math.abs(hash).toString(36)
    const checkoutToken = draft.checkoutToken || 'chk_default'
    const safeKey = idempotencyKey || `order:${draft.customerId}:${checkoutToken}:${cartHash}`
    if (!draft.agentId || !UUID_PATTERN.test(draft.agentId)) {
        throw new Error('A valid agent is required before an order can be created.')
    }

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
    const paymentProvider = normalizeOnlineProvider(draft.paymentMethod)
    const shopOwnerId = await resolveShopOwnerId(draft.agentId)
    if (paymentProvider && !shopOwnerId) {
        throw new Error('This agent is not linked to a shop owner, so hosted checkout cannot be created.')
    }

    // 3. Database-level Idempotency Verification
    if (supabase && supabase.from) {
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id, data, created_at')
            .eq('email', emailKey)
            .eq('data->>agent_id', draft.agentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (existingLead && existingLead.created_at) {
            const ageMs = now - new Date(existingLead.created_at).getTime()
            const leadData = existingLead.data || {}
            const isMatchingKey = leadData.idempotency_key === safeKey
            const isRecentIdentical = ageMs < 10 * 60 * 1000 &&
                ['confirmed', 'pending_payment'].includes(leadData.status) &&
                leadData.phone === draft.phone &&
                leadData.sku === draft.sku &&
                (leadData.color || '').toLowerCase() === colorKey &&
                (leadData.size || '').toLowerCase() === sizeKey

            if (isMatchingKey || isRecentIdentical) {
                console.log(`[ORDER DB DEDUPLICATION]: Found existing order in DB (${existingLead.id}). Zero stock deducted.`)
                let checkout: any = null
                if (leadData.status === 'pending_payment') {
                    const paymentResult = await queryPg(
                        `SELECT id, provider, checkout_url, expires_at
                           FROM public.payment_attempts
                          WHERE order_id = $1 AND status = 'pending'
                          ORDER BY created_at DESC LIMIT 1`,
                        [existingLead.id]
                    )
                    checkout = paymentResult.rows[0] || null
                    if (!checkout && paymentProvider && shopOwnerId) {
                        try {
                            const retriedCheckout = await createHostedCheckoutForOrder({
                                userId: shopOwnerId,
                                orderId: existingLead.id,
                                provider: paymentProvider,
                                payerReference: draft.phone
                            })
                            checkout = {
                                id: retriedCheckout.attemptId,
                                provider: retriedCheckout.provider,
                                checkout_url: retriedCheckout.checkoutUrl,
                                expires_at: retriedCheckout.expiresAt
                            }
                        } catch (error: any) {
                            return {
                                success: false,
                                orderId: existingLead.id,
                                leadId: existingLead.id,
                                status: 'pending_payment',
                                paymentProvider,
                                isDuplicate: true,
                                message: `The order is saved, but a new secure ${paymentProvider} link could not be created. Please ask the shop owner to check the gateway configuration.`
                            }
                        }
                    }
                }
                const duplicateResult: OrderCreationResult = {
                    success: true,
                    orderId: existingLead.id,
                    leadId: existingLead.id,
                    consignmentId: leadData.consignment_id,
                    trackingCode: leadData.tracking_code,
                    status: leadData.status,
                    paymentProvider: checkout?.provider,
                    paymentAttemptId: checkout?.id,
                    checkoutUrl: checkout?.checkout_url,
                    paymentExpiresAt: checkout?.expires_at,
                    isDuplicate: true,
                    message: leadData.status === 'pending_payment'
                        ? 'This order is already awaiting payment. Use the existing secure checkout link.'
                        : 'Order already created and confirmed. Zero stock deducted.'
                }
                recentOrdersCache.set(safeKey, { result: duplicateResult, timestamp: now })
                return duplicateResult
            }
        }
    }

    // 4. Clean Canonical Variant Resolution
    const cleanProductName = draft.productName || (draft.sku.includes('hoodie') ? 'Winter Hoodie' : 'Premium T-Shirt')

    // 5. Save pending hosted-payment order or confirmed COD order.
    let createdLeadId = ''
    const initialStatus = paymentProvider ? 'pending_payment' : 'confirmed'
    const invoiceNumber = `CM-${Date.now().toString(36).toUpperCase()}`
    const orderData: Record<string, any> = {
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
        user_id: shopOwnerId,
        invoice_number: invoiceNumber,
        currency: 'BDT',
        payment_method: paymentProvider || draft.paymentMethod || 'Cash On Delivery',
        payment_provider: paymentProvider,
        payment_status: paymentProvider ? 'unpaid' : 'cod_due',
        trx_id: null,
        is_paid: false,
        status: initialStatus,
        customer: draft.customerId,
        agent_id: draft.agentId,
        platform: draft.platform || 'telegram',
        idempotency_key: safeKey,
        current_state: paymentProvider ? 'AWAIT_PAYMENT' : 'ORDER_CONFIRMED',
        ...(paymentProvider ? {
            payment_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        } : {
            courier_job: {
                status: 'pending',
                attempts: 0,
                max_attempts: 5,
                created_at: new Date().toISOString()
            }
        })
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
            throw new Error(`Order could not be saved: ${error.message}`)
        } else if (insertResult?.id) {
            createdLeadId = insertResult.id
        }
    }

    if (!createdLeadId || !UUID_PATTERN.test(createdLeadId)) {
        throw new Error('Order could not be saved safely. No inventory was changed.')
    }

    if (shopOwnerId && UUID_PATTERN.test(createdLeadId)) {
        try {
            const canonicalOrderId = await createCanonicalCommerceOrder({
                ownerUserId: shopOwnerId,
                legacyLeadId: createdLeadId,
                idempotencyKey: safeKey,
                draft,
                invoiceNumber,
                status: initialStatus
            })
            orderData.canonical_order_id = canonicalOrderId
            await supabase.from('leads').update({ data: orderData }).eq('id', createdLeadId)
        } catch (error: any) {
            console.error('[CANONICAL ORDER MIRROR]:', error?.message || error)
            await supabase.from('leads').update({
                data: {
                    ...orderData,
                    status: 'recording_failed',
                    order_error: String(error?.message || 'Commerce ledger failure').slice(0, 300)
                }
            }).eq('id', createdLeadId)
            throw new Error('Order could not be recorded in the commerce ledger. No inventory was changed.')
        }
    }

    let immediateResult: OrderCreationResult = {
        success: true,
        orderId: createdLeadId,
        leadId: createdLeadId,
        status: paymentProvider ? 'pending_payment' : 'confirmed',
        paymentProvider: paymentProvider || undefined,
        isDuplicate: false,
        message: paymentProvider
            ? `Order #${createdLeadId} is reserved and awaiting secure ${paymentProvider} payment.`
            : `Order #${createdLeadId} confirmed successfully.`
    }

    if (paymentProvider) {
        const reservation = await reserveCatalogStock({
            agentId: draft.agentId,
            sku: draft.sku,
            color: draft.color,
            size: draft.size,
            quantity: draft.quantity,
            referenceId: createdLeadId
        })
        if (!reservation.success) {
            await supabase.from('leads').update({
                data: { ...orderData, status: 'inventory_unavailable', inventory_error: reservation.message }
            }).eq('id', createdLeadId)
            return {
                ...immediateResult,
                success: false,
                status: 'pending_payment',
                message: `Order could not proceed because stock is no longer available: ${reservation.message}`
            }
        }
    }

    if (paymentProvider && shopOwnerId && UUID_PATTERN.test(createdLeadId)) {
        try {
            const checkout = await createHostedCheckoutForOrder({
                userId: shopOwnerId,
                orderId: createdLeadId,
                provider: paymentProvider,
                payerReference: draft.phone
            })
            immediateResult = {
                ...immediateResult,
                paymentAttemptId: checkout.attemptId,
                checkoutUrl: checkout.checkoutUrl,
                paymentExpiresAt: checkout.expiresAt,
                message: `Order #${createdLeadId} is awaiting payment. Send this secure ${paymentProvider} checkout URL to the customer: ${checkout.checkoutUrl}`
            }
        } catch (error: any) {
            console.warn(`[HOSTED CHECKOUT WARN]: Secure checkout could not be created: ${String(error?.message || 'provider error').slice(0, 180)}`)
            await supabase.from('leads').update({
                data: {
                    ...orderData,
                    status: 'pending_payment',
                    payment_status: 'unpaid',
                    payment_error: String(error?.message || 'Gateway not configured').slice(0, 300)
                }
            }).eq('id', createdLeadId)

            immediateResult = {
                ...immediateResult,
                success: false,
                status: 'pending_payment',
                message: `Order #${createdLeadId} is saved but remains unpaid. A secure ${paymentProvider} checkout link could not be created. The shop owner must check the gateway configuration.`
            }
        }
    }

    // COD inventory changes only after both order records exist. Hosted payments
    // remain unpaid and do not consume stock until a verified provider callback.
    if (!paymentProvider && immediateResult.success) {
        try {
            const inventory = await deductInventoryStock({
                agentId: draft.agentId,
                sku: draft.sku,
                color: draft.color,
                size: draft.size,
                quantity: draft.quantity,
                referenceId: createdLeadId
            })
            if (!inventory.success) throw new Error(inventory.message || 'Inventory deduction failed')
        } catch (error: any) {
            await supabase.from('leads').update({
                data: {
                    ...orderData,
                    status: 'inventory_failed',
                    inventory_error: String(error?.message || 'Inventory deduction failed').slice(0, 300)
                }
            }).eq('id', createdLeadId)
            throw new Error('Order was recorded, but inventory could not be reserved. The order requires merchant review.')
        }
    }

    // Set in-memory cache immediately
    if (immediateResult.success) {
        recentOrdersCache.set(safeKey, { result: immediateResult, timestamp: now })
    }

    // 6. Durable Background Courier Dispatch Worker for COD only.
    if (paymentProvider) return immediateResult

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

            if (!courierResult.success) {
                throw new Error(courierResult.message || 'Courier booking failed.')
            }

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
