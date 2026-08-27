import type { CriticResult, AgentContext, AgentToolResult } from './agent_types'

export function verifyResponseLightweight(
    text: string,
    toolResults: AgentToolResult[],
    context?: AgentContext,
    input: { userText?: string; hadImage?: boolean } = {}
): CriticResult {
    const issues: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }> = []

    const normalized = String(text || '').toLowerCase()

    // 1. Verify price assertions came from the authoritative price tool.
    const priceTool = toolResults.find(t => t.name === 'get_current_price')
    const deliveryTool = toolResults.find(t => t.name === 'calculate_delivery_fee')
    const containsPriceClaim = /(?:৳\s*\d+|\b\d+\s*(?:tk|taka|টাকা)\b)/i.test(text)
    if (containsPriceClaim && !priceTool && !deliveryTool) {
        issues.push({
            type: 'UNGROUNDED_PRICE',
            severity: 'high',
            description: 'A price was stated without a successful price lookup.'
        })
    }

    if (priceTool?.output?.unitPrice) {
        const expected = new Set([
            Number(priceTool.output.unitPrice),
            Number(priceTool.output.subtotal),
            Number(priceTool.output.finalItemTotal),
            Number(deliveryTool?.output?.deliveryFee),
            Number(deliveryTool?.output?.advancePaymentAmount),
            Number(priceTool.output.finalItemTotal) + Number(deliveryTool?.output?.deliveryFee || 0)
        ].filter(Number.isFinite))
        const claimed = [...text.matchAll(/(?:৳\s*|\b)(\d{2,7})\s*(?:tk|taka|টাকা)?/gi)]
            .map(match => Number(match[1]))
            .filter(value => value >= 50)
        if (claimed.length > 0 && claimed.every(value => !expected.has(value))) {
            issues.push({
                type: 'PRICE_MISMATCH',
                severity: 'high',
                description: 'The stated price does not match the price tool result.'
            })
        }
    }

    // 2. Stock and order/payment claims require matching tool evidence.
    const hasStockTool = toolResults.some(result => result.name === 'check_inventory' && result.output)
    if (/(?:স্টকে আছে|in stock|\d+\s*(?:পিস|pcs).*stock)/i.test(text) && !hasStockTool) {
        issues.push({ type: 'UNGROUNDED_STOCK', severity: 'high', description: 'Stock was claimed without an inventory lookup.' })
    }
    const successfulOrder = toolResults.some(result => result.name === 'create_order' && result.output?.success)
    if (/(?:অর্ডার.*(?:কনফার্ম|সফল)|order.*(?:confirmed|successful))/i.test(text) && !successfulOrder) {
        issues.push({ type: 'FALSE_ORDER_CONFIRMATION', severity: 'high', description: 'An order was confirmed without a successful order tool result.' })
    }
    if (/(?:payment|পেমেন্ট).*(?:confirmed|successful|সম্পন্ন|সফল)/i.test(normalized) &&
        !toolResults.some(result => result.name === 'verify_payment' && result.output?.verified === true)) {
        issues.push({ type: 'FALSE_PAYMENT_CONFIRMATION', severity: 'high', description: 'Payment was claimed as successful without provider verification.' })
    }

    // 3. Never invent an uploaded image or repeat data already stored in the order draft.
    if (!input.hadImage && /(?:আপনার পাঠানো (?:ছবি|ইমেজ)|the (?:photo|image) you (?:sent|uploaded))/i.test(text)) {
        issues.push({ type: 'FALSE_IMAGE_REFERENCE', severity: 'high', description: 'The reply refers to an image that was not received.' })
    }
    if (context?.orderDraft?.phone && /(?:মোবাইল|ফোন|phone).*(?:দিন|provide|send)/i.test(text)) {
        issues.push({ type: 'REASKED_PHONE', severity: 'high', description: 'The response asks for a phone number already in memory.' })
    }
    if (context?.orderDraft?.address && /(?:ঠিকানা|address).*(?:দিন|provide|send|লিখুন)/i.test(text)) {
        issues.push({ type: 'REASKED_ADDRESS', severity: 'high', description: 'The response asks for an address already in memory.' })
    }

    // 4. Check for empty or broken reply.
    if (!text || text.trim().length === 0) {
        issues.push({
            type: 'EMPTY_RESPONSE',
            severity: 'high',
            description: 'Response is completely empty.'
        })
    }

    return {
        pass: issues.length === 0,
        level: 'RULE_BASED',
        issues: issues.length > 0 ? issues : undefined
    }
}
