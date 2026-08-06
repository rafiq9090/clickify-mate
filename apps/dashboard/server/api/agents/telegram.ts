// server/api/agents/telegram.ts
import { decrypt } from '../../utils/encryption'
import { generateAIReply, analyzeSentimentAndPickEmoji } from '../../utils/groq'
import { processMockOrderStockDeduction } from '../../utils/mock_shop'

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
        console.warn(`[GROQ VISION WARNING] Primary vision model failed: ${e.message}. Trying fallback...`)
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

        // 2. Save User Message
        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: chatId.toString(),
            role: 'user',
            content: userText
        })

        // 2b. PARALLEL EXECUTION (Reaction + AI Reply)
        event.context.agent_behavior = agent.agent_behavior
        const [emoji, aiResult] = await Promise.all([
            analyzeSentimentAndPickEmoji(userText, apiKey, history),
            generateAIReply(userText, agent.agent_behavior?.tone || 'Mixed', apiKey, agent.knowledge || '', history, sessionState, 0, agent.updated_at, event)
        ])

        // 1. Send Reaction First (Instant Feedback)
        if (emoji && emoji !== 'none') {
            console.log(`[TELEGRAM DEBUG]: Sending reaction: ${emoji}`)
            $fetch(`https://api.telegram.org/bot${botToken}/setMessageReaction`, {
                method: 'POST',
                body: {
                    chat_id: chatId,
                    message_id: messageId,
                    reaction: [{ type: 'emoji', emoji: emoji }]
                }
            }).catch(e => console.error('[TELEGRAM REACTION ERROR]:', e.message))
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
                console.error(`[TELEGRAM ERROR]: Failed to update session lead:`, updateErr.message, updateErr)
            } else if (updatedLead) {
                sessionLead = updatedLead
                console.log(`[TELEGRAM DEBUG]: Updated session lead ${sessionLead.id}`)
            }
        } else {
            const { data: insertedLead, error: insertErr } = await supabase
                .from('leads')
                .insert({
                    email: emailKey,
                    source: 'ai_agent',
                    data: {
                        platform: 'telegram',
                        customer: chatId.toString(),
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
                console.error(`[TELEGRAM ERROR]: Failed to insert new lead:`, insertErr.message, insertErr)
            } else if (insertedLead) {
                sessionLead = insertedLead
                console.log(`[TELEGRAM DEBUG]: Created new session lead ${sessionLead.id}`)
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

            // Deduct mock stock
            const deduction = await processMockOrderStockDeduction(orderInfo, agent.agent_behavior || {})
            if (deduction.success) {
                console.log(`[TELEGRAM DEBUG]: Stock deduction success. Total: ৳${deduction.deductedPrice}`)
                aiReply += `\n\n[STOCK RESERVED]: ${deduction.message}`
            } else {
                console.warn(`[TELEGRAM DEBUG]: Stock deduction failed: ${deduction.message}`)
                aiReply = `I am sorry, but we cannot complete this order because: ${deduction.message}`
            }

            // paymentTransactionId is already extracted at the top level

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
                        console.error(`[TELEGRAM ERROR]: Failed to update lead with order:`, updateErr.message, updateErr)
                    } else if (updatedLead) {
                        sessionLead = updatedLead
                        console.log(`[TELEGRAM DEBUG]: Finalized order for existing lead ${sessionLead.id}`)
                    }
                } else {
                    const { data: insertedLead, error: insertErr } = await supabase.from('leads').insert({
                        email: emailKey,
                        source: 'ai_agent',
                        data: {
                            platform: 'telegram',
                            customer: chatId.toString(),
                            order: orderInfo,
                            agent_id: agent.id,
                            user_id: agent.user_id,
                            current_state: 'sales',
                            collected_details: {},
                            payment_transaction_id: paymentTransactionId
                        }
                    }).select().maybeSingle()
                    
                    if (insertErr) {
                        console.error(`[TELEGRAM ERROR]: Failed to insert new order lead:`, insertErr.message, insertErr)
                    } else if (insertedLead) {
                        sessionLead = insertedLead
                        console.log(`[TELEGRAM DEBUG]: Created new order lead (session expired)`)
                    }
                }
            } else {
                const { data: insertedLead, error: insertErr } = await supabase.from('leads').insert({
                    email: emailKey,
                    source: 'ai_agent',
                    data: {
                        platform: 'telegram',
                        customer: chatId.toString(),
                        order: orderInfo,
                        agent_id: agent.id,
                        user_id: agent.user_id,
                        current_state: 'sales',
                        collected_details: {},
                        payment_transaction_id: paymentTransactionId
                    }
                }).select().maybeSingle()
                
                if (insertErr) {
                    console.error(`[TELEGRAM ERROR]: Failed to insert brand new order lead:`, insertErr.message, insertErr)
                } else if (insertedLead) {
                    sessionLead = insertedLead
                    console.log(`[TELEGRAM DEBUG]: Created brand new order lead`)
                }
            }
        }

        if (hasImages) {
            aiReply = aiReply.replace(/^[📸📷🖼️\s,.:;-]+$/gu, '').trim()
        }

        // Fallback to prevent Telegram 400 Bad Request on empty/tag-only messages when no images are sent
        if (!hasImages && (!aiReply || aiReply.trim() === '')) {
            if (orderMatch) {
                aiReply = "Order placed successfully! Thank you for shopping with us. 😊"
            } else {
                aiReply = "I am checking that for you. What else can I help you with?"
            }
        }

        // 3. Save AI Reply (Cleaned) with Exact Tokens
        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: chatId.toString(),
            role: 'assistant',
            content: aiReply,
            tokens_used: tokens
        })

        console.log(`[AGENT DEBUG V${VERSION}]: AI Reply generated. Tokens: ${tokens}`)

        // 1. Send Text Reply First
        if (aiReply && aiReply.trim() !== '') {
            try {
                await $fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    body: { chat_id: chatId, text: aiReply }
                })
            } catch (sendErr: any) {
                console.warn(`[TELEGRAM SEND WARNING]: Failed to send message via Telegram API (likely mock/simulated chatId or blocked bot):`, sendErr.message)
            }
        }

        // 2. Send Images Second
        if (hasImages && imagesToSend.length > 0) {
            try {
                const media = imagesToSend.map((url: string) => ({ type: 'photo', media: url }))
                await $fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
                    method: 'POST',
                    body: { chat_id: chatId, media }
                })
            } catch (imgErr: any) {
                console.error('[TELEGRAM IMAGE ERROR]:', imgErr.message)
            }
        }

        return { success: true }

    } catch (e: any) {
        console.error(`[TELEGRAM AGENT ERROR V${VERSION}]:`, e.message || e.statusMessage || String(e))
        console.error(e)
        return { success: false, error: e.message || e.statusMessage || String(e) }
    }
})
