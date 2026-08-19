import type { AgentUnderstanding, AgentIntent, AgentEntities, AgentContext } from './agent_types'

export function extractEntitiesDeterministic(text: string): AgentEntities {
    const entities: AgentEntities = {}
    if (!text) return entities

    const lower = text.toLowerCase()

    // 1. Phone number extraction (Bangladeshi 11-digit: 01XXXXXXXXX)
    const phoneMatch = text.match(/(?:\+?88)?01[3-9]\d{8}\b/)
    if (phoneMatch) {
        entities.phone = phoneMatch[0].replace('+88', '')
    }

    // 2. Transaction ID extraction (e.g. TrxID: 2D3XJS... or 8-12 char alphanumeric)
    const trxMatch = text.match(/(?:trx\s*id|transaction\s*id|id\s*:?)\s*([A-Za-z0-9]{8,14})\b/i) ||
                     text.match(/\b([A-Z0-9]{8,12})\b/)
    if (trxMatch && !phoneMatch) {
        entities.trxId = trxMatch[1]
    }

    // 3. Product / SKU extraction
    if (lower.includes('hoodie') || lower.includes('হুডি')) {
        entities.sku = 'hoodie'
    } else if (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('টি-শার্ট') || lower.includes('shirt')) {
        entities.sku = 't-shirt-white'
    }

    // 4. Color detection
    const colors = ['white', 'maroon', 'red', 'black', 'sky blue', 'blue', 'navy', 'green', 'yellow', 'grey', 'gray', 'সাদা', 'কালো', 'লাল', 'মেরুন']
    for (const c of colors) {
        if (lower.includes(c)) {
            entities.color = c === 'মেরুন' ? 'Maroon' : (c === 'সাদা' ? 'White' : (c === 'কালো' ? 'Black' : c))
            break
        }
    }

    // 5. Size detection
    const sizeMatch = text.match(/\b(XXL|XL|L|M|S)\b/i) || text.match(/\b(xxl|xl|large|medium|small)\b/i)
    if (sizeMatch && sizeMatch[1]) {
        entities.size = sizeMatch[1].toUpperCase()
    }

    // 6. Quantity detection (e.g. 2 ta, 3 pcs, 1 piece, 2টি)
    const qtyMatch = text.match(/\b(\d+)\s*(?:ta|pcs|pc|piece|pieces|ti|টা|টি)\b/i) ||
                     text.match(/\b(?:quantity|qty)\s*:?\s*(\d+)\b/i)
    if (qtyMatch && qtyMatch[1]) {
        entities.quantity = parseInt(qtyMatch[1], 10)
    }

    // 7. District / Location detection
    const districts = ['dhaka', 'chittagong', 'chattogram', 'sylhet', 'rajshahi', 'khulna', 'barisal', 'rangpur', 'mymensingh', 'cumilla', 'comilla', 'gazipur', 'narayanganj', 'savar', 'ঢাকা', 'চট্টগ্রাম', 'সিলেট']
    for (const d of districts) {
        if (lower.includes(d)) {
            entities.district = d
            break
        }
    }

    return entities
}

export function detectCustomerCorrection(text: string, previousAgentText?: string): {
    isCorrection: boolean
    errorType?: 'WRONG_VARIANT' | 'WRONG_PRICE' | 'WRONG_STOCK' | 'MISUNDERSTOOD_INTENT'
} {
    if (!text) return { isCorrection: false }
    const lower = text.toLowerCase()

    // Explicit correction signals in Bengali/Banglish/English
    const correctionKeywords = [
        'ভুল বলছেন', 'ভুল বলছেন আপনি', 'ভুল', 'wrong', 'mistake', 'na bhai',
        'eta na', 'eta na ami', 'bolsi', 'ami bolsilam', 'website e onno',
        'website e price', 'website e to', 'dam onno', 'dam to',
        'abar same kotha', 'bujhen nai', 'bujhte paren nai', 'black na',
        'white na', 'maroon na', 'ami eta chaini', 'ami blue bolsi'
    ]

    for (const kw of correctionKeywords) {
        if (lower.includes(kw)) {
            if (lower.includes('price') || lower.includes('dam') || lower.includes('taka') || lower.includes('৳')) {
                return { isCorrection: true, errorType: 'WRONG_PRICE' }
            }
            if (lower.includes('stock') || lower.includes('available') || lower.includes('ache')) {
                return { isCorrection: true, errorType: 'WRONG_STOCK' }
            }
            if (lower.includes('color') || lower.includes('size') || lower.includes('black') || lower.includes('white') || lower.includes('blue') || lower.includes('maroon') || lower.includes('xl') || lower.includes('l')) {
                return { isCorrection: true, errorType: 'WRONG_VARIANT' }
            }
            return { isCorrection: true, errorType: 'MISUNDERSTOOD_INTENT' }
        }
    }

    return { isCorrection: false }
}

export function understandMessageFast(
    text: string,
    previousAgentText?: string
): AgentUnderstanding {
    const lower = (text || '').toLowerCase().trim()
    const entities = extractEntitiesDeterministic(text)
    const correction = detectCustomerCorrection(text, previousAgentText)

    let intent: AgentIntent = 'UNKNOWN'
    let sentiment: 'positive' | 'neutral' | 'confused' | 'frustrated' | 'negative' = 'neutral'
    let confidence = 0.85

    // 1. Customer Correction Priority
    if (correction.isCorrection) {
        return {
            intent: 'CUSTOMER_CORRECTION',
            entities,
            sentiment: 'frustrated',
            customerCorrection: true,
            repeatedQuestion: false,
            possibleErrorType: correction.errorType,
            confidence: 0.95
        }
    }

    // 2. Greetings
    if (/^(hi|hello|hey|salam|assalamu\s*alaikum|kemon\s*achen|hlo)\b/i.test(lower) && lower.length < 35) {
        return {
            intent: 'GREETING',
            entities,
            sentiment: 'positive',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.98
        }
    }

    // 3. Image / Photo Requests
    if (lower.includes('pic') || lower.includes('photo') || lower.includes('image') || lower.includes('chobi') || lower.includes('ছবি') || lower.includes('পিক') || lower.includes('pathan') || lower.includes('dekan') || lower.includes('dekhte chai')) {
        return {
            intent: 'IMAGE_REQUEST',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.95
        }
    }

    // 4. Delivery Questions (Must come before generic order start)
    if (lower.includes('delivery') || lower.includes('shipping') || lower.includes('charge') || lower.includes('kobe pabo') || lower.includes('koto din') || lower.includes('free pabo') || lower.includes('ডেলিভারি')) {
        return {
            intent: 'DELIVERY_QUERY',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.94
        }
    }

    // 5. Price & Coupon Queries
    if (lower.includes('price') || lower.includes('dam') || lower.includes('koto') || lower.includes('cost') || lower.includes('tk') || lower.includes('taka') || lower.includes('discount') || lower.includes('coupon') || lower.includes('save10')) {
        return {
            intent: 'PRICE_QUERY',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.93
        }
    }

    // 6. Stock & Availability Queries
    if (lower.includes('stock') || lower.includes('available') || lower.includes('ache') || lower.includes('hobe') || lower.includes('pawa jabe') || lower.includes('আছেনা') || lower.includes('আছে')) {
        return {
            intent: 'STOCK_QUERY',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.92
        }
    }

    // 7. Payment Trx ID
    if (entities.trxId || lower.includes('bkash') || lower.includes('nagad') || lower.includes('paid') || lower.includes('advance')) {
        return {
            intent: 'PAYMENT_QUERY',
            entities,
            sentiment: 'positive',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.92
        }
    }

    // 8. Order Confirmations
    if (/^(yes|confirm|confirmed|order\s*confirm|thik\s*ache|done|yes\s*confirm|ok|okay|ha|হ্যাঁ)\b/i.test(lower) || lower.includes('order confirm') || lower.includes('confirm korbo')) {
        return {
            intent: 'ORDER_CONFIRM',
            entities,
            sentiment: 'positive',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.96
        }
    }

    // 9. Order Start / Details provision
    if (entities.phone || entities.address || lower.includes('order korte chai') || lower.includes('nibo') || lower.includes('buy')) {
        return {
            intent: 'ORDER_START',
            entities,
            sentiment: 'positive',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.90
        }
    }

    // 10. Product Discovery
    if (lower.includes('hoodie') || lower.includes('t-shirt') || lower.includes('color') || lower.includes('size') || lower.includes('item')) {
        return {
            intent: 'PRODUCT_DISCOVERY',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.88
        }
    }

    return {
        intent: 'UNKNOWN',
        entities,
        sentiment,
        customerCorrection: false,
        repeatedQuestion: false,
        confidence
    }
}
