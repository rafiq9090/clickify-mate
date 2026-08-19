import type { AgentToolDefinition, AgentContext } from './agent_types'
import { checkInventory } from './tools/inventory'
import { getCurrentPrice } from './tools/pricing'
import { calculateDeliveryFee } from './tools/delivery'
import { createOrderSafely } from './tools/orders'
import { verifyPayment } from './tools/payments'
import { getTrackingStatus } from './tools/courier'
import { searchProducts, getProductVariants, resolveProductImagesTool } from './tools/products'
import { getCustomerProfile } from './tools/customer'

export const agentToolRegistry: Record<string, AgentToolDefinition> = {
    check_inventory: {
        name: 'check_inventory',
        description: 'Check real-time stock availability for a specific product SKU, color, and size.',
        parameters: {
            type: 'object',
            properties: {
                sku: { type: 'string', description: 'Product SKU or identifier (e.g. t-shirt-white, premium-winter-hoodie)' },
                color: { type: 'string', description: 'Color requested by customer (e.g. White, Maroon, Red, Sky Blue, Black)' },
                size: { type: 'string', description: 'Size requested (e.g. L, XL, XXL)' },
                quantity: { type: 'number', description: 'Number of pieces (defaults to 1)' }
            }
        },
        isSideEffect: false,
        execute: async (args) => checkInventory(args)
    },

    get_current_price: {
        name: 'get_current_price',
        description: 'Get authoritative current price, bundle discounts (e.g. 10% off on 2, 15% off on 3+), and coupons.',
        parameters: {
            type: 'object',
            properties: {
                sku: { type: 'string', description: 'Product SKU or name' },
                quantity: { type: 'number', description: 'Quantity being ordered' },
                couponCode: { type: 'string', description: 'Optional coupon code (e.g. SAVE10)' }
            }
        },
        isSideEffect: false,
        execute: async (args) => getCurrentPrice(args)
    },

    calculate_delivery_fee: {
        name: 'calculate_delivery_fee',
        description: 'Calculate exact delivery fee (Inside Dhaka ৳80, Outside Dhaka ৳150, Free over ৳1500) and whether advance payment is required.',
        parameters: {
            type: 'object',
            properties: {
                address: { type: 'string', description: 'Customer delivery address' },
                district: { type: 'string', description: 'District or city (e.g. Dhaka, Chittagong, Sylhet, Cumilla)' },
                orderTotal: { type: 'number', description: 'Total value of items' }
            }
        },
        isSideEffect: false,
        execute: async (args) => calculateDeliveryFee(args)
    },

    search_products: {
        name: 'search_products',
        description: 'Search product catalog for matching items, categories, or colors.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search keywords (e.g. hoodie, tshirt, white, maroon)' }
            }
        },
        isSideEffect: false,
        execute: async (args, ctx) => searchProducts({ query: args.query, agentId: ctx?.agentId })
    },

    get_product_variants: {
        name: 'get_product_variants',
        description: 'Get all available color and size variants for a product SKU.',
        parameters: {
            type: 'object',
            properties: {
                sku: { type: 'string', description: 'Product SKU' }
            },
            required: ['sku']
        },
        isSideEffect: false,
        execute: async (args) => getProductVariants(args.sku)
    },

    verify_payment: {
        name: 'verify_payment',
        description: 'Verify a customer bKash/Nagad/Rocket transaction ID for advance delivery charge or full payment.',
        parameters: {
            type: 'object',
            properties: {
                trxId: { type: 'string', description: 'Transaction ID provided by customer (e.g. 2d3xwr934rd)' },
                amount: { type: 'number', description: 'Amount paid (e.g. 150)' },
                method: { type: 'string', description: 'Payment method (bKash, Nagad, Rocket)' }
            },
            required: ['trxId']
        },
        isSideEffect: false,
        execute: async (args) => verifyPayment(args)
    },

    get_tracking_status: {
        name: 'get_tracking_status',
        description: 'Look up live courier tracking status for an order.',
        parameters: {
            type: 'object',
            properties: {
                trackingCode: { type: 'string', description: 'Courier tracking code or invoice ID' }
            },
            required: ['trackingCode']
        },
        isSideEffect: false,
        execute: async (args) => getTrackingStatus(args.trackingCode)
    },

    resolve_product_images: {
        name: 'resolve_product_images',
        description: 'Find official photo URLs for a requested product without leaking images of other products.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Product name or user query' },
                sku: { type: 'string', description: 'Product SKU if known' },
                color: { type: 'string', description: 'Specific color requested' }
            },
            required: ['query']
        },
        isSideEffect: false,
        execute: async (args) => resolveProductImagesTool(args)
    },

    get_customer_profile: {
        name: 'get_customer_profile',
        description: 'Fetch previous order history, name, phone, and address for this customer.',
        parameters: {
            type: 'object',
            properties: {
                customerId: { type: 'string', description: 'Customer unique external ID' }
            }
        },
        isSideEffect: false,
        execute: async (args, ctx) => getCustomerProfile({ customerId: args.customerId || ctx?.customerId || '', agentId: ctx?.agentId })
    },

    create_order: {
        name: 'create_order',
        description: 'Place a confirmed order in the system with stock deduction and courier consignment creation.',
        parameters: {
            type: 'object',
            properties: {
                customerName: { type: 'string', description: 'Customer full name' },
                phone: { type: 'string', description: 'Customer 11-digit phone number' },
                address: { type: 'string', description: 'Full delivery address with district' },
                sku: { type: 'string', description: 'Product SKU' },
                color: { type: 'string', description: 'Selected color' },
                size: { type: 'string', description: 'Selected size' },
                quantity: { type: 'number', description: 'Quantity (default 1)' },
                unitPrice: { type: 'number', description: 'Unit selling price' },
                deliveryFee: { type: 'number', description: 'Delivery fee' },
                total: { type: 'number', description: 'Grand total amount' },
                trxId: { type: 'string', description: 'Advance payment Transaction ID if outside Dhaka' }
            },
            required: ['customerName', 'phone', 'address', 'sku', 'total']
        },
        isSideEffect: true,
        execute: async (args, ctx) => {
            const draft = {
                agentId: ctx?.agentId || '',
                customerId: ctx?.customerId || '',
                customerName: args.customerName,
                phone: args.phone,
                address: args.address,
                sku: args.sku,
                color: args.color,
                size: args.size,
                quantity: args.quantity || 1,
                unitPrice: args.unitPrice || 1000,
                deliveryFee: args.deliveryFee || 80,
                total: args.total || 1080,
                trxId: args.trxId,
                platform: ctx?.channel,
                checkoutToken: ctx?.session?.checkoutToken
            }
            return createOrderSafely(draft)
        }
    }
}

export function getAllToolDefinitions(): AgentToolDefinition[] {
    return Object.values(agentToolRegistry)
}

export async function executeToolSafely(
    name: string,
    args: Record<string, any>,
    context?: AgentContext
): Promise<{ success: boolean; data?: any; error?: string }> {
    const tool = agentToolRegistry[name]
    if (!tool) {
        return { success: false, error: `Tool "${name}" not found in registry.` }
    }

    try {
        const result = await tool.execute(args, context)
        return { success: true, data: result }
    } catch (err: any) {
        console.error(`[TOOL EXECUTION ERROR] (${name}):`, err)
        return { success: false, error: err.message || 'Tool execution failed' }
    }
}
