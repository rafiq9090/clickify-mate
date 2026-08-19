// server/api/agents/telegram.ts
import { decrypt } from '../../utils/encryption'
import { generateAIReply, analyzeSentimentAndPickEmoji } from '../../utils/groq'
import { processMockOrderStockDeduction, getMockInventory, resolveIntelligentProductImages } from '../../utils/mock_shop'
import { getFileFromBackblaze } from '../../utils/backblaze'
import { runAgent } from '../../utils/agent/agent_orchestrator'
import { sendTelegramReaction } from '../../utils/agent/agent_reactions'
import { checkAndRecordWebhookEvent } from '../../utils/agent/webhook_dedup'
import { verifyTelegramSecret } from '../../utils/agent/webhook_auth'
import { analyzeImage } from '../../utils/agent/vision'
import type { IncomingAgentEvent } from '../../utils/agent/agent_types'

async function fetchImageBufferAndType(imageUrl: string): Promise<{ buffer: Buffer | null; contentType: string }> {
    if (!imageUrl) return { buffer: null, contentType: 'image/jpeg' }

    let imageBuffer: Buffer | null = null
    let contentType = 'image/jpeg'

    // 1. If it's a Backblaze B2 link (or /api/media/... proxy), stream binary bytes directly
    if (imageUrl.includes('.backblazeb2.com/') || imageUrl.startsWith('/api/media/')) {
        let b2Key = ''
        if (imageUrl.startsWith('/api/media/')) {
            b2Key = imageUrl.replace('/api/media/', '')
        } else if (imageUrl.includes('.backblazeb2.com/')) {
            const parts = imageUrl.split('.backblazeb2.com/')
            b2Key = parts[1] || ''
        }

        if (b2Key) {
            try {
                const s3Obj = await getFileFromBackblaze(b2Key)
                const stream = s3Obj.Body as any
                const chunks: Buffer[] = []
                for await (const chunk of stream) {
                    chunks.push(Buffer.from(chunk))
                }
                imageBuffer = Buffer.concat(chunks)
                contentType = s3Obj.ContentType || 'image/jpeg'
            } catch (b2Err: any) {
                console.warn(`[TELEGRAM B2 STREAM WARN]:`, b2Err.message)
            }
        }
    }

    // 2. If standard HTTP/HTTPS public URL, download binary buffer directly
    if (!imageBuffer && imageUrl.startsWith('http')) {
        try {
            const res = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })
            if (res.ok) {
                const arrayBuf = await res.arrayBuffer()
                imageBuffer = Buffer.from(arrayBuf)
                contentType = res.headers.get('content-type') || 'image/jpeg'
            }
        } catch (fetchErr: any) {
            console.warn(`[TELEGRAM FETCH PHOTO WARN]:`, fetchErr.message)
        }
    }

    return { buffer: imageBuffer, contentType }
}

async function sendTelegramPhotoReliable(chatId: string | number, imageUrl: string, botToken: string) {
    if (!imageUrl) return

    const { buffer: imageBuffer, contentType } = await fetchImageBufferAndType(imageUrl)

    // 1. Send binary stream via Telegram FormData
    if (imageBuffer) {
        try {
            const formData = new FormData()
            const blob = new Blob([new Uint8Array(imageBuffer)], { type: contentType })
            formData.append('chat_id', chatId.toString())
            formData.append('photo', blob, 'product.jpg')

            const res: any = await $fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                body: formData
            })
            console.log(`[TELEGRAM DEBUG]: Successfully sent binary photo to chat ${chatId}`)
            return res?.result ? [res.result] : []
        } catch (sendErr: any) {
            console.error('[TELEGRAM BINARY SEND PHOTO ERROR]:', sendErr.data || sendErr.message)
        }
    }

    // 2. Fallback: URL string
    try {
        const res: any = await $fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: { chat_id: chatId, photo: imageUrl }
        })
        console.log(`[TELEGRAM DEBUG]: Sent photo URL to chat ${chatId}`)
        return res?.result ? [res.result] : []
    } catch (urlErr: any) {
        console.error('[TELEGRAM SEND PHOTO URL ERROR]:', urlErr.data || urlErr.message)
        return []
    }
}

async function sendTelegramMediaGroupReliable(chatId: string | number, imageUrls: string[], botToken: string): Promise<any[]> {
    if (!imageUrls || imageUrls.length === 0) return []

    // If single image, send standard single photo
    if (imageUrls.length === 1 && imageUrls[0]) {
        const single = await sendTelegramPhotoReliable(chatId, imageUrls[0], botToken)
        return single || []
    }

    // Up to 10 photos per album in Telegram sendMediaGroup
    const targetUrls = Array.from(new Set(imageUrls.filter(Boolean))).slice(0, 10)

    try {
        const formData = new FormData()
        formData.append('chat_id', chatId.toString())

        const mediaArray: any[] = []

        for (let i = 0; i < targetUrls.length; i++) {
            const url = targetUrls[i]
            if (!url) continue
            const { buffer, contentType } = await fetchImageBufferAndType(url)

            if (buffer) {
                const attachName = `photo_${i}`
                const blob = new Blob([new Uint8Array(buffer)], { type: contentType })
                formData.append(attachName, blob, `product_${i}.jpg`)
                mediaArray.push({
                    type: 'photo',
                    media: `attach://${attachName}`
                })
            } else {
                mediaArray.push({
                    type: 'photo',
                    media: url
                })
            }
        }

        formData.append('media', JSON.stringify(mediaArray))

        const res: any = await $fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
            method: 'POST',
            body: formData
        })
        console.log(`[TELEGRAM DEBUG]: Successfully sent media group album (${targetUrls.length} photos) to chat ${chatId}`)
        return Array.isArray(res?.result) ? res.result : []
    } catch (albumErr: any) {
        console.warn(`[TELEGRAM MEDIA GROUP WARN]: Failed sendMediaGroup album, falling back to sequential delivery:`, albumErr.data || albumErr.message)
        const results: any[] = []
        for (const url of targetUrls) {
            const singleRes = await sendTelegramPhotoReliable(chatId, url, botToken)
            if (Array.isArray(singleRes)) results.push(...singleRes)
        }
        return results
    }
}

async function getTelegramFileBuffer(fileId: string, botToken: string) {
    const fileInfo = await $fetch<any>(`https://api.telegram.org/bot${botToken}/getFile`, {
        method: 'POST',
        body: { file_id: fileId }
    })

    if (!fileInfo.ok || !fileInfo.result?.file_path) {
        throw new Error('Failed to get file path from Telegram')
    }

    const filePath = fileInfo.result.file_path
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`
    const fileRes = await $fetch<any>(fileUrl, {
        responseType: 'arrayBuffer'
    })
    return Buffer.from(fileRes)
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
    const VERSION = "1.4.0-MEDIA-SUPPORT"

    if (event.method === 'GET') {
        return {
            status: 'AI Agent Service Active',
            version: VERSION,
            platform: 'Telegram'
        }
    }

    setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
    setResponseHeader(event, 'ngrok-skip-browser-warning', 'true')

    const body = await readBody(event)
    const message = body.message || body.edited_message
    if (!message) return { success: true }

    const isVoice = !!message.voice
    const isPhoto = !!message.photo && message.photo.length > 0
    const hasText = !!message.text

    if (!hasText && !isVoice && !isPhoto) {
        return { success: true }
    }

    // 1. Webhook Authentication (Telegram Secret Token)
    const secretCheck = verifyTelegramSecret(event)
    if (!secretCheck.isValid) {
        console.warn(`[TELEGRAM WEBHOOK AUTH REJECTED]: ${secretCheck.reason}`)
        throw createError({ statusCode: 401, statusMessage: `Unauthorized: ${secretCheck.reason}` })
    }

    const chatId = message.chat.id
    const messageId = message.message_id


    try {
        const apiKey = await getApiKey('groq_api_key', 'groqApiKey')
        const query = getQuery(event)
        const agentId = query.agent_id

        console.log(`[AGENT DEBUG V${VERSION}]: Incoming request for Agent ID: ${agentId}`)

        if (!apiKey) throw new Error('System configuration incomplete (Groq API Key missing)')
        if (!agentId) throw new Error('Unauthorized Webhook Call (Missing Agent ID)')

        const supabase = useSupabaseAdmin()
        let agent: any = null

        if (agentId) {
            const { data, error } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('id', agentId)
                .maybeSingle()

            if (!error && data) {
                agent = data
            }
        }

        if (!agent && message.chat?.id) {
            const botId = message.chat.id?.toString()
            const { data, error } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('external_id', botId)
                .maybeSingle()

            if (!error && data) {
                agent = data
            }
        }

        if (!agent) {
            const { data, error } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('platform', 'telegram')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (!error && data) {
                agent = data
            }
        }

        if (!agent) {
            console.error(`[AGENT DEBUG]: Agent ${agentId} not found in DB`)
            return { success: false, error: 'Agent configuration not found' }
        }

        // 2. Multi-Tenant Durable Webhook Deduplication
        if (messageId) {
            const isDuplicate = await checkAndRecordWebhookEvent({
                agentId: agent.id,
                channel: 'telegram',
                messageId
            })
            if (isDuplicate) {
                return { success: true, duplicate: true }
            }
        }


        // --- SMART FALLBACK: If current agent has no knowledge, find one for this user that does ---
        if (!agent.knowledge || agent.knowledge.length < 5) {
            console.log(`[AGENT DEBUG]: Primary agent ${agent.id} has no knowledge. Searching alternatives...`)

            // Priority 1: Search by User ID and Platform
            const { data: userFallback } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('user_id', agent.user_id)
                .eq('platform', agent.platform)
                .neq('knowledge', '')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (userFallback && userFallback.knowledge) {
                console.log(`[AGENT DEBUG]: Found User-level fallback knowledge: ${userFallback.id}`)
                agent = userFallback
            } else if (agent.external_id) {
                // Priority 2: Deep Sync by External ID (Bot ID)
                const { data: idFallback } = await supabase
                    .from('agent_configs')
                    .select('*')
                    .eq('external_id', agent.external_id)
                    .neq('knowledge', '')
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (idFallback && idFallback.knowledge) {
                    console.log(`[AGENT DEBUG]: Found ID-level deep sync knowledge: ${idFallback.id}`)
                    agent = idFallback
                }
            }
        }

        console.log(`[AGENT DEBUG V${VERSION}]: Knowledge Base Length: ${agent.knowledge?.length || 0} characters`)

        const botToken = await decrypt(agent.encrypted_token)
        console.log(`[AGENT DEBUG V${VERSION}]: Generating reply for ${chatId}`)

        let userText = message.text || ''
        let replyContext: any = null

        // --- PROCESS TELEGRAM REPLIED / QUOTED MESSAGE ---
        if (message.reply_to_message) {
            const repliedMsg = message.reply_to_message
            const repliedAuthor = [repliedMsg.from?.first_name, repliedMsg.from?.last_name].filter(Boolean).join(' ') || (repliedMsg.from?.is_bot ? 'AI Assistant' : 'User')
            const repliedText = repliedMsg.text || repliedMsg.caption || (repliedMsg.photo ? '[Product Photo]' : '')
            if (repliedText) {
                replyContext = {
                    author: repliedAuthor,
                    text: repliedText,
                    message_id: repliedMsg.message_id ? repliedMsg.message_id.toString() : null
                }
                userText = `[In reply to "${repliedText}"]: ${userText}`.trim()
                console.log(`[TELEGRAM DEBUG]: Customer replied to message #${repliedMsg.message_id} (${repliedAuthor}): "${repliedText}"`)
            }
        }

        // --- PROCESS MEDIA TYPES IF NECESSARY ---
        if (message.voice) {
            console.log(`[TELEGRAM DEBUG V${VERSION}]: Processing voice. File ID: ${message.voice.file_id}`)
            try {
                const audioBuffer = await getTelegramFileBuffer(message.voice.file_id, botToken)
                const mimeType = message.voice.mime_type || 'audio/ogg'
                userText = await transcribeAudio(audioBuffer, mimeType, apiKey)
                console.log(`[TELEGRAM DEBUG V${VERSION}]: Voice transcription: "${userText}"`)
            } catch (audioErr: any) {
                console.error('[TELEGRAM AUDIO EXCEPTION]:', audioErr.message)
            }
            if (!userText) {
                userText = 'User sent a voice message.'
            }
        } else if (message.photo && message.photo.length > 0) {
            const largestPhoto = message.photo[message.photo.length - 1]
            const caption = message.caption || ''
            console.log(`[TELEGRAM DEBUG V${VERSION}]: Processing image. File ID: ${largestPhoto.file_id}, Caption: ${caption}`)
            let imageDescription = ''
            try {
                const imageBuffer = await getTelegramFileBuffer(largestPhoto.file_id, botToken)
                const base64Image = imageBuffer.toString('base64')
                const mimeType = 'image/jpeg'
                const visionPrompt = "Describe the products or items in this image in one concise sentence (e.g. 'A blue t-shirt hanging on a rack'). If it is a payment receipt, extract the transaction ID and amount."
                imageDescription = await analyzeImage(base64Image, mimeType, visionPrompt, apiKey)
                console.log(`[TELEGRAM DEBUG V${VERSION}]: Image vision description: "${imageDescription}"`)
            } catch (imgErr: any) {
                console.error('[TELEGRAM IMAGE EXCEPTION]:', imgErr.message)
            }
            if (imageDescription) {
                userText = `[User sent image: ${imageDescription}] ${caption}`.trim()
            } else {
                userText = caption || 'User sent an image.'
            }
        }

        // 1. Fetch History (limit to last 24 hours to prevent stale conversations from bleeding into new ones)
        const historyTimeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: historyData } = await supabase
            .from('chat_history')
            .select('role, content')
            .eq('agent_id', agent.id)
            .eq('user_external_id', chatId.toString())
            .gte('created_at', historyTimeLimit)
            .order('created_at', { ascending: false })
            .limit(10)

        const history = (historyData || []).reverse()

        // --- FETCH OR CREATE LEAD FOR SESSION STATE ---
        const emailKey = `${chatId}@telegram.org`
        const { data: existingLeads } = await supabase
            .from('leads')
            .select('*')
            .eq('email', emailKey)
            .order('created_at', { ascending: false })
            .limit(1)

        let sessionLead = null
        let sessionState = { current_state: 'sales', collected_details: {} }

        if (existingLeads && existingLeads.length > 0) {
            const latestLead = existingLeads[0]
            const ageInMs = Date.now() - new Date(latestLead.created_at).getTime()
            if (ageInMs < 2 * 60 * 60 * 1000) { // 2 hours active session window
                sessionLead = latestLead
                sessionState = {
                    current_state: latestLead.data?.current_state || 'sales',
                    collected_details: latestLead.data?.collected_details || {}
                }
            }
        }

        // --- EXTRACT CUSTOMER NAME & PROFILE PHOTO ---
        const fromUser = message.from || {}
        const customerName = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') || (fromUser.username ? `@${fromUser.username}` : `Telegram User #${chatId.toString().slice(-6)}`)
        let customerAvatar = ''
        if (fromUser.id && botToken) {
            try {
                const photoRes: any = await $fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos`, {
                    method: 'POST',
                    body: { user_id: fromUser.id, limit: 1 }
                }).catch(() => null)
                const fileId = photoRes?.result?.photos?.[0]?.[0]?.file_id
                if (fileId) {
                    const fileInfo: any = await $fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
                        method: 'POST',
                        body: { file_id: fileId }
                    }).catch(() => null)
                    if (fileInfo?.result?.file_path) {
                        customerAvatar = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`
                    }
                }
            } catch (e) {
                // Ignore profile photo errors
            }
        }

        // 2. Save User Message with message_id and reply_to context
        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: chatId.toString(),
            customer_name: customerName,
            customer_avatar: customerAvatar,
            role: 'user',
            content: userText,
            message_id: message.message_id ? message.message_id.toString() : null,
            reply_to: replyContext
        })

        // Check if owner has paused AI auto-reply for this customer or if agent is inactive
        if (sessionLead?.data?.ai_disabled === true || agent.is_active === false) {
            console.log(`[TELEGRAM DEBUG]: AI Auto-Pilot is PAUSED for customer ${chatId}. Saved message to inbox. Skipping AI generation.`)
            return { success: true, ai_paused: true }
        }

        // --- Clickify AI Agent 2.0 Engine Execution ---
        const incomingEvent: IncomingAgentEvent = {
            channel: 'telegram',
            eventId: `tg-${message.message_id || Date.now()}`,
            customerId: chatId.toString(),
            customerName,
            customerAvatar,
            messageId: message.message_id ? message.message_id.toString() : '',
            text: userText,
            replyTo: replyContext,
            timestamp: Date.now(),
            rawPayload: message
        }

        const agentRes = await runAgent(incomingEvent, agent)

        if (agentRes.aiPaused) {
            return { success: true, ai_paused: true }
        }

        const aiReply = agentRes.text || ''
        const imagesToSend = agentRes.imagesToSend || []
        const hasImages = imagesToSend.length > 0
        const tokens = agentRes.tokensUsed || 0

        // 1. Send Reaction (Instant Feedback)
        if (agentRes.reaction?.shouldReact && agentRes.reaction?.emoji && message.message_id) {
            sendTelegramReaction(chatId, message.message_id, agentRes.reaction.emoji, botToken)
        }

        let sentMessageId: string | null = null
        // 2. Send Text Reply
        if (aiReply && aiReply.trim() !== '') {
            try {
                const sendRes: any = await $fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    body: { chat_id: chatId, text: aiReply }
                })
                if (sendRes?.result?.message_id) {
                    sentMessageId = sendRes.result.message_id.toString()
                }
            } catch (sendErr: any) {
                console.warn(`[TELEGRAM SEND WARNING]: Failed to send message via Telegram API:`, sendErr.message)
            }
        }

        // 3. Send Images (MediaGroup Album for 2-3 images, single photo if 1)
        let mediaMessageIds: string[] = []
        if (hasImages && imagesToSend.length > 0) {
            const mediaRes = await sendTelegramMediaGroupReliable(chatId, imagesToSend, botToken)
            if (Array.isArray(mediaRes)) {
                mediaMessageIds = mediaRes.map(m => m.message_id ? m.message_id.toString() : '').filter(Boolean)
            }
        }

        // 4. Save AI Reply (Cleaned) with Exact Tokens, Attached Images & Telegram Message IDs
        const historyContent = (hasImages && imagesToSend.length > 0)
            ? `${aiReply}\n${imagesToSend.map(u => `[IMAGE: ${u}]`).join('\n')}`
            : aiReply

        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: chatId.toString(),
            customer_name: customerName,
            customer_avatar: customerAvatar,
            role: 'assistant',
            content: historyContent,
            images: imagesToSend,
            tokens_used: tokens,
            message_id: sentMessageId,
            media_message_ids: mediaMessageIds
        })

        console.log(`[AGENT V2 TELEGRAM]: Replied to ${customerName} (${chatId}). State: ${agentRes.state}, Repaired: ${agentRes.repaired || false}`)
return { success: true }

    } catch (e: any) {
        console.error(`[TELEGRAM AGENT ERROR V${VERSION}]:`, e.message || e.statusMessage || String(e))
        console.error(e)
        return { success: false, error: e.message || e.statusMessage || String(e) }
    }
})
