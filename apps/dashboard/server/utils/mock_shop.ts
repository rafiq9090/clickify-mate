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
    stock_quantity: number
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

    let report = '\n\n[MOCK SHOP REAL-TIME INVENTORY STOCK STATUS]:'
    itemsToReport.forEach(item => {
        const status = item.stock_quantity > 0 
            ? `${item.stock_quantity} in stock` 
            : 'OUT OF STOCK'
        report += `\n- Product: "${item.name}" | Size: "${item.size}" | Color: "${item.color}" | Price: ৳${item.price} | Stock: ${status}`
    })
    
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
            const matchesName = item.name.toLowerCase() === requestedItem.toLowerCase()
            const matchesSize = !requestedSize || item.size.toLowerCase() === requestedSize.toLowerCase()
            const matchesColor = !requestedColor || item.color.toLowerCase() === requestedColor.toLowerCase()
            return matchesName && matchesSize && matchesColor
        })

        if (index === -1) {
            return { success: false, message: `Product "${requestedItem}" (Size: ${requestedSize}, Color: ${requestedColor}) not found in inventory`, deductedPrice: 0 }
        }

        const product = inventory[index]
        if (!product) {
            return { success: false, message: 'Product not found', deductedPrice: 0 }
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

        console.log(`[MOCK SHOP]: Successfully deducted ${requestedQty} units of ${product.name} (New Stock: ${product.stock_quantity})`)
        return { 
            success: true, 
            message: `Successfully reserved ${requestedQty}x ${product.name}`, 
            deductedPrice: product.price * requestedQty 
        }
    } catch (err: any) {
        console.error('[MOCK SHOP EXCEPTION]:', err)
        return { success: false, message: err.message, deductedPrice: 0 }
    }
}
