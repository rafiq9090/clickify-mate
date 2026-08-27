// server/api/agents/instagram.ts
import { decrypt } from '../../utils/encryption'
import { getApiKey } from '../../utils/settings'
import { runAgent } from '../../utils/agent/agent_orchestrator'
import type { IncomingAgentEvent } from '../../utils/agent/agent_types'
import { useSupabaseAdmin } from '../../utils/supabase'
import { checkAndRecordWebhookEvent } from '../../utils/agent/webhook_dedup'
import { verifyMetaSignature } from '../../utils/agent/webhook_auth'
import { analyzeImage } from '../../utils/agent/vision'

interface DownloadedMedia {
    buffer: Buffer
    contentType: string
}

async function downloadMediaFromUrl(mediaUrl: string, accessToken: string): Promise<DownloadedMedia> {
    const fetchMedia = async (url: string, useAuth: boolean): Promise<DownloadedMedia> => {
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        let finalUrl = url
        if (useAuth && accessToken) {
            const separator = url.includes('?') ? '&' : '?'
            finalUrl = `${url}${separator}access_token=${accessToken}`
        }
        
        const response = await fetch(finalUrl, { headers })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const contentType = response.headers.get('content-type') || ''
        return {
            buffer: Buffer.from(arrayBuffer),
            contentType
        }
    }

    try {
        return await fetchMedia(mediaUrl, true)
    } catch (error: any) {
        try {
            return await fetchMedia(mediaUrl, false)
        } catch (fallbackError: any) {
            throw new Error(`Failed to download Instagram media: ${fallbackError.message}`)
        }
    }
}

async function transcribeAudio(audioBuffer: Buffer, mimeType: string, apiKey: string): Promise<string> {
    let ext = 'ogg'
    const mimeLower = mimeType.toLowerCase()
    if (mimeLower.includes('mp3') || mimeLower.includes('mpeg')) ext = 'mp3'
    else if (mimeLower.includes('wav')) ext = 'wav'
    else if (mimeLower.includes('webm')) ext = 'webm'
    else if (mimeLower.includes('m4a') || mimeLower.includes('mp4') || mimeLower.includes('aac')) ext = 'm4a'

    const formData = new FormData()
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType })
    formData.append('file', blob, `voice.${ext}`)
    formData.append('model', 'whisper-large-v3')
    formData.append('prompt', 'Bengali, বাংলা, Banglish (Bangla written in English alphabets), and English speech from an Instagram customer.')

    const res = await $fetch<any>('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData
    })
    return res.text || ''
}

export default defineEventHandler(async (event) => {
    // 1. Webhook Handshake (GET)
    if (event.method === 'GET') {
        const query = getQuery(event)
        const mode = query['hub.mode']
        const token = query['hub.verify_token']
        const challenge = query['hub.challenge']

        const config = useRuntimeConfig()
        const verifyToken = config.public.verifyToken || process.env.VERIFY_TOKEN || 'clickify_secure_verify'

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[INSTAGRAM WEBHOOK]: Verification handshake successful!')
            return challenge
        }
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Invalid verify token' })
    }

    // 2. Incoming Webhook Event (POST)
    if (event.method === 'POST') {
        const rawBody = await readRawBody(event)
        if (!rawBody) {
            return { status: 'empty_body' }
        }

        // Verify Meta HMAC Signature if configured
        const appSecret = process.env.META_APP_SECRET || process.env.FB_APP_SECRET
        const signatureResult = verifyMetaSignature(event, rawBody, appSecret)
        if (!signatureResult.isValid) {
            console.warn(`[INSTAGRAM SECURITY WARN]: ${signatureResult.reason || 'Invalid webhook signature'}. Dropping request.`)
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Invalid signature' })
        }

        let body: any
        try {
            body = JSON.parse(rawBody)
        } catch {
            return { status: 'invalid_json' }
        }

        // Must be an instagram or page object
        if (body.object !== 'instagram' && body.object !== 'page') {
            return { status: 'ignored_object' }
        }

        const supabase = useSupabaseAdmin()
        if (!supabase || !supabase.from) {
            console.error('[INSTAGRAM FATAL]: Supabase database client unavailable')
            return { status: 'db_unavailable' }
        }

        const groqApiKey = await getApiKey('groq_api_key', 'groqApiKey')

        // Process entries
        for (const entry of body.entry || []) {
            const igAccountId = entry.id

            // Find matching active agent for this Instagram account
            const { data: agentList } = await supabase
                .from('agent_configs')
                .select('*')
                .in('platform', ['instagram', 'ig_comment'])
                .eq('external_id', igAccountId)
                .eq('is_active', true)

            const agent = agentList?.[0]

            if (!agent) {
                console.warn(`[INSTAGRAM AGENT ROUTING]: No active agent found for Instagram account ID: ${igAccountId}`)
                continue
            }

            let accessToken = ''
            try {
                accessToken = await decrypt(agent.encrypted_token)
            } catch (err: any) {
                console.error(`[INSTAGRAM AUTH ERROR]: Failed to decrypt agent token: ${err.message}`)
                continue
            }

            // ==========================================
            // CASE A: DIRECT MESSAGES (DMs) & STORY REPLIES
            // ==========================================
            if (Array.isArray(entry.messaging)) {
                for (const messagingItem of entry.messaging) {
                    const senderId = messagingItem.sender?.id
                    const recipientId = messagingItem.recipient?.id

                    // Avoid self-looping on outgoing bot messages
                    if (!senderId || senderId === igAccountId) continue

                    const messageId = messagingItem.message?.mid || `ig_msg_${Date.now()}`

                    // Event Deduplication
                    const isDuplicate = await checkAndRecordWebhookEvent({
                        agentId: agent.id,
                        channel: 'instagram',
                        messageId
                    })
                    if (isDuplicate) {
                        console.log(`[INSTAGRAM DEDUP]: Skipping duplicate message ${messageId}`)
                        continue
                    }

                    const messageObj = messagingItem.message || {}
                    let incomingText = messageObj.text || ''
                    const attachments = messageObj.attachments || []

                    // Handle Story Replies / Mentions
                    if (messageObj.reply_to?.story) {
                        const storyUrl = messageObj.reply_to.story.url || ''
                        incomingText = `[Customer replied to Instagram Story: ${storyUrl}] ${incomingText}`.trim()
                    }

                    // Handle Attachments (Audio Voice Notes & Photos)
                    if (attachments.length > 0) {
                        for (const att of attachments) {
                            const attType = att.type
                            const payloadUrl = att.payload?.url

                            if (payloadUrl) {
                                try {
                                    if (attType === 'audio' || attType === 'voice') {
                                        if (groqApiKey) {
                                            const downloaded = await downloadMediaFromUrl(payloadUrl, accessToken)
                                            const transcribed = await transcribeAudio(downloaded.buffer, downloaded.contentType, groqApiKey)
                                            if (transcribed) {
                                                incomingText = (incomingText + ' ' + transcribed).trim()
                                                console.log(`[INSTAGRAM VOICE TRANSCRIBED]: "${transcribed}"`)
                                            }
                                        }
                                    } else if (attType === 'image') {
                                        const downloaded = await downloadMediaFromUrl(payloadUrl, accessToken)
                                        const visionAnalysis = await analyzeImage(
                                            downloaded.buffer.toString('base64'),
                                            downloaded.contentType || 'image/jpeg',
                                            'Describe this product or analyze if it is a payment receipt.',
                                            groqApiKey || undefined
                                        )
                                        incomingText = (incomingText + `\n[Customer sent image: ${visionAnalysis || 'image received; no reliable description available'}]`).trim()
                                    }
                                } catch (mediaErr: any) {
                                    console.warn(`[INSTAGRAM MEDIA ERROR]: ${mediaErr.message}`)
                                }
                            }
                        }
                    }

                    if (!incomingText.trim()) continue

                    // Build canonical incoming event
                    const incomingEvent: IncomingAgentEvent = {
                        channel: 'instagram',
                        eventId: `ig_evt_${messageId}`,
                        customerId: senderId,
                        messageId,
                        text: incomingText,
                        timestamp: messagingItem.timestamp || Date.now()
                    }

                    // Run the Multi-Tenant AI Agent Orchestrator with RAG
                    const agentResult = await runAgent(incomingEvent, agent)

                    await supabase.from('chat_history').insert([
                        {
                            agent_id: agent.id,
                            user_external_id: senderId,
                            role: 'user',
                            content: incomingText,
                            message_id: messageId,
                            created_at: new Date(Number(messagingItem.timestamp || Date.now()) - 50).toISOString()
                        },
                        ...(agentResult.text ? [{
                            agent_id: agent.id,
                            user_external_id: senderId,
                            role: 'assistant',
                            content: agentResult.text,
                            images: agentResult.imagesToSend || [],
                            tokens_used: agentResult.tokensUsed || 0,
                            created_at: new Date(Number(messagingItem.timestamp || Date.now())).toISOString()
                        }] : [])
                    ])

                    if (agentResult.aiPaused || !agentResult.text) {
                        continue
                    }

                    // Dispatch text response back to customer on Instagram
                    try {
                        await $fetch(`https://graph.facebook.com/v19.0/me/messages`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: {
                                recipient: { id: senderId },
                                message: { text: agentResult.text }
                            }
                        })
                        console.log(`[INSTAGRAM DISPATCH SUCCESS]: Replied to ${senderId}`)

                        // If agent resolved product photos, dispatch them as media messages
                        if (Array.isArray(agentResult.imagesToSend) && agentResult.imagesToSend.length > 0) {
                            for (const imgUrl of agentResult.imagesToSend.slice(0, 3)) {
                                await $fetch(`https://graph.facebook.com/v19.0/me/messages`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        recipient: { id: senderId },
                                        message: {
                                            attachment: {
                                                type: 'image',
                                                payload: { url: imgUrl, is_reusable: true }
                                            }
                                        }
                                    }
                                }).catch((imgErr: any) => console.warn(`[INSTAGRAM IMAGE DISPATCH WARN]: ${imgErr.message}`))
                            }
                        }
                    } catch (dispatchErr: any) {
                        console.error(`[INSTAGRAM DISPATCH FAILED]: ${dispatchErr.message}`)
                    }
                }
            }

            // ==========================================
            // CASE B: COMMENTS ON POSTS & REELS (Comment-to-DM)
            // ==========================================
            if (Array.isArray(entry.changes)) {
                for (const change of entry.changes) {
                    if (change.field === 'comments') {
                        const commentVal = change.value || {}
                        const commentId = commentVal.id
                        const fromUser = commentVal.from || {}
                        const commentText = commentVal.text || ''

                        if (!commentId || fromUser.id === igAccountId || !commentText.trim()) continue

                        const isDuplicateComment = await checkAndRecordWebhookEvent({
                            agentId: agent.id,
                            channel: 'instagram_comment',
                            messageId: commentId
                        })
                        if (isDuplicateComment) continue

                        const incomingCommentEvent: IncomingAgentEvent = {
                            channel: 'instagram_comment',
                            eventId: `ig_cmt_${commentId}`,
                            customerId: fromUser.id,
                            customerName: fromUser.username || fromUser.name,
                            messageId: commentId,
                            text: commentText,
                            timestamp: Date.now()
                        }

                        const commentResult = await runAgent(incomingCommentEvent, agent)
                        await supabase.from('chat_history').insert([
                            {
                                agent_id: agent.id,
                                user_external_id: fromUser.id,
                                customer_name: fromUser.username || fromUser.name,
                                role: 'user',
                                content: commentText,
                                message_id: commentId,
                                created_at: new Date(Date.now() - 50).toISOString()
                            },
                            ...(commentResult.text ? [{
                                agent_id: agent.id,
                                user_external_id: fromUser.id,
                                customer_name: fromUser.username || fromUser.name,
                                role: 'assistant',
                                content: commentResult.text,
                                images: commentResult.imagesToSend || [],
                                tokens_used: commentResult.tokensUsed || 0,
                                created_at: new Date().toISOString()
                            }] : [])
                        ])
                        if (!commentResult.aiPaused && commentResult.text) {
                            // 1. Reply to public comment
                            try {
                                await $fetch(`https://graph.facebook.com/v19.0/${commentId}/replies`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        message: `Thanks @${fromUser.username || 'customer'}! We sent the details to your DM. 📩`
                                    }
                                }).catch((cErr: any) => console.warn(`[IG PUBLIC REPLY WARN]: ${cErr.message}`))

                                // 2. Send private DM with full sales info & checkout link
                                await $fetch(`https://graph.facebook.com/v19.0/me/messages`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        recipient: { comment_id: commentId },
                                        message: { text: commentResult.text }
                                    }
                                }).catch((dmErr: any) => console.warn(`[IG PRIVATE DM WARN]: ${dmErr.message}`))
                            } catch (err: any) {
                                console.error(`[INSTAGRAM COMMENT AUTOMATION ERROR]: ${err.message}`)
                            }
                        }
                    }
                }
            }
        }

        return { status: 'processed' }
    }

    return { status: 'method_not_allowed' }
})
