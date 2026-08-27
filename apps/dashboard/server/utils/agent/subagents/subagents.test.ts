import assert from 'node:assert/strict'
import test, { describe, it } from 'node:test'
import { discoveryAgent } from './discovery_agent'
import { salesAgent } from './sales_agent'
import { paymentAgent } from './payment_agent'
import { logisticsAgent } from './logistics_agent'
import { returnsAgent } from './returns_agent'
import { supportAgent } from './support_agent'
import { resolveSubAgent, executeSubAgentGraph } from './agent_graph_router'
import type { AgentContext, AgentUnderstanding, IncomingAgentEvent } from '../agent_types'

function createMockContext(overrides: Partial<AgentContext> = {}): AgentContext {
    return {
        agentId: 'test_agent_1',
        shopId: 'test_shop_1',
        channel: 'telegram',
        customerId: 'cust_123',
        customer: { id: 'cust_123', name: 'John Doe', phone: '01712345678', address: 'Dhanmondi, Dhaka' },
        session: {
            state: 'SALES_INQUIRING',
            language: 'bn'
        },
        selection: {
            sku: 'premium-hoodie-black',
            productName: 'Premium Winter Hoodie',
            price: 1200
        },
        recentMessages: [],
        agentConfig: {
            businessName: 'Clickify Shop',
            tone: 'polite',
            catalog: []
        },
        ...overrides
    }
}

function createMockEvent(text: string, mediaUrl?: string): IncomingAgentEvent {
    return {
        channel: 'telegram',
        eventId: 'evt_1',
        customerId: 'cust_123',
        messageId: 'msg_1',
        text,
        media: mediaUrl ? { type: 'image', url: mediaUrl } : undefined,
        timestamp: Date.now()
    }
}

describe('Domain-Specific Sub-Agents Unit Tests', () => {
    it('Discovery Agent properly recognizes discovery and image intents', () => {
        const understanding: AgentUnderstanding = {
            intent: 'IMAGE_REQUEST',
            entities: { sku: 'hoodie-01' },
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.95
        }
        const ctx = createMockContext()
        assert.equal(discoveryAgent.canHandle(understanding, ctx), true)
    })

    it('Sales Agent handles price inquiry with calculation', async () => {
        const understanding: AgentUnderstanding = {
            intent: 'PRICE_QUERY',
            entities: { sku: 'premium-hoodie-black', quantity: 2 },
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.95
        }
        const ctx = createMockContext()
        assert.equal(salesAgent.canHandle(understanding, ctx), true)

        const output = await salesAgent.execute({
            event: createMockEvent('dam koto?'),
            context: ctx,
            understanding
        })

        assert.ok(output.text)
        assert.equal(output.state, 'VARIANT_SELECTION')
        assert.ok(output.confidence > 0.8)
    })

    it('Payment Agent acknowledges TrxID submission safely without false order confirmation', async () => {
        const understanding: AgentUnderstanding = {
            intent: 'PAYMENT_QUERY',
            entities: { trxId: '9K8J2X1Z99', paymentMethod: 'bkash' },
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.95
        }
        const ctx = createMockContext({ session: { state: 'AWAIT_PAYMENT' } })
        assert.equal(paymentAgent.canHandle(understanding, ctx), true)

        const output = await paymentAgent.execute({
            event: createMockEvent('Bkash pathaisi TrxID 9K8J2X1Z99'),
            context: ctx,
            understanding
        })

        assert.equal(output.state, 'VERIFY_PAYMENT')
        assert.ok(output.text.includes('9K8J2X1Z99'))
        assert.equal(output.orderCreated, undefined)
    })

    it('Logistics Agent resolves delivery inquiries for Dhaka & Outside Dhaka', async () => {
        const understanding: AgentUnderstanding = {
            intent: 'DELIVERY_QUERY',
            entities: { district: 'Chittagong' },
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.95
        }
        const ctx = createMockContext()
        assert.equal(logisticsAgent.canHandle(understanding, ctx), true)

        const output = await logisticsAgent.execute({
            event: createMockEvent('Chittagong delivery charge koto?'),
            context: ctx,
            understanding
        })

        assert.ok(output.text.includes('Chittagong'))
        assert.ok(output.confidence > 0.85)
    })

    it('Returns Agent handles damage complaint with exchange policy', async () => {
        const understanding: AgentUnderstanding = {
            intent: 'COMPLAINT',
            entities: {},
            sentiment: 'negative',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.9
        }
        const ctx = createMockContext()
        assert.equal(returnsAgent.canHandle(understanding, ctx), true)

        const output = await returnsAgent.execute({
            event: createMockEvent('Jacket ta damaged ashche', 'https://example.com/broken.jpg'),
            context: ctx,
            understanding
        })

        assert.ok(output.text.includes('এক্সচেঞ্জ') || output.text.includes('exchange'))
        assert.equal(output.state, 'SUPPORT')
    })

    it('Support Agent escalates when customer requests a human agent', async () => {
        const understanding: AgentUnderstanding = {
            intent: 'HUMAN_REQUEST',
            entities: {},
            sentiment: 'frustrated',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.99
        }
        const ctx = createMockContext()
        assert.equal(supportAgent.canHandle(understanding, ctx), true)

        const output = await supportAgent.execute({
            event: createMockEvent('ekjon manusher sathe kotha bolbo'),
            context: ctx,
            understanding
        })

        assert.equal(output.requiresHumanHandoff, true)
        assert.equal(output.state, 'SUPPORT')
    })

    it('Hierarchical Graph Router resolves target sub-agents deterministically', () => {
        const supportUnder: AgentUnderstanding = {
            intent: 'HUMAN_HANDOFF',
            entities: {},
            sentiment: 'frustrated',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.99
        }
        const agent = resolveSubAgent(supportUnder, createMockContext())
        assert.equal(agent.id, 'support')

        const trackUnder: AgentUnderstanding = {
            intent: 'ORDER_TRACKING',
            entities: { orderId: 'ORD-1234' },
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.95
        }
        const logAgent = resolveSubAgent(trackUnder, createMockContext())
        assert.equal(logAgent.id, 'logistics')
    })

    it('executeSubAgentGraph runs end-to-end and attaches telemetry', async () => {
        const understanding: AgentUnderstanding = {
            intent: 'PRICE_QUERY',
            entities: { sku: 'premium-hoodie-black', quantity: 1 },
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.95
        }
        const ctx = createMockContext()
        const event = createMockEvent('price koto?')

        const result = await executeSubAgentGraph(event, ctx, understanding)
        assert.ok(result.text)
        assert.equal(result.activeSubAgent, 'sales')
        assert.ok(typeof result.latencyMs === 'number')
        assert.equal(ctx.session.activeSubAgent, 'sales')
    })
})
