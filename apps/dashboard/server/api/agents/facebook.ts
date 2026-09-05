// server/api/agents/facebook.ts
import { decrypt } from '../../utils/encryption'
import { getApiKey } from '../../utils/settings'
import { runAgent } from '../../utils/agent/agent_orchestrator'
import type { IncomingAgentEvent } from '../../utils/agent/agent_types'
import { useSupabaseAdmin } from '../../utils/supabase'
import { checkAndRecordWebhookEvent } from '../../utils/agent/webhook_dedup'
import { verifyMetaSignature } from '../../utils/agent/webhook_auth'
import { analyzeImage } from '../../utils/agent/vision'
import { analyzeVideoMessage } from '../../utils/agent/video_processor'
import { analyzeCommentToxicity } from '../../utils/agent/comment_moderator'

const postCaptionCache = new Map<string, { message: string; timestamp: number }>()

async function fetchFacebookPostCaption(postId: string, pageAccessToken: string): Promise<string> {
    if (!postId || !pageAccessToken) return ''
    const cached = postCaptionCache.get(postId)
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 30) {
        return cached.message
    }
    try {
        const res: any = await $fetch(`https://graph.facebook.com/v19.0/${postId}?fields=message&access_token=${pageAccessToken}`)
        const message = res?.message || ''
        postCaptionCache.set(postId, { message, timestamp: Date.now() })
        return message
    } catch {
        return ''
    }
}

interface DownloadedMedia {
    buffer: Buffer
    contentType: string
}

async function downloadMediaFromUrl(mediaUrl: string, pageAccessToken: string): Promise<DownloadedMedia> {
    const fetchMedia = async (url: string, useAuth: boolean): Promise<DownloadedMedia> => {
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        let finalUrl = url
        if (useAuth && pageAccessToken) {
            const separator = url.includes('?') ? '&' : '?'
            finalUrl = `${url}${separator}access_token=${pageAccessToken}`
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
            throw new Error(`Failed to download media: ${fallbackError.message}`)
        }
    }
}

async function transcribeAudio(audioBuffer: Buffer, mimeType: string, apiKey: string) {
    let ext = 'ogg'
    const mimeLower = mimeType.toLowerCase()
    if (mimeLower.includes('mp3') || mimeLower.includes('mpeg')) ext = 'mp3'
    else if (mimeLower.includes('wav')) ext = 'wav'
    else if (mimeLower.includes('webm')) ext = 'webm'
    else if (mimeLower.includes('m4a') || mimeLower.includes('x-m4a') || mimeLower.includes('mp4') || mimeLower.includes('aac')) ext = 'm4a'

    const formData = new FormData()
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType })
    formData.append('file', blob, `voice.${ext}`)
    formData.append('model', 'whisper-large-v3')
    formData.append('prompt', 'Bengali, বাংলা, Banglish (Bangla written in English alphabets), and English speech from a customer.')

    const res = await $fetch<any>('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData
    })
    return res.text || ''
}


function renderPrivacyComment(options: {
    senderName: string
    emojiAllowed: boolean
    sentPrivateSuccess: boolean
}): string {
    const { senderName, emojiAllowed, sentPrivateSuccess } = options
    const emoji = emojiAllowed ? ' 😊' : ''
    if (sentPrivateSuccess) {
        return `প্রিয় ${senderName}, আপনার গোপনীয়তা ও সুরক্ষার স্বার্থে বিস্তারিত তথ্য ইনবক্সে পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স চেক করুন। ধন্যবাদ!${emoji}`
    } else {
        return `প্রিয় ${senderName}, আপনার গোপনীয়তা ও সুরক্ষার স্বার্থে অর্ডারের তথ্যের জন্য অনুগ্রহ করে আমাদের পেইজে একটি সরাসরি মেসেজ (Inbox) পাঠান। ধন্যবাদ!${emoji}`
    }
}

export default defineEventHandler(async (event) => {
    const VERSION = '2.0.0-HARDENED-ENGINE'

    // 1. Webhook Handshake (GET)
    if (event.method === 'GET') {
        const query = getQuery(event)
        const mode = query['hub.mode']
        const token = query['hub.verify_token']
        const challenge = query['hub.challenge']

        const config = useRuntimeConfig()
        const verifyToken = config.public.verifyToken || (process.env.NODE_ENV === 'production' ? '' : 'papersnap_secure_verify')

        if (mode === 'subscribe' && verifyToken && token === verifyToken) {
            return challenge
        }
        if (mode === 'subscribe') {
            console.warn(`[FACEBOOK WEBHOOK HANDSHAKE REJECTED]: Invalid or unconfigured verify token.`)
            throw createError({ statusCode: 403, statusMessage: 'Webhook verification token mismatch' })
        }
        return { status: 'Facebook Messenger & Page Agent Active', version: VERSION }
    }

    // 2. Webhook Signature Verification (POST)
    const rawBody = await readRawBody(event) || ''
    const sigCheck = verifyMetaSignature(event, rawBody)
    if (!sigCheck.isValid) {
        console.warn(`[FACEBOOK WEBHOOK AUTH REJECTED]: ${sigCheck.reason}`)
        throw createError({
            statusCode: 401,
            statusMessage: `Invalid webhook signature: ${sigCheck.reason}`
        })
    }

    const body = await readBody(event)
    const query = getQuery(event)
    const agentId = query.agent_id

    const entry = body?.entry?.[0]
    if (!entry) return { success: true }

    const pageId = entry.id
    const supabase = useSupabaseAdmin()

    // Find agent by ID or Page ID (supports facebook, messenger, fb_comment)
    let agent = null
    const fbPlatforms = ['facebook', 'messenger', 'fb_comment']
    if (agentId) {
        const { data } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('id', agentId)
            .in('platform', fbPlatforms)
            .eq('is_active', true)
            .maybeSingle()
        agent = data
    }
    if (!agent && pageId) {
        const { data } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('external_id', pageId)
            .in('platform', fbPlatforms)
            .eq('is_active', true)
            .maybeSingle()
        agent = data
    }

    if (!agent) {
        console.error(`[FACEBOOK DEBUG V${VERSION}]: No active Facebook/Messenger agent found in DB for Page ID ${pageId} (agentId: ${agentId || 'none'}).`)
        throw createError({ statusCode: 404, statusMessage: 'No matching active Facebook agent' })
    }

    const pageAccessToken = await decrypt(agent.encrypted_token)
    const apiKey = await getApiKey('groq_api_key', 'groqApiKey')
    const emojiAllowed = agent.agent_behavior?.emoji_allowed !== false && agent.persona_settings?.emoji_allowed !== false

    // ==========================================
    // A. HANDLE MESSENGER DIRECT MESSAGES
    // ==========================================
    if (entry.messaging && Array.isArray(entry.messaging) && entry.messaging.length > 0) {
        const messagingEvent = entry.messaging[0]
        const senderId = messagingEvent.sender?.id
        const recipientId = messagingEvent.recipient?.id
        const message = messagingEvent.message

        if (!message || message.is_echo || !senderId || senderId === pageId) {
            return { success: true }
        }

        const messageId = message.mid
        const isDuplicate = await checkAndRecordWebhookEvent({
            agentId: agent.id,
            channel: 'messenger',
            messageId
        })
        if (isDuplicate) {
            return { success: true, duplicate: true }
        }

        // 0. ZERO-TOKEN GUARD: CHECK IF AI AUTO-PILOT IS PAUSED / STOPPED FOR THIS CUSTOMER
        const emailKey = `${senderId}@facebook.org`
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
            console.log(`[AGENT SILENT MODE]: AI Auto-Pilot is PAUSED for Messenger customer ${senderId}. Skipping all LLM, vision, and speech inference (0 tokens consumed).`)

            let rawUserText = message.text || ''
            if (!rawUserText && message.attachments && message.attachments.length > 0) {
                const attType = message.attachments[0].type
                rawUserText = `[${attType} attachment]`
            }

            await supabase.from('chat_history').insert([
                {
                    agent_id: agent.id,
                    user_external_id: senderId,
                    role: 'user',
                    content: rawUserText || '[Message]',
                    created_at: new Date().toISOString()
                }
            ])

            return {
                success: true,
                aiPaused: true,
                message: 'AI paused for this customer. 0 tokens consumed. Routed to Live Inbox.'
            }
        }

        let userText = message.text || ''
        let mediaUrl = ''

        // Process attachments (Voice Note or Image)
        if (message.attachments && message.attachments.length > 0) {
            const attachment = message.attachments[0]
            const attachmentType = attachment.type
            const payload = attachment.payload || {}

            if (attachmentType === 'audio' && payload.url && pageAccessToken && apiKey) {
                try {
                    const audioMedia = await downloadMediaFromUrl(payload.url, pageAccessToken)
                    userText = await transcribeAudio(audioMedia.buffer, audioMedia.contentType || 'audio/ogg', apiKey)
                } catch (audioErr: any) {
                    console.error('[FACEBOOK AUDIO ERROR]:', audioErr.message)
                }
                if (!userText) userText = 'User sent a voice message.'
            } else if (attachmentType === 'image' && payload.url && pageAccessToken && apiKey) {
                try {
                    mediaUrl = payload.url
                    const imgMedia = await downloadMediaFromUrl(mediaUrl, pageAccessToken)
                    const base64Image = imgMedia.buffer.toString('base64')
                    const visionPrompt = "Describe the products or items in this image in one concise sentence (e.g. 'A blue denim jacket'). If it is a payment receipt, extract the transaction ID and amount."
                    const imageDescription = await analyzeImage(base64Image, imgMedia.contentType || 'image/jpeg', visionPrompt, apiKey)
                    userText = imageDescription ? `[User sent image: ${imageDescription}]` : 'User sent an image.'
                } catch (imgErr: any) {
                    console.error('[FACEBOOK IMAGE ERROR]:', imgErr.message)
                }
                if (!userText) userText = 'User sent an image.'
            } else if (attachmentType === 'video' && payload.url && pageAccessToken && apiKey) {
                try {
                    mediaUrl = payload.url
                    const vidMedia = await downloadMediaFromUrl(mediaUrl, pageAccessToken)
                    const videoRes = await analyzeVideoMessage({
                        videoBuffer: vidMedia.buffer,
                        mimeType: vidMedia.contentType || 'video/mp4',
                        groqApiKey: apiKey
                    })
                    userText = videoRes.combinedText
                } catch (vidErr: any) {
                    console.error('[FACEBOOK VIDEO ERROR]:', vidErr.message)
                }
                if (!userText) userText = 'User sent a video.'
            }
        }

        // Fetch Sender Profile Name & Avatar
        let senderProfileName = `Facebook User (${senderId})`
        let senderAvatar = ''
        if (pageAccessToken) {
            try {
                const profileRes = await $fetch<any>(`https://graph.facebook.com/v19.0/${senderId}?fields=first_name,last_name,profile_pic&access_token=${pageAccessToken}`)
                if (profileRes.first_name || profileRes.last_name) {
                    senderProfileName = `${profileRes.first_name || ''} ${profileRes.last_name || ''}`.trim()
                    senderAvatar = profileRes.profile_pic || ''
                }
            } catch (e) {}
        }

        // Save User Message
        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: senderId,
            customer_name: senderProfileName,
            customer_avatar: senderAvatar,
            role: 'user',
            content: userText,
            message_id: messageId
        })

        // Dispatch to Agent 2.0 Engine
        const incomingEvent: IncomingAgentEvent = {
            channel: 'messenger',
            eventId: `fb-${messageId || Date.now()}`,
            customerId: senderId,
            customerName: senderProfileName,
            customerAvatar: senderAvatar,
            messageId,
            text: userText,
            media: mediaUrl ? { type: 'image', url: mediaUrl } : undefined,
            timestamp: Date.now(),
            rawPayload: messagingEvent
        }

        const agentRes = await runAgent(incomingEvent, agent)

        if (agentRes.aiPaused) {
            return { success: true, ai_paused: true }
        }

        const aiReply = agentRes.text || ''
        const imagesToSend = agentRes.imagesToSend || []
        const hasImages = imagesToSend.length > 0
        const tokens = agentRes.tokensUsed || 0

        // 1. Send Messenger Reaction
        if (agentRes.reaction?.shouldReact && agentRes.reaction?.emoji && messageId && pageAccessToken) {
            const messengerMap: any = { '👍': '👍', '❤️': '❤️', '😂': '😄', '😮': '😮', '😟': '😢', '🚨': '😡', '🤔': '👍' }
            const mappedEmoji = messengerMap[agentRes.reaction.emoji] || '👍'
            $fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                method: 'POST',
                body: {
                    recipient: { id: senderId },
                    sender_action: 'react',
                    payload: { message_id: messageId, reaction: mappedEmoji }
                }
            }).catch(() => {})
        }

        // 2. Send Media Gallery / Images
        if (hasImages && pageAccessToken) {
            for (const imgUrl of imagesToSend.slice(0, 3)) {
                await $fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                    method: 'POST',
                    body: {
                        recipient: { id: senderId },
                        message: {
                            attachment: {
                                type: 'image',
                                payload: { url: imgUrl, is_reusable: true }
                            }
                        }
                    }
                }).catch(err => console.error('[FB IMAGE SEND ERROR]:', err.message))
            }
        }

        // 3. Send Text Response with Quick Reply Action Buttons
        if (aiReply && pageAccessToken) {
            const messagePayload: any = { text: aiReply }

            if (agentRes.state === 'ORDER_CONFIRMED') {
                messagePayload.quick_replies = [
                    { content_type: 'text', title: '🛍️ আরো পণ্য দেখুন', payload: 'MORE_PRODUCTS' },
                    { content_type: 'text', title: '📦 অর্ডার ট্র্যাক করুন', payload: 'TRACK_ORDER' }
                ]
            } else if (agentRes.state === 'COLLECT_PHONE' || agentRes.state === 'COLLECT_ADDRESS') {
                messagePayload.quick_replies = [
                    { content_type: 'text', title: '✍️ অর্ডার বাতিল করুন', payload: 'CANCEL_ORDER' }
                ]
            }

            await $fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                method: 'POST',
                body: {
                    recipient: { id: senderId },
                    message: messagePayload
                }
            }).catch(err => console.error('[FB TEXT SEND ERROR]:', err.message))
        }

        // 4. Save Assistant Message to chat_history
        const historyContent = hasImages ? `${aiReply}\n[Attached ${imagesToSend.length} product images]`.trim() : aiReply
        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: senderId,
            role: 'assistant',
            content: historyContent,
            images: imagesToSend,
            tokens_used: tokens
        })

        console.log(`[AGENT V2 MESSENGER]: Replied to ${senderProfileName} (${senderId}). State: ${agentRes.state}`)
        return { success: true, state: agentRes.state }
    }

    // ==========================================
    // B. HANDLE FACEBOOK PAGE POST COMMENTS (Public & Private Separation)
    // ==========================================
    if (entry.changes && Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
            if (change.field === 'feed' && change.value?.item === 'comment' && change.value?.verb === 'add') {
                const commentValue = change.value
                const commentId = commentValue.comment_id
                if (!commentId) continue

                const isDuplicate = await checkAndRecordWebhookEvent({
                    agentId: agent.id,
                    channel: 'fb_comment',
                    messageId: commentId
                })
                if (isDuplicate) continue

                const senderId = commentValue.from?.id
                const senderName = commentValue.from?.name || `Facebook User (${senderId})`
                const senderAvatar = pageAccessToken
                    ? `https://graph.facebook.com/v19.0/${senderId}/picture?type=normal&access_token=${pageAccessToken}`
                    : ''
                const commentText = commentValue.message || ''

                if (!senderId || senderId === pageId || !commentText) continue

                // 📖 Fetch & Cache Post Caption for Context Understanding
                const postId = commentValue.post_id || commentValue.parent_id || ''
                const postCaption = commentValue.post?.message || (await fetchFacebookPostCaption(postId, pageAccessToken))

                // 🎯 1. Specific Post Targeting Scope Filters
                const commentScope = agent.agent_behavior?.fb_comment_scope || 'all_posts'
                if (commentScope === 'specific_posts') {
                    const rawTargetIds = agent.agent_behavior?.fb_target_post_ids || ''
                    const targetIds = Array.isArray(rawTargetIds)
                        ? rawTargetIds
                        : String(rawTargetIds).split(',').map((s: string) => s.trim()).filter(Boolean)
                    if (targetIds.length > 0 && !targetIds.some((id: string) => postId.includes(id))) {
                        console.log(`[FB POST SCOPE]: Skipping comment on Post ${postId} (not in specified target post IDs)`)
                        continue
                    }
                } else if (commentScope === 'tagged_posts') {
                    const triggerTag = (agent.agent_behavior?.fb_trigger_tag || '').trim().toLowerCase()
                    if (triggerTag && !postCaption.toLowerCase().includes(triggerTag)) {
                        console.log(`[FB POST SCOPE]: Skipping comment on Post ${postId} (missing tag "${triggerTag}")`)
                        continue
                    }
                }

                // 🛑 2. Ignore Non-Sales Posts Filter
                if (agent.agent_behavior?.fb_ignore_non_sales) {
                    const nonSalesPatterns = /(?:eid mubarak|শুভ নববর্ষ|happy new year|announcement|বিজ্ঞপ্তি|অফিস বন্ধ|holiday|winner announcement|contest winner)/i
                    if (nonSalesPatterns.test(postCaption)) {
                        console.log(`[FB POST SCOPE]: Skipping non-sales post: "${postCaption.slice(0, 45)}..."`)
                        continue
                    }
                }

                // 🛡️ 3. Real-Time Bad / Toxic / Scam / Spam Comment Moderation
                const toxicity = analyzeCommentToxicity(commentText)
                const shouldAutoDelete = toxicity.isBad && agent.agent_behavior?.fb_delete_negatives !== false

                if (shouldAutoDelete) {
                    console.log(`[FB AUTO-MODERATION DETECTED]: Bad comment from ${senderName} (${senderId}): "${commentText}" | Reason: ${toxicity.reason}`)

                    // 1. Delete or Hide comment on Facebook Page via Meta Graph API
                    if (pageAccessToken && commentId) {
                        try {
                            await $fetch(`https://graph.facebook.com/v19.0/${commentId}?access_token=${pageAccessToken}`, {
                                method: 'DELETE'
                            })
                            console.log(`[FB AUTO-MODERATION SUCCESS]: Deleted comment ${commentId} from Facebook Page.`)
                        } catch (delErr: any) {
                            console.warn(`[FB AUTO-MODERATION]: Delete failed, hiding comment: ${delErr.message}`)
                            await $fetch(`https://graph.facebook.com/v19.0/${commentId}?access_token=${pageAccessToken}`, {
                                method: 'POST',
                                body: { is_hidden: true }
                            }).catch(() => {})
                        }
                    }

                    // 2. Save Deleted Comment in chat_history with profile name & picture
                    await supabase.from('chat_history').insert({
                        agent_id: agent.id,
                        user_external_id: senderId,
                        customer_name: senderName,
                        customer_avatar: senderAvatar,
                        role: 'user',
                        content: `🚨 [AUTO-DELETED BAD COMMENT: ${toxicity.reason}]\n"${commentText}"`,
                        message_id: commentId
                    })

                    // 3. Save Moderated Lead / Incident Log for Dashboard display
                    await supabase.from('leads').insert({
                        email: `${senderId}@fbcomment.meta`,
                        status: 'deleted_comment',
                        data: {
                            agent_id: agent.id,
                            platform: 'fb_comment',
                            customer_name: senderName,
                            customer_avatar: senderAvatar,
                            comment_id: commentId,
                            comment_text: commentText,
                            moderation_reason: toxicity.reason,
                            action_taken: 'deleted',
                            deleted_at: new Date().toISOString()
                        }
                    })

                    // Do not reply to toxic comments
                    continue
                }

                // Save Normal User Comment
                await supabase.from('chat_history').insert({
                    agent_id: agent.id,
                    user_external_id: senderId,
                    customer_name: senderName,
                    customer_avatar: senderAvatar,
                    role: 'user',
                    content: commentText,
                    message_id: commentId
                })

                // 🛡️ Deterministic Privacy Shield: Detect private order/PII inquiries BEFORE public tool exposure
                const containsPrivateInquiry = /(?:01[3-9]\d{8}|order|parcel|trx|trxid|tracking|ঠিকানা|পার্সেল|টাকা|ডেলিভারি|কোড|bkash|nagad)/i.test(commentText)

                let aiReply = ''
                let sentPrivateSuccess = false

                const postContext = postCaption ? { postId, postCaption } : undefined
                const enrichedCommentText = postCaption 
                    ? `[Customer commented on Post: "${postCaption.slice(0, 150)}"] ${commentText}`
                    : commentText

                if (containsPrivateInquiry) {
                    // Dispatch directly to Agent Engine for private response context
                    const privateEvent: IncomingAgentEvent = {
                        channel: 'messenger',
                        eventId: `fb-comment-priv-${commentId}`,
                        customerId: senderId,
                        customerName: senderName,
                        customerAvatar: senderAvatar,
                        messageId: commentId,
                        text: enrichedCommentText,
                        postContext,
                        timestamp: Date.now(),
                        rawPayload: commentValue
                    }
                    const privateRes = await runAgent(privateEvent, agent)
                    const privateReplyText = privateRes.text || 'আপনার অর্ডারের বিস্তারিত তথ্য এখানে প্রদান করা হলো।'

                    // Attempt sending Private Reply via Meta Graph API
                    if (pageAccessToken && commentId) {
                        try {
                            await $fetch(`https://graph.facebook.com/v19.0/${commentId}/private_replies?access_token=${pageAccessToken}`, {
                                method: 'POST',
                                body: { message: privateReplyText }
                            })
                            sentPrivateSuccess = true
                            console.log(`[FB PRIVACY SHIELD]: Successfully dispatched private reply to ${senderName} for comment ${commentId}`)
                        } catch (privErr: any) {
                            console.warn(`[FB PRIVACY SHIELD]: Private reply error: ${privErr.message}`)
                            sentPrivateSuccess = false
                        }
                    }

                    // Format public safe message honoring merchant personality settings
                    aiReply = renderPrivacyComment({ senderName, emojiAllowed, sentPrivateSuccess })
                } else {
                    // Normal Public Comment Inquiry
                    const incomingEvent: IncomingAgentEvent = {
                        channel: 'facebook_comment',
                        eventId: `fb-comment-${commentId}`,
                        customerId: senderId,
                        customerName: senderName,
                        customerAvatar: senderAvatar,
                        messageId: commentId,
                        text: enrichedCommentText,
                        postContext,
                        timestamp: Date.now(),
                        rawPayload: commentValue
                    }

                    const agentRes = await runAgent(incomingEvent, agent)
                    if (agentRes.aiPaused) continue

                    aiReply = agentRes.text || ''
                }

                // 2. React to Facebook Comment Based on Sentiment (LOVE for praise, LIKE for inquiries)
                if (commentId && pageAccessToken) {
                    const isPositiveLove = /(?:love|sundor|bhalo|awesome|darun|best|great|nice|ধন্যবাদ|সুন্দর|ভালো|দারুণ|অনেক সুন্দর|পছন্দ|jossh)/i.test(commentText)
                    const fbReaction = isPositiveLove ? 'LOVE' : 'LIKE'
                    $fetch(`https://graph.facebook.com/v19.0/${commentId}/reactions?access_token=${pageAccessToken}`, {
                        method: 'POST',
                        body: { type: fbReaction }
                    }).catch(() => {})
                }

                // 2. Post Safe Reply Comment
                if (aiReply && aiReply.trim() !== '' && pageAccessToken) {
                    await $fetch(`https://graph.facebook.com/v19.0/${commentId}/comments?access_token=${pageAccessToken}`, {
                        method: 'POST',
                        body: { message: aiReply }
                    }).catch(err => console.error('[FB COMMENT REPLY ERROR]:', err.message))
                }

                // 3. Save Assistant Response
                await supabase.from('chat_history').insert({
                    agent_id: agent.id,
                    user_external_id: senderId,
                    role: 'assistant',
                    content: aiReply,
                    tokens_used: 0
                })

                console.log(`[AGENT V2 FB COMMENT]: Replied to comment by ${senderName} on post.`)
            }
        }
    }

    return { success: true }
})
