import { getMockInventory } from '../../mock_shop'

export interface PriceCalculationResult {
    sku: string
    productName: string
    unitRegularPrice: number
    unitPrice: number
    quantity: number
    subtotal: number
    discountAmount: number
    discountPercent: number
    appliedOffer?: string
    couponNote?: string
    explanation: string
    finalItemTotal: number
    currency: string
}

export async function getCurrentPrice(args: {
    sku?: string
    quantity?: number
    couponCode?: string
}): Promise<PriceCalculationResult> {
    const catalog = getMockInventory()
    const targetSku = (args.sku || '').toLowerCase().trim()
    const quantity = Math.max(1, args.quantity || 1)

    const product = catalog.find((p: any) =>
        (p.sku && p.sku.toLowerCase() === targetSku) ||
        (p.name && p.name.toLowerCase().includes(targetSku))
    ) || catalog[0]

    const unitRegularPrice = product?.regular_price || product?.price || 1200
    const unitOfferPrice = product?.price || 1000
    const rawSubtotal = unitOfferPrice * quantity

    let discountPercent = 0
    let appliedOffer = ''

    // 1. Standard volume bundle discounts
    if (quantity >= 3) {
        discountPercent = 15
        appliedOffer = '15% Volume Bundle Discount (3+ items)'
    } else if (quantity === 2) {
        discountPercent = 10
        appliedOffer = '10% Pair Discount (2 items)'
    }

    // 2. Coupon check with clear stacking explanation
    let couponNote = ''
    if (args.couponCode) {
        const code = args.couponCode.toUpperCase().trim()
        if (code === 'SAVE10') {
            if (discountPercent > 10) {
                couponNote = `Coupon SAVE10 (10%) cannot be stacked with the higher 15% quantity discount. The best discount (15% = ৳${Math.round((rawSubtotal * 15) / 100)} off) has been applied for you, keeping your final price at ৳${rawSubtotal - Math.round((rawSubtotal * 15) / 100)}.`
            } else if (discountPercent === 10) {
                couponNote = `10% Discount active on your order.`
            } else {
                discountPercent = 10
                appliedOffer = '10% Coupon (SAVE10)'
                couponNote = `Coupon SAVE10 applied successfully (10% discount = ৳${Math.round((rawSubtotal * 10) / 100)} off)!`
            }
        } else {
            couponNote = `Coupon '${args.couponCode}' is not recognized.`
        }
    }

    const discountAmount = Math.round((rawSubtotal * discountPercent) / 100)
    const finalItemTotal = rawSubtotal - discountAmount

    const explanation = discountAmount > 0
        ? `${product?.name || 'Product'} (${quantity} pcs): ৳${unitOfferPrice} x ${quantity} = ৳${rawSubtotal}. Applied ${appliedOffer || 'discount'} (-৳${discountAmount}). Final Total: ৳${finalItemTotal} BDT.${couponNote ? ` Note: ${couponNote}` : ''}`
        : `${product?.name || 'Product'} (${quantity} pcs): ৳${unitOfferPrice} x ${quantity} = ৳${finalItemTotal} BDT.`

    return {
        sku: product?.sku || 'unknown',
        productName: product?.name || 'Item',
        unitRegularPrice,
        unitPrice: unitOfferPrice,
        quantity,
        subtotal: rawSubtotal,
        discountAmount,
        discountPercent,
        appliedOffer: appliedOffer || undefined,
        couponNote: couponNote || undefined,
        explanation,
        finalItemTotal,
        currency: 'BDT'
    }
}
