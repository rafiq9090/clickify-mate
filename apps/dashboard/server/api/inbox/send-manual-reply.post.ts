// server/api/inbox/send-manual-reply.post.ts
import { decrypt } from '../../utils/encryption'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { agent_id, user_external_id, content, platform } = body || {}

    if (!user_external_id || !content || content.trim() === '') {
        throw createError({ statusCode: 400, statusMessage: 'Missing user_external_id or content' })
    }

    const supabase = useSupabaseAdmin()
    let agent: any = null

    if (agent_id) {
        const { data } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('id', agent_id)
            .maybeSingle()
        agent = data
    }

    if (!agent) {
        // Fallback: look up active agent by platform
        const { data } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('platform', platform || 'telegram')
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        agent = data
    }

    if (!agent) {
        throw createError({ statusCode: 404, statusMessage: 'No active agent found to deliver message' })
    }

    let token = ''
    try {
        token = await decrypt(agent.encrypted_token)
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to decrypt agent credentials: ' + e.message })
    }

    const targetPlatform = agent.platform || platform || 'telegram'
    let sendResult: any = null

    // 1. Deliver to Telegram
    if (targetPlatform === 'telegram') {
        try {
            sendResult = await $fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                body: {
                    chat_id: user_external_id,
                    text: content.trim()
                }
            })
        } catch (tgErr: any) {
            console.error('[MANUAL TELEGRAM SEND ERROR]:', tgErr.data || tgErr.message)
            throw createError({ statusCode: 500, statusMessage: 'Telegram Delivery Failed: ' + (tgErr.data?.description || tgErr.message) })
        }
    } 
    // 2. Deliver to WhatsApp
    else if (targetPlatform === 'whatsapp') {
        try {
            sendResult = await $fetch(`https://graph.facebook.com/v21.0/${agent.external_id || 'me'}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: user_external_id,
                    type: 'text',
                    text: { body: content.trim() }
                }
            })
        } catch (waErr: any) {
            console.error('[MANUAL WHATSAPP SEND ERROR]:', waErr.data || waErr.message)
            throw createError({ statusCode: 500, statusMessage: 'WhatsApp Delivery Failed: ' + waErr.message })
        }
    }
    // 3. Deliver to Facebook Messenger
    else if (targetPlatform === 'messenger' || targetPlatform === 'facebook') {
        try {
            sendResult = await $fetch(`https://graph.facebook.com/v21.0/me/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    recipient: { id: user_external_id },
                    message: { text: content.trim() }
                }
            })
        } catch (fbErr: any) {
            console.error('[MANUAL FACEBOOK SEND ERROR]:', fbErr.data || fbErr.message)
            throw createError({ statusCode: 500, statusMessage: 'Facebook Delivery Failed: ' + fbErr.message })
        }
    }

    // 4. Save to Chat History Table
    try {
        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: user_external_id.toString(),
            customer_name: body.customer_name || '',
            customer_avatar: body.customer_avatar || '',
            role: 'assistant',
            content: content.trim(),
            tokens_used: 0
        })
    } catch (saveErr: any) {
        console.warn('[MANUAL REPLY HISTORY SAVE WARNING]:', saveErr.message)
    }

    return { success: true, sendResult }
})
