import assert from 'node:assert/strict'
import test from 'node:test'
import type { AgentContext, IncomingAgentEvent } from './agent_types'
import { extractEntitiesDeterministic, understandMessageFast } from './agent_nlu'
import {
    buildProductListReply,
    buildOrderReviewReply,
    buildGreetingReply,
    formatReplyForChannel,
    getMissingOrderField,
    mergeCurrentTurn
} from './agent_dialogue'

function context(overrides: Partial<AgentContext> = {}): AgentContext {
    const base: AgentContext = {
        agentId: 'agent-1',
        shopId: 'shop-1',
        channel: 'telegram',
        customerId: 'customer-1',
        customerName: 'Rafiq',
        customer: { id: 'customer-1' },
        session: {
            state: 'SALES_INQUIRING',
            lastPresentedOptions: {},
            fallbackCount: 0
        },
        selection: { quantity: 1 },
        orderDraft: { name: 'Rafiq', quantity: 1 },
        recentMessages: [],
        agentConfig: {
            businessName: 'Test Shop',
            catalog: [
                {
                    sku: 'tee-1',
                    name: 'Premium T-Shirt',
                    price: 850,
                    images: [
                        { color: 'Black', size: 'L', quantity: 10 },
                        { color: 'White', size: 'XL', quantity: 8 }
                    ]
                },
                { sku: 'jacket-1', name: 'Denim Jacket', price: 1450, stock_quantity: 4 }
            ]
        }
    }
    return {
        ...base,
        ...overrides,
        customer: { ...base.customer, ...(overrides.customer || {}) },
        session: { ...base.session, ...(overrides.session || {}) },
        selection: { ...base.selection, ...(overrides.selection || {}) },
        orderDraft: { ...base.orderDraft, ...(overrides.orderDraft || {}) },
        agentConfig: { ...base.agentConfig, ...(overrides.agentConfig || {}) }
    }
}

function event(text: string): IncomingAgentEvent {
    return {
        channel: 'telegram',
        eventId: 'event-1',
        customerId: 'customer-1',
        messageId: 'message-1',
        text,
        timestamp: Date.now()
    }
}

test('normalizes common Bangla payment spellings and typo variants', () => {
    assert.equal(understandMessageFast('nogot').intent, 'PAYMENT_SELECTION')
    assert.equal(understandMessageFast('nogot').entities.paymentMethod, 'nagad')
    assert.equal(understandMessageFast('বিকাশ').entities.paymentMethod, 'bkash')
    assert.equal(understandMessageFast('stripe').entities.paymentMethod, 'stripe')
})

test('uses an inclusive greeting unless the customer explicitly gives salam', () => {
    const neutral = context({ session: { state: 'SALES_INQUIRING', language: 'bn' } })
    assert.match(buildGreetingReply(neutral, 'হ্যালো'), /^হ্যালো!/) 
    assert.equal(buildGreetingReply(neutral, 'হ্যালো').includes('ওয়ালাইকুম আসসালাম'), false)

    const salam = context({ session: { state: 'SALES_INQUIRING', language: 'bn' } })
    assert.equal(understandMessageFast('আসসালামু আলাইকুম').intent, 'GREETING')
    assert.match(buildGreetingReply(salam, 'আসসালামু আলাইকুম'), /^ওয়ালাইকুম আসসালাম!/)
})

test('detects a plain English hello as English on the first turn', () => {
    const ctx = context({ session: { state: 'SALES_INQUIRING' } })
    const understanding = understandMessageFast('hello')
    mergeCurrentTurn(ctx, understanding, 'hello')
    assert.equal(ctx.session.language, 'en')
    assert.match(buildGreetingReply(ctx, 'hello'), /^Hello!/)
})

test('merges a requested address before deciding the next missing order field', () => {
    const ctx = context({
        session: { state: 'COLLECT_ADDRESS', lastAskedField: 'address' },
        selection: { sku: 'tee-1', productName: 'Premium T-Shirt', color: 'Black', size: 'L', quantity: 1 },
        orderDraft: { sku: 'tee-1', color: 'Black', size: 'L', quantity: 1, phone: '01712345678' }
    })
    const message = 'Cumilla, Burichang, Ramchandrapur'
    const understanding = understandMessageFast(message, undefined, ctx.agentConfig.catalog)
    mergeCurrentTurn(ctx, understanding, message)

    assert.equal(ctx.orderDraft?.address, message)
    assert.equal(getMissingOrderField(ctx), 'payment')
})

test('captures a plain-text customer name only when the flow requested it', () => {
    const ctx = context({
        customerName: undefined,
        session: { state: 'COLLECT_NAME', lastAskedField: 'name' },
        orderDraft: { sku: 'jacket-1', quantity: 1 }
    })
    const understanding = understandMessageFast('Md Rafiqul Islam', undefined, ctx.agentConfig.catalog)
    mergeCurrentTurn(ctx, understanding, 'Md Rafiqul Islam')
    assert.equal(ctx.orderDraft?.name, 'Md Rafiqul Islam')
})

test('resolves a numeric reply only from the last structured product options', () => {
    const ctx = context()
    const list = buildProductListReply(ctx)
    ctx.session.lastPresentedOptions = list.options
    const understanding = understandMessageFast('1 number order korbo', undefined, ctx.agentConfig.catalog)
    mergeCurrentTurn(ctx, understanding, '1 number order korbo')

    assert.equal(understanding.intent, 'OPTION_SELECTION')
    assert.equal(ctx.selection.sku, 'tee-1')
    assert.equal(ctx.selection.productName, 'Premium T-Shirt')
})

test('does not treat copied variant stock rows as order quantity or address', () => {
    const entities = extractEntitiesDeterministic('| Black | XL | 15 |')
    assert.equal(entities.quantity, undefined)
    assert.equal(entities.address, undefined)
})

test('formats replies safely for messaging channels', () => {
    const formatted = formatReplyForChannel(
        '| Product | Price |\n| --- | --- |\n| T-Shirt | 850 |\nআপনার পাঠানো ছবিটি সুন্দর। https://bad.example/x',
        event('price?'),
        ['https://good.example/x']
    )
    assert.equal(formatted.includes('|'), false)
    assert.equal(formatted.includes('আপনার পাঠানো ছবিটি'), false)
    assert.equal(formatted.includes('https://bad.example/x'), false)
    assert.match(formatted, /T-Shirt — 850/)
})

test('preserves only an explicitly approved hosted checkout URL', () => {
    const url = 'https://pay.example/checkout/abc'
    const formatted = formatReplyForChannel(`Pay here: ${url} or https://bad.example/x`, event('bkash'), [url])
    assert.equal(formatted.includes(url), true)
    assert.equal(formatted.includes('https://bad.example/x'), false)
})

test('builds a final order review before any side effect is allowed', () => {
    const ctx = context({
        session: { state: 'VERIFY_ORDER', lastAskedField: 'confirmation', language: 'en' },
        selection: { sku: 'tee-1', productName: 'Premium T-Shirt', color: 'Black', size: 'L', quantity: 1 },
        orderDraft: {
            sku: 'tee-1', productName: 'Premium T-Shirt', color: 'Black', size: 'L', quantity: 1,
            name: 'Rafiq', phone: '01712345678', address: 'Cumilla', paymentMethod: 'bkash',
            unitPrice: 850, deliveryFee: 120, total: 970
        }
    })
    const review = buildOrderReviewReply(ctx)
    assert.match(review, /Reply “Confirm”/)
    assert.match(review, /Total: ৳970/)
    assert.match(review, /Payment: BKASH/)
})
