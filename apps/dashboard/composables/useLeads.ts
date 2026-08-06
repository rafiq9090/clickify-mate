import { ref, computed, watch } from 'vue'

export const useLeads = (supabase: any, showToast: Function, askConfirm: Function, integrations: any) => {
    const leads = ref<any[]>([])
    const loading = ref(false)
    const expandedLeads = ref<string[]>([])
    const selectedLeads = ref<string[]>([])
    const sendingToSteadfast = ref(false)

    // Edit modal state
    const showEditModal = ref(false)
    const editingLead = ref<any>(null)
    const editOrderText = ref('')
    const editLeadStatus = ref('pending')
    const editTransactionId = ref('')

    // Filters
    const activeTab = ref('all')
    const searchQuery = ref('')
    const startDate = ref('')
    const endDate = ref('')

    // Pagination
    const currentPage = ref(1)
    const itemsPerPage = 10
    const totalLeads = ref(0)
    const totalPages = computed(() => Math.ceil(totalLeads.value / itemsPerPage))

    const isAllSelected = computed(() => {
        if (leads.value.length === 0) return false
        return leads.value.every(lead => selectedLeads.value.includes(lead.id))
    })

    const toggleSelectAll = () => {
        if (isAllSelected.value) selectedLeads.value = []
        else selectedLeads.value = leads.value.map(lead => lead.id)
    }

    const toggleLeadExpand = (leadId: string) => {
        const index = expandedLeads.value.indexOf(leadId)
        if (index > -1) expandedLeads.value.splice(index, 1)
        else expandedLeads.value.push(leadId)
    }

    const fetchLeads = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        loading.value = true
        expandedLeads.value = []
        try {
            const from = (currentPage.value - 1) * itemsPerPage
            const to = from + itemsPerPage - 1
            let query = supabase
                .from('leads')
                .select('*', { count: 'exact' })
                .eq('source', 'ai_agent')
                .filter('data->>user_id', 'eq', user.id)
                .is('data->>payment_transaction_id', null)
                .order('created_at', { ascending: false })
            if (activeTab.value !== 'all') {
                if (activeTab.value === 'facebook') query = query.or('data->>platform.eq.messenger,data->>platform.eq.fb_comment')
                else query = query.eq('data->>platform', activeTab.value)
            }
            if (searchQuery.value) {
                const term = searchQuery.value.trim()
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)
                if (isUuid) query = query.eq('id', term)
                else query = query.or(`email.ilike.%${term}%,data->>customer.ilike.%${term}%,data->>order.ilike.%${term}%,short_id.ilike.%${term}%`)
            }
            if (startDate.value) query = query.gte('created_at', startDate.value)
            if (endDate.value) {
                const end = new Date(endDate.value)
                end.setDate(end.getDate() + 1)
                query = query.lt('created_at', end.toISOString())
            }
            const { data, count, error } = await query.range(from, to)
            if (error) throw error
            leads.value = data || []
            totalLeads.value = count || 0
        } catch (e: any) {
            console.error('Failed to fetch leads:', e)
        } finally {
            loading.value = false
        }
    }

    const deleteLead = async (id: string) => {
        askConfirm('Delete Order?', 'This record will be permanently purged from the neural database.', async () => {
            try {
                const { error } = await supabase.from('leads').delete().eq('id', id)
                if (error) throw error
                leads.value = leads.value.filter(l => l.id !== id)
                showToast('Order Deleted Successfully', 'success')
            } catch (e: any) {
                showToast('Delete Failed: ' + e.message, 'error')
            }
        })
    }

    const openEditModal = (lead: any) => {
        editingLead.value = lead
        editOrderText.value = lead.data.order || ''
        editLeadStatus.value = lead.data.status || 'pending'
        editTransactionId.value = lead.data.payment_transaction_id || ''
        showEditModal.value = true
    }

    const saveLeadUpdate = async (fetchOrders: Function) => {
        if (!editingLead.value) return
        try {
            const txId = editTransactionId.value.trim() || null
            const updatedData = { ...editingLead.value.data, order: editOrderText.value, status: editLeadStatus.value, payment_transaction_id: txId }
            const { error } = await supabase.from('leads').update({ data: updatedData }).eq('id', editingLead.value.id)
            if (error) throw error
            await Promise.all([fetchLeads(), fetchOrders()])
            showEditModal.value = false
            editingLead.value = null
            showToast('Order Updated Successfully', 'success')
        } catch (e: any) {
            showToast('Update Failed: ' + e.message, 'error')
        }
    }

    const sendSelectedToSteadfast = async () => {
        if (selectedLeads.value.length === 0) return
        sendingToSteadfast.value = true
        try {
            const payload = {
                lead_ids: selectedLeads.value,
                api_key: integrations.steadfast_api_key || null,
                secret_key: integrations.steadfast_secret_key || null
            }
            const res: any = await $fetch('/api/steadfast-proxy', { method: 'POST', body: payload })
            let successCount = 0, failCount = 0
            if (res.results) {
                for (const r of res.results) {
                    if (r.success) {
                        successCount++
                        const localLead = leads.value.find(l => l.id === r.lead_id)
                        if (localLead) {
                            if (!localLead.data) localLead.data = {}
                            localLead.data.tracking_code = r.tracking_code
                            localLead.data.delivery_status = r.status
                            localLead.data.consignment_id = r.consignment_id
                        }
                    } else { failCount++ }
                }
            }
            if (failCount === 0) showToast(`Successfully booked ${successCount} shipments on Steadfast`, 'success')
            else showToast(`Booked ${successCount} shipments. ${failCount} failed.`, 'warning')
            selectedLeads.value = []
        } catch (e: any) {
            showToast('Courier Booking Failed: ' + e.message, 'error')
        } finally {
            sendingToSteadfast.value = false
        }
    }

    const sendSingleToSteadfast = async (leadId: string) => {
        sendingToSteadfast.value = true
        try {
            const payload = {
                lead_ids: [leadId],
                api_key: integrations.steadfast_api_key || null,
                secret_key: integrations.steadfast_secret_key || null
            }
            const res: any = await $fetch('/api/steadfast-proxy', { method: 'POST', body: payload })
            if (res.results?.[0]) {
                const r = res.results[0]
                if (r.success) {
                    const localLead = leads.value.find(l => l.id === leadId)
                    if (localLead) {
                        if (!localLead.data) localLead.data = {}
                        localLead.data.tracking_code = r.tracking_code
                        localLead.data.delivery_status = r.status
                        localLead.data.consignment_id = r.consignment_id
                    }
                    showToast(`Shipment booked successfully: ${r.tracking_code}`, 'success')
                } else {
                    showToast(`Steadfast Error: ${r.message || 'Unknown error'}`, 'error')
                }
            }
        } catch (e: any) {
            showToast('Steadfast Courier Booking Failed: ' + e.message, 'error')
        } finally {
            sendingToSteadfast.value = false
        }
    }

    const filteredLeads = computed(() => leads.value)

    const exportToCSV = () => {
        if (leads.value.length === 0) return
        const baseHeaders = ['Platform', 'Customer', 'Email', 'Time', 'Date']
        const orderKeys = new Set<string>()
        filteredLeads.value.forEach(l => {
            const orderStr = l.data.order || ''
            if (orderStr.includes(':')) {
                orderStr.split('|').forEach((part: string) => {
                    const key = part.split(':')[0]?.trim()
                    if (key && !baseHeaders.some(h => h.toLowerCase() === key.toLowerCase())) orderKeys.add(key)
                })
            }
        })
        const allHeaders = [...baseHeaders, ...Array.from(orderKeys)]
        const rows = filteredLeads.value.map(l => {
            const rowData: any = {
                Platform: l.data.platform, Customer: l.data.customer,
                Email: l.email, Time: new Date(l.created_at).toLocaleTimeString(),
                Date: new Date(l.created_at).toLocaleDateString()
            }
            const orderStr = l.data.order || ''
            if (orderStr.includes(':')) {
                orderStr.split('|').forEach((part: string) => {
                    const [key, val] = part.split(':').map((s: string) => s.trim())
                    if (key) rowData[key] = val
                })
            } else { rowData['Details'] = orderStr }
            return allHeaders.map(header => `"${rowData[header] || ''}"`).join(',')
        })
        const csvContent = [allHeaders.join(','), ...rows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.setAttribute('href', URL.createObjectURL(blob))
        link.setAttribute('download', `order_export_${new Date().toISOString().slice(0, 10)}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Watchers
    watch([currentPage, activeTab, startDate, endDate], () => fetchLeads())
    let searchTimeout: any
    watch(searchQuery, () => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => { currentPage.value = 1; fetchLeads() }, 500)
    })

    return {
        leads, loading, expandedLeads, selectedLeads, sendingToSteadfast,
        showEditModal, editingLead, editOrderText, editLeadStatus, editTransactionId,
        activeTab, searchQuery, startDate, endDate,
        currentPage, totalLeads, totalPages, isAllSelected,
        filteredLeads, toggleSelectAll, toggleLeadExpand,
        fetchLeads, deleteLead, openEditModal, saveLeadUpdate,
        sendSelectedToSteadfast, sendSingleToSteadfast, exportToCSV
    }
}
