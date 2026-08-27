import type { SubAgent, SubAgentInput, SubAgentOutput } from './types'
import { executeToolSafely } from '../agent_tools'
import {
    buildConfirmedOrderReceipt,
    buildOrderReviewReply,
    buildPendingPaymentReceipt,
    buildProgressReply,
    getMissingOrderField,
    stateForMissingField
} from '../agent_dialogue'

export class SalesAgent implements SubAgent {
    id = 'sales' as const
    name = 'Sales & Closing Agent'
    description = 'Specialized in customer conversion, bundle pricing, delivery calculation, details collection, and checkout.'
    allowedTools = ['get_current_price', 'calculate_delivery_fee', 'check_inventory', 'create_order']

    canHandle(understanding: any, context: any): boolean {
        const salesIntents = [
            'PRICE_QUERY',
            'ORDER_START',
            'ORDER_CONFIRM',
            'AFFIRMATION'
        ]
        const orderStates = [
            'VARIANT_SELECTION',
            'COLLECT_NAME',
            'COLLECT_PHONE',
            'COLLECT_ADDRESS',
            'VERIFY_ORDER'
        ]
        return salesIntents.includes(understanding.intent) || orderStates.includes(context.session.state)
    }

    async execute(input: SubAgentInput): Promise<SubAgentOutput> {
        const { event, context, understanding } = input
        const lang = context.session.language || 'bn'
        const toolCalls: any[] = []
        const toolResults: any[] = []

        // 1. Price Query Intent
        if (understanding.intent === 'PRICE_QUERY') {
            const sku = understanding.entities.sku || context.selection?.sku
            if (sku) {
                const toolCallId = `sales_price_${Date.now()}`
                toolCalls.push({ id: toolCallId, name: 'get_current_price', arguments: { sku, quantity: understanding.entities.quantity || 1 } })
                
                const executed = await executeToolSafely('get_current_price', {
                    sku,
                    quantity: understanding.entities.quantity || 1,
                    couponCode: understanding.entities.couponCode
                }, context)
                toolResults.push({ toolCallId, name: 'get_current_price', output: executed.data, error: executed.error })

                const price = executed.data?.unitPrice || context.selection?.price || 1200
                const bundleText = executed.data?.tierDiscountPercent 
                    ? ` (Discount applied: ${executed.data.tierDiscountPercent}%)` 
                    : ''
                const text = lang === 'en'
                    ? `The price for ${sku} is ৳${price}${bundleText}. Would you like to place an order?`
                    : `${sku}-এর বর্তমান মূল্য ৳${price}${bundleText}। আপনি কি এটি অর্ডার করতে চান?`
                
                return {
                    text,
                    state: 'VARIANT_SELECTION',
                    toolCalls,
                    toolResults,
                    confidence: 0.95
                }
            }
        }

        // 2. Checking Missing Order Fields (Name, Phone, Address, Quantity)
        const missing = getMissingOrderField(context)
        if (missing) {
            context.session.lastAskedField = missing
            const nextState = stateForMissingField(missing, context.session.state)
            const text = buildProgressReply(context, missing)
            return {
                text,
                state: nextState,
                confidence: 0.9
            }
        }

        // 3. All Fields Present -> Review Order or Final Checkout
        if (understanding.intent === 'ORDER_CONFIRM' || understanding.intent === 'AFFIRMATION' || context.session.state === 'VERIFY_ORDER') {
            // Price lookup before order creation
            const sku = context.selection.sku || understanding.entities.sku || 'default-item'
            const qty = Number(context.selection.quantity || understanding.entities.quantity || 1)
            
            const priceCallId = `sales_pr_${Date.now()}`
            toolCalls.push({ id: priceCallId, name: 'get_current_price', arguments: { sku, quantity: qty } })
            const priceRes = await executeToolSafely('get_current_price', { sku, quantity: qty }, context)
            toolResults.push({ toolCallId: priceCallId, name: 'get_current_price', output: priceRes.data, error: priceRes.error })

            const unitPrice = priceRes.data?.unitPrice || context.selection.price || 500
            const district = understanding.entities.district || 'Dhaka'
            
            const delCallId = `sales_del_${Date.now()}`
            toolCalls.push({ id: delCallId, name: 'calculate_delivery_fee', arguments: { district, orderTotal: unitPrice * qty } })
            const delRes = await executeToolSafely('calculate_delivery_fee', { district, orderTotal: unitPrice * qty }, context)
            toolResults.push({ toolCallId: delCallId, name: 'calculate_delivery_fee', output: delRes.data, error: delRes.error })

            const deliveryFee = delRes.data?.deliveryFee ?? 80
            const total = (unitPrice * qty) + deliveryFee
            const requiresAdvance = Boolean(delRes.data?.requiresAdvancePayment)

            // If advance payment is required, route to pending payment receipt
            if (requiresAdvance) {
                const text = buildPendingPaymentReceipt(context, {
                    total,
                    advanceAmount: delRes.data?.advancePaymentAmount || deliveryFee,
                    deliveryFee
                })
                return {
                    text,
                    state: 'AWAIT_PAYMENT',
                    toolCalls,
                    toolResults,
                    confidence: 0.95
                }
            }

            // Create Order
            const orderCallId = `sales_ord_${Date.now()}`
            const orderPayload = {
                customerName: understanding.entities.name || context.orderDraft?.name || context.customer.name || 'Valued Customer',
                phone: understanding.entities.phone || context.orderDraft?.phone || context.customer.phone || '',
                address: understanding.entities.address || context.orderDraft?.address || context.customer.address || '',
                sku,
                color: context.selection.color || understanding.entities.color,
                size: context.selection.size || understanding.entities.size,
                quantity: qty,
                unitPrice,
                deliveryFee,
                total,
                paymentProvider: 'cod'
            }

            toolCalls.push({ id: orderCallId, name: 'create_order', arguments: orderPayload })
            const orderRes = await executeToolSafely('create_order', orderPayload, context)
            toolResults.push({ toolCallId: orderCallId, name: 'create_order', output: orderRes.data, error: orderRes.error })

            if (orderRes.data?.success) {
                const text = buildConfirmedOrderReceipt(context, orderRes.data)
                return {
                    text,
                    state: 'ORDER_CONFIRMED',
                    toolCalls,
                    toolResults,
                    orderCreated: true,
                    orderData: orderRes.data,
                    confidence: 0.98
                }
            }
        }

        // Default: Review order details with customer
        const reviewText = buildOrderReviewReply(context)
        return {
            text: reviewText,
            state: 'VERIFY_ORDER',
            confidence: 0.88
        }
    }
}

export const salesAgent = new SalesAgent()
