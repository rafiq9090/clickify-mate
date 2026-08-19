export interface CustomerProfileResult {
    id: string
    name?: string
    phone?: string
    address?: string
    orderCount: number
    lastOrder?: any
}

export async function getCustomerProfile(args: {
    customerId: string
    agentId?: string
    phone?: string
}): Promise<CustomerProfileResult> {
    const supabase = useSupabaseAdmin()
    let name = ''
    let phone = args.phone || ''
    let address = ''
    let orderCount = 0
    let lastOrder: any = null

    if (supabase && supabase.from) {
        let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
        if (args.customerId) {
            const emailKey = `${args.customerId}@telegram.org`
            query = query.eq('email', emailKey)
        }

        const { data: leads } = await query.limit(5)
        if (Array.isArray(leads) && leads.length > 0) {
            orderCount = leads.length
            lastOrder = leads[0]?.data
            name = leads[0]?.name || lastOrder?.name || ''
            phone = leads[0]?.phone || lastOrder?.phone || phone
            address = lastOrder?.address || ''
        }
    }

    return {
        id: args.customerId,
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
        orderCount,
        lastOrder
    }
}
