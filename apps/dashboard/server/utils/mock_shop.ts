import fs from 'fs'
import path from 'path'

const filePath = path.resolve(process.cwd(), 'server/data/mock_inventory.json')

export interface MockProduct {
    id: string
    name: string
    sku: string
    size: string
    color: string
    price: number
    regular_price?: number
    stock_quantity: number
    image?: string
    images?: Array<{ 
        role: string
        url: string
        color?: string
        size?: string
        quantity?: number
        price?: number
    }>
    assigned_agent?: string
}

// Read from JSON file
export function getMockInventory(): MockProduct[] {
    try {
        if (!fs.existsSync(filePath)) return []
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (err) {
        console.error('[MOCK SHOP ERROR]: Failed to read mock inventory:', err)
        return []
    }
}

// Write to JSON file
export function saveMockInventory(inventory: MockProduct[]) {
    try {
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(filePath, JSON.stringify(inventory, null, 2), 'utf8')
    } catch (err) {
        console.error('[MOCK SHOP ERROR]: Failed to save mock inventory:', err)
    }
}

// Find stock status of matching items (supports Shopify, WooCommerce, and Mock Demo)
export async function checkMockStockForPrompt(userText: string, behavior?: any): Promise<string> {
    if (behavior && behavior.shop_type && behavior.shop_type !== 'mock') {
        const shopType = behavior.shop_type
        const apiUrl = behavior.shop_api_url
        const apiKey = behavior.shop_api_key
        const apiSecret = behavior.shop_api_secret

        if (!apiUrl || !apiKey) {
            return '\n\n[INVENTORY SYSTEM NOTICE]: Shop Integration is selected but not configured properly (Missing API URL or Access Token).'
        }

        const searchTerms = userText.trim()

        if (shopType === 'woocommerce') {
            try {
                let formattedUrl = apiUrl.replace(/\/$/, '')
                if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                    formattedUrl = 'https://' + formattedUrl
                }
                
                const auth = Buffer.from(`${apiKey}:${apiSecret || ''}`).toString('base64')
                
                console.log(`[WC SHOP INVENTORY]: Querying WooCommerce store for: "${searchTerms}"`)
                const products: any = await $fetch(`${formattedUrl}/wp-json/wc/v3/products`, {
                    params: { search: searchTerms, per_page: 5 },
                    headers: {
                        Authorization: `Basic ${auth}`
                    },
                    timeout: 5000
                })

                if (!Array.isArray(products) || products.length === 0) {
                    return `\n\n[WOOCOMMERCE REAL-TIME INVENTORY]: No matching products found for query "${searchTerms}".`
                }

                let report = '\n\n[WOOCOMMERCE REAL-TIME INVENTORY STOCK STATUS]:'
                products.forEach((prod: any) => {
                    const stockStatus = prod.manage_stock 
                        ? (prod.stock_quantity > 0 ? `${prod.stock_quantity} in stock` : 'OUT OF STOCK')
                        : (prod.stock_status === 'instock' ? 'In Stock (unmanaged)' : 'OUT OF STOCK')
                    report += `\n- Product: "${prod.name}" | Price: ৳${prod.price} | Stock: ${stockStatus}`
                })
                return report
            } catch (err: any) {
                console.error('[WC SHOP INVENTORY ERROR]:', err.message)
                return `\n\n[WOOCOMMERCE INVENTORY ERROR]: Failed to fetch stock from store (${err.message}). Falling back to local mock inventory.`
            }
        }

        if (shopType === 'shopify') {
            try {
                let formattedUrl = apiUrl.replace(/\/$/, '')
                if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                    formattedUrl = 'https://' + formattedUrl
                }
                if (!formattedUrl.includes('.myshopify.com') && !formattedUrl.includes('myshopify.com')) {
                    formattedUrl = `https://${apiUrl}.myshopify.com`
                }

                console.log(`[SHOPIFY SHOP INVENTORY]: Querying Shopify store for: "${searchTerms}"`)
                const res: any = await $fetch(`${formattedUrl}/admin/api/2024-04/products.json`, {
                    params: { title: searchTerms, limit: 5 },
                    headers: {
                        'X-Shopify-Access-Token': apiKey
                    },
                    timeout: 5000
                })

                const products = res?.products || []
                if (!Array.isArray(products) || products.length === 0) {
                    return `\n\n[SHOPIFY REAL-TIME INVENTORY]: No matching products found for query "${searchTerms}".`
                }

                let report = '\n\n[SHOPIFY REAL-TIME INVENTORY STOCK STATUS]:'
                products.forEach((prod: any) => {
                    prod.variants?.forEach((variant: any) => {
                        const stockStatus = variant.inventory_quantity !== undefined
                            ? (variant.inventory_quantity > 0 ? `${variant.inventory_quantity} in stock` : 'OUT OF STOCK')
                            : 'In Stock'
                        report += `\n- Product: "${prod.title} - ${variant.title}" | Price: ৳${variant.price} | Stock: ${stockStatus}`
                    })
                })
                return report
            } catch (err: any) {
                console.error('[SHOPIFY SHOP INVENTORY ERROR]:', err.message)
                return `\n\n[SHOPIFY INVENTORY ERROR]: Failed to fetch stock from store (${err.message}). Falling back to local mock inventory.`
            }
        }

        if (shopType === 'custom') {
            try {
                let formattedUrl = apiUrl.replace(/\/$/, '')
                if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                    formattedUrl = 'https://' + formattedUrl
                }

                console.log(`[CUSTOM SHOP INVENTORY]: Querying Custom API: "${formattedUrl}/inventory" for: "${searchTerms}"`)
                const res: any = await $fetch(`${formattedUrl}/inventory`, {
                    params: { query: searchTerms },
                    headers: {
                        Authorization: `Bearer ${apiKey}`
                    },
                    timeout: 5000
                })

                const products = res?.products || (Array.isArray(res) ? res : [])
                if (!Array.isArray(products) || products.length === 0) {
                    return `\n\n[CUSTOM REAL-TIME INVENTORY]: No matching products found for query "${searchTerms}".`
                }

                let report = '\n\n[CUSTOM REAL-TIME INVENTORY STOCK STATUS]:'
                products.forEach((prod: any) => {
                    const name = prod.name || prod.title || 'Product'
                    const price = prod.price || 0
                    const stockVal = prod.stock !== undefined ? prod.stock : (prod.stock_quantity !== undefined ? prod.stock_quantity : 'In Stock')
                    const stockStatus = typeof stockVal === 'number'
                        ? (stockVal > 0 ? `${stockVal} in stock` : 'OUT OF STOCK')
                        : stockVal
                    report += `\n- Product: "${name}" | Price: ৳${price} | Stock: ${stockStatus}`
                })
                return report
            } catch (err: any) {
                console.error('[CUSTOM SHOP INVENTORY ERROR]:', err.message)
                return `\n\n[CUSTOM INVENTORY ERROR]: Failed to fetch stock from custom API (${err.message}). Falling back to local mock inventory.`
            }
        }
    }

    // Default local Mock Shop inventory fallback
    const text = userText.toLowerCase()
    const inventory = getMockInventory()
    
    // Find matching items
    const matches = inventory.filter(item => {
        const nameMatch = text.includes(item.name.toLowerCase())
        const skuMatch = text.includes(item.sku.toLowerCase())
        const colorMatch = text.includes(item.color.toLowerCase())
        const sizeMatch = text.includes(`size ${item.size.toLowerCase()}`) || text.includes(` ${item.size.toLowerCase()}`) || text.includes(`-${item.size.toLowerCase()}`)
        
        return nameMatch || skuMatch || (colorMatch && nameMatch)
    })

    const itemsToReport = matches.length > 0 ? matches : inventory

    let report = '\n\n[MOCK SHOP REAL-TIME INVENTORY STOCK STATUS - ABSOLUTE TRUTH]:'
    itemsToReport.forEach(item => {
        const totalStatus = item.stock_quantity > 0 
            ? `${item.stock_quantity} total in stock` 
            : 'OUT OF STOCK'
        
        let variantsBreakdown = ''
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
            const variantSummaries = item.images
                .filter(img => img.color || img.quantity !== undefined || img.size)
                .map(img => {
                    const c = img.color || 'Standard'
                    const s = img.size || item.size || 'Standard'
                    const q = img.quantity !== undefined ? `${img.quantity} in stock` : (item.stock_quantity > 0 ? `${item.stock_quantity} in stock` : '0 in stock')
                    return `${c} (Size: ${s}, Stock: ${q})`
                })
            if (variantSummaries.length > 0) {
                variantsBreakdown = ` | Specific Variants Breakdown: [${variantSummaries.join('; ')}]`
            }
        }

        report += `\n- Product: "${item.name}" | SKU: "${item.sku}" | Available Sizes: "${item.size}" | Price: ৳${item.price} | Total Stock: ${totalStatus}${variantsBreakdown}`
    })
    report += `\n(CRITICAL INVENTORY RULE: You MUST check the specific variant stock above BEFORE asking for advance delivery payment or confirming any order. If a requested variant has limited stock (e.g. requested 2, but only 1 available in that color/size) or if the requested size is not available in that color, immediately inform the customer about the exact availability and offer available alternatives).`
    
    return report
}

// Parse Order Data from AI Tag: [ORDER_DATA: Item: Blue T-Shirt | Qty: 1 | Name: Rafiq | Phone: 01700 | Address: Dhaka]
export function parseOrderString(orderInfo: string): Record<string, string> {
    const parts = orderInfo.split('|')
    const result: Record<string, string> = {}
    
    parts.forEach(part => {
        const separatorIndex = part.indexOf(':')
        if (separatorIndex !== -1) {
            const key = part.slice(0, separatorIndex).trim()
            const val = part.slice(separatorIndex + 1).trim()
            result[key] = val
        }
    })
    
    return result
}

// Process order and deduct stock (supports Shopify, WooCommerce, and Mock Demo)
export async function processMockOrderStockDeduction(orderInfo: string, behavior?: any): Promise<{ success: boolean; message: string; deductedPrice: number }> {
    if (behavior && behavior.shop_type && behavior.shop_type !== 'mock') {
        const shopType = behavior.shop_type
        const apiUrl = behavior.shop_api_url
        const apiKey = behavior.shop_api_key
        const apiSecret = behavior.shop_api_secret

        if (!apiUrl || !apiKey) {
            return { success: false, message: 'Shop Integration is selected but not configured properly (Missing API URL or Key).', deductedPrice: 0 }
        }

        try {
            const parsed = parseOrderString(orderInfo)
            const requestedItem = parsed.Item || ''
            const requestedQty = parseInt(parsed.Qty || '1')
            const customerName = parsed.Name || 'Anonymous Customer'
            const customerPhone = parsed.Phone || ''
            const customerAddress = parsed.Address || ''

            if (shopType === 'woocommerce') {
                let formattedUrl = apiUrl.replace(/\/$/, '')
                if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                    formattedUrl = 'https://' + formattedUrl
                }
                const auth = Buffer.from(`${apiKey}:${apiSecret || ''}`).toString('base64')

                console.log(`[WC ORDER CREATION]: Searching for product "${requestedItem}"`)
                const products: any = await $fetch(`${formattedUrl}/wp-json/wc/v3/products`, {
                    params: { search: requestedItem, per_page: 1 },
                    headers: { Authorization: `Basic ${auth}` },
                    timeout: 5000
                })

                const product = Array.isArray(products) && products.length > 0 ? products[0] : null
                if (!product) {
                    return { success: false, message: `Product "${requestedItem}" not found on WooCommerce store`, deductedPrice: 0 }
                }

                console.log(`[WC ORDER CREATION]: Creating WooCommerce order for product ID ${product.id}`)
                const orderData = {
                    payment_method: 'cod',
                    payment_method_title: 'Cash on Delivery',
                    set_paid: false,
                    billing: {
                        first_name: customerName,
                        phone: customerPhone,
                        address_1: customerAddress
                    },
                    shipping: {
                        first_name: customerName,
                        address_1: customerAddress
                    },
                    line_items: [
                        {
                            product_id: product.id,
                            quantity: requestedQty
                        }
                    ]
                }

                const response: any = await $fetch(`${formattedUrl}/wp-json/wc/v3/orders`, {
                    method: 'POST',
                    body: orderData,
                    headers: { Authorization: `Basic ${auth}` },
                    timeout: 5000
                })

                return {
                    success: true,
                    message: `WooCommerce Order #${response.id} created successfully. Stock synced!`,
                    deductedPrice: parseFloat(response.total || '0')
                }
            }

            if (shopType === 'shopify') {
                let formattedUrl = apiUrl.replace(/\/$/, '')
                if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                    formattedUrl = 'https://' + formattedUrl
                }
                if (!formattedUrl.includes('.myshopify.com') && !formattedUrl.includes('myshopify.com')) {
                    formattedUrl = `https://${apiUrl}.myshopify.com`
                }

                console.log(`[SHOPIFY ORDER CREATION]: Searching for product "${requestedItem}"`)
                const res: any = await $fetch(`${formattedUrl}/admin/api/2024-04/products.json`, {
                    params: { title: requestedItem, limit: 1 },
                    headers: { 'X-Shopify-Access-Token': apiKey },
                    timeout: 5000
                })

                const products = res?.products || []
                const product = products.length > 0 ? products[0] : null
                if (!product) {
                    return { success: false, message: `Product "${requestedItem}" not found on Shopify store`, deductedPrice: 0 }
                }

                const variant = product.variants?.[0]
                if (!variant) {
                    return { success: false, message: `No variants found for product "${requestedItem}"`, deductedPrice: 0 }
                }

                console.log(`[SHOPIFY ORDER CREATION]: Creating Shopify order for variant ID ${variant.id}`)
                const orderData = {
                    order: {
                        line_items: [
                            {
                                variant_id: variant.id,
                                quantity: requestedQty
                            }
                        ],
                        customer: {
                            first_name: customerName,
                            phone: customerPhone
                        },
                        shipping_address: {
                            first_name: customerName,
                            address1: customerAddress,
                            phone: customerPhone
                        },
                        financial_status: 'pending',
                        inventory_behavior: 'decrement_ignoring_policy'
                    }
                }

                const response: any = await $fetch(`${formattedUrl}/admin/api/2024-04/orders.json`, {
                    method: 'POST',
                    body: orderData,
                    headers: { 'X-Shopify-Access-Token': apiKey },
                    timeout: 5000
                })

                const order = response?.order
                return {
                    success: true,
                    message: `Shopify Order #${order?.order_number || order?.id} created successfully. Stock synced!`,
                    deductedPrice: parseFloat(order?.total_price || '0')
                }
            }

            if (shopType === 'custom') {
                let formattedUrl = apiUrl.replace(/\/$/, '')
                if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                    formattedUrl = 'https://' + formattedUrl
                }

                console.log(`[CUSTOM ORDER CREATION]: Submitting order to Custom API: "${formattedUrl}/orders"`)
                const orderData = {
                    item: requestedItem,
                    qty: requestedQty,
                    customer: {
                        name: customerName,
                        phone: customerPhone,
                        address: customerAddress
                    },
                    payment_method: parsed.PaymentMethod || 'cod',
                    payment_transaction_id: parsed.PaymentTransactionId || ''
                }

                const response: any = await $fetch(`${formattedUrl}/orders`, {
                    method: 'POST',
                    body: orderData,
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                })

                const orderId = response?.order_id || response?.id || 'N/A'
                const totalPrice = parseFloat(response?.total_price || response?.total || '0')

                return {
                    success: true,
                    message: `Custom API Order #${orderId} created successfully. Stock synced!`,
                    deductedPrice: totalPrice
                }
            }
        } catch (err: any) {
            console.error('[EXTERNAL ORDER CREATION ERROR]:', err.message)
            return { success: false, message: `External order creation failed: ${err.message}. Using mock fallback.`, deductedPrice: 0 }
        }
    }

    // Local Mock Shop Order Deduction
    try {
        const parsed = parseOrderString(orderInfo)
        const requestedItem = parsed.Item || ''
        const requestedQty = parseInt(parsed.Qty || '1')
        const requestedSize = parsed.Size || ''
        const requestedColor = parsed.Color || ''

        if (!requestedItem) {
            return { success: false, message: 'Item name not found in order data', deductedPrice: 0 }
        }

        const inventory = getMockInventory()
        const index = inventory.findIndex(item => {
            const matchesName = item.name.toLowerCase() === requestedItem.toLowerCase() || item.sku.toLowerCase() === requestedItem.toLowerCase()
            
            // Size match: exact, part of slash/comma list (e.g. "L/XL" matches "L"), or variant image size
            const itemSizes = (item.size || '').toLowerCase().split(/[\/,\s]+/).map(s => s.trim()).filter(Boolean)
            const imgSizes = (item.images || []).map(img => (img.size || '').trim().toLowerCase()).filter(Boolean)
            const matchesSize = !requestedSize || (item.size || '').toLowerCase() === requestedSize.toLowerCase() || itemSizes.includes(requestedSize.toLowerCase()) || imgSizes.includes(requestedSize.toLowerCase())
            
            // Color match: top-level color or any image variant color
            const imgColors = (item.images || []).map(img => (img.color || '').trim().toLowerCase()).filter(Boolean)
            const matchesColor = !requestedColor || (item.color || '').toLowerCase() === requestedColor.toLowerCase() || imgColors.includes(requestedColor.toLowerCase())
            
            return matchesName && matchesSize && matchesColor
        })

        if (index === -1) {
            return { success: false, message: `Product "${requestedItem}" (Size: ${requestedSize || 'N/A'}, Color: ${requestedColor || 'N/A'}) not found in inventory`, deductedPrice: 0 }
        }

        const product = inventory[index]
        if (!product) {
            return { success: false, message: 'Product not found', deductedPrice: 0 }
        }

        // Check if there is a specific variant image matching color and/or size
        let matchedVariantImg = null
        if (product.images && product.images.length > 0) {
            if (requestedColor && requestedSize) {
                matchedVariantImg = product.images.find(img => 
                    (img.color || '').trim().toLowerCase() === requestedColor.toLowerCase() && 
                    (!img.size || (img.size || '').trim().toLowerCase() === requestedSize.toLowerCase())
                )
            }
            if (!matchedVariantImg && requestedColor) {
                matchedVariantImg = product.images.find(img => (img.color || '').trim().toLowerCase() === requestedColor.toLowerCase())
            }
        }

        if (matchedVariantImg && typeof matchedVariantImg.quantity === 'number') {
            if (matchedVariantImg.quantity < requestedQty) {
                return {
                    success: false,
                    message: `Insufficient stock for color "${requestedColor}". Requested: ${requestedQty}, Available: ${matchedVariantImg.quantity}`,
                    deductedPrice: 0
                }
            }
            matchedVariantImg.quantity -= requestedQty
        }

        if (product.stock_quantity < requestedQty) {
            return { 
                success: false, 
                message: `Insufficient stock. Requested: ${requestedQty}, Available: ${product.stock_quantity}`, 
                deductedPrice: 0 
            }
        }

        product.stock_quantity -= requestedQty
        saveMockInventory(inventory)

        const finalItemPrice = (matchedVariantImg && typeof matchedVariantImg.price === 'number' && matchedVariantImg.price > 0) ? matchedVariantImg.price : product.price
        console.log(`[MOCK SHOP]: Successfully deducted ${requestedQty} units of ${product.name} (New Stock: ${product.stock_quantity})`)
        return { 
            success: true, 
            message: `Successfully reserved ${requestedQty}x ${product.name}${requestedColor ? ` (${requestedColor})` : ''}`, 
            deductedPrice: finalItemPrice * requestedQty 
        }
    } catch (err: any) {
        console.error('[MOCK SHOP EXCEPTION]:', err)
        return { success: false, message: err.message, deductedPrice: 0 }
    }
}

// Unified, accurate, and intelligent product image resolver
export function resolveIntelligentProductImages(
    allImagesInput: any,
    userTextInput: any = '',
    aiReplyInput: any = '',
    sessionState?: any,
    requestedIdentifiers: string[] = []
): string[] {
    let allImages = allImagesInput
    let userText = typeof userTextInput === 'string' ? userTextInput : ''
    let aiReply = typeof aiReplyInput === 'string' ? aiReplyInput : ''

    // Handle polymorphic parameter order: (queryStr, catalogArray)
    if (typeof allImagesInput === 'string' && Array.isArray(userTextInput)) {
        userText = allImagesInput
        allImages = userTextInput
    }

    if (!allImages || !Array.isArray(allImages) || allImages.length === 0) return []

    // Flatten if passed catalog products instead of raw image objects
    const flattenedImages: any[] = []
    for (const item of allImages) {
        if (item.url && typeof item.url === 'string') {
            flattenedImages.push(item)
        } else if (Array.isArray(item.images)) {
            for (const subImg of item.images) {
                if (subImg.url) {
                    flattenedImages.push({
                        ...subImg,
                        sku: subImg.sku || item.sku,
                        name: subImg.name || item.name,
                        id: subImg.id || item.id
                    })
                }
            }
        } else if (item.image && typeof item.image === 'string') {
            flattenedImages.push({
                sku: item.sku,
                name: item.name,
                id: item.id,
                url: item.image,
                role: 'hero'
            })
        }
    }

    if (flattenedImages.length === 0) return []

    const u = (userText || '').toLowerCase()
    const r = (aiReply || '').toLowerCase()
    const sessProd = (sessionState?.collected_details?.product || sessionState?.collected_details?.item || '').toLowerCase()

    // 1. Group images by unique product
    const productMap = new Map<string, { key: string; id: string; sku: string; name: string; images: any[] }>()
    for (const img of flattenedImages) {
        const prodKey = (img.sku || img.name || img.id || 'default').toLowerCase()
        if (!productMap.has(prodKey)) {
            productMap.set(prodKey, {
                key: prodKey,
                id: (img.id || '').toLowerCase(),
                sku: (img.sku || '').toLowerCase(),
                name: (img.name || '').toLowerCase(),
                images: []
            })
        }
        productMap.get(prodKey)!.images.push(img)
    }

    const allProducts = Array.from(productMap.values())

    // 2. Identify target product(s) from context
    let targetProducts: typeof allProducts = []

    // Priority A: Explicit LLM identifiers (e.g. [SEND_IMAGES: premium-winter-hoodie])
    if (requestedIdentifiers.length > 0) {
        targetProducts = allProducts.filter(p => 
            requestedIdentifiers.some(id => 
                p.sku === id || p.sku.includes(id) || id.includes(p.sku) ||
                p.id === id || p.id.includes(id) || id.includes(p.id) ||
                p.name.includes(id) || id.includes(p.name)
            )
        )
    }

    // Priority B: Product name, SKU, or keywords mentioned in user's CURRENT message
    if (targetProducts.length === 0 && u) {
        targetProducts = allProducts.filter(p => {
            if (p.sku && u.includes(p.sku)) return true
            if (p.name && u.includes(p.name)) return true
            // Match significant product keywords (>= 3 chars, e.g. "hoodie", "t-shirt", "shirt", "pant", "jacket")
            const keywords = p.name.split(/[\s-_]+/).filter(w => w.length >= 3 && !['and', 'for', 'the', 'new', 'men', 'women'].includes(w))
            return keywords.some(k => u.includes(k))
        })
    }

    // Priority C: Product name, SKU, or keywords mentioned in AI reply
    if (targetProducts.length === 0 && r) {
        targetProducts = allProducts.filter(p => {
            if (p.sku && r.includes(p.sku)) return true
            if (p.name && r.includes(p.name)) return true
            const keywords = p.name.split(/[\s-_]+/).filter(w => w.length >= 3 && !['and', 'for', 'the', 'new', 'men', 'women'].includes(w))
            return keywords.some(k => r.includes(k))
        })
    }

    // Priority D: Active product in session state
    if (targetProducts.length === 0 && sessProd) {
        targetProducts = allProducts.filter(p => 
            p.sku === sessProd || p.name === sessProd || p.name.includes(sessProd) || sessProd.includes(p.name)
        )
    }

    // Candidate pool is strictly isolated to target product(s) if identified
    let candidatePool = targetProducts.length > 0
        ? targetProducts.flatMap(p => p.images)
        : allImages

    // 3. Check for specific color/variant requested in user's CURRENT message
    const catalogColors = Array.from(new Set(candidatePool.map(img => (img.color || '').trim().toLowerCase()).filter(Boolean)))
    
    const colorSynonyms: Record<string, string[]> = {
        'black and white': ['black and white', 'black & white', 'black white', 'shada kalo', 'সাদা কালো', 'কালো সাদা', 'bw', 'b&w'],
        'sky blue': ['sky blue', 'sky', 'light blue', 'akashi', 'আকাশি'],
        'navy blue': ['navy blue', 'navy', 'nevi', 'dark blue', 'নেভি'],
        'maroon': ['maroon', 'maeon', 'merun', 'marun', 'meron', 'মারুন', 'খয়েরি', 'burgundy'],
        'red': ['red', 'lal', 'লাল', 'crimson'],
        'white': ['white', 'wht', 'shada', 'সাদা', 'off-white'],
        'black': ['black', 'blk', 'kalo', 'কালো'],
        'blue': ['blue', 'nil', 'নীল'],
        'green': ['green', 'olive', 'shobuj', 'সবুজ'],
        'yellow': ['yellow', 'holud', 'হলুদ', 'mustard'],
        'pink': ['pink', 'golapi', 'গোলাপি', 'rose'],
        'grey': ['grey', 'gray', 'ash', 'অ্যাশ', 'ধূসর'],
        'beige': ['beige', 'khaki', 'খাকি']
    }

    // Sort color keys descending by length so compound names match before single words
    const allColorKeys = Array.from(new Set([...catalogColors, ...Object.keys(colorSynonyms)]))
        .sort((a, b) => b.length - a.length)

    let detectedColor = ''
    for (const key of allColorKeys) {
        const synonyms = colorSynonyms[key] || [key]
        const allTerms = [key, ...synonyms]
        if (allTerms.some(term => u.includes(term))) {
            detectedColor = key
            break
        }
    }

    // Check if user specifically requested "ALL" photos
    const isAskingAll = /(all|shob|সব|both|each|collection|every|full|সবগুলো|সবগুলা|সব ছবি|সবগুলো ছবি|সম্পূর্ণ)/i.test(u)

    if (detectedColor) {
        const matched = candidatePool.filter(img => {
            const c = (img.color || '').toLowerCase()
            const synonyms = colorSynonyms[detectedColor] || [detectedColor]
            return c === detectedColor || synonyms.some(syn => c === syn || (c && syn && (c.includes(syn) || syn.includes(c))))
        })
        if (matched.length > 0) {
            console.log(`[RESOLVE PRODUCT IMAGES]: Exact color match found for "${detectedColor}" (${matched.length} photo(s))`)
            const limit = isAskingAll ? 10 : 3
            return matched.slice(0, limit).map(img => img.url)
        }
    }

    // 4. Check for specific angle / view requested in userText
    if (/(back|behind|rear|pechon|pichon|পিছনের|পিছন)/i.test(u)) {
        const match = candidatePool.find(img => img.role === 'back')
        if (match) return [match.url]
    }
    if (/(front|samne|samner|সামনের|সামনে)/i.test(u)) {
        const match = candidatePool.find(img => img.role === 'hero')
        if (match) return [match.url]
    }
    if (/(chart|size|measurement|মাপ|সাইজ)/i.test(u)) {
        const match = candidatePool.find(img => img.role === 'chart')
        if (match) return [match.url]
    }
    if (/(detail|fabric|material|close|কাপড়|ফেব্রিক)/i.test(u)) {
        const match = candidatePool.find(img => img.role === 'detail')
        if (match) return [match.url]
    }
    if (/(model|wearing|worn|পরা|মডেল)/i.test(u)) {
        const match = candidatePool.find(img => img.role === 'model')
        if (match) return [match.url]
    }

    // 5. Check if user asked for "ALL" photos (Deliver all available images up to album max limit 10)
    if (isAskingAll) {
        console.log(`[RESOLVE PRODUCT IMAGES]: User requested ALL photos. Delivering all ${candidatePool.length} available photos.`)
        return candidatePool.slice(0, 10).map(img => img.url)
    }

    // 6. Check if user asked for "ANOTHER" / "NEXT" / "MORE" / "DIFFERENT" / "ONNO" / "ARO" image
    if (/(another|next|more|different|onno|অন্য|aro|আর|আরেক|arekt|2nd|second|other)/i.test(u)) {
        if (candidatePool.length > 1) {
            const secondImg = candidatePool[1] || candidatePool.find(img => img.role !== 'hero')
            if (secondImg) return [secondImg.url]
        }
    }

    // 7. Check sessionState for pre-selected color in active order
    if (sessionState?.collected_details?.color) {
        const sessCol = (sessionState.collected_details.color || '').toLowerCase()
        const matched = candidatePool.filter(img => (img.color || '').toLowerCase().includes(sessCol))
        if (matched.length > 0) return matched.slice(0, 3).map(img => img.url)
    }

    // 8. General product overview (Curated Power Trio: distinct colors/roles within target product)
    const distinctList: any[] = []
    const seenPointers = new Set<string>()

    for (const img of candidatePool) {
        const key = (img.color || img.role || img.url).toLowerCase()
        if (!seenPointers.has(key)) {
            seenPointers.add(key)
            distinctList.push(img)
        }
        if (distinctList.length >= 3) break
    }

    if (distinctList.length > 0) {
        return distinctList.map(img => img.url)
    }

    return candidatePool.slice(0, 3).map(img => img.url)
}
