// server/api/agents/telegram.ts
import { decrypt } from '../../utils/encryption'
import { generateAIReply, analyzeSentimentAndPickEmoji } from '../../utils/groq'
import { getFileFromBackblaze } from '../../utils/backblaze'
import { runAgent } from '../../utils/agent/agent_orchestrator'
import { sendTelegramReaction } from '../../utils/agent/agent_reactions'
import { checkAndRecordWebhookEvent } from '../../utils/agent/webhook_dedup'
import { verifyTelegramSecret } from '../../utils/agent/webhook_auth'
import { analyzeImage } from '../../utils/agent/vision'
import { analyzeVideoMessage } from '../../utils/agent/video_processor'
import type { IncomingAgentEvent } from '../../utils/agent/agent_types'

function safeTelegramError(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error || 'Unknown Telegram error')
    return raw.replace(/bot[^/\s"']+/gi, 'bot[REDACTED]').slice(0, 500)
}

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

async function sendTelegramMessageWithRetry(
    chatId: number | string,
    text: string,
    botToken: string,
    retries = 3
): Promise<boolean> {
    if (!text || !text.trim()) return true
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await $fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                body: {
                    chat_id: chatId,
                    text: text
                },
                timeout: 10000
            })
            return true
        } catch (err: any) {
            console.warn(`[TELEGRAM SEND ATTEMPT ${attempt} FAILED]:`, safeTelegramError(err))
            if (attempt === retries) {
                console.error(`[TELEGRAM SEND FINAL FAILURE]:`, safeTelegramError(err))
                return false
            }
            await new Promise(resolve => setTimeout(resolve, attempt * 600))
        }
    }
    return false
}

async function sendTelegramMediaGroupReliable(
    chatId: number | string,
    imageUrls: string[],
    botToken: string
): Promise<any[]> {
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
    const VERSION = "2.0.0-VIDEO-ENABLED"

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
    const isVideo = !!(message.video || message.video_note || message.animation)
    const hasText = !!message.text

    if (!hasText && !isVoice && !isPhoto && !isVideo) {
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
        const apiKey = await getApiKey('groq_api_key', 'groqApiKey') || ''
        const query = getQuery(event)
        const agentId = query.agent_id

        console.log(`[AGENT DEBUG V${VERSION}]: Incoming request for Agent ID: ${agentId}`)

        if (!agentId) throw new Error('Unauthorized Webhook Call (Missing Agent ID)')

        const supabase = useSupabaseAdmin()
        let agent: any = null

        if (agentId) {
            const { data, error } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('id', agentId)
                .eq('platform', 'telegram')
                .eq('is_active', true)
                .maybeSingle()

            if (!error && data) {
                agent = data
            }
        }

        if (!agent) {
            console.error(`[AGENT DEBUG]: Agent ${agentId} not found in DB`)
            throw createError({ statusCode: 404, statusMessage: 'Active Telegram agent configuration not found' })
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

        console.log(`[AGENT DEBUG V${VERSION}]: Knowledge Base Length: ${agent.knowledge?.length || 0} characters`)

        // 0. ZERO-TOKEN GUARD: CHECK IF AI AUTO-PILOT IS PAUSED / STOPPED FOR THIS CUSTOMER
        const emailKey = `${chatId}@telegram.org`
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
            console.log(`[AGENT SILENT MODE]: AI Auto-Pilot is PAUSED for customer ${chatId}. Skipping all LLM, vision, and speech inference (0 tokens consumed).`)

            let rawUserText = message.text || message.caption || ''
            if (!rawUserText) {
                if (message.voice) rawUserText = '[Voice Message]'
                else if (message.photo) rawUserText = '[Photo Attachment]'
                else if (message.video || message.video_note) rawUserText = '[Video Attachment]'
                else rawUserText = '[Attachment]'
            }

            const fromObj = message.from || {}
            const customerName = [fromObj.first_name, fromObj.last_name].filter(Boolean).join(' ') || (fromObj.username ? `@${fromObj.username}` : `Customer #${chatId.toString().slice(0, 6)}`)

            // Insert into chat_history so it appears live in the Dashboard Live Inbox for manual reply
            await supabase.from('chat_history').insert([
                {
                    agent_id: agent.id,
                    user_external_id: chatId.toString(),
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

        // --- PROCESS MEDIA TYPES (VOICE, PHOTO, VIDEO) ---
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
        } else if (message.video || message.video_note || message.animation) {
            const vid = message.video || message.video_note || message.animation
            const caption = message.caption || ''
            console.log(`[TELEGRAM DEBUG V${VERSION}]: Processing video. File ID: ${vid.file_id}, Duration: ${vid.duration || 'N/A'}s`)
            try {
                let thumbnailBuffer: Buffer | undefined
                const thumbId = vid.thumbnail?.file_id || vid.thumb?.file_id
                if (thumbId) {
                    thumbnailBuffer = await getTelegramFileBuffer(thumbId, botToken)
                }

                // Check if video is short/lightweight (<= 60s & <= 20MB) for audio transcription
                const isHeavy = Boolean((vid.duration && vid.duration > 60) || (vid.file_size && vid.file_size > 20 * 1024 * 1024))
                let videoBuffer: Buffer | undefined
                if (vid.file_id) {
                    try {
                        const fileInfo = await $fetch<any>(`https://api.telegram.org/bot${botToken}/getFile`, {
                            method: 'POST',
                            body: { file_id: vid.file_id }
                        })
                        if (fileInfo?.ok && fileInfo.result?.file_path) {
                            // Do not persist Telegram file URLs: they contain the bot token.
                        }
                    } catch (fErr) {}
                }

                if (!isHeavy && !videoBuffer && vid.file_id) {
                    videoBuffer = await getTelegramFileBuffer(vid.file_id, botToken).catch(() => undefined)
                }

                const videoRes = await analyzeVideoMessage({
                    videoBuffer,
                    thumbnailBuffer,
                    mimeType: vid.mime_type || 'video/mp4',
                    duration: vid.duration,
                    fileSize: vid.file_size,
                    caption,
                    groqApiKey: apiKey
                })

                userText = videoRes.combinedText
                console.log(`[TELEGRAM DEBUG V${VERSION}]: Video analysis: "${userText}" (Heavy: ${isHeavy})`)
            } catch (vidErr: any) {
                console.error('[TELEGRAM VIDEO EXCEPTION]:', vidErr.message)
                userText = caption || 'User sent a video.'
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
                        // Telegram file URLs contain the bot token and must not be stored.
                        customerAvatar = ''
                    }
                }
            } catch (e) {
                // Ignore profile photo errors
            }
        }

        // 2. DISPATCH TO CLICKIFY AI AGENT 2.0 ORCHESTRATOR
        const agentEvent: IncomingAgentEvent = {
            channel: 'telegram',
            eventId: `tg_${chatId}_${messageId}_${Date.now()}`,
            customerId: chatId.toString(),
            customerName,
            customerAvatar,
            messageId: messageId ? messageId.toString() : Date.now().toString(),
            text: userText,
            media: (message.photo || isVoice || isVideo) ? {
                type: isVoice ? 'audio' : (isVideo ? 'video' : 'image')
            } : undefined,
            replyTo: replyContext ? {
                messageId: replyContext.message_id,
                text: replyContext.text,
                author: replyContext.author
            } : undefined,
            timestamp: Date.now(),
            rawPayload: body
        }

        const agentResult = await runAgent(agentEvent, agent)

        if (agentResult.aiPaused) {
            if (agentResult.text) {
                await sendTelegramMessageWithRetry(chatId, agentResult.text, botToken)
            }

            // Save incoming user message to chat_history so it appears live in Inbox
            await supabase.from('chat_history').insert([
                {
                    agent_id: agent.id,
                    user_external_id: chatId.toString(),
                    customer_name: customerName,
                    customer_avatar: customerAvatar,
                    role: 'user',
                    content: userText,
                    created_at: new Date().toISOString()
                },
                ...(agentResult.text ? [{
                    agent_id: agent.id,
                    user_external_id: chatId.toString(),
                    customer_name: customerName,
                    customer_avatar: customerAvatar,
                    role: 'assistant',
                    content: agentResult.text,
                    created_at: new Date().toISOString()
                }] : [])
            ])

            return { success: true, aiPaused: true }
        }

        const reply = agentResult.text

        // 3. SEND AGENT REACTION (IF DECIDED)
        if (agentResult.reaction && agentResult.reaction.shouldReact && agentResult.reaction.emoji) {
            sendTelegramReaction(chatId, messageId, agentResult.reaction.emoji, botToken).catch(() => {})
        }

        // 4. SEND RESPONSE TEXT BACK TO TELEGRAM
        if (reply) {
            const delivered = await sendTelegramMessageWithRetry(chatId, reply, botToken)
            if (!delivered) {
                throw new Error('Telegram delivery failed after retries')
            }
        }

        // 5. SEND PRODUCT IMAGES (ALBUM / SINGLE) IF RESOLVED BY AGENT
        if (agentResult.imagesToSend && agentResult.imagesToSend.length > 0) {
            try {
                await sendTelegramMediaGroupReliable(chatId, agentResult.imagesToSend, botToken)
            } catch (err: any) {
                console.error('[TELEGRAM AGENT IMAGE SEND ERROR]:', err.message)
            }
        }

        // 6. SAVE CHAT HISTORY (User Message + Assistant Response)
        const nowMs = Date.now()
        await supabase.from('chat_history').insert([
            {
                agent_id: agent.id,
                user_external_id: chatId.toString(),
                customer_name: customerName,
                role: 'user',
                content: userText,
                created_at: new Date(nowMs - 50).toISOString()
            },
            {
                agent_id: agent.id,
                user_external_id: chatId.toString(),
                customer_name: customerName,
                role: 'assistant',
                content: reply,
                created_at: new Date(nowMs).toISOString()
            }
        ])

        console.log(`[AGENT V2 TELEGRAM]: Replied to ${customerName} (${chatId}). State: ${agentResult.state}, Repaired: ${agentResult.repaired || false}`)
        return { success: true }

    } catch (err: any) {
        const safeError = safeTelegramError(err)
        console.error(`[TELEGRAM AGENT ERROR V${VERSION}]:`, safeError)
        if (err?.statusCode) throw err
        throw createError({ statusCode: 502, statusMessage: 'Telegram message processing or delivery failed', data: { error: safeError } })
    }
})
