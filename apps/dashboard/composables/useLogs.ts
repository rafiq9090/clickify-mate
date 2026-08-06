import { ref, computed, watch } from 'vue'

export const useLogs = (supabase: any) => {
    const logs = ref<any[]>([])
    const logsCurrentPage = ref(1)
    const logsItemsPerPage = 5
    const totalLogs = ref(0)
    const logsTotalPages = computed(() => Math.ceil(totalLogs.value / logsItemsPerPage))

    const fetchLogs = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        try {
            const from = (logsCurrentPage.value - 1) * logsItemsPerPage
            const to = from + logsItemsPerPage - 1
            const { data, count, error } = await supabase
                .from('leads')
                .select('*', { count: 'exact' })
                .eq('source', 'ai_moderation')
                .filter('data->>user_id', 'eq', user.id)
                .order('created_at', { ascending: false })
                .range(from, to)
            if (error) throw error
            totalLogs.value = count || 0
            const mergedLogs: any[] = []
            if (data) {
                data.forEach((m: any) => {
                    const cleanComment = m.data?.order
                        ? m.data.order.replace('🔴 DELETED COMMENT: ', '').replace(/^"|"$/g, '')
                        : ''
                    mergedLogs.push({
                        id: m.id,
                        created_at: m.created_at,
                        event: `Auto-deleted: "${cleanComment}"`,
                        profile: m.data?.customer || 'Unknown User',
                        platform: 'FB Comment',
                        rate: 100,
                        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    })
                })
            }
            logs.value = mergedLogs
        } catch (e: any) {
            console.error('Failed to fetch logs:', e)
        }
    }

    watch(logsCurrentPage, () => fetchLogs())

    return { logs, logsCurrentPage, totalLogs, logsTotalPages, fetchLogs }
}
