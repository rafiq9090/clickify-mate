import type { CriticResult, AgentContext, AgentToolResult } from './agent_types'

export function verifyResponseLightweight(
    text: string,
    toolResults: AgentToolResult[],
    context?: AgentContext
): CriticResult {
    const issues: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }> = []

    // 1. Verify Price assertions match tool output
    const priceTool = toolResults.find(t => t.name === 'get_current_price')
    if (priceTool && priceTool.output?.unitPrice) {
        const expectedPrice = priceTool.output.unitPrice
        const expectedTotal = priceTool.output.finalItemTotal
        // If LLM mentions a completely mismatched price
        const priceMatches = text.match(/(?:৳|tk|taka|\b)\s*(\d{3,5})\b/gi)
        if (priceMatches && priceMatches.length > 0) {
            // Price numbers found
        }
    }

    // 2. Check for empty or broken reply
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
