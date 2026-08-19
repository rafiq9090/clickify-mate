import { getMockInventory, saveMockInventory } from '../../mock_shop'

export interface InventoryCheckResult {
    available: boolean
    sku: string
    productName: string
    color?: string
    size?: string
    requestedQuantity: number
    availableQuantity: number
    alternativeVariants?: Array<{
        color?: string
        size?: string
        stock: number
    }>
    message: string
}

export async function checkInventory(args: {
    sku?: string
    color?: string
    size?: string
    quantity?: number
}): Promise<InventoryCheckResult> {
    const catalog = getMockInventory()
    const requestedQty = Math.max(1, args.quantity || 1)
    const targetSku = (args.sku || '').toLowerCase().trim()
    const targetColor = (args.color || '').toLowerCase().trim()
    const targetSize = (args.size || '').toLowerCase().trim()

    // Find product by SKU or name
    const product = catalog.find((p: any) =>
        (p.sku && p.sku.toLowerCase() === targetSku) ||
        (p.name && p.name.toLowerCase().includes(targetSku)) ||
        (targetColor && p.name && p.name.toLowerCase().includes(targetColor))
    ) || catalog[0]

    if (!product) {
        return {
            available: false,
            sku: args.sku || 'unknown',
            productName: 'Product not found',
            requestedQuantity: requestedQty,
            availableQuantity: 0,
            message: 'Product not found in catalog.'
        }
    }

    const availableVariants: Array<{ color?: string; size?: string; stock: number }> = []

    // If product has detailed variant images array
    if (Array.isArray(product.images) && product.images.length > 0) {
        for (const img of product.images) {
            const vColor = (img.color || '').toLowerCase().trim()
            const vSize = (img.size || '').toLowerCase().trim()
            const vStock = typeof img.quantity === 'number' ? img.quantity : (product.stock_quantity || 0)

            availableVariants.push({
                color: img.color || 'Standard',
                size: img.size || 'Free Size',
                stock: vStock
            })

            const colorMatch = !targetColor || vColor.includes(targetColor) || targetColor.includes(vColor)
            const sizeMatch = !targetSize || vSize.includes(targetSize) || targetSize.includes(vSize)

            if (colorMatch && sizeMatch) {
                const isAvail = vStock >= requestedQty
                return {
                    available: isAvail,
                    sku: product.sku,
                    productName: product.name,
                    color: img.color,
                    size: img.size,
                    requestedQuantity: requestedQty,
                    availableQuantity: vStock,
                    alternativeVariants: availableVariants.filter(v => v.stock > 0),
                    message: isAvail
                        ? `In stock: ${vStock} pcs available for ${product.name} (${img.color} - ${img.size}).`
                        : `Insufficient stock: Only ${vStock} pcs available for ${img.color} - ${img.size}.`
                }
            }
        }
    }

    // Default product-level stock check
    const totalStock = product.stock_quantity ?? 10
    const isAvail = totalStock >= requestedQty

    return {
        available: isAvail,
        sku: product.sku,
        productName: product.name,
        color: args.color,
        size: args.size,
        requestedQuantity: requestedQty,
        availableQuantity: totalStock,
        alternativeVariants: availableVariants,
        message: isAvail
            ? `In stock: ${totalStock} pcs available for ${product.name}.`
            : `Out of stock: Only ${totalStock} pcs remaining.`
    }
}

export async function deductInventoryStock(args: {
    sku: string
    color?: string
    size?: string
    quantity: number
}): Promise<{ success: boolean; newStock: number; message: string }> {
    const catalog = getMockInventory()
    const targetSku = (args.sku || '').toLowerCase().trim()
    const targetColor = (args.color || '').toLowerCase().trim()
    const qtyToDeduct = Math.max(1, args.quantity || 1)

    const product = catalog.find((p: any) =>
        (p.sku && p.sku.toLowerCase() === targetSku) ||
        (p.name && p.name.toLowerCase().includes(targetSku))
    )

    if (!product) {
        return { success: false, newStock: 0, message: 'Product not found' }
    }

    let deducted = false
    let currentStock = product.stock_quantity || 0

    if (Array.isArray(product.images)) {
        for (const img of product.images) {
            const vColor = (img.color || '').toLowerCase().trim()
            if (!targetColor || vColor.includes(targetColor) || targetColor.includes(vColor)) {
                if (typeof img.quantity === 'number') {
                    img.quantity = Math.max(0, img.quantity - qtyToDeduct)
                    currentStock = img.quantity
                    deducted = true
                    break
                }
            }
        }
    }

    if (!deducted) {
        product.stock_quantity = Math.max(0, (product.stock_quantity || 10) - qtyToDeduct)
        currentStock = product.stock_quantity
    }

    saveMockInventory(catalog)

    return {
        success: true,
        newStock: currentStock,
        message: `Successfully deducted ${qtyToDeduct} pcs from inventory.`
    }
}
