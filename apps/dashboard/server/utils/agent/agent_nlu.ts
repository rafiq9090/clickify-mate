import type { AgentUnderstanding, AgentIntent, AgentEntities } from './agent_types'

function normalizeDigits(text: string): string {
    const bengali = '০১২৩৪৫৬৭৮৯'
    return (text || '').replace(/[০-৯]/g, digit => String(bengali.indexOf(digit)))
}

export function normalizePaymentMethod(text: string): 'bkash' | 'nagad' | 'cod' | 'rocket' | 'stripe' | 'paypal' | 'sslcommerz' | undefined {
    const lower = (text || '').toLowerCase().replace(/[\s*_`-]+/g, ' ').trim()
    if (/(?:\bbkash\b|\bb kash\b|বিকাশ)/i.test(lower)) return 'bkash'
    if (/(?:\bnagad\b|\bnogot\b|\bnogod\b|নগদ)/i.test(lower)) return 'nagad'
    if (/(?:\bcod\b|cash on delivery|cash delivery|\bcash\b|ক্যাশ অন ডেলিভারি|ক্যাশ)/i.test(lower)) return 'cod'
    if (/(?:\brocket\b|রকেট)/i.test(lower)) return 'rocket'
    if (/(?:\bstripe\b|\bstrip\b)/i.test(lower)) return 'stripe'
    if (/(?:\bsslcommerz\b|\bssl\b|\bsslcommerce\b|\bbank\b|\bbanks\b|\bbanking\b|\bnet banking\b|\bcard\b|\bvisa\b|\bmastercard\b|ব্যাংক|কার্ড|এসএসএল)/i.test(lower)) return 'sslcommerz'
    if (/\bpaypal\b/i.test(lower)) return 'paypal'
    return undefined
}

export function extractEntitiesDeterministic(text: string, catalog: any[] = []): AgentEntities {
    const entities: AgentEntities = {}
    if (!text) return entities

    const normalizedText = normalizeDigits(text)
    const lower = normalizedText.toLowerCase()

    // 1. Phone number extraction (Bangladeshi 11-digit: 01XXXXXXXXX)
    const phoneMatch = normalizedText.match(/(?:\+?88)?01\d{9}\b/) || normalizedText.match(/(?:\+?88)?01[3-9]\d{8}\b/)
    if (phoneMatch) {
        entities.phone = phoneMatch[0].replace('+88', '')
    }

    // 2. Transaction ID extraction (e.g. TrxID: 2D3XJS... or 8-14 char alphanumeric)
    const trxMatch = text.match(/(?:trx\s*id|transaction\s*id|id\s*:?)\s*([A-Za-z0-9]{8,14})\b/i)
    if (trxMatch && !phoneMatch) {
        entities.trxId = trxMatch[1]
    }

    // 3. Dynamic Product / SKU extraction from live database catalog
    if (Array.isArray(catalog) && catalog.length > 0) {
        for (const prod of catalog) {
            const prodName = (prod.name || '').toLowerCase()
            const prodSku = (prod.sku || '').toLowerCase()

            if (prodSku && lower.includes(prodSku)) {
                entities.sku = prod.sku
                entities.productName = prod.name
                break
            }
            if (prodName && lower.includes(prodName)) {
                entities.sku = prod.sku
                entities.productName = prod.name
                break
            }
        }
    }

    // 4. Dynamic Color extraction from live catalog variants. Older catalog rows
    // store variants in `images`, while newer rows may use `variants`.
    if (Array.isArray(catalog) && catalog.length > 0) {
        for (const prod of catalog) {
            const variants = [
                ...(Array.isArray(prod.variants) ? prod.variants : []),
                ...(Array.isArray(prod.images) ? prod.images : []),
                ...(prod.color ? [{ color: prod.color }] : [])
            ]
            for (const variant of variants) {
                if (variant.color && lower.includes(String(variant.color).toLowerCase())) {
                    entities.color = variant.color
                    break
                }
            }
            if (entities.color) break
        }
    }

    // 4.1 Fallback standard colors if catalog is empty or does not specify
    if (!entities.color) {
        const commonColorMatch = normalizedText.match(/\b(black|white|red|blue|green|yellow|navy|olive|maroon|grey|gray|কালো|সাদা|লাল|নীল|সবুজ|হলুদ)\b/i)
        if (commonColorMatch && commonColorMatch[1]) {
            const rawCol = commonColorMatch[1]
            entities.color = rawCol.charAt(0).toUpperCase() + rawCol.slice(1).toLowerCase()
        }
    }

    // 5. Size detection
    const sizeMatch = normalizedText.match(/\b(XXL|XL|L|M|S)\b/i) || normalizedText.match(/\b(xxl|xl|large|medium|small)\b/i)
    if (sizeMatch && sizeMatch[1]) {
        entities.size = sizeMatch[1].toUpperCase()
    }

    // 6. Quantity detection
    const looksLikeCopiedTableRow = (normalizedText.match(/\|/g) || []).length >= 2
    const qtyMatch = looksLikeCopiedTableRow ? null : (
        normalizedText.match(/\b(\d+)\s*(?:ta|pcs|pc|piece|pieces|ti|টা|টি)\b/i) ||
        normalizedText.match(/\b(?:quantity|qty|পরিমাণ|পিস)\s*:?\s*(\d+)\b/i) ||
        normalizedText.match(/(?:^|[,|])\s*(\d{1,2})\s*$/)
    )
    if (qtyMatch && qtyMatch[1]) {
        const parsed = parseInt(qtyMatch[1], 10)
        if (parsed > 0 && parsed <= 50) {
            entities.quantity = parsed
        }
    }

    // 7. Dynamic Address extraction
    if (
        lower.includes('thikana') || lower.includes('ঠিকানা') || lower.includes('road') ||
        lower.includes('house') || lower.includes('sector') || lower.includes('block') ||
        lower.includes('gram') || lower.includes('union') || lower.includes('upazila') ||
        lower.includes('thana') || lower.includes('dhaka') || lower.includes('chittagong') ||
        lower.includes('cumilla') || lower.includes('comilla') || lower.includes('cumill') || lower.includes('sylhet') || lower.includes('rajshahi') ||
        lower.includes('khulna') || lower.includes('barisal') || lower.includes('rangpur') ||
        lower.includes('mymensingh') || lower.includes('gazipur') || lower.includes('narayanganj') ||
        (!looksLikeCopiedTableRow && (normalizedText.match(/,/g) || []).length >= 2 && normalizedText.length >= 8)
    ) {
        let cleanedAddress = normalizedText.replace(/^(amar\s*thikana|amar\s*eita\s*mol\s*thikana|thikana\s*:?|ঠিকানা\s*:?|address\s*:?)/i, '').trim()

        // Sanitize address: if the customer sent a composite order string (e.g. "Dhaka, 01733887749, Black, XL , 1"),
        // strip out extracted contact & variant info from the physical address field.
        if (entities.phone || /(?:\+?88)?01[3-9]\d{8}/.test(cleanedAddress)) {
            cleanedAddress = cleanedAddress.replace(/(?:\+?88)?01[3-9]\d{8}/g, '')
        }
        // Remove size tokens
        cleanedAddress = cleanedAddress.replace(/\b(XXL|XL|L|M|S)\b/gi, '')
        // Remove standard color tokens
        cleanedAddress = cleanedAddress.replace(/\b(Black|White|Red|Blue|Green|Yellow|সাদা|কালো|লাল|নীল)\b/gi, '')
        // Remove quantities or lone integers surrounded by commas/boundaries/whitespace
        cleanedAddress = cleanedAddress.replace(/\b\d+\s*(?:pcs|pc|piece|pieces|ta|ti|টা|টি)\b/gi, '')
        cleanedAddress = cleanedAddress.replace(/(?:^|[,|\s])\d+(?=[,|\s]|$)/g, ' ')
        // Remove product name or SKU if present in composite text
        if (entities.productName) {
            cleanedAddress = cleanedAddress.replace(new RegExp(`\\b${entities.productName}\\b`, 'gi'), '')
        }
        if (entities.sku) {
            cleanedAddress = cleanedAddress.replace(new RegExp(`\\b${entities.sku}\\b`, 'gi'), '')
        }
        // Clean up formatting artifacts (dangling commas, colons, spaces)
        cleanedAddress = cleanedAddress
            .replace(/[,|\-:]\s*[,|\-:]+/g, ',')
            .replace(/^[,|\-:\s]+|[,|\-:\s]+$/g, '')
            .trim()

        if (cleanedAddress.length >= 2 && !cleanedAddress.startsWith('http')) {
            entities.address = cleanedAddress
        }
    }

    const paymentMethod = normalizePaymentMethod(normalizedText)
    if (paymentMethod) entities.paymentMethod = paymentMethod

    return entities
}

export function detectCustomerCorrection(text: string, previousAgentText?: string): {
    isCorrection: boolean
    errorType?: 'WRONG_VARIANT' | 'WRONG_PRICE' | 'WRONG_STOCK' | 'MISUNDERSTOOD_INTENT'
} {
    if (!text) return { isCorrection: false }
    const lower = text.toLowerCase()

    const correctionKeywords = [
        'ভুল বলছেন', 'ভুল বলছেন আপনি', 'ভুল', 'wrong', 'mistake', 'na bhai',
        'eta na', 'eta na ami', 'bolsi', 'ami bolsilam', 'ami to', 'bolechi', 'bolesi',
        'abar same kotha', 'bujhen nai', 'bujhte paren nai', 'bhul bujchen', 'bhul bujtesen', 'bujhen na',
        'ami eta chaini', 'ami eita chai nai', 'matha thik', 'ki bolo', 'ki kos', 'faltu',
        'koto bar', 'eto bar', 'eto bar bolar', 'agei disi', 'upore diye', 'bar bar eki', 'eki kotha',
        'ami chobi dei nai', 'chobi dei nai', 'ami to ekbar bollam', 'thikana koto bar',
        'na na', 'khulna na', 'dhaka na', 'stop asking', 'you are wrong', 'not this', 'not that'
    ]

    for (const kw of correctionKeywords) {
        if (lower.includes(kw)) {
            return { isCorrection: true, errorType: 'MISUNDERSTOOD_INTENT' }
        }
    }

    // Pattern: "X bolechi, Y na" or "X, Y na" (e.g. "Dhaka bolechi, Khulna na")
    if (/\b(?:bolechi|bolesi|bolsilam)\b/i.test(lower) || /\b[a-z\u0980-\u09FF]+\s+na\b/i.test(lower)) {
        if (lower.includes(' na') || lower.includes(' না')) {
            return { isCorrection: true, errorType: 'MISUNDERSTOOD_INTENT' }
        }
    }

    return { isCorrection: false }
}

export function understandMessageFast(
    text: string,
    previousAgentText?: string,
    catalog: any[] = []
): AgentUnderstanding {
    const lower = (text || '').toLowerCase().trim()
    const entities = extractEntitiesDeterministic(text, catalog)
    const correction = detectCustomerCorrection(text, previousAgentText)

    let intent: AgentIntent = 'UNKNOWN'
    let sentiment: 'positive' | 'neutral' | 'confused' | 'frustrated' | 'negative' = 'neutral'
    let confidence = 0.85
    const isProductListRequest = /(ki\s*ki\s*products?\s*(ache|asen)|ki\s*ki\s*product\s*(ache|asen)|show\s*(me\s*)?(all\s*)?products?|tell\s*(me\s*)?(about\s*)?(your|you\s*)?products?|what\s*products?|available\s*products?|product\s*list|all\s*products?|প্রোডাক্ট\s*লিস্ট|সব\s*প্রোডাক্ট|কি\s*কি\s*প্রোডাক্ট)/i.test(lower)

    // 1. Human Agent Handoff
    if (
        /(human\s*agent|real\s*agent|admin\s*k\s*d|admin\s*er\s*sathe|talk\s*to\s*human|real\s*manush|manusher\s*sathe|customer\s*care|live\s*support|manush\s*er\s*sathe|এডমিন|মানুষের\s*সাথে|লাইভ\s*এজেন্ট)/i.test(lower)
    ) {
        return {
            intent: 'HUMAN_HANDOFF',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.98
        }
    }

    // 2. Complaint
    if (
        /(defect|damaged|broken|torn|chera|chera\s*peyechi|nosto|wrong\s*size|bhul\s*size|shilai\s*khula|chera\s*kapod|fata|faulty|stain|dag\s*lagano|কমপ্লেইন|ছেঁড়া|নষ্ট|সমস্যা)/i.test(lower)
    ) {
        return {
            intent: 'COMPLAINT',
            entities,
            sentiment: 'negative',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.96
        }
    }

    // 3. Customer Correction
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

    // 4. Greetings
    if ((/^(hi|hello|hey|salam|assalamu\s*alaikum|kemon\s*achen|hlo)\b/i.test(lower) ||
        /^(?:হ্যালো|হাই|সালাম|আসসালামু\s*আলাইকুম)(?:[.!?\s]|$)/i.test(lower)) && lower.length < 35) {
        return {
            intent: 'GREETING',
            entities,
            sentiment: 'positive',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.98
        }
    }

    if (isProductListRequest) {
        return {
            intent: 'PRODUCT_DISCOVERY', entities, sentiment: 'neutral',
            customerCorrection: false, repeatedQuestion: false, confidence: 0.98
        }
    }

    // 4.1 A transaction reference is proof to review, never a new gateway choice.
    if (entities.trxId) {
        return {
            intent: 'PAYMENT_QUERY',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.98
        }
    }

    // 4.1b Payment Gateway / Change Payment Inquiries
    if (/(?:change\s*(?:my\s*)?payment|change\s*(?:my\s*)?gateway|payment\s*gat?eway|payment\s*methods?|how\s*to\s*pay|পেমেন্ট\s*পরিবর্তন|পেমেন্ট\s*পদ্ধতি|পেমেন্ট\s*গেটওয়ে)/i.test(lower)) {
        return {
            intent: 'PAYMENT_QUERY',
            entities,
            sentiment: 'neutral',
            customerCorrection: true,
            repeatedQuestion: false,
            confidence: 0.98
        }
    }

    // 4.2 Payment choice must be recognized before generic price/order words.
    if (entities.paymentMethod) {
        return {
            intent: 'PAYMENT_SELECTION',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.98
        }
    }

    // 4.3 Short confirmations and rejections are interpreted against conversation state later.
    if (/^(yes|y|yeah|yep|ok|okay|ji|jee|hum|hmm|হ্যাঁ|জি|ঠিক আছে|acha|accha)[.!?\s]*$/i.test(lower)) {
        return {
            intent: 'AFFIRMATION', entities, sentiment: 'positive',
            customerCorrection: false, repeatedQuestion: false, confidence: 0.96
        }
    }
    if (/^(no|nah|na|না|cancel|বাদ|lagbe na|chai na)[.!?\s]*$/i.test(lower)) {
        return {
            intent: 'NEGATION', entities, sentiment: 'neutral',
            customerCorrection: false, repeatedQuestion: false, confidence: 0.96
        }
    }

    // 4.4 Numeric selection is resolved against the last structured option list.
    if (/^(?:option\s*)?[১-৯1-9](?:[\s.)]|$)/i.test((text || '').trim()) ||
        /^(?:[১-৯1-9])\s*(?:number|no|নাম্বার|ta|ti|টা|টি|order|kinte|kinbu|kinbo|nibo|korte|ekta|pcs|pc)/i.test((text || '').trim())) {
        return {
            intent: 'OPTION_SELECTION', entities, sentiment: 'positive',
            customerCorrection: false, repeatedQuestion: false, confidence: 0.96
        }
    }

    // 4.5 New Order / Reset Order / Another Order request
    const isNewOrderRequest = (
        /(?:another|new|fresh|again|one\s*more)\s+(?:order|product|item|purchase|buy)/i.test(lower) ||
        /(?:i\s*want\s*(?:to\s*)?)?(?:another|new|next)\s+order/i.test(lower) ||
        /^(?:another\s+order|new\s+order|order\s+again|buy\s+again|aro\s+order|notun\s+order)[.!?\s]*$/i.test(lower) ||
        /(?:আরেকটি|আরেকটা|নতুন|আবার)\s*(?:অর্ডার|কিনব|কিনতে|নিব)/i.test(lower)
    )
    if (isNewOrderRequest) {
        return {
            intent: 'NEW_ORDER',
            entities,
            sentiment: 'positive',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.99
        }
    }

    // 5. Order Confirmation / Checkout (Check BEFORE price/stock queries to prioritize buying intent)
    if (/^(?:yes\s+)?(?:confirm|confirm order|order confirm|confirmed|কনফার্ম|অর্ডার কনফার্ম)[.!?\s]*$/i.test(lower)) {
        return {
            intent: 'ORDER_CONFIRM',
            entities,
            sentiment: 'positive',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.99
        }
    }
    if (
        lower.includes('confirm') || lower.includes('order') || lower.includes('kinte') ||
        lower.includes('kinbu') || lower.includes('kinbo') || lower.includes('nibon') || lower.includes('nibo') ||
        lower.includes('অর্ডার') || lower.includes('নিব') || lower.includes('কিনব') ||
        lower.includes('পাঠিয়ে দিন') || lower.includes('order from') || lower.includes('order form') ||
        lower.includes('kinte chai') || lower.includes('korte cai') || lower.includes('buy')
    ) {
        return {
            intent: 'ORDER_START',
            entities,
            sentiment: 'positive',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.95
        }
    }

    // 6. Image / Photo Requests (Only trigger on explicit user requests to view product photos)
    const cleanUserText = (text || '').replace(/\[(?:User sent (?:image|video|voice)|Customer uploaded (?:image|video)):[^\]]*\]/gi, '').trim()
    const cleanLower = cleanUserText.toLowerCase()
    const isExplicitImageReq = (
        /(pic|photo|image|chobi|ছবি|পিক|পিকচার|ছবিটি|ছবিগুলো)/i.test(cleanLower) &&
        /(dao|den|pathan|dekh|dekhan|chai|dekte|পাঠান|দিন|দেখান|দেখবো|চাই|হবে|দেখা)/i.test(cleanLower)
    ) || /^(pic|photo|image|chobi|ছবি|পিক|ছবি দেন|pic please|chobi den|chobi dekhaw)[.!?\s]*$/i.test(cleanLower)

    if (isExplicitImageReq) {
        return {
            intent: 'IMAGE_REQUEST',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.95
        }
    }

    // 7. Praise & Gratitude (Positive Sentiment)
    if (
        /(thank\s*you|thanks|awesome|great\s*quality|good\s*product|nice|excellent|superb|love\s*it|dhonnobad|dhonnobaad|onek\s*bhalo|sundor|darun|khub\s*bhalo|jossh|osadharon|ধন্যবাদ|অনেক\s*সুন্দর|দারুণ|ভালো\s*প্রোডাক্ট)/i.test(lower)
    ) {
        return {
            intent: 'AFFIRMATION',
            entities,
            sentiment: 'positive',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.96
        }
    }

    // 8. Delivery Queries
    if (lower.includes('delivery') || lower.includes('shipping') || lower.includes('charge') || lower.includes('kobe pabo') || lower.includes('koto din') || lower.includes('ডেলিভারি')) {
        return {
            intent: 'DELIVERY_QUERY',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.94
        }
    }

    // 9. Price Queries (Pure price inquiry)
    if (
        lower.includes('dam koto') || lower.includes('koto dam') || lower.includes('price koto') || 
        lower.includes('koto price') || lower.includes('koto taka') || lower.includes('taka koto') ||
        lower.includes('কত দাম') || lower.includes('দাম কত') || lower.includes('কত টাকা') ||
        (lower.includes('দাম') && !lower.includes('অর্ডার')) || lower.includes('how much') || lower.includes('cost') ||
        /\b(?:price|pricing|rate|dam|cost)\b/i.test(lower)
    ) {
        return {
            intent: 'PRICE_QUERY',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.94
        }
    }

    // 10. Stock Queries
    if (lower.includes('stock') || lower.includes('available') || lower.includes('ache') || lower.includes('হবে কি') || lower.includes('আছে')) {
        return {
            intent: 'STOCK_QUERY',
            entities,
            sentiment: 'neutral',
            customerCorrection: false,
            repeatedQuestion: false,
            confidence: 0.90
        }
    }

    // Final sentiment fallback derivation
    if (sentiment === 'neutral') {
        if (/(awesome|great|love|good|best|nice|excellent|সুন্দর|ভালো|দারুণ|ধন্যবাদ|superb)/i.test(lower)) {
            sentiment = 'positive'
        } else if (/(baje|kharap|faltu|terrible|worst|useless|cheat|fraud|annoying|ভুল|খারাপ|বাজে|ফালতু)/i.test(lower)) {
            sentiment = 'negative'
        } else if (/(keno|kobe|bujhlam na|bujhina|confused|why|what|কিভাবে|বুঝলাম না)/i.test(lower)) {
            sentiment = 'confused'
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

export function evaluateCatalogMatch(
    queryOrVisionDescription: string,
    catalog: any[] = []
): { isMatch: boolean; matchedProduct?: any; matchedSku?: string; reason?: string } {
    if (!queryOrVisionDescription) {
        return { isMatch: true }
    }

    const text = queryOrVisionDescription.toLowerCase()

    if (!catalog || catalog.length === 0) {
        return { isMatch: true }
    }

    // Dynamic match against live catalog
    for (const prod of catalog) {
        const prodName = (prod.name || '').toLowerCase()
        const prodSku = (prod.sku || '').toLowerCase()
        const prodCategory = (prod.category || '').toLowerCase()

        if (prodSku && text.includes(prodSku)) {
            return { isMatch: true, matchedProduct: prod, matchedSku: prod.sku }
        }
        if (prodName && text.includes(prodName)) {
            return { isMatch: true, matchedProduct: prod, matchedSku: prod.sku }
        }
        const keywords = prodName.split(/[\s-_]+/).filter((w: string) => w.length >= 3 && !['and', 'for', 'the', 'new', 'men', 'women'].includes(w))
        if (keywords.some((k: string) => text.includes(k))) {
            return { isMatch: true, matchedProduct: prod, matchedSku: prod.sku }
        }
        if (prodCategory && text.includes(prodCategory)) {
            return { isMatch: true, matchedProduct: prod, matchedSku: prod.sku }
        }
    }

    return { isMatch: false }
}
