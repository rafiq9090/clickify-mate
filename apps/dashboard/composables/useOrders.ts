import { ref, computed, watch } from 'vue'

export const useOrders = (supabase: any) => {
    const orders = ref<any[]>([])
    const loading = ref(false)
    const expandedOrders = ref<string[]>([])
    const ordersActiveTab = ref('all')
    const ordersSearchQuery = ref('')
    const ordersStartDate = ref('')
    const ordersEndDate = ref('')

    // Pagination
    const ordersCurrentPage = ref(1)
    const ordersItemsPerPage = 10
    const totalOrders = ref(0)
    const ordersTotalPages = computed(() => Math.ceil(totalOrders.value / ordersItemsPerPage))

    const toggleOrderExpand = (orderId: string) => {
        const index = expandedOrders.value.indexOf(orderId)
        if (index > -1) expandedOrders.value.splice(index, 1)
        else expandedOrders.value.push(orderId)
    }

    const parseOrderData = (order: any) => {
        const data: Record<string, string> = {}
        const orderString = order.data?.order || ''
        if (!orderString) return data
        const pairs = orderString.split('|')
        for (const pair of pairs) {
            const [key, value] = pair.split(':').map((s: string) => s.trim())
            if (key && value) data[key.toLowerCase()] = value
        }
        return data
    }

    const fetchOrders = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        loading.value = true
        expandedOrders.value = []
        try {
            const from = (ordersCurrentPage.value - 1) * ordersItemsPerPage
            const to = from + ordersItemsPerPage - 1
            let query = supabase
                .from('leads')
                .select('*', { count: 'exact' })
                .eq('source', 'ai_agent')
                .filter('data->>user_id', 'eq', user.id)
                .or('data->>payment_transaction_id.not.is.null,data->>trx_id.not.is.null,data->>payment_status.eq.paid,data->>is_paid.eq.true')
                .order('created_at', { ascending: false })
            if (ordersActiveTab.value !== 'all') {
                if (ordersActiveTab.value === 'facebook') query = query.or('data->>platform.eq.messenger,data->>platform.eq.fb_comment,data->>platform.eq.facebook')
                else query = query.eq('data->>platform', ordersActiveTab.value)
            }
            if (ordersSearchQuery.value) {
                const term = ordersSearchQuery.value.trim()
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)
                if (isUuid) query = query.eq('id', term)
                else query = query.or(`email.ilike.%${term}%,data->>customer.ilike.%${term}%,data->>name.ilike.%${term}%,data->>phone.ilike.%${term}%,data->>invoice_number.ilike.%${term}%,data->>payment_transaction_id.ilike.%${term}%,data->>trx_id.ilike.%${term}%,data->>payment_method.ilike.%${term}%,data->>payment_channel.ilike.%${term}%,data->>payment_provider.ilike.%${term}%`)
            }
            if (ordersStartDate.value) query = query.gte('created_at', ordersStartDate.value)
            if (ordersEndDate.value) {
                const end = new Date(ordersEndDate.value)
                end.setDate(end.getDate() + 1)
                query = query.lt('created_at', end.toISOString())
            }
            const { data, count, error } = await query.range(from, to)
            if (error) throw error
            orders.value = data || []
            totalOrders.value = count || 0
        } catch (e: any) {
            console.error('Failed to fetch orders:', e)
        } finally {
            loading.value = false
        }
    }

    watch([ordersCurrentPage, ordersActiveTab, ordersStartDate, ordersEndDate], () => fetchOrders())
    let ordersSearchTimeout: any
    watch(ordersSearchQuery, () => {
        clearTimeout(ordersSearchTimeout)
        ordersSearchTimeout = setTimeout(() => { ordersCurrentPage.value = 1; fetchOrders() }, 500)
    })

    return {
        orders, loading, expandedOrders, ordersActiveTab,
        ordersSearchQuery, ordersStartDate, ordersEndDate,
        ordersCurrentPage, totalOrders, ordersTotalPages,
        toggleOrderExpand, parseOrderData, fetchOrders
    }
}
