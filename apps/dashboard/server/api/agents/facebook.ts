// server/api/agents/facebook.ts
import { decrypt } from '../../utils/encryption'
import { generateAIReply, analyzeSentimentAndPickEmoji } from '../../utils/groq'

interface DownloadedMedia {
    buffer: Buffer
    contentType: string
}

// Helper function to download media from Facebook URL with content-type detection
async function downloadMediaFromUrl(mediaUrl: string, pageAccessToken: string): Promise<DownloadedMedia> {
    const fetchMedia = async (url: string, useAuth: boolean): Promise<DownloadedMedia> => {
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        let finalUrl = url
        if (useAuth && pageAccessToken) {
            // Facebook lookaside CDN endpoints require token in query parameters
            const separator = url.includes('?') ? '&' : '?'
            finalUrl = `${url}${separator}access_token=${pageAccessToken}`
        }
        
        console.log(`[FACEBOOK MEDIA DEBUG]: Fetching URL: ${finalUrl.replace(pageAccessToken, 'HIDDEN_TOKEN')}`)
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
        console.warn('[FACEBOOK MEDIA WARNING] Failed with access_token query parameter, trying without:', error.message)
        try {
            return await fetchMedia(mediaUrl, false)
        } catch (fallbackError: any) {
            console.error('[FACEBOOK MEDIA ERROR] Failed both download attempts:', fallbackError.message)
            throw new Error(`Failed to download media: ${fallbackError.message}`)
        }
    }
}

// Helper function to transcribe voice messages
async function transcribeAudio(audioBuffer: Buffer, mimeType: string, apiKey: string) {
    let ext = 'ogg'
    const mimeLower = mimeType.toLowerCase()
    if (mimeLower.includes('mp3') || mimeLower.includes('mpeg')) ext = 'mp3'
    else if (mimeLower.includes('wav')) ext = 'wav'
    else if (mimeLower.includes('webm')) ext = 'webm'
    else if (mimeLower.includes('m4a') || mimeLower.includes('x-m4a') || mimeLower.includes('mp4') || mimeLower.includes('aac')) ext = 'm4a'

    const formData = new FormData()
    const blob = new Blob([Buffer.from(audioBuffer)], { type: mimeType })
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

// Helper function to analyze images with vision
async function analyzeImage(imageBase64: string, mimeType: string, prompt: string, apiKey: string) {
    try {
        const res = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: {
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.2
            }
        })
        return res.choices?.[0]?.message?.content || ''
    } catch (e: any) {
        console.warn(`[FACEBOOK VISION WARNING] Primary vision model failed: ${e.message}. Trying fallback...`)
        const res = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: {
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.2
            }
        })
        return res.choices?.[0]?.message?.content || ''
    }
}

export default defineEventHandler(async (event) => {
    const VERSION = "1.4.0-MEDIA-SUPPORT"
    console.log(`[FACEBOOK DEBUG V${VERSION}]: Incoming ${event.method} request`)
    
    // 1. Facebook Webhook Verification (Handshake)
    if (event.method === 'GET') {
        const query = getQuery(event)
        const mode = query['hub.mode']
        const token = query['hub.verify_token']
        const challenge = query['hub.challenge']

        const config = useRuntimeConfig()
        const verifyToken = config.public.verifyToken || 'papersnap_secure_verify'

        if (mode === 'subscribe' && token === verifyToken) {
            console.log(`[FACEBOOK DEBUG V${VERSION}]: Handshake Successful!`)
            return challenge
        }
        return { status: 'Facebook Agent Active', version: VERSION }
    }

    const body = await readBody(event)
    const query = getQuery(event)
    const agentId = query.agent_id
    const entry = body.entry?.[0]

    console.log(`[FACEBOOK DEBUG V${VERSION}]: Webhook Received. Agent ID: ${agentId}`)
    
    if (!entry) {
        console.warn('[FACEBOOK DEBUG]: No entry found in request body')
        return { success: true }
    }

    try {
        const pageId = entry.id || entry.uid // Facebook Page IDs are in entry.id
        console.log(`[FACEBOOK DEBUG]: Processing event for Page ID: ${pageId}`)

        // Initialize Supabase
        const supabase = useSupabaseAdmin()
        
        const isMessenger = !!entry.messaging
        const isComment = !!entry.changes
        const eventType = isMessenger ? 'messenger' : (isComment ? 'fb_comment' : null)
        
        let agent = null

        if (agentId) {
            // Priority 1: Trace by query agent_id (backward compatibility)
            const { data } = await supabase.from('agent_configs').select('*').eq('id', agentId).single()
            agent = data
        }

        if (!agent && pageId && eventType) {
            // Priority 2: Trace by External ID (The Smart Way)
            // Filter by event type to ensure we hit the right agent (messenger vs comment)
            const { data } = await supabase.from('agent_configs')
                .select('*')
                .eq('external_id', pageId)
                .eq('platform', eventType)
                .single()
            agent = data
        }

        // Fallback: If still nothing, try to find ANY agent for this Page ID
        if (!agent && pageId) {
             const { data } = await supabase.from('agent_configs')
                .select('*')
                .eq('external_id', pageId)
                .limit(1)
                .maybeSingle()
            agent = data
        }

        if (!agent) {
            console.error(`[FACEBOOK DEBUG]: No agent found for Page ${pageId} or ID ${agentId}. Ensure the agent is connected in the dashboard.`)
            return { success: false, error: 'Agent not registered' }
        }

        // --- SMART FALLBACK: If current agent has no knowledge, find one for this user that does ---
        if (!agent.knowledge || agent.knowledge.length < 5) {
            console.log(`[FACEBOOK DEBUG]: Primary agent ${agent.id} has no knowledge. Searching alternatives...`)
            let { data: userFallback } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('user_id', agent.user_id)
                .eq('platform', agent.platform)
                .neq('knowledge', '')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            
            if (userFallback && userFallback.knowledge) {
                console.log(`[FACEBOOK DEBUG]: Found User-level fallback: ${userFallback.id}`)
                agent = userFallback
            } else if (agent.external_id) {
                const { data: idFallback } = await supabase
                    .from('agent_configs')
                    .select('*')
                    .eq('external_id', agent.external_id)
                    .neq('knowledge', '')
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                
                if (idFallback && idFallback.knowledge) {
                    console.log(`[FACEBOOK DEBUG]: Found ID-level deep sync: ${idFallback.id}`)
                    agent = idFallback
                }
            }
        }

        // Auto-Bind Fix: If agent was found via agent_id, ensure its external_id matches the current Page ID
        if (agentId && agent && agent.external_id !== pageId) {
            console.log(`[FACEBOOK DEBUG]: Binding/Updating Page ID ${pageId} to Agent ${agent.id}`)
            await supabase.from('agent_configs').update({ external_id: pageId }).eq('id', agent.id)
        }
        
        console.log(`[FACEBOOK DEBUG]: Agent Match! Platform: ${agent.platform}, Tone: ${agent.agent_behavior?.tone || 'Mixed'}`)

        const pageAccessToken = await decrypt(agent.encrypted_token)
        const apiKey = await getApiKey('groq_api_key', 'groqApiKey')
        
        if (!apiKey) {
            console.warn('[FACEBOOK DEBUG]: No API Key found for Groq AI engine.')
            return { success: false, error: 'AI engine not configured' }
        }

        // 3. Handle Messenger Messages
        if (entry.messaging) {
            const messageEvent = entry.messaging[0]
            const senderId = messageEvent.sender.id
            let userText = messageEvent.message?.text || ''
            const messageId = messageEvent.message?.mid
            const attachments = messageEvent.message?.attachments || []

            // Fetch real profile name from Facebook Graph API
            let senderProfileName = ''
            try {
                const profileRes: any = await $fetch(`https://graph.facebook.com/v19.0/${senderId}?fields=name&access_token=${pageAccessToken}`)
                senderProfileName = profileRes?.name || ''
            } catch (e) {
                console.warn(`[MESSENGER DEBUG]: Could not fetch profile name for ${senderId}`)
            }

            // --- PROCESS ATTACHMENTS (Images, Voice, Files) ---
            if (attachments && attachments.length > 0) {
                console.log(`[MESSENGER DEBUG]: Processing ${attachments.length} attachment(s)`)
                
                for (const attachment of attachments) {
                    const attachmentType = attachment.type
                    const payload = attachment.payload || {}
                    const mediaUrl = payload.url
                    
                    if (!mediaUrl) {
                        console.warn(`[MESSENGER DEBUG]: Attachment has no URL`)
                        continue
                    }

                    try {
                        if (attachmentType === 'audio' || attachmentType === 'voice') {
                            // Handle voice message
                            console.log(`[MESSENGER DEBUG]: Processing voice message from ${mediaUrl}`)
                            const { buffer, contentType } = await downloadMediaFromUrl(mediaUrl, pageAccessToken)
                            const mimeType = contentType || 'audio/ogg'
                            const transcribed = await transcribeAudio(buffer, mimeType, apiKey)
                            console.log(`[MESSENGER DEBUG]: Voice transcription: "${transcribed}"`)
                            if (transcribed) {
                                userText = transcribed
                            } else {
                                userText = 'User sent a voice message.'
                            }
                        } else if (attachmentType === 'image') {
                            // Handle image with vision analysis
                            console.log(`[MESSENGER DEBUG]: Processing image from ${mediaUrl}`)
                            const { buffer, contentType } = await downloadMediaFromUrl(mediaUrl, pageAccessToken)
                            const base64Image = buffer.toString('base64')
                            const mimeType = contentType || 'image/jpeg'
                            const visionPrompt = "Describe the products or items in this image in one concise sentence (e.g. 'A blue t-shirt hanging on a rack'). If it is a payment receipt, extract the transaction ID and amount."
                            const imageDescription = await analyzeImage(base64Image, mimeType, visionPrompt, apiKey)
                            console.log(`[MESSENGER DEBUG]: Image vision description: "${imageDescription}"`)
                            if (imageDescription) {
                                userText = `[User sent image: ${imageDescription}]`
                            } else {
                                userText = 'User sent an image.'
                            }
                        } else if (attachmentType === 'file') {
                            // Handle file attachments
                            console.log(`[MESSENGER DEBUG]: File attachment detected: ${mediaUrl}`)
                            userText = `User sent a file attachment: ${payload.filename || 'unknown'}`
                        } else if (attachmentType === 'video') {
                            // Handle video attachments
                            console.log(`[MESSENGER DEBUG]: Video attachment detected: ${mediaUrl}`)
                            userText = 'User sent a video.'
                        } else {
                            console.log(`[MESSENGER DEBUG]: Unknown attachment type: ${attachmentType}`)
                            userText = `User sent a ${attachmentType} attachment.`
                        }
                    } catch (err: any) {
                        console.error(`[MESSENGER ATTACHMENT ERROR] ${attachmentType}:`, err.message)
                        userText = `Error processing ${attachmentType} attachment. Please try again.`
                    }
                }
            }

            // Only process if we have some content (text or processed attachment)
            if (userText || messageId) {
                // 1. Fetch History (limit to last 24 hours to prevent stale conversations from bleeding into new ones)
                const historyTimeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                const { data: historyData } = await supabase
                    .from('chat_history')
                    .select('role, content')
                    .eq('agent_id', agent.id)
                    .eq('user_external_id', senderId)
                    .gte('created_at', historyTimeLimit)
                    .order('created_at', { ascending: false })
                    .limit(10)
                
                const history = (historyData || []).reverse()

                // --- FETCH OR CREATE LEAD FOR SESSION STATE ---
                const emailKey = `${senderId}@messenger.com`
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

                // 2. Save User Message
                await supabase.from('chat_history').insert({
                    agent_id: agent.id,
                    user_external_id: senderId,
                    role: 'user',
                    content: userText
                })

                // 2b. PARALLEL EXECUTION (Reaction + AI Reply)
                const [emoji, aiResult] = await Promise.all([
                    analyzeSentimentAndPickEmoji(userText, apiKey, history),
                    generateAIReply(userText, agent.agent_behavior?.tone || 'Mixed', apiKey, agent.knowledge || '', history, sessionState, 0, agent.updated_at)
                ])

                // 1. Send Reaction First (Instant Feedback)
                if (emoji && emoji !== 'none' && messageId) {
                    const messengerMap: any = {
                        '👍': '👍', '❤️': '❤️', '😂': '😄', '😮': '😮', '😟': '😢', '🚨': '😡', '🤔': '🤔'
                    }
                    const reaction = messengerMap[emoji] || '👍'
                    console.log(`[MESSENGER DEBUG]: Sending reaction: ${reaction}`)
                    $fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                        method: 'POST',
                        body: {
                            recipient: { id: senderId },
                            sender_action: 'react',
                            payload: { message_id: messageId, reaction: reaction }
                        }
                    }).catch(e => {
                        console.error('[MESSENGER REACTION ERROR]:', e.message)
                        if (e.data) console.error('[MESSENGER REACTION DETAIL]:', JSON.stringify(e.data))
                    })
                }

                const { reply, tokens, updatedSessionState } = aiResult
                let aiReply = reply

                // --- EXTRACT PAYMENT TRANSACTION ID FROM USER TEXT ---
                let paymentTransactionId = null
                const txPatterns = [
                    /(?:bkash|nagad|rocket|transaction|trans|ref|trx|txid|id)[:\s]+([a-zA-Z0-9]{8,15})/gi,
                    /(?:trxid)[:\s]*([a-zA-Z0-9]{8,15})/gi
                ]
                for (const pattern of txPatterns) {
                    const match = pattern.exec(userText)
                    if (match && match[1]) {
                        paymentTransactionId = match[1].trim()
                        break
                    }
                }
                if (!paymentTransactionId) {
                    const standaloneMatches = userText.match(/\b[a-zA-Z0-9]{8,15}\b/g)
                    if (standaloneMatches) {
                        for (const candidate of standaloneMatches) {
                            const hasLetters = /[a-zA-Z]/.test(candidate)
                            const hasNumbers = /[0-9]/.test(candidate)
                            if (hasLetters && hasNumbers) {
                                paymentTransactionId = candidate
                                break
                            }
                        }
                    }
                }

                // Save updated session state back to the lead (always insert/update)
                const finalState = updatedSessionState || sessionState || { current_state: 'sales', collected_details: {} }
                const finalTxId = paymentTransactionId || sessionLead?.data?.payment_transaction_id || null
                
                if (sessionLead) {
                    const { data: updatedLead, error: updateErr } = await supabase
                        .from('leads')
                        .update({
                            data: {
                                ...sessionLead.data,
                                current_state: finalState.current_state,
                                collected_details: finalState.collected_details,
                                payment_transaction_id: finalTxId
                            }
                        })
                        .eq('id', sessionLead.id)
                        .select()
                        .maybeSingle()
                    
                    if (updateErr) {
                        console.error(`[MESSENGER ERROR]: Failed to update session lead:`, updateErr.message, updateErr)
                    } else if (updatedLead) {
                        sessionLead = updatedLead
                        console.log(`[MESSENGER DEBUG]: Updated session lead ${sessionLead.id}`)
                    }
                } else {
                    const { data: insertedLead, error: insertErr } = await supabase
                        .from('leads')
                        .insert({
                            email: emailKey,
                            source: 'ai_agent',
                            data: {
                                platform: 'messenger',
                                customer: senderProfileName || senderId,
                                agent_id: agent.id,
                                user_id: agent.user_id,
                                current_state: finalState.current_state,
                                collected_details: finalState.collected_details,
                                payment_transaction_id: finalTxId
                            }
                        })
                        .select()
                        .maybeSingle()
                    
                    if (insertErr) {
                        console.error(`[MESSENGER ERROR]: Failed to insert new lead:`, insertErr.message, insertErr)
                    } else if (insertedLead) {
                        sessionLead = insertedLead
                        console.log(`[MESSENGER DEBUG]: Created new session lead ${sessionLead.id}`)
                    }
                }
                
                // --- IMAGE EXTRACTION (Supports Product ID and Index) ---
                let hasImages = false
                const rawImages = agent.product_images || []
                const allImages = rawImages.map((img: any, idx: number) => {
                    if (typeof img === 'string') {
                        return { id: (idx + 1).toString(), url: img }
                    } else if (img && typeof img === 'object') {
                        return { id: img.id || (idx + 1).toString(), url: img.url || '' }
                    }
                    return { id: '', url: '' }
                }).filter((img: any) => img.url)

                const imagesToSend: string[] = []
                
                // Find all matches globally
                const imageMatches = [...aiReply.matchAll(/\[SEND_IMAGES:?\s*([^\]]*?)\]/gi)]
                if (imageMatches.length > 0) {
                    hasImages = true
                    for (const match of imageMatches) {
                        const identifiers = (match[1] || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
                        identifiers.forEach((id: string) => {
                            let matched = allImages.find((img: any) => img.id.toLowerCase() === id)
                            if (!matched) {
                                const isWhite = id.includes('white') || id.includes('wt') || id.includes('w-')
                                const isBlack = id.includes('black') || id.includes('bt') || id.includes('b-')
                                const isBlue = id.includes('blue') || id.includes('nb') || id.includes('navy') || id.includes('n-')
                                
                                if (isWhite) {
                                    matched = allImages.find((img: any) => {
                                        const imgId = (img.id || '').toLowerCase()
                                        return imgId.includes('white') || imgId.includes('wt') || imgId.includes('w-')
                                    })
                                } else if (isBlack) {
                                    matched = allImages.find((img: any) => {
                                        const imgId = (img.id || '').toLowerCase()
                                        return imgId.includes('black') || imgId.includes('bt') || imgId.includes('b-')
                                    })
                                } else if (isBlue) {
                                    matched = allImages.find((img: any) => {
                                        const imgId = (img.id || '').toLowerCase()
                                        return imgId.includes('blue') || imgId.includes('nb') || imgId.includes('navy') || imgId.includes('n-')
                                    })
                                }
                            }
                            if (!matched) {
                                matched = allImages.find((img: any) => {
                                    const imgId = (img.id || '').toLowerCase()
                                    return imgId.includes(id) || id.includes(imgId)
                                })
                            }
                            if (!matched) {
                                const idx = parseInt(id)
                                if (!isNaN(idx) && allImages[idx - 1]) {
                                    matched = allImages[idx - 1]
                                }
                            }
                            if (matched) {
                                imagesToSend.push(matched.url)
                            }
                        })
                        // Remove the matched tag from the reply
                        aiReply = aiReply.replace(match[0], '').trim()
                    }
                    if (imagesToSend.length === 0 && allImages.length > 0) {
                        imagesToSend.push(allImages[0].url)
                    }
                }

                // Handle legacy/fallback tag
                if (aiReply.includes('[SEND_IMAGES]')) {
                    if (allImages.length > 0) {
                        hasImages = true
                        imagesToSend.push(allImages[0].url)
                    }
                    aiReply = aiReply.replace(/\[SEND_IMAGES\]/gi, '').trim()
                }

                // --- ORDER DATA EXTRACTION ---
                const orderMatch = aiReply.match(/\[ORDER_DATA: (.*?)\]/)
                if (orderMatch && orderMatch[1]) {
                    const orderInfo = orderMatch[1]
                    aiReply = aiReply.replace(orderMatch[0], '').trim()
                    
                    // paymentTransactionId is already extracted at the top level
                    
                    // Save to Leads Table for Dashboard (with duplicate prevention/upserting logic)
                    if (sessionLead) {
                        const ageInMs = Date.now() - new Date(sessionLead.created_at).getTime()
                        if (ageInMs < 2 * 60 * 60 * 1000) { // 2 hours active session window
                            const { data: updatedLead, error: updateErr } = await supabase
                                .from('leads')
                                .update({
                                    data: {
                                        ...sessionLead.data,
                                        order: orderInfo,
                                        current_state: 'sales',
                                        collected_details: {},
                                        payment_transaction_id: paymentTransactionId || sessionLead.data?.payment_transaction_id
                                    }
                                })
                                .eq('id', sessionLead.id)
                                .select()
                                .maybeSingle()
                            
                            if (updateErr) {
                                console.error(`[MESSENGER ERROR]: Failed to update lead with order:`, updateErr.message, updateErr)
                            } else if (updatedLead) {
                                sessionLead = updatedLead
                                console.log(`[MESSENGER DEBUG]: Finalized order for existing lead ${sessionLead.id}`)
                            }
                        } else {
                            const { data: insertedLead, error: insertErr } = await supabase.from('leads').insert({
                                email: emailKey,
                                source: 'ai_agent',
                                data: {
                                    platform: 'messenger',
                                    customer: senderProfileName || senderId,
                                    order: orderInfo,
                                    agent_id: agent.id,
                                    user_id: agent.user_id,
                                    current_state: 'sales',
                                    collected_details: {},
                                    payment_transaction_id: paymentTransactionId
                                }
                            }).select().maybeSingle()
                            
                            if (insertErr) {
                                console.error(`[MESSENGER ERROR]: Failed to insert new order lead:`, insertErr.message, insertErr)
                            } else if (insertedLead) {
                                sessionLead = insertedLead
                                console.log(`[MESSENGER DEBUG]: Created new order lead (session expired)`)
                            }
                        }
                    } else {
                        const { data: insertedLead, error: insertErr } = await supabase.from('leads').insert({
                            email: emailKey,
                            source: 'ai_agent',
                            data: {
                                platform: 'messenger',
                                customer: senderProfileName || senderId,
                                order: orderInfo,
                                agent_id: agent.id,
                                user_id: agent.user_id,
                                current_state: 'sales',
                                collected_details: {},
                                payment_transaction_id: paymentTransactionId
                            }
                        }).select().maybeSingle()
                        
                        if (insertErr) {
                            console.error(`[MESSENGER ERROR]: Failed to insert brand new order lead:`, insertErr.message, insertErr)
                        } else if (insertedLead) {
                            sessionLead = insertedLead
                            console.log(`[MESSENGER DEBUG]: Created brand new order lead`)
                        }
                    }
                }

                if (hasImages) {
                    aiReply = aiReply.replace(/^[📸📷🖼️\s,.:;-]+$/gu, '').trim()
                }

                // Fallback to prevent empty message errors
                if (!hasImages && (!aiReply || aiReply.trim() === '')) {
                    if (orderMatch) {
                        aiReply = "Order placed successfully! Thank you for shopping with us. 😊"
                    } else {
                        aiReply = "I am checking that for you. What else can I help you with?"
                    }
                }

                // 3. Save AI Reply (Cleaned) with Tokens
                await supabase.from('chat_history').insert({
                    agent_id: agent.id,
                    user_external_id: senderId,
                    role: 'assistant',
                    content: aiReply,
                    tokens_used: tokens
                })

                // 1. Send Text Reply First
                if (aiReply && aiReply.trim() !== '') {
                    try {
                        await $fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                            method: 'POST',
                            body: {
                                recipient: { id: senderId },
                                message: { text: aiReply }
                            }
                        })
                    } catch (sendErr: any) {
                        console.warn(`[MESSENGER SEND WARNING]: Failed to send message via Meta API (likely mock/simulated sender or invalid token):`, sendErr.message)
                    }
                }

                // 2. Send Images Second
                if (hasImages && imagesToSend.length > 0) {
                    for (const url of imagesToSend) {
                        try {
                            await $fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                                method: 'POST',
                                body: {
                                    recipient: { id: senderId },
                                    message: { attachment: { type: 'image', payload: { url, is_reusable: true } } }
                                }
                            })
                        } catch (e) {}
                    }
                }
                console.log(`[MESSENGER DEBUG V${VERSION}]: Replied to ${senderId} | Tokens Used: ${tokens}`)
            }
        }

        // 4. Handle Facebook Comments
        if (entry.changes) {
            console.log(`[FB COMMENT DEBUG V${VERSION}]: Change detected in feed`)
            const change = entry.changes[0]
            
            if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                const commentId = change.value.comment_id
                let userText = change.value.message
                const senderId = change.value.from.id
                const senderName = change.value.from.name

                console.log(`[FB COMMENT DEBUG V${VERSION}]: New comment from ${senderName}: "${userText}"`)

                // Avoid replying to the page's own comments (prevent loops)
                if (senderId === entry.id) {
                    console.log('[FB COMMENT DEBUG]: Skipping loop reply (Page commenting on itself)')
                    return { success: true }
                }

                // 1. Fetch History (limit to last 24 hours to prevent stale conversations from bleeding into new ones)
                const historyTimeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                const { data: historyData } = await supabase
                    .from('chat_history')
                    .select('role, content')
                    .eq('agent_id', agent.id)
                    .eq('user_external_id', senderId)
                    .gte('created_at', historyTimeLimit)
                    .order('created_at', { ascending: false })
                    .limit(5) // Fewer for comments to save space
                
                const history = (historyData || []).reverse()

                // --- FETCH OR CREATE LEAD FOR SESSION STATE ---
                const emailKey = `${senderId}@facebook.com`
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

                // 2. Save User Message
                await supabase.from('chat_history').insert({
                    agent_id: agent.id,
                    user_external_id: senderId,
                    role: 'user',
                    content: userText
                })

                // 2b. PARALLEL EXECUTION (Reaction + AI Reply)
                const [emoji, aiResult] = await Promise.all([
                    analyzeSentimentAndPickEmoji(userText, apiKey, history),
                    generateAIReply(userText, agent.agent_behavior?.tone || 'Mixed', apiKey, agent.knowledge || '', history, sessionState, 0, agent.updated_at)
                ])

                // 1. Send Reaction First
                if (emoji && emoji !== 'none' && commentId) {
                    const fbMap: any = {
                        '👍': 'LIKE', '❤️': 'LOVE', '😂': 'HAHA', '😮': 'WOW', '😟': 'SAD', '🚨': 'ANGRY', '🤔': 'LIKE'
                    }
                    const reaction = fbMap[emoji] || 'LIKE'
                    console.log(`[FB COMMENT DEBUG]: Sending reaction: ${reaction}`)
                    $fetch(`https://graph.facebook.com/v19.0/${commentId}/reactions?access_token=${pageAccessToken}`, {
                        method: 'POST',
                        body: { type: reaction }
                    }).catch(e => console.error('[FB COMMENT REACTION ERROR]:', e.message))
                }

                const { reply, tokens, updatedSessionState } = aiResult
                let aiReply = reply

                // --- EXTRACT PAYMENT TRANSACTION ID FROM USER TEXT ---
                let paymentTransactionId = null
                const txPatterns = [
                    /(?:bkash|nagad|rocket|transaction|trans|ref|trx|txid|id)[:\s]+([a-zA-Z0-9]{8,15})/gi,
                    /(?:trxid)[:\s]*([a-zA-Z0-9]{8,15})/gi
                ]
                for (const pattern of txPatterns) {
                    const match = pattern.exec(userText)
                    if (match && match[1]) {
                        paymentTransactionId = match[1].trim()
                        break
                    }
                }
                if (!paymentTransactionId) {
                    const standaloneMatches = userText.match(/\b[a-zA-Z0-9]{8,15}\b/g)
                    if (standaloneMatches) {
                        for (const candidate of standaloneMatches) {
                            const hasLetters = /[a-zA-Z]/.test(candidate)
                            const hasNumbers = /[0-9]/.test(candidate)
                            if (hasLetters && hasNumbers) {
                                paymentTransactionId = candidate
                                break
                            }
                        }
                    }
                }

                // Save updated session state back to the lead (always insert/update)
                const finalState = updatedSessionState || sessionState || { current_state: 'sales', collected_details: {} }
                const finalTxId = paymentTransactionId || sessionLead?.data?.payment_transaction_id || null
                
                if (sessionLead) {
                    const { data: updatedLead, error: updateErr } = await supabase
                        .from('leads')
                        .update({
                            data: {
                                ...sessionLead.data,
                                current_state: finalState.current_state,
                                collected_details: finalState.collected_details,
                                payment_transaction_id: finalTxId
                            }
                        })
                        .eq('id', sessionLead.id)
                        .select()
                        .maybeSingle()
                    
                    if (updateErr) {
                        console.error(`[FB COMMENT ERROR]: Failed to update session lead:`, updateErr.message, updateErr)
                    } else if (updatedLead) {
                        sessionLead = updatedLead
                        console.log(`[FB COMMENT DEBUG]: Updated session lead ${sessionLead.id}`)
                    }
                } else {
                    const { data: insertedLead, error: insertErr } = await supabase
                        .from('leads')
                        .insert({
                            email: emailKey,
                            source: 'ai_agent',
                            data: {
                                platform: 'fb_comment',
                                customer: senderName || senderId,
                                agent_id: agent.id,
                                user_id: agent.user_id,
                                current_state: finalState.current_state,
                                collected_details: finalState.collected_details,
                                payment_transaction_id: finalTxId
                            }
                        })
                        .select()
                        .maybeSingle()
                    
                    if (insertErr) {
                        console.error(`[FB COMMENT ERROR]: Failed to insert new lead:`, insertErr.message, insertErr)
                    } else if (insertedLead) {
                        sessionLead = insertedLead
                        console.log(`[FB COMMENT DEBUG]: Created new session lead ${sessionLead.id}`)
                    }
                }
                
                let hasImages = false
                const rawImages = agent.product_images || []
                const allImages = rawImages.map((img: any, idx: number) => {
                    if (typeof img === 'string') {
                        return { id: (idx + 1).toString(), url: img }
                    } else if (img && typeof img === 'object') {
                        return { id: img.id || (idx + 1).toString(), url: img.url || '' }
                    }
                    return { id: '', url: '' }
                }).filter((img: any) => img.url)

                const imagesToSend: string[] = []
                let firstImage = ''
                
                // Find all matches globally
                const imageMatches = [...aiReply.matchAll(/\[SEND_IMAGES:?\s*([^\]]*?)\]/gi)]
                if (imageMatches.length > 0) {
                    hasImages = true
                    for (const match of imageMatches) {
                        const identifiers = (match[1] || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
                        identifiers.forEach((id: string) => {
                            let matched = allImages.find((img: any) => img.id.toLowerCase() === id)
                            if (!matched) {
                                const isWhite = id.includes('white') || id.includes('wt') || id.includes('w-')
                                const isBlack = id.includes('black') || id.includes('bt') || id.includes('b-')
                                const isBlue = id.includes('blue') || id.includes('nb') || id.includes('navy') || id.includes('n-')
                                
                                if (isWhite) {
                                    matched = allImages.find((img: any) => {
                                        const imgId = (img.id || '').toLowerCase()
                                        return imgId.includes('white') || imgId.includes('wt') || imgId.includes('w-')
                                    })
                                } else if (isBlack) {
                                    matched = allImages.find((img: any) => {
                                        const imgId = (img.id || '').toLowerCase()
                                        return imgId.includes('black') || imgId.includes('bt') || imgId.includes('b-')
                                    })
                                } else if (isBlue) {
                                    matched = allImages.find((img: any) => {
                                        const imgId = (img.id || '').toLowerCase()
                                        return imgId.includes('blue') || imgId.includes('nb') || imgId.includes('navy') || imgId.includes('n-')
                                    })
                                }
                            }
                            if (!matched) {
                                matched = allImages.find((img: any) => {
                                    const imgId = (img.id || '').toLowerCase()
                                    return imgId.includes(id) || id.includes(imgId)
                                })
                            }
                            if (!matched) {
                                const idx = parseInt(id)
                                if (!isNaN(idx) && allImages[idx - 1]) {
                                    matched = allImages[idx - 1]
                                }
                            }
                            if (matched) {
                                imagesToSend.push(matched.url)
                            }
                        })
                        // Remove the matched tag from the reply
                        aiReply = aiReply.replace(match[0], '').trim()
                    }
                    if (imagesToSend.length === 0 && allImages.length > 0) {
                        imagesToSend.push(allImages[0].url)
                    }
                }

                // Handle legacy/fallback tag
                if (aiReply.includes('[SEND_IMAGES]')) {
                    if (allImages.length > 0) {
                        hasImages = true
                        imagesToSend.push(allImages[0].url)
                    }
                    aiReply = aiReply.replace(/\[SEND_IMAGES\]/gi, '').trim()
                }
                if (imagesToSend.length > 0) {
                    firstImage = imagesToSend[0] || ''
                }

                // --- ORDER DATA EXTRACTION ---
                const orderMatch = aiReply.match(/\[ORDER_DATA: (.*?)\]/)
                if (orderMatch && orderMatch[1]) {
                    const orderInfo = orderMatch[1]
                    aiReply = aiReply.replace(orderMatch[0], '').trim()
                    
                    // paymentTransactionId is already extracted at the top level
                    
                    // Save to Leads Table for Dashboard (with duplicate prevention/upserting logic)
                    const emailKey = `${senderId}@facebook.com`
                    if (sessionLead) {
                        const ageInMs = Date.now() - new Date(sessionLead.created_at).getTime()
                        if (ageInMs < 2 * 60 * 60 * 1000) { // 2 hours active session window
                            const { data: updatedLead, error: updateErr } = await supabase
                                .from('leads')
                                .update({
                                    data: {
                                        ...sessionLead.data,
                                        order: orderInfo,
                                        current_state: 'sales',
                                        collected_details: {},
                                        payment_transaction_id: paymentTransactionId || sessionLead.data?.payment_transaction_id
                                    }
                                })
                                .eq('id', sessionLead.id)
                                .select()
                                .maybeSingle()
                            
                            if (updateErr) {
                                console.error(`[FB COMMENT ERROR]: Failed to update lead with order:`, updateErr.message, updateErr)
                            } else if (updatedLead) {
                                sessionLead = updatedLead
                                console.log(`[FB COMMENT DEBUG]: Finalized order for existing lead ${sessionLead.id}`)
                            }
                        } else {
                            const { data: insertedLead, error: insertErr } = await supabase.from('leads').insert({
                                email: emailKey,
                                source: 'ai_agent',
                                data: {
                                    platform: 'fb_comment',
                                    customer: senderName || senderId,
                                    order: orderInfo,
                                    agent_id: agent.id,
                                    user_id: agent.user_id,
                                    current_state: 'sales',
                                    collected_details: {},
                                    payment_transaction_id: paymentTransactionId
                                }
                            }).select().maybeSingle()
                            
                            if (insertErr) {
                                console.error(`[FB COMMENT ERROR]: Failed to insert new order lead:`, insertErr.message, insertErr)
                            } else if (insertedLead) {
                                sessionLead = insertedLead
                                console.log(`[FB COMMENT DEBUG]: Created new order lead (session expired)`)
                            }
                        }
                    } else {
                        const { data: insertedLead, error: insertErr } = await supabase.from('leads').insert({
                            email: emailKey,
                            source: 'ai_agent',
                            data: {
                                platform: 'fb_comment',
                                customer: senderName || senderId,
                                order: orderInfo,
                                agent_id: agent.id,
                                user_id: agent.user_id,
                                current_state: 'sales',
                                collected_details: {},
                                payment_transaction_id: paymentTransactionId
                            }
                        }).select().maybeSingle()
                        
                        if (insertErr) {
                            console.error(`[FB COMMENT ERROR]: Failed to insert brand new order lead:`, insertErr.message, insertErr)
                        } else if (insertedLead) {
                            sessionLead = insertedLead
                            console.log(`[FB COMMENT DEBUG]: Created brand new order lead`)
                        }
                    }
                }

                if (hasImages) {
                    aiReply = aiReply.replace(/^[📸📷🖼️\s,.:;-]+$/gu, '').trim()
                    if (aiReply === '') {
                        aiReply = "Here is the picture you requested 😊"
                    }
                }

                // Fallback to prevent empty message errors
                if (!hasImages && (!aiReply || aiReply.trim() === '')) {
                    if (orderMatch) {
                        aiReply = "Order placed successfully! Thank you for shopping with us. 😊"
                    } else {
                        aiReply = "I am checking that for you. What else can I help you with?"
                    }
                }

                // 3. Save AI Reply
                await supabase.from('chat_history').insert({
                    agent_id: agent.id,
                    user_external_id: senderId,
                    role: 'assistant',
                    content: aiReply,
                    tokens_used: tokens
                })

                console.log(`[FB COMMENT DEBUG V${VERSION}]: AI Generated Reply: ${aiReply}`)
                
                // Determine whether to send privately
                const behavior = agent.agent_behavior || {}
                const pPrices = behavior.fb_private_reply_prices !== false
                const pOrders = behavior.fb_private_reply_orders !== false
                const pPii = behavior.fb_private_reply_pii !== false
                const pComplaints = behavior.fb_private_reply_complaints !== false
                const publicEnabled = behavior.fb_public_reply_enabled !== false

                const userTextLower = userText.toLowerCase()
                const isPrice = /price|cost|how much|দাম|কত|৳/i.test(userTextLower) || updatedSessionState?.current_state === 'negotiation'
                const isPii = /\b01[3-9]\d{8}\b/.test(userTextLower) || /address|ঠিকানা|delivery/i.test(userTextLower)
                const isOrder = updatedSessionState?.current_state === 'sales' || /buy|order|want|need|অর্ডার|কিনব/i.test(userTextLower)
                const isComplaint = /scam|fake|bad|cheat|worst|delay|late|wrong|damage|broken|নষ্ট|খারাপ/i.test(userTextLower) || emoji === '😟' || emoji === '🚨'

                const deleteNegative = behavior.fb_delete_negatives !== false

                let sendPrivately = false
                if (isPrice && pPrices) sendPrivately = true
                if (isPii && pPii) sendPrivately = true
                if (isOrder && pOrders) sendPrivately = true
                if (isComplaint && pComplaints) sendPrivately = true

                try {
                    // Check if comment is a complaint and auto-delete is enabled
                    if (isComplaint && deleteNegative) {
                        console.log(`[FB COMMENT DEBUG]: Auto-deleting negative/spam comment ${commentId}`)
                        
                        // Log deleted comment activity to Leads table for dashboard visibility
                        try {
                            await supabase.from('leads').insert({
                                email: `${senderId}@facebook.com`,
                                source: 'ai_moderation',
                                data: {
                                    platform: 'fb_comment',
                                    customer: senderName || senderId,
                                    agent_id: agent.id,
                                    user_id: agent.user_id,
                                    order: `🔴 DELETED COMMENT: "${userText}"`,
                                    status: 'deleted_complaint'
                                }
                            })
                            console.log(`[FB COMMENT DEBUG]: Logged deleted comment from ${senderName} to database`)
                        } catch (dbErr: any) {
                            console.error(`[FB COMMENT ERROR]: Failed to log deleted comment activity: ${dbErr.message}`)
                        }

                        await $fetch(`https://graph.facebook.com/v19.0/${commentId}?access_token=${pageAccessToken}`, {
                            method: 'DELETE'
                        })
                        console.log(`[FB COMMENT DEBUG]: Successfully deleted negative comment ${commentId}`)
                        return { success: true }
                    }

                    if (sendPrivately) {
                        console.log(`[FB COMMENT DEBUG]: Routing reply privately to Messenger for comment ${commentId}`)
                        try {
                            // Send private reply using the correct Graph API Send Messages endpoint (comment_id recipient)
                            await $fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                                method: 'POST',
                                body: {
                                    recipient: { comment_id: commentId },
                                    message: { text: aiReply }
                                }
                            })

                            // Also send a public comment notification if enabled
                            if (publicEnabled) {
                                const publicNote = "Inbox check korun please 😊"
                                await $fetch(`https://graph.facebook.com/v19.0/${commentId}/comments?access_token=${pageAccessToken}`, {
                                    method: 'POST',
                                    body: { message: publicNote }
                                })
                            }
                        } catch (privErr: any) {
                            console.error(`[FB COMMENT ERROR]: Private reply failed, falling back to public reply. Error: ${privErr.message}`)
                            if (publicEnabled) {
                                const body: any = { message: aiReply }
                                if (hasImages && firstImage) {
                                    body.attachment_url = firstImage
                                }
                                await $fetch(`https://graph.facebook.com/v19.0/${commentId}/comments?access_token=${pageAccessToken}`, {
                                    method: 'POST',
                                    body
                                })
                            }
                        }
                    } else {
                        if (publicEnabled) {
                            const body: any = { message: aiReply }
                            if (hasImages && firstImage) {
                                body.attachment_url = firstImage
                            }
                            await $fetch(`https://graph.facebook.com/v19.0/${commentId}/comments?access_token=${pageAccessToken}`, {
                                method: 'POST',
                                body
                            })
                            console.log(`[FB COMMENT DEBUG V${VERSION}]: Successfully replied to comment ${commentId} with image: ${!!firstImage}`)
                        } else {
                            console.log(`[FB COMMENT DEBUG V${VERSION}]: Public reply disabled. Skipping comment ${commentId}.`)
                        }
                    }
                } catch (apiErr: any) {
                    console.error(`[FB COMMENT ERROR]: Meta API rejected the reply/delete action: ${apiErr.message}`)
                    console.error(`[FB COMMENT ERROR]: Details: ${JSON.stringify(apiErr.data)}`)
                }
            } else {
                console.log(`[FB COMMENT DEBUG]: Irrelevant change ignored: ${change.field}/${change.value?.item}`)
            }
        }

        return { success: true }

    } catch (e: any) {
        console.error('[FACEBOOK AGENT ERROR]:', e.message)
        return { success: false, error: e.message }
    }
})

