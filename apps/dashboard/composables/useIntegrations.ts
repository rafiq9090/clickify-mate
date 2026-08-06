import { ref, reactive } from 'vue'

export const useIntegrations = (supabase: any, showToast: Function, askConfirm: Function) => {
    const backendStatus = ref('offline')
    const backendFfmpeg = ref(false)
    const backendVpsMode = ref(false)
    const backendChecking = ref(false)
    const showIntegrations = ref(false)
    const savingIntegrations = ref(false)

    const integrations = reactive({
        steadfast_api_key: '',
        steadfast_secret_key: '',
        steadfast_sender_id: '',
        steadfast_webhook_url: '',
        twilio_account_sid: '',
        twilio_auth_token: '',
        twilio_phone_number: '',
        sslcommerz_store_id: '',
        sslcommerz_store_password: '',
        sslcommerz_sandbox: true,
        shop_type: 'mock',
        shop_api_url: '',
        shop_api_key: '',
        shop_api_secret: ''
    })

    const VPS_BACKEND_URL = 'http://103.174.51.212:8000'

    const checkBackendStatus = async () => {
        backendChecking.value = true
        try {
            const res: any = await $fetch(`${VPS_BACKEND_URL}/api/status`, { timeout: 5000 })
            backendStatus.value = res.status || 'offline'
            backendFfmpeg.value = res.ffmpeg_ready || false
            backendVpsMode.value = res.vps_mode || false
        } catch (e) {
            backendStatus.value = 'offline'
            backendFfmpeg.value = false
            backendVpsMode.value = false
        } finally {
            backendChecking.value = false
        }
    }

    const saveIntegrations = async (agents: any) => {
        savingIntegrations.value = true
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            for (const agent of agents.value) {
                const updatedBehavior = {
                    ...agent.agent_behavior,
                    steadfast_api_key: integrations.steadfast_api_key,
                    steadfast_secret_key: integrations.steadfast_secret_key,
                    steadfast_sender_id: integrations.steadfast_sender_id,
                    steadfast_webhook_url: integrations.steadfast_webhook_url,
                    twilio_account_sid: integrations.twilio_account_sid,
                    twilio_auth_token: integrations.twilio_auth_token,
                    twilio_phone_number: integrations.twilio_phone_number,
                    sslcommerz_store_id: integrations.sslcommerz_store_id,
                    sslcommerz_store_password: integrations.sslcommerz_store_password,
                    sslcommerz_sandbox: integrations.sslcommerz_sandbox,
                    shop_type: integrations.shop_type || 'mock',
                    shop_api_url: integrations.shop_api_url || '',
                    shop_api_key: integrations.shop_api_key || '',
                    shop_api_secret: integrations.shop_api_secret || ''
                }
                
                await supabase.from('agent_configs').update({ agent_behavior: updatedBehavior }).eq('id', agent.id)
                agent.agent_behavior = updatedBehavior
            }
            showToast('Integration credentials saved to all agents', 'success')
        } catch (e: any) {
            showToast('Save Failed: ' + e.message, 'error')
        } finally {
            savingIntegrations.value = false
        }
    }

    const loadIntegrations = (agentsList: any[]) => {
        const source = agentsList.find(a => a.agent_behavior?.steadfast_api_key || a.agent_behavior?.shop_api_key) || agentsList[0]
        if (source?.agent_behavior) {
            const b = source.agent_behavior
            integrations.steadfast_api_key = b.steadfast_api_key || ''
            integrations.steadfast_secret_key = b.steadfast_secret_key || ''
            integrations.steadfast_sender_id = b.steadfast_sender_id || ''
            integrations.steadfast_webhook_url = b.steadfast_webhook_url || ''
            integrations.twilio_account_sid = b.twilio_account_sid || ''
            integrations.twilio_auth_token = b.twilio_auth_token || ''
            integrations.twilio_phone_number = b.twilio_phone_number || ''
            integrations.sslcommerz_store_id = b.sslcommerz_store_id || ''
            integrations.sslcommerz_store_password = b.sslcommerz_store_password || ''
            integrations.sslcommerz_sandbox = b.sslcommerz_sandbox !== undefined ? b.sslcommerz_sandbox : true
            integrations.shop_type = b.shop_type || 'mock'
            integrations.shop_api_url = b.shop_api_url || ''
            integrations.shop_api_key = b.shop_api_key || ''
            integrations.shop_api_secret = b.shop_api_secret || ''
        }
    }

    // Developer API Keys State
    const apiKeys = ref<any[]>([])
    const generatingApiKey = ref(false)

    const fetchApiKeys = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data, error } = await supabase
                .from('user_api_keys')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            apiKeys.value = data || []
        } catch (e) {
            console.error('Failed to fetch API keys:', e)
        }
    }

    const generateNewApiKey = async () => {
        generatingApiKey.value = true
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const randomString = Array.from(crypto.getRandomValues(new Uint8Array(24)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
            const newKey = `as_${randomString}`
            
            const { error } = await supabase
                .from('user_api_keys')
                .insert({
                    user_id: user.id,
                    key_value: newKey,
                    name: `API Key - ${new Date().toLocaleDateString()}`
                })
            if (error) throw error
            showToast('New API Key generated successfully!', 'success')
            await fetchApiKeys()
        } catch (e: any) {
            showToast('Generation Failed: ' + e.message, 'error')
        } finally {
            generatingApiKey.value = false
        }
    }

    const deleteApiKey = async (id: string) => {
        askConfirm(
            'Revoke API Key?',
            'Any external application using this API Key will lose connection immediately.',
            async () => {
                try {
                    const { error } = await supabase
                        .from('user_api_keys')
                        .delete()
                        .eq('id', id)
                    if (error) throw error
                    showToast('API Key revoked successfully', 'success')
                    await fetchApiKeys()
                } catch (e: any) {
                    showToast('Revocation Failed: ' + e.message, 'error')
                }
            }
        )
    }

    return {
        backendStatus, backendFfmpeg, backendVpsMode, backendChecking,
        showIntegrations, savingIntegrations, integrations,
        checkBackendStatus, saveIntegrations, loadIntegrations,
        apiKeys, generatingApiKey, fetchApiKeys, generateNewApiKey, deleteApiKey
    }
}
