import { generateAIReply } from '../utils/groq'
import { getApiKey } from '../utils/settings'

export default defineEventHandler(async (event): Promise<any> => {
    requireAdminSession(event)
    const apiKey = await getApiKey('groq_api_key', 'groqApiKey')
    if (!apiKey) {
        return { error: 'No valid Groq API Key found in settings or process.env' }
    }

    const turns = [
        {
            input: "Hi, do you have black t-shirts?",
            expected: "should route to sizing/catalog"
        },
        {
            input: "What size chart do you have? I am 6 feet tall and 80kg.",
            expected: "should route to sizing and recommend size XL"
        },
        {
            input: "Okay, can I get a discount if I buy 2?",
            expected: "should route to negotiation and offer discount"
        },
        {
            input: "Awesome, I want to order. My name is Rafiq, phone is 01712345678, address is Dhaka, quantity is 2.",
            expected: "should route to sales, capture details"
        },
        {
            input: "Yes, I confirm the order.",
            expected: "should output final [ORDER_DATA] tag"
        }
    ]

    const results = []
    let sessionState = { current_state: 'sales', collected_details: {} }
    let history: { role: string, content: string }[] = []

    for (const turn of turns) {
        console.log(`[TEST RUNNER]: Input: "${turn.input}" (Active State: ${sessionState.current_state})`)
        
        const res = await generateAIReply(
            turn.input,
            'Friendly',
            apiKey,
            `SIZE CHART:
- M: Chest 38, Length 27 (Height 5.4 - 5.7 feet)
- L: Chest 40, Length 28 (Height 5.8 - 5.11 feet)
- XL: Chest 42, Length 29 (Height 6.0 - 6.2 feet)

ORDER CONFIRMATION FORM:
Required: Name, Phone, Address, Qty

PRODUCTS:
- Black T-Shirt (SKU: ts-black), Price: ৳500`,
            history,
            sessionState,
            0,
            '2026-06-01'
        )

        results.push({
            input: turn.input,
            expected: turn.expected,
            route_determined: sessionState.current_state,
            collected_details: { ...sessionState.collected_details },
            reply: res.reply
        })

        // Update history & state for next turn
        history.push({ role: 'user', content: turn.input })
        history.push({ role: 'assistant', content: res.reply })
        sessionState = res.updatedSessionState
    }

    return {
        success: true,
        simulation: results
    }
})
