import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'

export const useWebhook = (agents: any) => {
    const showWebhookToken = ref(false)
    const testingWebhookStatus = ref<Record<string, string>>({})
    const testPayloadAgentId = ref('')
    const testPayloadBody = ref('Do you have Blue Denim Jacket in stock?')
    const webhookTestResult = ref<any>(null)
    const webhookTestLoading = ref(false)

    const verifyToken = computed(() => {
        const config = useRuntimeConfig()
        return (config.public as any)?.verifyToken || ''
    })

    // Auto-detect if current origin serves Rust (port 5004) or TypeScript (port 3000)
    const isRustMode = ref(false)
    onMounted(async () => {
        try {
            const res: any = await $fetch('/health', { method: 'GET' })
            if (res && res.engine === 'rust') isRustMode.value = true
        } catch {
            isRustMode.value = false
        }
    })

    const getWebhookUrl = (platform: string, agentId: string) => {
        if (typeof window === 'undefined') return ''
        const origin = window.location.origin
        if (isRustMode.value) {
            if (platform === 'telegram') return `${origin}/webhook/telegram?agent_id=${agentId}`
            if (platform === 'whatsapp') return `${origin}/webhook/whatsapp?agent_id=${agentId}`
            return `${origin}/webhook/facebook?agent_id=${agentId}`
        } else {
            if (platform === 'telegram') return `${origin}/webhook/telegram?agent_id=${agentId}`
            if (platform === 'whatsapp') return `${origin}/api/agents/whatsapp?agent_id=${agentId}`
            return `${origin}/api/agents/facebook?agent_id=${agentId}`
        }
    }

    // Callback URL for Meta webhook verification (no agent_id needed)
    const metaCallbackUrl = computed(() => {
        if (typeof window === 'undefined') return ''
        const origin = window.location.origin
        return isRustMode.value ? `${origin}/webhook/facebook` : `${origin}/api/agents/facebook`
    })

    const selectedAgentForConfig = computed(() =>
        agents.value?.find((a: any) => a.id === testPayloadAgentId.value) || null
    )

    const verifyAgentWebhook = async (agent: any, showToast: Function) => {
        testingWebhookStatus.value[agent.id] = 'testing'
        try {
            const url = getWebhookUrl(agent.platform, agent.id)
            const res: any = await $fetch(url, { method: 'GET' })
            if (res && (res.status?.includes('Active') || res.status?.includes('ACTIVE') || res.platform)) {
                testingWebhookStatus.value[agent.id] = 'success'
                showToast(`${agent.platform.toUpperCase()} webhook path is active and verified!`, 'success')
            } else {
                testingWebhookStatus.value[agent.id] = 'error'
                showToast('Webhook path returned unexpected response. Check server logs.', 'warning')
            }
        } catch (e: any) {
            testingWebhookStatus.value[agent.id] = 'error'
            showToast(`Verification Failed: ${e.message}`, 'error')
        }
    }

    const runWebhookMockTest = async (showToast: Function, fetchLeads: Function, fetchOrders: Function) => {
        if (!testPayloadAgentId.value) {
            showToast('Please select an agent to test', 'warning')
            return
        }
        webhookTestLoading.value = true
        webhookTestResult.value = null
        try {
            const agent = agents.value?.find((a: any) => a.id === testPayloadAgentId.value)
            if (!agent) throw new Error('Agent not found')

            let endpoint = ''
            let body: any = {}

            if (agent.platform === 'telegram') {
                endpoint = '/api/agents/telegram'
                body = {
                    message: {
                        message_id: 12345,
                        from: { id: 987654321, first_name: 'TestUser', username: 'testuser' },
                        chat: { id: 987654321, first_name: 'TestUser', type: 'private' },
                        date: Math.floor(Date.now() / 1000),
                        text: testPayloadBody.value
                    }
                }
            } else if (agent.platform === 'whatsapp') {
                endpoint = '/api/agents/whatsapp'
                body = {
                    object: 'whatsapp_business_account',
                    entry: [{
                        id: '1234567890',
                        changes: [{
                            value: {
                                messaging_product: 'whatsapp',
                                metadata: { display_phone_number: '15550000000', phone_number_id: agent.external_id || 'mock_phone_id' },
                                contacts: [{ profile: { name: 'Test User' }, wa_id: '8801700000000' }],
                                messages: [{
                                    from: '8801700000000',
                                    id: 'wamid.HBgMODgwMTcwMDAwMDAwFQIAERgSRjQ1NjY1NDMyM0FCQ0RFRgA=',
                                    timestamp: Math.floor(Date.now() / 1000).toString(),
                                    text: { body: testPayloadBody.value },
                                    type: 'text'
                                }]
                            },
                            field: 'messages'
                        }]
                    }]
                }
            } else {
                endpoint = '/api/agents/facebook'
                body = {
                    object: 'page',
                    entry: [{
                        id: agent.external_id || 'mock_page_id',
                        time: Date.now(),
                        messaging: [{
                            sender: { id: '9876543210' },
                            recipient: { id: agent.external_id || 'mock_page_id' },
                            timestamp: Date.now(),
                            message: { mid: 'm_1234567890abcdef', text: testPayloadBody.value }
                        }]
                    }]
                }
            }

            const response = await $fetch(`${endpoint}?agent_id=${agent.id}`, { method: 'POST', body })
            webhookTestResult.value = { statusCode: 200, statusText: 'OK', response, timestamp: new Date().toLocaleTimeString() }
            showToast('Mock Webhook event processed successfully!', 'success')
            await fetchLeads()
            await fetchOrders()
        } catch (e: any) {
            webhookTestResult.value = {
                statusCode: e.status || 500,
                statusText: e.message || 'Internal Server Error',
                response: e.data || null,
                timestamp: new Date().toLocaleTimeString()
            }
            showToast(`Webhook simulation failed: ${e.message}`, 'error')
        } finally {
            webhookTestLoading.value = false
        }
    }

    return {
        showWebhookToken, testingWebhookStatus, testPayloadAgentId,
        testPayloadBody, webhookTestResult, webhookTestLoading,
        verifyToken, isRustMode, getWebhookUrl, metaCallbackUrl,
        selectedAgentForConfig, verifyAgentWebhook, runWebhookMockTest
    }
}
