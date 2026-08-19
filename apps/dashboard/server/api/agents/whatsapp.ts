// server/api/agents/whatsapp.ts
import { decrypt } from '../../utils/encryption'
import { getApiKey } from '../../utils/settings'
import { runAgent } from '../../utils/agent/agent_orchestrator'
import type { IncomingAgentEvent } from '../../utils/agent/agent_types'
import { useSupabaseAdmin } from '../../utils/supabase'
import { checkAndRecordWebhookEvent } from '../../utils/agent/webhook_dedup'
import { verifyMetaSignature } from '../../utils/agent/webhook_auth'
import { analyzeImage } from '../../utils/agent/vision'

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
            const { data } = await supabase.from('agent_configs').select('*').eq('id', agentId).maybeSingle()
            agent = data
        }

        // 2. Try to find by Phone ID (Meta's ID)
        if (!agent && phoneNumberId) {
            const { data } = await supabase.from('agent_configs').select('*').eq('external_id', phoneNumberId).maybeSingle()
            agent = data
        }

        // 3. Fallback: Most recent WhatsApp agent
        if (!agent) {
            const { data } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('platform', 'whatsapp')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            agent = data
        }

        if (!agent) {
            console.error(`[WHATSAPP DEBUG V${VERSION}]: No WhatsApp agent found in DB.`)
            return { success: false }
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
        }

        const customerName = value.contacts?.[0]?.profile?.name || `WhatsApp User (${from})`

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
