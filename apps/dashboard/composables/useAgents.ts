import { ref, reactive } from 'vue'

export const useAgents = (supabase: any, showToast: Function) => {
    const agents = ref<any[]>([])
    const userEmail = ref('')

    const formatPlatformName = (platform: string) => {
        if (platform === 'fb_comment') return 'FB comment'
        if (platform === 'messenger') return 'Messenger'
        if (platform === 'whatsapp') return 'WhatsApp'
        if (platform === 'telegram') return 'Telegram'
        return platform
    }

    const fetchAgents = async (loadIntegrationsFn?: Function) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data, error } = await supabase.from('agent_configs').select('*').eq('user_id', user.id)
            if (error) throw error
            if (data) {
                console.log(`[DASHBOARD DEBUG]: Found ${data.length} agents.`)
                agents.value = data.map((a: any) => {
                    const rawImages = Array.isArray(a.product_images) ? a.product_images : []
                    const images = rawImages.map((img: any) => {
                        if (typeof img === 'string') return { id: '', url: img }
                        if (img && typeof img === 'object') return { id: img.id || '', url: img.url || '' }
                        return { id: '', url: '' }
                    })
                    while (images.length < 3) images.push({ id: '', url: '' })
                    const behavior = a.agent_behavior || {}
                    if (behavior.fb_private_reply_prices === undefined) behavior.fb_private_reply_prices = true
                    if (behavior.fb_private_reply_orders === undefined) behavior.fb_private_reply_orders = true
                    if (behavior.fb_private_reply_pii === undefined) behavior.fb_private_reply_pii = true
                    if (behavior.fb_private_reply_complaints === undefined) behavior.fb_private_reply_complaints = true
                    if (behavior.fb_public_reply_enabled === undefined) behavior.fb_public_reply_enabled = true
                    if (behavior.fb_delete_negatives === undefined) behavior.fb_delete_negatives = true
                    if (behavior.webhook_forward_url === undefined) behavior.webhook_forward_url = ''
                    if (behavior.webhook_events === undefined) behavior.webhook_events = { messages: true, comments: true, orders: true }
                    return {
                        ...a,
                        isDirty: false, showAdvance: false, activeCardTab: 'knowledge',
                        agent_behavior: behavior, product_images: images,
                        visibleImageCount: Math.max(1, images.filter((img: any) => img.url && img.url.trim() !== '').length)
                    }
                })
                if (loadIntegrationsFn) loadIntegrationsFn(agents.value)
            }
        } catch (e: any) {
            console.error('Failed to fetch agents:', e)
        }
    }

    const updateKnowledge = async (agent: any) => {
        try {
            const { error } = await supabase.from('agent_configs').update({
                knowledge: agent.knowledge,
                product_images: agent.product_images.filter((img: any) => img && img.url && img.url.trim() !== ''),
                agent_behavior: agent.agent_behavior
            }).eq('id', agent.id)
            if (error) throw error
            agent.isDirty = false
            showToast('Knowledge Base & Product Gallery Synchronized', 'success')
        } catch (e: any) {
            showToast('Sync Failed: ' + e.message, 'error')
        }
    }

    // Agent connection modal
    const showConnectModal = ref(false)
    const connectPlatform = ref('whatsapp')
    const connectToken = ref('')
    const connectKnowledge = ref('')
    const connectingAgent = ref(false)

    const openConnectModal = (defaultTemplate: string) => {
        connectPlatform.value = 'whatsapp'
        connectToken.value = ''
        connectKnowledge.value = defaultTemplate
        showConnectModal.value = true
    }

    const handleConnectAgent = async (loadIntegrationsFn?: Function) => {
        if (!connectToken.value) {
            showToast('API Key / Bot Token is required', 'warning')
            return
        }
        connectingAgent.value = true
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res: any = await $fetch('/api/agents/connect', {
                method: 'POST',
                headers: { Authorization: `Bearer ${session?.access_token}` },
                body: { platform: connectPlatform.value, token: connectToken.value, knowledge: connectKnowledge.value }
            })
            if (res.success) {
                showToast(res.message || 'Agent connected successfully!', 'success')
                showConnectModal.value = false
                connectToken.value = ''
                connectKnowledge.value = ''
                await fetchAgents(loadIntegrationsFn)
            }
        } catch (e: any) {
            showToast('Connection Failed: ' + (e.data?.statusMessage || e.message), 'error')
        } finally {
            connectingAgent.value = false
        }
    }

    // Delete agent modal
    const showDeleteModal = ref(false)
    const targetAgentId = ref<string | null>(null)

    const disconnectAgent = (id: string) => {
        targetAgentId.value = id
        showDeleteModal.value = true
    }

    const confirmDelete = async (stats: any[]) => {
        if (!targetAgentId.value) return
        try {
            const { error } = await supabase.from('agent_configs').delete().eq('id', targetAgentId.value)
            if (error) throw error
            agents.value = agents.value.filter(a => a.id !== targetAgentId.value)
            if (stats[1]) stats[1].value = agents.value.length.toString()
            showDeleteModal.value = false
            targetAgentId.value = null
        } catch (e: any) {
            alert('Failed: ' + e.message)
        }
    }

    return {
        agents, userEmail, formatPlatformName, fetchAgents, updateKnowledge,
        showConnectModal, connectPlatform, connectToken, connectKnowledge, connectingAgent,
        openConnectModal, handleConnectAgent,
        showDeleteModal, targetAgentId, disconnectAgent, confirmDelete
    }
}
