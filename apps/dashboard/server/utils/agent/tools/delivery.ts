export interface DeliveryFeeResult {
    location: string
    isInsideDhaka: boolean
    deliveryFee: number
    freeShippingApplied: boolean
    advancePaymentRequired: boolean
    advancePaymentAmount: number
    advanceExplanation?: string
    estimatedDays: string
    explanation: string
    currency: string
}

export function isLocationInsideDhaka(addressOrDistrict: string): boolean {
    if (!addressOrDistrict) return true
    const normalized = addressOrDistrict.toLowerCase()

    // Explicit outside dhaka indicators
    const outsideDistricts = [
        'chittagong', 'chattogram', 'sylhet', 'rajshahi', 'khulna', 'barisal', 'barishal',
        'rangpur', 'mymensingh', 'cumilla', 'comilla', 'gazipur', 'narayanganj', 'savar',
        'keraniganj', 'bogura', 'bogra', 'jessore', 'jashore', 'coxs bazar', 'feni',
        'noakhali', 'brahmanbaria', 'tangail', 'dinajpur', 'kushtia', 'faridpur', 'pabna'
    ]

    for (const d of outsideDistricts) {
        if (normalized.includes(d)) return false
    }

    if (normalized.includes('outside dhaka') || normalized.includes('dhakar baire') || normalized.includes('gram')) {
        return false
    }

    return true
}

export async function calculateDeliveryFee(args: {
    address?: string
    district?: string
    orderTotal?: number
}): Promise<DeliveryFeeResult> {
    const loc = (args.district || args.address || 'Dhaka').trim()
    const isInside = isLocationInsideDhaka(loc)
    const orderTotal = args.orderTotal || 0

    // Free delivery rule for orders >= ৳1500
    if (orderTotal >= 1500) {
        const advanceExplanation = !isInside
            ? 'ঢাকার বাইরে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি (৳০)! তবে অর্ডার নিশ্চিত করতে ৳১৫০ অগ্রিম প্রদান করতে হবে, যা ডেলিভারির সময় মোট বিল থেকে সমন্বয় (adjust) করা হবে।'
            : undefined

        return {
            location: loc,
            isInsideDhaka: isInside,
            deliveryFee: 0,
            freeShippingApplied: true,
            advancePaymentRequired: !isInside,
            advancePaymentAmount: !isInside ? 150 : 0,
            advanceExplanation,
            estimatedDays: isInside ? '1-2 Days' : '2-4 Days',
            explanation: isInside
                ? 'ঢাকার ভেতরে আপনার অর্ডারে ফ্রি ডেলিভারি (৳০) প্রযোজ্য হয়েছে।'
                : (advanceExplanation || 'ঢাকার বাইরে ফ্রি ডেলিভারি প্রযোজ্য।'),
            currency: 'BDT'
        }
    }

    const fee = isInside ? 80 : 150
    const advanceExplanation = !isInside
        ? 'ঢাকার বাইরে ডেলিভারি চার্জ ৳১৫০ অগ্রিম বিকাশ বা নগদে প্রদান করতে হবে। বাকি পণ্যের মূল্য ক্যাশ অন ডেলিভারিতে প্রদান করবেন।'
        : undefined

    return {
        location: loc,
        isInsideDhaka: isInside,
        deliveryFee: fee,
        freeShippingApplied: false,
        advancePaymentRequired: !isInside,
        advancePaymentAmount: !isInside ? 150 : 0,
        advanceExplanation,
        estimatedDays: isInside ? '1-2 Days' : '2-4 Days',
        explanation: isInside
            ? 'ঢাকার ভেতরে ডেলিভারি চার্জ ৳৮০ (ক্যাশ অন ডেলিভারি)।'
            : (advanceExplanation || 'ঢাকার বাইরে ডেলিভারি চার্জ ৳১৫০।'),
        currency: 'BDT'
    }
}
