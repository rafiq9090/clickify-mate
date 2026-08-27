// server/api/agents/whatsapp.ts
import { decrypt } from '../../utils/encryption'
import { getApiKey } from '../../utils/settings'
import { runAgent } from '../../utils/agent/agent_orchestrator'
import type { IncomingAgentEvent } from '../../utils/agent/agent_types'
import { useSupabaseAdmin } from '../../utils/supabase'
import { checkAndRecordWebhookEvent } from '../../utils/agent/webhook_dedup'
import { verifyMetaSignature } from '../../utils/agent/webhook_auth'
import { analyzeImage } from '../../utils/agent/vision'
import { analyzeVideoMessage } from '../../utils/agent/video_processor'

async function getMetaMediaUrl(mediaId: string, pageAccessToken: string) {
    const res = await $fetch<any>(`https://graph.facebook.com/v19.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${pageAccessToken}` }
    })
    return res.url
}

async function downloadMetaMedia(url: string, pageAccessToken: string) {
    const res = await $fetch<any>(url, {
        headers: { Authorization: `Bearer ${pageAccessToken}` },
        responseType: 'arrayBuffer'
    })
    return Buffer.from(res)
}

async function transcribeAudio(audioBuffer: Buffer, mimeType: string, apiKey: string) {
    let ext = 'ogg'
    if (mimeType.includes('mp3')) ext = 'mp3'
    else if (mimeType.includes('wav')) ext = 'wav'
    else if (mimeType.includes('webm')) ext = 'webm'

    const formData = new FormData()
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType })
    formData.append('file', blob, `voice.${ext}`)
    formData.append('model', 'whisper-large-v3')
    formData.append('prompt', 'Bengali, বাংলা, Banglish (Bangla written in English alphabets), and English speech from a customer.')

    const res = await $fetch<any>('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`
        },
        body: formData
    })
    return res.text || ''
}


export default defineEventHandler(async (event) => {
    const VERSION = '2.0.0-HARDENED-ENGINE'

    // 1. WhatsApp Webhook Verification Handshake (GET)
    if (event.method === 'GET') {
        const query = getQuery(event)
        const mode = query['hub.mode']
        const token = query['hub.verify_token']
        const challenge = query['hub.challenge']

        const config = useRuntimeConfig()
        const verifyToken = config.public.verifyToken || 'papersnap_secure_verify'

        if (mode === 'subscribe' && token === verifyToken) {
            console.log(`[WHATSAPP DEBUG V${VERSION}]: Handshake Successful!`)
            return challenge
        }
        return { status: 'WhatsApp Agent Active', version: VERSION }
    }

    // 2. Webhook Signature Verification (POST)
    const rawBody = await readRawBody(event) || ''
    const sigCheck = verifyMetaSignature(event, rawBody)
    if (!sigCheck.isValid) {
        console.warn(`[WHATSAPP WEBHOOK AUTH REJECTED]: ${sigCheck.reason}`)
        throw createError({
            statusCode: 401,
            statusMessage: `Invalid webhook signature: ${sigCheck.reason}`
        })
    }

    const body = await readBody(event)
    const query = getQuery(event)
    const agentId = query.agent_id

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value || !value.messages) {
        return { success: true }
    }

    try {
        const message = value.messages[0]
        const from = message.from // User's phone number
        const messageId = message.id
        const phoneNumberId = value.metadata.phone_number_id
        const messageType = message.type || 'text'

        let userText = ''
        if (messageType === 'text') {
            userText = message.text?.body || ''
        }

        // Initialize Supabase
        const supabase = useSupabaseAdmin()
        let agent = null

        // 1. Try to find by direct ID (from URL)
        if (agentId) {
            const { data } = await supabase.from('agent_configs').select('*').eq('id', agentId).eq('platform', 'whatsapp').eq('is_active', true).maybeSingle()
            agent = data
        }

        // 2. Try to find by Phone ID (Meta's ID)
        if (!agent && phoneNumberId) {
            const { data } = await supabase.from('agent_configs').select('*').eq('external_id', phoneNumberId).eq('platform', 'whatsapp').eq('is_active', true).maybeSingle()
            agent = data
        }

        // 3. Fallback: Find any active WhatsApp agent and sync phone number ID
        if (!agent) {
            const { data } = await supabase.from('agent_configs').select('*').eq('platform', 'whatsapp').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
            if (data) {
                agent = data
                if (phoneNumberId) {
                    supabase.from('agent_configs').update({ external_id: phoneNumberId }).eq('id', data.id).then(() => {
                        console.log(`[AGENT AUTO-SYNC]: Linked WhatsApp Phone Number ID ${phoneNumberId} to agent ${data.id}`)
                    }).catch(() => {})
                }
            }
        }

        if (!agent) {
            console.error(`[WHATSAPP DEBUG V${VERSION}]: No WhatsApp agent found in DB.`)
            throw createError({ statusCode: 404, statusMessage: 'No matching active WhatsApp agent' })
        }

        // Multi-Tenant Durable Deduplication
        const isDuplicate = await checkAndRecordWebhookEvent({
            agentId: agent.id,
            channel: 'whatsapp',
            messageId
        })
        if (isDuplicate) {
            return { success: true, duplicate: true }
        }

        let customerName = value.contacts?.[0]?.profile?.name || `Customer +${from}`

        // 0. ZERO-TOKEN GUARD: CHECK IF AI AUTO-PILOT IS PAUSED / STOPPED FOR THIS CUSTOMER
        const emailKey = `${from}@whatsapp.org`
        const { data: leadRows } = await supabase
            .from('leads')
            .select('data')
            .eq('email', emailKey)
            .eq('data->>agent_id', agent.id)

        let isCustomerAiDisabled = agent.is_active === false
        if (Array.isArray(leadRows)) {
            for (const r of leadRows) {
                if (r.data?.ai_disabled === true) {
                    isCustomerAiDisabled = true
                    break
                }
            }
        }

        if (isCustomerAiDisabled) {
            console.log(`[AGENT SILENT MODE]: AI Auto-Pilot is PAUSED for WhatsApp customer ${from}. Skipping all LLM, vision, and speech inference (0 tokens consumed).`)

            let rawUserText = message.text?.body || message.caption || ''
            if (!rawUserText) {
                if (messageType === 'audio') rawUserText = '[Voice Note]'
                else if (messageType === 'image') rawUserText = '[Photo Attachment]'
                else if (messageType === 'video') rawUserText = '[Video Attachment]'
                else rawUserText = '[Attachment]'
            }

            await supabase.from('chat_history').insert([
                {
                    agent_id: agent.id,
                    user_external_id: from,
                    customer_name: customerName,
                    role: 'user',
                    content: rawUserText,
                    created_at: new Date().toISOString()
                }
            ])

            return {
                success: true,
                aiPaused: true,
                message: 'AI paused for this customer. 0 tokens consumed. Routed to Live Inbox.'
            }
        }

        const pageAccessToken = await decrypt(agent.encrypted_token)
        const apiKey = await getApiKey('groq_api_key', 'groqApiKey')

        // --- Process Voice Notes or Images ---
        let mediaUrl = ''
        if (messageType === 'audio') {
            const mediaId = message.audio?.id
            if (mediaId && pageAccessToken && apiKey) {
                try {
                    const audioUrl = await getMetaMediaUrl(mediaId, pageAccessToken)
                    const audioBuffer = await downloadMetaMedia(audioUrl, pageAccessToken)
                    const mimeType = message.audio?.mime_type || 'audio/ogg'
                    userText = await transcribeAudio(audioBuffer, mimeType, apiKey)
                } catch (audioErr: any) {
                    console.error('[WHATSAPP AUDIO ERROR]:', audioErr.message)
                }
            }
            if (!userText) userText = 'User sent a voice message.'
        } else if (messageType === 'image') {
            const mediaId = message.image?.id
            const caption = message.image?.caption || ''
            if (mediaId && pageAccessToken && apiKey) {
                try {
                    mediaUrl = await getMetaMediaUrl(mediaId, pageAccessToken)
                    const imageBuffer = await downloadMetaMedia(mediaUrl, pageAccessToken)
                    const base64Image = imageBuffer.toString('base64')
                    const mimeType = message.image?.mime_type || 'image/jpeg'
                    const visionPrompt = "Describe the products or items in this image in one concise sentence (e.g. 'A blue t-shirt'). If it is a payment receipt, extract the transaction ID and amount."
                    const imageDescription = await analyzeImage(base64Image, mimeType, visionPrompt, apiKey)
                    userText = imageDescription ? `[User sent image: ${imageDescription}] ${caption}`.trim() : (caption || 'User sent an image.')
                } catch (imgErr: any) {
                    console.error('[WHATSAPP IMAGE ERROR]:', imgErr.message)
                }
            }
            if (!userText) userText = caption || 'User sent an image.'
        } else if (messageType === 'video') {
            const mediaId = message.video?.id
            const caption = message.video?.caption || ''
            if (mediaId && pageAccessToken && apiKey) {
                try {
                    mediaUrl = await getMetaMediaUrl(mediaId, pageAccessToken)
                    const videoBuffer = await downloadMetaMedia(mediaUrl, pageAccessToken)
                    const videoRes = await analyzeVideoMessage({
                        videoBuffer,
                        mimeType: message.video?.mime_type || 'video/mp4',
                        caption,
                        groqApiKey: apiKey
                    })
                    userText = videoRes.combinedText
                } catch (vidErr: any) {
                    console.error('[WHATSAPP VIDEO ERROR]:', vidErr.message)
                }
            }
            if (!userText) userText = caption || 'User sent a video.'
        }

        customerName = value.contacts?.[0]?.profile?.name || `WhatsApp User (${from})`

        // 1. Save User Message to chat_history
        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: from,
            customer_name: customerName,
            role: 'user',
            content: userText,
            message_id: messageId
        })

        // 2. Dispatch to Clickify AI Agent 2.0 Engine
        const incomingEvent: IncomingAgentEvent = {
            channel: 'whatsapp',
            eventId: `wa-${messageId || Date.now()}`,
            customerId: from,
            customerName,
            messageId,
            text: userText,
            media: mediaUrl ? { type: 'image', url: mediaUrl } : undefined,
            timestamp: Date.now(),
            rawPayload: message
        }

        const agentRes = await runAgent(incomingEvent, agent)

        if (agentRes.aiPaused) {
            console.log(`[WHATSAPP DEBUG]: AI Auto-Pilot is PAUSED for customer ${from}.`)
            return { success: true, ai_paused: true }
        }

        const aiReply = agentRes.text || ''
        const imagesToSend = agentRes.imagesToSend || []
        const hasImages = imagesToSend.length > 0
        const tokens = agentRes.tokensUsed || 0

        // 3. Send Social Reaction Non-Blockingly
        if (agentRes.reaction?.shouldReact && agentRes.reaction?.emoji && messageId && pageAccessToken) {
            $fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${pageAccessToken}` },
                body: {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: from,
                    type: 'reaction',
                    reaction: { message_id: messageId, emoji: agentRes.reaction.emoji }
                }
            }).catch(e => console.warn('[WHATSAPP REACTION WARNING]:', e.message))
        }

        // 4. Send Product Images via WhatsApp Cloud API
        if (hasImages && imagesToSend.length > 0 && pageAccessToken) {
            for (const imgUrl of imagesToSend.slice(0, 3)) {
                await $fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${pageAccessToken}` },
                    body: {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: from,
                        type: 'image',
                        image: { link: imgUrl }
                    }
                }).catch(err => console.warn('[WHATSAPP IMAGE SEND ERROR]:', err.message))
            }
        }

        // 5. Send Text Reply
        if (aiReply && aiReply.trim() !== '' && pageAccessToken) {
            await $fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${pageAccessToken}` },
                body: {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: from,
                    type: 'text',
                    text: { body: aiReply }
                }
            }).catch(err => console.error('[WHATSAPP TEXT SEND ERROR]:', err.message))
        }

        // 6. Save Assistant Response to Chat History
        const historyContent = (hasImages && imagesToSend.length > 0)
            ? `${aiReply}\n${imagesToSend.map(u => `[IMAGE: ${u}]`).join('\n')}`
            : aiReply

        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: from,
            role: 'assistant',
            content: historyContent,
            images: imagesToSend,
            tokens_used: tokens
        })

        console.log(`[AGENT V2 WHATSAPP]: Replied to ${customerName} (${from}). State: ${agentRes.state}`)
        return { success: true, state: agentRes.state }
    } catch (e: any) {
        console.error('[WHATSAPP AGENT ERROR]:', e.message, e)
        return { success: false, error: e.message }
    }
})
