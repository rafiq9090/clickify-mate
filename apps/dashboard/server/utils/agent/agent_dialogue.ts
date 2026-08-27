import type {
    AgentContext,
    AgentEntities,
    AgentIntent,
    AgentUnderstanding,
    ConversationState,
    IncomingAgentEvent
} from './agent_types'

const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯'

function asciiDigits(value: string): string {
    return (value || '').replace(/[০-৯]/g, digit => String(BENGALI_DIGITS.indexOf(digit)))
}

function catalogProduct(context: AgentContext, sku?: string) {
    const normalized = String(sku || '').toLowerCase().trim()
    if (!normalized) return undefined
    return (context.agentConfig.catalog || []).find((product: any) =>
        String(product.sku || '').toLowerCase() === normalized ||
        String(product.name || '').toLowerCase() === normalized ||
        String(product.name || '').toLowerCase().includes(normalized)
    )
}

function productVariants(product: any): Array<{ color?: string; size?: string; stock: number }> {
    if (!product) return []
    const source = Array.isArray(product.variants) && product.variants.length > 0
        ? product.variants
        : (Array.isArray(product.images) ? product.images : [])
    const seen = new Set<string>()
    const variants: Array<{ color?: string; size?: string; stock: number }> = []
    for (const item of source) {
        const color = item.color || undefined
        const size = item.size || undefined
        const stock = Number(item.stock ?? item.quantity ?? product.stock_quantity ?? 0)
        const key = `${String(color || '').toLowerCase()}|${String(size || '').toLowerCase()}`
        if (seen.has(key)) continue
        seen.add(key)
        variants.push({ color, size, stock })
    }
    return variants
}

function optionIndex(text: string): string | undefined {
    const normalized = asciiDigits(text).trim()
    const match = normalized.match(/(?:^|\b)([1-9])(?:[\s.)-]|$|\b)/)
    return match?.[1]
}

function looksLikeAddress(text: string): boolean {
    const clean = asciiDigits(text).trim()
    if (clean.length < 6 || clean.length > 300 || /^https?:\/\//i.test(clean)) return false
    if (/^(yes|no|ok|okay|ji|jee|hmm?|bkash|nagad|nogot|nogod|stripe|cod|rocket)$/i.test(clean)) return false
    if (/^(?:\+?88)?01[3-9]\d{8}$/.test(clean)) return false
    if ((clean.match(/\|/g) || []).length >= 2) return false
    return clean.includes(',') || /\b(road|house|block|sector|village|gram|union|thana|upazila|district|dhaka|cumill|comilla|chattogram|sylhet|rajshahi|khulna|barisal|rangpur)\b/i.test(clean)
}

function looksLikeName(text: string): boolean {
    const clean = asciiDigits(text).trim()
    if (clean.length < 2 || clean.length > 80 || /\d|https?:|[|,]/i.test(clean)) return false
    if (/^(yes|no|ok|okay|ji|jee|bkash|nagad|nogot|stripe|cod|rocket)$/i.test(clean)) return false
    return /^[\p{L}.' -]+$/u.test(clean)
}

export function detectLanguage(text: string, currentLanguage?: string): string {
    if (!text) return currentLanguage || 'bn'
    const lower = text.toLowerCase().trim()

    // 1. Explicit Language Commands & Inquiries
    if (/\b(?:hindi|in hindi|indi|hindustani|हिंदी|হিন্দি)\b/i.test(lower)) return 'hi'
    if (/\b(?:arabic|in arabic|arabi|arbic|عربي|العربية|আরবি)\b/i.test(lower)) return 'ar'
    if (/\b(?:german|in german|deutsch|deutsche|জার্মান)\b/i.test(lower)) return 'de'
    if (/\b(?:spanish|in spanish|español|espanol|স্প্যানিশ)\b/i.test(lower)) return 'es'
    if (/\b(?:french|in french|français|francais|ফরাসি)\b/i.test(lower)) return 'fr'
    if (/\b(?:urdu|in urdu|اردو|উর্দু)\b/i.test(lower)) return 'ur'
    if (/\b(?:italian|italiano|ইতালীয়)\b/i.test(lower)) return 'it'
    if (/\b(?:portuguese|português|পর্তুগিজ)\b/i.test(lower)) return 'pt'
    if (/\b(?:english|in english|convert to english|english please|give me english|speak in english|change to english|english convert|enlish)\b/i.test(lower)) {
        return 'en'
    }
    if (/\b(?:bangla|in bangla|bengali|bangla please|বাংলা|বাংলায়|বাংলায় বলুন)\b/i.test(lower)) {
        return 'bn'
    }

    // A plain Latin greeting should not be mistaken for Bangla just because the
    // conversation has no established language yet.
    if (/^(?:hi|hello|hey|hlo|good\s+(?:morning|afternoon|evening))[.!?\s]*$/i.test(lower)) return 'en'

    // 2. Unicode Scripts
    if (/[\u0600-\u06FF]/.test(text)) return 'ar'
    if (/[\u0900-\u097F]/.test(text)) return 'hi'
    if (/[\u0980-\u09FF]/.test(text)) return 'bn'

    // 3. Common English Words / Questions
    if (/\b(?:order confirm|order confirmation|give me|what is the price|which size|how much|i want to buy|delivery charge|is it available|please provide|confirm order|receipt|invoice|order from|tell me about|your company)\b/i.test(lower)) {
        return 'en'
    }

    // 4. If current language is set and text doesn't contain explicit Banglish markers, preserve it
    if (currentLanguage && currentLanguage !== 'bn') {
        const banglishMarkers = /\b(?:ami|apnar|apni|koto|dam|taka|eita|eta|kinbo|kinbu|nibo|lagbe|thikana|bujchi|hobe|ache|den|dao|korbo|cai|chai|kichu)\b/i
        if (!banglishMarkers.test(lower)) {
            return currentLanguage
        }
    }

    return currentLanguage || 'bn'
}

function getCleanCustomerName(context: AgentContext): string {
    const rawName = String(context.customer?.name || context.orderDraft?.name || '').trim()
    if (!rawName) return ''
    // Ignore generic placeholder names
    if (/^(facebook|telegram|whatsapp|instagram|meta|user|guest)\s*(user)?\s*\(?[\d_a-z]*\)?$/i.test(rawName)) {
        return ''
    }
    return rawName
}

function isPlatformWord(str: string): boolean {
    if (!str) return true
    const s = str.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!s) return true
    return (
        s.startsWith('mess') || // messenger, messagenser
        s.startsWith('faceb') ||
        s.startsWith('fb') ||
        s.startsWith('telegr') ||
        s.startsWith('tg') ||
        s.startsWith('whats') ||
        s.startsWith('wa') ||
        s.startsWith('insta') ||
        s.startsWith('ig') ||
        s === 'direct' ||
        s.endsWith('agent') ||
        s.endsWith('bot') ||
        s === 'clickifymate'
    )
}

function getBrandName(context: AgentContext): string {
    const configured = String(context.agentConfig.businessName || '').trim()
    if (configured && !isPlatformWord(configured)) {
        return configured
    }

    // Extract brand name from knowledge base (e.g. "# 🛍️ Fabrilife AI Sales Agent" -> "Fabrilife")
    const kb = String(context.agentConfig.knowledge || '')
    const kbMatch = kb.match(/#+\s*(?:🛍️|🏬|🏪|✨)?\s*([A-Za-z0-9\s&'-]+?)\s*(?:AI\s*Sales|AI\s*Agent|Sales\s*Agent|Knowledge\s*Base|Store|Shop)/i)
    if (kbMatch && kbMatch[1]) {
        const extracted = kbMatch[1].trim()
        if (extracted && !isPlatformWord(extracted)) {
            return extracted
        }
    }

    // Check custom agent name if provided
    const name = String(context.agentConfig.name || '').trim()
    if (name && !isPlatformWord(name)) {
        return name.replace(/\s*(?:agent|bot|sales|ai)\s*$/i, '').trim() || name
    }

    return ''
}

export function buildGreetingReply(context: AgentContext, userText?: string): string {
    const language = context.session.language || 'bn'
    const brandName = getBrandName(context)
    const customerName = getCleanCustomerName(context)
    const explicitlyIslamicGreeting = /(?:ass?alamu?\s*alaikum|salam\s*alaikum|আসসালামু\s*আলাইকুম|সালাম)/i.test(userText || '')

    if (language === 'en') {
        const opening = explicitlyIslamicGreeting 
            ? (customerName ? `Wa alaikum assalam, ${customerName}!` : 'Wa alaikum assalam!')
            : (customerName ? `Hello ${customerName}!` : 'Hello!')
        const welcomePart = brandName ? ` Welcome to ${brandName}.` : ''
        return `${opening}${welcomePart} How can I assist you with products, pricing, stock, or placing an order today? 😊`
    }

    const opening = explicitlyIslamicGreeting 
        ? (customerName ? `ওয়ালাইকুম আসসালাম, ${customerName}!` : 'ওয়ালাইকুম আসসালাম!')
        : (customerName ? `হ্যালো ${customerName}!` : 'হ্যালো!')
    const destination = brandName ? ` ${brandName}-এ স্বাগতম।` : ''
    return `${opening}${destination} প্রোডাক্ট, দাম, স্টক বা অর্ডার—যেটি দরকার বলুন। 😊`
}

/**
 * Apply the current message to structured state before any model is called.
 * This prevents the model from seeing a stale phone/address/payment draft.
 */
export function mergeCurrentTurn(
    context: AgentContext,
    understanding: AgentUnderstanding,
    rawText: string
): AgentEntities {
    const entities = { ...understanding.entities }

    // Dynamically detect and persist conversation language
    const lang = detectLanguage(rawText, context.session.language || context.customer?.preferredLanguage)
    context.session.language = lang
    if (context.customer) {
        context.customer.preferredLanguage = lang
    }

    if (understanding.intent === 'OPTION_SELECTION' || (!entities.sku && optionIndex(rawText))) {
        const index = optionIndex(rawText)
        let sku = index ? context.session.lastPresentedOptions?.[index] : undefined
        if (!sku && index) {
            const products = (context.agentConfig.catalog || []).filter((product: any) =>
                !product.assigned_agent || product.assigned_agent === 'all' || product.assigned_agent === context.agentId
            )
            const idxNum = parseInt(index, 10) - 1
            if (products[idxNum]) {
                sku = products[idxNum].sku || products[idxNum].id
            }
        }
        const product = catalogProduct(context, sku)
        if (sku && product) {
            entities.sku = product.sku
            entities.productName = product.name
            understanding.entities = entities
        }
    }

    if (!entities.address &&
        (context.session.state === 'COLLECT_ADDRESS' || context.session.lastAskedField === 'address') &&
        looksLikeAddress(rawText)) {
        entities.address = asciiDigits(rawText).trim()
        understanding.entities = entities
    }

    if (!entities.name &&
        (context.session.state === 'COLLECT_NAME' || context.session.lastAskedField === 'name') &&
        looksLikeName(rawText)) {
        entities.name = rawText.trim()
        understanding.entities = entities
    }

    if (entities.sku) {
        const product = catalogProduct(context, entities.sku)
        const changed = context.selection.sku && context.selection.sku !== entities.sku
        if (changed) {
            context.previousSelection = { ...context.selection }
            context.selection.color = undefined
            context.selection.size = undefined
            if (context.orderDraft) {
                context.orderDraft.color = undefined
                context.orderDraft.size = undefined
            }
        }
        context.selection.sku = entities.sku
        context.selection.productName = entities.productName || product?.name
        context.orderDraft = context.orderDraft || {}
        context.orderDraft.sku = entities.sku
    }
    if (entities.color) {
        context.selection.color = entities.color
        context.orderDraft = context.orderDraft || {}
        context.orderDraft.color = entities.color
    }
    if (entities.size) {
        context.selection.size = entities.size
        context.orderDraft = context.orderDraft || {}
        context.orderDraft.size = entities.size
    }
    if (entities.quantity) {
        context.selection.quantity = entities.quantity
        context.orderDraft = context.orderDraft || {}
        context.orderDraft.quantity = entities.quantity
    }
    if (!context.selection.quantity) context.selection.quantity = 1

    context.orderDraft = context.orderDraft || {}
    if (!context.orderDraft.quantity) context.orderDraft.quantity = context.selection.quantity || 1
    if (entities.name) context.orderDraft.name = entities.name
    if (entities.phone) {
        context.orderDraft.phone = entities.phone
        context.customer.phone = entities.phone
    }
    if (entities.address) {
        context.orderDraft.address = entities.address
        context.customer.address = entities.address
    }
    if (entities.district) context.orderDraft.district = entities.district
    if (entities.trxId) context.orderDraft.trxId = entities.trxId
    if (entities.paymentMethod) context.orderDraft.paymentMethod = entities.paymentMethod

    // Autofill known customer profile details if missing in current order draft
    if (!context.orderDraft.phone && context.customer?.phone) {
        context.orderDraft.phone = context.customer.phone
    }
    if (!context.orderDraft.name && (context.customer?.name || context.customerName)) {
        context.orderDraft.name = context.customer?.name || context.customerName
    }
    if (!context.orderDraft.address && context.customer?.address) {
        context.orderDraft.address = context.customer.address
    }

    return entities
}

export function buildProductListReply(context: AgentContext): { text: string; options: Record<string, string> } {
    const lang = context.session.language || 'bn'
    const products = (context.agentConfig.catalog || []).filter((product: any) =>
        !product.assigned_agent || product.assigned_agent === 'all' || product.assigned_agent === context.agentId
    )
    if (products.length === 0) {
        return {
            text: lang === 'en'
                ? 'Sorry, no active products are currently available in the catalog. A store representative will check shortly.'
                : 'দুঃখিত, এই মুহূর্তে ক্যাটালগে কোনো সক্রিয় প্রোডাক্ট পাওয়া যাচ্ছে না। একজন প্রতিনিধি ক্যাটালগটি যাচাই করবেন।',
            options: {}
        }
    }

    const options: Record<string, string> = {}
    const lines = products.slice(0, 8).map((product: any, index: number) => {
        const key = String(index + 1)
        options[key] = String(product.sku || product.id || key)
        const price = Number(product.price)
        return `${key}. ${product.name}${Number.isFinite(price) && price > 0 ? ` — ৳${price}` : ''}`
    })

    const title = lang === 'en' ? 'Our Available Products:' : 'বর্তমানে আমাদের প্রোডাক্ট:'
    const instruction = lang === 'en' ? "Please reply with the product number or name you'd like to order." : 'যেটি চান তার নম্বর বা নাম বলুন।'

    return {
        text: `${title}\n${lines.join('\n')}\n${instruction}`,
        options
    }
}

export type MissingOrderField = 'product' | 'color' | 'size' | 'name' | 'phone' | 'address' | 'payment' | null

export function getMissingOrderField(context: AgentContext): MissingOrderField {
    const draft = context.orderDraft || {}
    const sku = draft.sku || context.selection.sku
    if (!sku) return 'product'

    // Auto-populate customer name if already known from profile
    if (!draft.name && (context.customer?.name || context.customerName)) {
        const raw = context.customer?.name || context.customerName
        if (raw && !/^(facebook|telegram|whatsapp|instagram|meta|user|guest)\s*(user)?\s*\(?[\d_a-z]*\)?$/i.test(raw)) {
            draft.name = raw
            if (context.orderDraft) context.orderDraft.name = raw
        }
    }

    const product = catalogProduct(context, sku)
    const variants = productVariants(product).filter(variant => variant.stock > 0)
    const colors = new Set(variants.map(v => v.color).filter(Boolean))
    const sizes = new Set(variants.map(v => v.size).filter(Boolean))

    // If only 1 color or size is available in catalog, auto-assign it
    if (colors.size === 1 && !draft.color && !context.selection.color) {
        const onlyColor = colors.values().next().value
        if (onlyColor) {
            context.selection.color = onlyColor
            if (context.orderDraft) context.orderDraft.color = onlyColor
        }
    }
    if (sizes.size === 1 && !draft.size && !context.selection.size) {
        const onlySize = sizes.values().next().value
        if (onlySize) {
            context.selection.size = onlySize
            if (context.orderDraft) context.orderDraft.size = onlySize
        }
    }

    if (colors.size > 1 && !(draft.color || context.selection.color)) return 'color'
    if (sizes.size > 1 && !(draft.size || context.selection.size)) return 'size'
    if (!draft.name) return 'name'
    if (!draft.phone) return 'phone'
    if (!draft.address) return 'address'
    if (!draft.paymentMethod) return 'payment'
    return null
}

export function buildProgressReply(context: AgentContext, missing: MissingOrderField): string {
    const lang = context.session.language || 'bn'
    const product = catalogProduct(context, context.orderDraft?.sku || context.selection.sku)
    const variants = productVariants(product).filter(v => v.stock > 0)
    if (missing === 'product') return buildProductListReply(context).text

    const draft = context.orderDraft || {}
    const colors = [...new Set(variants.map(v => v.color).filter(Boolean))]
    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]

    const needsColor = colors.length > 1 && !(draft.color || context.selection.color)
    const needsSize = sizes.length > 1 && !(draft.size || context.selection.size)
    const needsName = !draft.name && !(context.customer?.name || context.customerName)
    const needsPhone = !draft.phone
    const needsAddress = !draft.address
    const needsPayment = !draft.paymentMethod

    const missingFieldsCount = [needsColor, needsSize, needsName, needsPhone, needsAddress, needsPayment].filter(Boolean).length

    // If 2 or more fields are missing, provide the FULL ALL-IN-ONE order form template in ONE single message
    if (missingFieldsCount >= 2) {
        const productName = product?.name || draft.productName || 'Product'
        if (lang === 'en') {
            const formLines = [
                `📦 To confirm your order for "${productName}", please reply with the following details in one message:`,
                '',
                needsName ? '📌 Full Name: ' : '',
                needsPhone ? '📌 Mobile Number: ' : '',
                needsAddress ? '📌 Delivery Address (Area, Thana, District): ' : '',
                needsColor ? `📌 Color (${colors.join(' / ')}): ` : '',
                needsSize ? `📌 Size (${sizes.join(' / ')}): ` : '',
                needsPayment ? '📌 Payment Method (bKash / Nagad / Stripe / Cash on Delivery): ' : '',
                '',
                '👉 Send all details in a single message to place the order quickly!'
            ].filter(line => line !== '')
            return formLines.join('\n')
        }

        const formLines = [
            `📦 "${productName}" অর্ডারটি কনফার্ম করতে নিচের তথ্যগুলো এক মেসেজে পাঠিয়ে দিন:`,
            '',
            needsName ? '📌 আপনার নাম:' : '',
            needsPhone ? '📌 মোবাইল নম্বর:' : '',
            needsAddress ? '📌 সম্পূর্ণ ঠিকানা (গ্রাম/এলাকা, থানা, জেলা):' : '',
            needsColor ? `📌 পছন্দের রং (${colors.join(' / ')}):` : '',
            needsSize ? `📌 সাইজ (${sizes.join(' / ')}):` : '',
            needsPayment ? '📌 পেমেন্ট পদ্ধতি (bKash, Nagad, Stripe অথবা Cash on Delivery):' : '',
            '',
            '👉 এক মেসেজে সবগুলো তথ্য লিখে পাঠালেই অর্ডারটি দ্রুত তৈরি হয়ে যাবে!'
        ].filter(line => line !== '')
        return formLines.join('\n')
    }

    if (missing === 'color') {
        return lang === 'en'
            ? `Which color would you like? Available: ${colors.join(', ')}.`
            : `কোন রংটি চান? উপলভ্য: ${colors.join(', ')}।`
    }
    if (missing === 'size') {
        return lang === 'en'
            ? `Which size would you like? Available: ${sizes.join(', ')}.`
            : `কোন সাইজটি চান? উপলভ্য: ${sizes.join(', ')}।`
    }
    if (missing === 'name') {
        return lang === 'en' ? 'Please provide your full name for the order.' : 'অর্ডারের জন্য আপনার নামটি দিন।'
    }
    if (missing === 'phone') {
        return lang === 'en'
            ? 'Please provide your 11-digit mobile number for delivery.'
            : 'অর্ডারের জন্য আপনার ১১ সংখ্যার মোবাইল নম্বর দিন।'
    }
    if (missing === 'address') {
        return lang === 'en'
            ? 'Thank you. Please provide your delivery address (Area/Village, Thana, District).'
            : 'ধন্যবাদ। এখন এলাকা/গ্রাম, থানা ও জেলাসহ ডেলিভারি ঠিকানাটি দিন।'
    }
    if (missing === 'payment') {
        return lang === 'en'
            ? 'Please choose your payment method: bKash, Nagad, Stripe, or Cash on Delivery (COD).'
            : 'পেমেন্ট পদ্ধতি বেছে নিন: bKash, Nagad, Stripe অথবা Cash on Delivery (COD)।'
    }
    return lang === 'en' ? 'Your order details are complete. Verifying order...' : 'আপনার অর্ডারের তথ্য সম্পূর্ণ হয়েছে। এখন অর্ডারটি যাচাই করছি।'
}

export function buildOrderReviewReply(context: AgentContext): string {
    const lang = context.session.language || 'bn'
    const draft = context.orderDraft || {}
    const product = catalogProduct(context, draft.sku || context.selection.sku)
    const productName = draft.productName || context.selection.productName || product?.name || draft.sku || 'Product'
    const itemTotal = Number(draft.unitPrice || 0) * Number(draft.quantity || 1)
    const payment = String(draft.paymentMethod || 'cod').toUpperCase()

    if (lang === 'en') {
        return [
            'Please review your order before it is created:',
            `Product: ${productName}`,
            draft.color ? `Color: ${draft.color}` : '',
            draft.size ? `Size: ${draft.size}` : '',
            `Quantity: ${draft.quantity || 1}`,
            `Item total: ৳${itemTotal}`,
            `Delivery: ৳${draft.deliveryFee || 0}`,
            `Total: ৳${draft.total || 0}`,
            `Payment: ${payment}`,
            `Name: ${draft.name || context.customerName || ''}`,
            `Phone: ${draft.phone || ''}`,
            `Address: ${draft.address || ''}`,
            '',
            'Reply “Confirm” to place this order, or “No” to cancel and make changes.'
        ].filter(Boolean).join('\n')
    }

    return [
        'অর্ডার তৈরির আগে তথ্যগুলো যাচাই করুন:',
        `পণ্য: ${productName}`,
        draft.color ? `রং: ${draft.color}` : '',
        draft.size ? `সাইজ: ${draft.size}` : '',
        `পরিমাণ: ${draft.quantity || 1}`,
        `পণ্যের মূল্য: ৳${itemTotal}`,
        `ডেলিভারি: ৳${draft.deliveryFee || 0}`,
        `সর্বমোট: ৳${draft.total || 0}`,
        `পেমেন্ট: ${payment}`,
        `নাম: ${draft.name || context.customerName || ''}`,
        `ফোন: ${draft.phone || ''}`,
        `ঠিকানা: ${draft.address || ''}`,
        '',
        'অর্ডার করতে “Confirm” লিখুন। পরিবর্তন বা বাতিল করতে “No” লিখুন।'
    ].filter(Boolean).join('\n')
}

export function buildConfirmedOrderReceipt(context: AgentContext, orderOutput: any): string {
    const lang = context.session.language || 'bn'
    const draft = context.orderDraft || {}
    const product = catalogProduct(context, draft.sku || context.selection.sku)
    const productName = draft.productName || context.selection.productName || product?.name || draft.sku || (lang === 'en' ? 'Product' : 'পণ্য')
    const orderId = orderOutput?.orderId || orderOutput?.invoiceNumber || `CM-${Date.now().toString(36).toUpperCase()}`

    if (lang === 'en') {
        const paymentDisplay = (draft.paymentMethod || 'cod').toLowerCase() === 'cod'
            ? 'Cash On Delivery (COD)'
            : (draft.paymentMethod?.toUpperCase() || 'Cash On Delivery')

        return [
            `🎉 Congratulations! Your order has been confirmed successfully.`,
            ``,
            `🧾 Order Receipt / Invoice:`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `📦 Order ID: #${orderId}`,
            `🛍️ Product: ${productName}`,
            draft.color ? `🎨 Color: ${draft.color}` : '',
            draft.size ? `📏 Size: ${draft.size}` : '',
            `🔢 Quantity: ${draft.quantity || 1} pcs`,
            `💰 Item Price: ৳${Number(draft.unitPrice || 0) * Number(draft.quantity || 1)}`,
            `🚚 Delivery Fee: ৳${draft.deliveryFee || 0}`,
            `💵 Total Amount: ৳${draft.total || 0}`,
            `💳 Payment Method: ${paymentDisplay}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `👤 Customer Name: ${draft.name || context.customerName || 'Customer'}`,
            `📞 Mobile Number: ${draft.phone || ''}`,
            `📍 Delivery Address: ${draft.address || ''}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `🚚 Your parcel is being processed for fast delivery. Thank you for shopping with us!`
        ].filter(line => line !== '').join('\n')
    }

    const paymentMethodDisplay = (draft.paymentMethod || 'cod').toLowerCase() === 'cod'
        ? 'ক্যাশ অন ডেলিভারি (COD)'
        : (draft.paymentMethod || 'Cash On Delivery')

    return [
        `🎉 অভিনন্দন! আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে।`,
        ``,
        `🧾 অর্ডার রিসিট / মেমো:`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📦 অর্ডার আইডি: #${orderId}`,
        `🛍️ পণ্য: ${productName}`,
        draft.color ? `🎨 কালার: ${draft.color}` : '',
        draft.size ? `📏 সাইজ: ${draft.size}` : '',
        `🔢 পরিমাণ: ${draft.quantity || 1} টি`,
        `💰 পণ্যের মূল্য: ৳${Number(draft.unitPrice || 0) * Number(draft.quantity || 1)}`,
        `🚚 ডেলিভারি চার্জ: ৳${draft.deliveryFee || 0}`,
        `💵 সর্বমোট বিল: ৳${draft.total || 0}`,
        `💳 পেমেন্ট পদ্ধতি: ${paymentMethodDisplay}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 গ্রাহকের নাম: ${draft.name || context.customerName || 'গ্রাহক'}`,
        `📞 মোবাইল নম্বর: ${draft.phone || ''}`,
        `📍 ডেলিভারি ঠিকানা: ${draft.address || ''}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `🚚 আপনার পার্সেলটি দ্রুত ডেলিভারি করার জন্য প্রসেস করা হচ্ছে। আমাদের শপ থেকে কেনাকাটা করার জন্য ধন্যবাদ!`
    ].filter(line => line !== '').join('\n')
}

export function buildPendingPaymentReceipt(context: AgentContext, orderOutput: any): string {
    const lang = context.session.language || 'bn'
    const draft = context.orderDraft || {}
    const product = catalogProduct(context, draft.sku || context.selection.sku)
    const productName = draft.productName || context.selection.productName || product?.name || draft.sku || (lang === 'en' ? 'Product' : 'পণ্য')
    const orderId = orderOutput?.orderId || `CM-${Date.now().toString(36).toUpperCase()}`
    const provider = orderOutput?.paymentProvider || draft.paymentMethod || 'bKash'

    if (lang === 'en') {
        return [
            `🎉 Your order has been placed and is awaiting payment!`,
            ``,
            `🧾 Order Details:`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `📦 Order ID: #${orderId}`,
            `🛍️ Product: ${productName}`,
            draft.color ? `🎨 Color: ${draft.color}` : '',
            draft.size ? `📏 Size: ${draft.size}` : '',
            `🔢 Quantity: ${draft.quantity || 1} pcs`,
            `💵 Total Bill: ৳${draft.total || 0}`,
            `💳 Payment Method: ${String(provider).toUpperCase()}`,
            `━━━━━━━━━━━━━━━━━━━━`,
            `🔗 Secure Payment Link:`,
            `${orderOutput.checkoutUrl}`,
            ``,
            `Once payment is completed, your order will be confirmed immediately. Thank you!`
        ].filter(line => line !== '').join('\n')
    }

    return [
        `🎉 আপনার অর্ডারটি সংরক্ষিত হয়েছে!`,
        ``,
        `🧾 অর্ডারের বিবরণ:`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📦 অর্ডার আইডি: #${orderId}`,
        `🛍️ পণ্য: ${productName}`,
        draft.color ? `🎨 কালার: ${draft.color}` : '',
        draft.size ? `📏 সাইজ: ${draft.size}` : '',
        `🔢 পরিমাণ: ${draft.quantity || 1} টি`,
        `💵 সর্বমোট বিল: ৳${draft.total || 0}`,
        `💳 পেমেন্ট মাধ্যম: ${String(provider).toUpperCase()}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `🔗 নিরাপদ পেমেন্ট লিংক:`,
        `${orderOutput.checkoutUrl}`,
        ``,
        `পেমেন্ট সম্পন্ন হলে আপনার অর্ডারটি চূড়ান্তভাবে কনফার্ম করা হবে। ধন্যবাদ!`
    ].filter(line => line !== '').join('\n')
}

export function collectedDetailsForSave(context: AgentContext, entities: AgentEntities) {
    return {
        ...entities,
        sku: context.orderDraft?.sku || context.selection.sku,
        productName: context.selection.productName,
        color: context.orderDraft?.color || context.selection.color,
        size: context.orderDraft?.size || context.selection.size,
        quantity: context.orderDraft?.quantity || context.selection.quantity || 1,
        name: context.orderDraft?.name,
        phone: context.orderDraft?.phone,
        address: context.orderDraft?.address,
        district: context.orderDraft?.district,
        payment_method: context.orderDraft?.paymentMethod,
        checkout_token: context.session.checkoutToken,
        last_presented_options: context.session.lastPresentedOptions || {},
        last_asked_field: context.session.lastAskedField,
        fallback_count: context.session.fallbackCount || 0,
        previous_selection: context.previousSelection
    }
}

export function shouldRetrieveKnowledge(intent: AgentIntent): boolean {
    return intent === 'PRODUCT_INFO' || intent === 'DELIVERY_QUERY' || intent === 'COMPLAINT' || intent === 'UNKNOWN'
}

function tableRowToLine(line: string): string | null {
    if (!/^\s*\|.*\|\s*$/.test(line)) return line
    if (/^\s*\|?[\s:|-]+\|?\s*$/.test(line)) return null
    const cells = line.split('|').map(cell => cell.trim()).filter(Boolean)
    return cells.length > 0 ? `• ${cells.join(' — ')}` : null
}

export function formatReplyForChannel(text: string, event: IncomingAgentEvent, allowedUrls?: string[]): string {
    const hadImage = event.media?.type === 'image' || /^\[(?:user|customer) sent image:/i.test(event.text || '')
    let output = String(text || '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')

    output = output.split('\n').map(tableRowToLine).filter(Boolean).join('\n')

    if (!hadImage) {
        output = output
            .replace(/আপনার পাঠানো (?:ছবি|ইমেজ)[^।.!?]*(?:[।.!?]|$)/gi, '')
            .replace(/the (?:photo|image) you (?:sent|uploaded)[^.!?]*(?:[.!?]|$)/gi, '')
    }

    // Preserve valid web and knowledge base URLs. If allowedUrls explicitly passed, validate against it.
    if (Array.isArray(allowedUrls) && allowedUrls.length > 0) {
        const allow = new Set(allowedUrls.filter(Boolean))
        output = output.replace(/https?:\/\/[^\s)]+/gi, url => {
            const cleanUrl = url.replace(/[.,]+$/, '')
            return allow.has(cleanUrl) ? url : cleanUrl
        })
    }

    output = output.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim()

    const maxLength = event.channel === 'instagram' || event.channel === 'instagram_comment' || event.channel === 'facebook_comment'
        ? 900
        : (event.channel === 'messenger' ? 1800 : 3500)
    if (output.length > maxLength) output = `${output.slice(0, maxLength - 1).trim()}…`
    return output || 'দুঃখিত, উত্তরটি সম্পূর্ণ করা যায়নি। আপনার তথ্য সংরক্ষিত আছে—একটু পরে আবার চেষ্টা করুন।'
}

export function stateForMissingField(missing: MissingOrderField, current: ConversationState): ConversationState {
    if (missing === 'product') return 'PRODUCT_DISCOVERY'
    if (missing === 'color' || missing === 'size') return 'VARIANT_SELECTION'
    if (missing === 'name') return 'COLLECT_NAME'
    if (missing === 'phone') return 'COLLECT_PHONE'
    if (missing === 'address') return 'COLLECT_ADDRESS'
    if (missing === 'payment') return 'VERIFY_ORDER'
    return current
}
