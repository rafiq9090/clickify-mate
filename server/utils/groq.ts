import { createError, parseCookies, getRequestIP } from 'h3'
import { sendAdminAlert } from './notifications'
import { getApiKeyList } from './settings'
import { checkMockStockForPrompt } from './mock_shop'

export async function fetchGroqCompletions(
    event: any,
    body: {
        model: string
        messages: any[]
        temperature?: number
        max_tokens?: number
        response_format?: any
    },
    featureName: string = 'general'
): Promise<any> {
    const keys = await getApiKeyList('groq_api_key', 'groqApiKey')
    if (keys.length === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'GROQ_API_KEY is missing. Please add it in Global Config or .env.'
        })
    }

    let lastError: any = null
    for (let i = 0; i < keys.length; i++) {
        const apiKey = keys[i]
        try {
            const response = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: body
            })

            // Track tokens
            const usage = response.usage
            if (usage) {
                const promptTokens = usage.prompt_tokens || 0
                const completionTokens = usage.completion_tokens || 0
                const totalTokens = usage.total_tokens || 0
                const model = body.model

                let sessionId = ''
                let ipAddress = ''
                if (event) {
                    try {
                        const cookies = parseCookies(event)
                        sessionId = cookies.v_session_id || ''
                        ipAddress = getRequestIP(event, { xForwardedFor: true }) || ''
                    } catch (e) {
                        console.error('[TOKEN LOGGING SESSION ERROR]:', e)
                    }
                }

                const supabase = useSupabaseAdmin()
                if (supabase && supabase.from) {
                    supabase.from('token_usage').insert({
                        session_id: sessionId || null,
                        ip_address: ipAddress || null,
                        prompt_tokens: promptTokens,
                        completion_tokens: completionTokens,
                        total_tokens: totalTokens,
                        model: model,
                        feature: featureName
                    }).then(({ error }) => {
                        if (error) {
                            console.error('[TOKEN LOGGING SAVE ERROR]:', error)
                        }
                    })
                }
            }

            return response
        } catch (err: any) {
            lastError = err
            const statusCode = err.statusCode || err.status || 500
            const errMsg = err.data?.error?.message || err.message || ''
            console.warn(`[GROQ ROTATION WARNING]: Key index ${i} failed. Status: ${statusCode}, Error: ${errMsg}`)

            if (i < keys.length - 1) {
                console.log(`[GROQ ROTATION]: Attempting fallback to key index ${i + 1}...`)
                continue
            }
        }
    }

    const errorBody = lastError?.data || {}
    const finalMsg = errorBody?.error?.message || lastError?.message || 'Groq API call failed after trying all keys.'
    throw createError({
        statusCode: lastError?.statusCode || 500,
        statusMessage: 'Groq API Error: ' + finalMsg
    })
}

export const callGroq = async (prompt: string, event?: any) => {
    try {
        const response = await fetchGroqCompletions(event, {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        }, 'general_call')

        const text = response.choices?.[0]?.message?.content || ''
        return { success: true, result: text }
    } catch (err: any) {
        throw createError({ statusCode: 500, statusMessage: 'Groq Generation Failed: ' + err.message })
    }
}


export async function filterRelevantKnowledge(
    query: string,
    fullKnowledge: string,
    apiKey?: string,
    event?: any
) {
    if (!fullKnowledge || fullKnowledge.length < 10000) return fullKnowledge // Don't filter if already small to save latency and preserve context

    try {
        const response = await fetchGroqCompletions(event, {
            model: 'llama-3.1-8b-instant', // Very cheap and fast for filtering
            messages: [
                {
                    role: 'system',
                    content: `You are a Knowledge Filter. Your task is to extract ONLY the parts of the provided Knowledge Base that are relevant to the user's query.
                        
RULES:
1. The user's query can be in any language (English, Bengali, Arabic, Hindi, Spanish, etc.) or Romanized transliterations (e.g. Banglish/Hinglish). Understand the semantic meaning in any language and extract the matching facts.
2. If the knowledge base is irrelevant to the query, return "No relevant information found."
3. Keep the extracted text concise.
4. Preserve specific facts like prices, links, or names.
5. Return ONLY the relevant snippets.`
                },
                {
                    role: 'user',
                    content: `Query: ${query}\n\nFull Knowledge Base:\n${fullKnowledge}`
                }
            ],
            temperature: 0.1,
            max_tokens: 500
        }, 'rag_filter')

        const filtered = response.choices[0]?.message?.content?.trim() || fullKnowledge
        console.log(`[RAG DEBUG]: Filtered knowledge from ${fullKnowledge.length} to ${filtered.length} chars`)
        return filtered
    } catch (e) {
        console.error('[RAG FILTER ERROR]:', e)
        return fullKnowledge // Fallback to full knowledge on error
    }
}

async function classifyIntent(
    prompt: string,
    history: { role: string, content: string }[],
    apiKey?: string,
    currentState?: string,
    event?: any
): Promise<string> {
    try {
        const historyContext = history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')
        const response = await fetchGroqCompletions(event, {
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: `You are an intent classifier for an e-commerce assistant.
Analyze the customer's new message and the recent conversation history to classify the intent.

ALLOWED INTENTS:
1. "sales": Expressing intent to buy, checkout, providing shipping details (name, phone, address, quantity), confirming order summary.
2. "faq": Questions about shipping policies, shop location, return/exchange guidelines, shipping times, refund policies, complaints, quality issues, damaged items, color fading/running issues, customer support, or general troubleshooting help (e.g., 'ki korbo', 'what should I do').
3. "sizing": Questions about size charts, height/weight recommendation, choosing colors/fit/fabric for buying, catalog inquiry, checking stock, or asking to see product pictures/photos.
4. "negotiation": Asking for discounts, promo codes, bulk pricing, or free delivery.

RULES:
1. Output EXACTLY one lowercase word: "sales", "faq", "sizing", or "negotiation".
2. The user's message can be in any language (English, Bengali, Arabic, Hindi, Spanish, etc.) or transliterated forms. Map them to the correct intent category regardless of the language.
3. If the user message is vague, a simple greeting, or a neutral answer, default to the current conversation state: "${currentState || 'sales'}".
4. Return ONLY the single word. No explanation, no markdown, no punctuation.`
                },
                {
                    role: 'user',
                    content: `Recent History:\n${historyContext}\n\nCustomer Message: "${prompt}"`
                }
            ],
            temperature: 0.1,
            max_tokens: 10
        }, 'intent_classification')
        const intent = response.choices?.[0]?.message?.content?.trim()?.toLowerCase() || 'sales'
        console.log(`[ROUTER DEBUG]: Classified intent for "${prompt}" as "${intent}" (Current state: "${currentState}")`)
        return ['sales', 'faq', 'sizing', 'negotiation'].includes(intent) ? intent : (currentState || 'sales')
    } catch (e) {
        console.error('[ROUTER ERROR]:', e)
        return currentState || 'sales'
    }
}

function extractOrderForm(knowledge: string): string {
    if (!knowledge) return ''

    const lines = knowledge.split('\n')
    let startIndex = -1
    let headerLevel = 2

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i]
        if (!rawLine) continue
        const line = rawLine.trim().toLowerCase()
        if (line.includes('order confirmation form') || line.includes('order form') || line.includes('order (') || line === '## order' || line.startsWith('## order ')) {
            startIndex = i
            const match = rawLine.match(/^(#+)/)
            const group1 = match?.[1]
            if (group1) {
                headerLevel = group1.length
            }
            break
        }
    }

    if (startIndex === -1) return ''

    const resultLines = []
    const firstLine = lines[startIndex]
    if (firstLine) {
        resultLines.push(firstLine)
    }

    for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i]
        if (line === undefined) continue
        const match = line.match(/^(#+)/)
        const group1 = match?.[1]
        if (match && group1 && group1.length <= headerLevel) {
            break
        }
        resultLines.push(line)
    }

    return resultLines.join('\n').trim()
}

export async function generateAIReply(
    prompt: string,
    tone: string,
    apiKey: string,
    knowledge: string = '',
    history: { role: string, content: string }[] = [],
    sessionState: any = null,
    depth: number = 0,
    lastUpdated: string = '',
    event?: any
): Promise<{ reply: string; tokens: number; updatedSessionState?: any }> {
    // 1. Initialize/Retrieve session state
    const currentState = sessionState?.current_state || 'sales'
    const collectedDetails = sessionState?.collected_details || {}

    // Extract Order Confirmation Form rules dynamically from knowledge
    const orderForm = extractOrderForm(knowledge)

    // 2. Classify user intent
    const intent = await classifyIntent(prompt, history, apiKey, currentState, event)

    // 3. Update session state with classified intent
    if (sessionState) {
        sessionState.current_state = intent
    }

    // 4. RAG Step: Only filter knowledge for faq or sizing if it's large to save context and tokens
    let filteredKnowledge = ''
    if (intent === 'faq' || intent === 'sizing') {
        if (knowledge.length < 15000) {
            filteredKnowledge = knowledge
        } else {
            filteredKnowledge = await filterRelevantKnowledge(prompt, knowledge, apiKey, event)
        }
    }

    // 5. Select system prompt based on active specialist agent
    let systemPrompt = ''
    if (intent === 'faq') {
        // Agent B: FAQ Expert
        systemPrompt = `You are a Customer Support FAQ Expert.
Tone: ${tone}

Use ONLY the following context to answer the user's questions:
${filteredKnowledge || 'No specific policy information available. State that you are checking with our support team.'}

Customer's Session Details (Use this to personalize answers if relevant, e.g. their name or shipping location):
${JSON.stringify(collectedDetails)}

STRICT RULES:
1. Rely ONLY on the provided context. If the answer is not in the context, say you are checking with the team.
2. Do NOT collect order details or checkout information.
3. If the user is ready to order, wants to checkout, or asks how to place an order, say: "Perfect! Let's get your order completed." and append the tag: [ROUTE: sales]
4. Keep replies friendly, concise (under 50 words).
5. LANGUAGE RULE: Always respond in the EXACT same language or transliterated form that the customer is using (e.g. if the customer writes in English, reply in English; if in Bengali/Banglish, reply in Bengali/Banglish; if in Arabic, Spanish, French, German, Hindi, Urdu, or any other language, reply in that exact language/transliteration).
6. EMOJI RULE: Do NOT generate, output, or use any emojis (e.g. 😊, 🙏, ✅) in your responses under any circumstances. Keep responses completely emoji-free.`
    } else if (intent === 'sizing') {
        // Agent D: Sizing & Product Advisor
        systemPrompt = `You are a Sizing & Style Advisor.
Tone: ${tone}

Use the business size charts and catalog details to recommend the correct product size:
${filteredKnowledge || 'No sizing chart or catalog available.'}

Customer's Session Details (Use this to personalize answers if relevant, e.g. their height, weight, preferred size):
${JSON.stringify(collectedDetails)}

STRICT RULES:
1. Recommend the correct size based on customer measurements (S, M, L, XL, XXL).
2. ONLY when the customer's CURRENT message (their most recent message) explicitly asks for pictures, photos, or images of a product (e.g. "Ekta pic dio", "Send a white tshirt pic"), you MUST output the corresponding image tag at the end of your response: [SEND_IMAGES: <Product ID>] (for example: [SEND_IMAGES: wt-124] for white, [SEND_IMAGES: bt-123] for black, [SEND_IMAGES: nb-125] for navy blue). If they ask for multiple products, you can comma-separate them: [SEND_IMAGES: wt-124, nb-125]. Do NOT output, repeat, or carry over the [SEND_IMAGES] tag in subsequent messages if the customer is no longer asking for pictures (e.g. if they switch to talking about checkout, sizing, ordering, or address). Do NOT include the tag inside your spoken text; append it at the very end of your response.
3. Once they agree on a size and product, say: "Would you like me to proceed to checkout?" and append the tag: [ROUTE: sales]
4. Do NOT collect address or checkout information.
5. Keep replies helpful and concise (under 50 words).
6. LANGUAGE RULE: Always respond in the EXACT same language or transliterated form that the customer is using (e.g. if the customer writes in English, reply in English; if in Bengali/Banglish, reply in Bengali/Banglish; if in Arabic, Spanish, French, German, Hindi, Urdu, or any other language, reply in that exact language/transliteration).
7. EMOJI RULE: Do NOT generate, output, or use any emojis (e.g. 😊, 🙏, ✅) in your responses under any circumstances. Keep responses completely emoji-free.`
    } else if (intent === 'negotiation') {
        // Agent E: Coupon & Negotiation Specialist
        systemPrompt = `You are a Sales Negotiator.
Tone: ${tone}

Approved Discount Rules:
- Buy 2 items: 10% discount
- Buy 3 or more: 15% discount
- Free Shipping for orders over ৳1500
- Maximum manual discount allowed: 10% coupon code (e.g. SAVE10) if they are hesitant.

STRICT RULES:
1. Never offer the discount immediately. Highlight the product's value first.
2. If they ask for discounts, offer standard bundle deals (e.g., free shipping or buying 2 items).
3. If they are hesitant, give them the coupon code (SAVE10) and say: "I can apply this 10% discount for you."
4. Once they accept the offer or discount, append the tag: [ROUTE: sales]
5. Keep replies persuasive and concise (under 50 words).
6. LANGUAGE RULE: Always respond in the EXACT same language or transliterated form that the customer is using (e.g. if the customer writes in English, reply in English; if in Bengali/Banglish, reply in Bengali/Banglish; if in Arabic, Spanish, French, German, Hindi, Urdu, or any other language, reply in that exact language/transliteration).
7. EMOJI RULE: Do NOT generate, output, or use any emojis (e.g. 😊, 🙏, ✅) in your responses under any circumstances. Keep responses completely emoji-free.`
    } else {
        // Agent A: Sales & Order Closer (Default)
        systemPrompt = `You are a High-Conversion Human Sales Assistant.
GOAL: Complete the customer's checkout details.
Tone: ${tone}

Business details (including product list, colors, prices, size guides, and shipping charges):
${knowledge || 'No specific catalog details available.'}

Required Order Details (EXTRACTED DYNAMICALLY FROM KNOWLEDGE BASE):
${orderForm || `1. Product Name / SKU
2. Quantity
3. Customer Name
4. Phone Number
5. Shipping Address`}

Currently Collected Details:
${JSON.stringify(collectedDetails)}

STRICT FLOW:
1. Check what required details are missing compared to the Required Order Details form above. Ask for them politely, one by one or in a single list.
2. OUTSIDE DHAKA RULE:
   - If the customer's shipping address is outside Dhaka city (i.e. any other district, city, or thana, such as Chittagong, Sylhet, Gazipur, Narayanganj, etc.):
     * You MUST inform them that the delivery charge of ৳150 must be paid in advance.
     * Tell them exactly: "Delivery charge ৳150 age pathate hobe amader bKash/Nagad-e: [FILL: NUMBER]. Transaction ID share korun, order book kore nebo". (If there is a number in the knowledge base, use it instead of [FILL: NUMBER]).
     * The payment Transaction ID is now a REQUIRED detail. You must collect it before showing the final order confirmation summary.
3. If the user provides a detail (e.g. their phone, address, size, color, name, payment transaction ID, etc.), update your understanding.
4. Once ALL required details (including the transaction ID if outside Dhaka) listed in the Required Order Details form are collected:
   - Present a clear summary to the customer of all collected fields (e.g. Item, Qty, Total Price including shipping, Name, Phone, Address, Size, Color, Transaction ID if applicable, etc.).
   - Ask them to explicitly confirm the summary.
   - If they have already provided their confirmation (or if they provided all details in one message along with confirmation/payment), you must immediately confirm the order and append the confirmation tag at the end:
     [ORDER_DATA: Item: <Item> | Qty: <Qty> | Price: <Price> | Total: <Total> | Name: <Name> | Phone: <Phone> | Address: <Address> | Size: <Size> | Color: <Color>] (include any other fields specified in the form)
5. ONLY when you or the customer confirms the order (e.g. you say "order confirmed", "confirmed", "booked", "1-2 dine deliver hobe", "ধন্যবাদ", or similar confirmation phrase), you MUST append the confirmation tag at the end:
   [ORDER_DATA: Item: <Item> | Qty: <Qty> | Price: <Price> | Total: <Total> | Name: <Name> | Phone: <Phone> | Address: <Address> | Size: <Size> | Color: <Color>] (include any other fields specified in the form)
6. NEVER output the [ORDER_DATA] tag if any required details are still missing.
7. If the user provides new details, append the following tag at the very end of your response to update the system: [STATE_UPDATE: key: value | key: value]. Only include fields the user just provided in this message. Do NOT use placeholder brackets like '<>' in the state update tag.
8. Do NOT answer detailed policy FAQs, size charts, or product catalog list inquiries. If the customer asks an FAQ or asks what products/new items you have, output: [ROUTE: sizing] or [ROUTE: faq] at the end so the router can redirect them.
9. Keep responses under 50 words.
10. LANGUAGE RULE: Always respond in the EXACT same language or transliterated form that the customer is using (e.g. if the customer writes in English, reply in English; if in Bengali/Banglish, reply in Bengali/Banglish; if in Arabic, Spanish, French, German, Hindi, Urdu, or any other language, reply in that exact language/transliteration).
11. EMOJI RULE: Do NOT generate, output, or use any emojis (e.g. 😊, 🙏, ✅) in your responses under any circumstances. Keep responses completely emoji-free.
12. ONLY when the customer's CURRENT message (their most recent message) explicitly asks for pictures, photos, or images of a product, you MUST append the corresponding image tag at the very end of your response: [SEND_IMAGES: <Product ID>] (e.g. [SEND_IMAGES: wt-124]). Do NOT output, repeat, or carry over the [SEND_IMAGES] tag in subsequent messages if the customer is no longer asking for pictures (e.g. if they switch to talking about checkout, sizing, ordering, or address).`
    }

    const stalenessGuard = `\n\n[STALENESS GUARD]\n- The active knowledge base above is the current, absolute truth (last updated/verified on: ${lastUpdated || 'recently'}).\n- If the customer's previous chat history contains outdated pricing, policies, or coupon codes that contradict the active knowledge base, you MUST prioritize the active knowledge base.\n- Acknowledge any changes politely and transparently if the customer brings up the mismatch.`
    systemPrompt += stalenessGuard

    const messages: any[] = [
        {
            role: 'system',
            content: systemPrompt
        }
    ]

    // --- Smart History Trim: Filter history to exclude conversation before the last successful order ---
    let cleanHistory = [...history]
    const successIndex = cleanHistory.map(h => h.content.toLowerCase()).findLastIndex(c =>
        c.includes('order placed successfully') ||
        c.includes('order successful') ||
        c.includes('[order_data')
    )
    if (successIndex !== -1) {
        cleanHistory = cleanHistory.slice(successIndex + 1)
    }

    cleanHistory.slice(-10).forEach(msg => {
        const content = msg.content.length > 200
            ? msg.content.substring(0, 200) + '...'
            : msg.content
        messages.push({ role: msg.role, content: content })
    })

    // Append real-time stock status info to system prompt
    const stockStatus = await checkMockStockForPrompt(prompt, event?.context?.agent_behavior)
    if (messages[0] && messages[0].role === 'system') {
        messages[0].content += stockStatus
    }

    // Add current user prompt
    messages.push({ role: 'user', content: prompt })

    let response: any
    let isFallback = false
    try {
        response = await fetchGroqCompletions(event, {
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.2
        }, 'agent_reply_primary')
    } catch (primaryErr: any) {
        console.warn(`[GROQ API WARNING] Primary model failed, retrying with fallback model... Error: ${primaryErr.message}`)
        try {
            response = await fetchGroqCompletions(event, {
                model: 'llama-3.1-8b-instant',
                messages: messages,
                temperature: 0.2
            }, 'agent_reply_fallback')
            isFallback = true
        } catch (fallbackErr: any) {
            const errorMsg = fallbackErr.data?.error?.message || fallbackErr.message
            console.error(`[GROQ ERROR]: Primary and Fallback both failed. Error: ${errorMsg}`)
            await sendAdminAlert('Groq API Failure', `Your AI Agent encountered a total Groq failure: ${errorMsg}.`)
            return { reply: 'I am currently undergoing maintenance. Please try again later.', tokens: 0, updatedSessionState: sessionState }
        }
    }

    try {
        let reply = response.choices[0]?.message?.content || 'Service temporarily unavailable.'
        const tokens = response.usage?.total_tokens || 0

        // Parse state updates if present
        const stateMatch = reply.match(/\[STATE_UPDATE: (.*?)\]/)
        if (stateMatch) {
            const updatesStr = stateMatch[1]
            reply = reply.replace(stateMatch[0], '').trim()

            const updates = updatesStr.split('|').reduce((acc: any, part: string) => {
                const tokens = part.split(':')
                const key = tokens[0]?.trim()
                const val = tokens.slice(1).join(':')?.trim()
                if (key && val && !val.startsWith('<')) {
                    acc[key.toLowerCase()] = val
                }
                return acc
            }, {})

            if (sessionState) {
                sessionState.collected_details = {
                    ...sessionState.collected_details,
                    ...updates
                }
            }
        }

        // Parse routing tags
        const routeMatch = reply.match(/\[ROUTE: (.*?)\]/)
        if (routeMatch) {
            const newRoute = routeMatch[1].trim().toLowerCase()
            reply = reply.replace(routeMatch[0], '').trim()
            if (['sales', 'faq', 'sizing', 'negotiation'].includes(newRoute)) {
                const targetState = sessionState || { current_state: currentState, collected_details: {} }
                targetState.current_state = newRoute

                // Redirection loop if depth is 0
                if (depth === 0) {
                    console.log(`[ROUTER REDIRECT]: Route changed from ${currentState} to ${newRoute}. Re-evaluating...`)
                    const nextResult = await generateAIReply(prompt, tone, apiKey, knowledge, history, targetState, depth + 1, lastUpdated, event)
                    return {
                        reply: nextResult.reply,
                        tokens: tokens + nextResult.tokens,
                        updatedSessionState: nextResult.updatedSessionState || targetState
                    }
                }
            }
        }

        return { reply, tokens, updatedSessionState: sessionState }
    } catch (parseErr: any) {
        console.error(`[GROQ PARSE ERROR]: ${parseErr.message}`)
        return { reply: 'I am currently undergoing maintenance. Please try again later.', tokens: 0, updatedSessionState: sessionState }
    }
}

export async function analyzeSentimentAndPickEmoji(
    prompt: string,
    apiKey?: string,
    history: { role: string, content: string }[] = [],
    event?: any
) {
    const messages: any[] = [
        {
            role: 'system',
            content: `You are a sentiment analyzer. Analyze the user's message and pick EXACTLY ONE emoji reaction from this list:
👍 (Agreement, General)
❤️ (Love, Happy, Appreciation)
🤔 (Question, Confused)
😂 (Funny, Laughing)
😟 (Issue, Sad, Complaint)
😮 (Surprised, Wow)
🚨 (Urgent, Emergency)

CRITICAL RULES:
1. Return ONLY the emoji character. 
2. No text, no explanation.
3. If unsure or message is neutral, return 'none'.
4. Be smart about sarcasm—check context if provided.`
        }
    ]

    history.slice(-3).forEach(msg => {
        messages.push({ role: msg.role, content: msg.content })
    })

    messages.push({ role: 'user', content: `Analyze this: "${prompt}"` })

    try {
        const response = await fetchGroqCompletions(event, {
            model: 'llama-3.1-8b-instant',
            messages: messages,
            temperature: 0.1,
            max_tokens: 5
        }, 'sentiment_analysis')

        const emoji = response.choices[0]?.message?.content?.trim() || 'none'
        return emoji.length > 5 ? 'none' : emoji // Safety check
    } catch (e) {
        return 'none'
    }
}
