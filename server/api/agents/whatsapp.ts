// server/api/agents/whatsapp.ts
import { decrypt } from '../../utils/encryption'
import { generateAIReply, analyzeSentimentAndPickEmoji } from '../../utils/groq'
import { processMockOrderStockDeduction } from '../../utils/mock_shop'

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
    console.log(`[WHATSAPP DEBUG V${VERSION}]: Incoming ${event.method} request`)

    // 1. WhatsApp Webhook Verification
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

    const body = await readBody(event)
    const query = getQuery(event)
    const agentId = query.agent_id

    console.log(`[WHATSAPP DEBUG V${VERSION}]: Webhook Received. Agent ID: ${agentId}`)

    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value || !value.messages) {
        return { success: true }
    }

    try {
        const message = value.messages[0]
        const from = message.from // User's phone number
        const messageId = message.id // Needed for reaction
        const wabaId = value.metadata?.display_phone_number
        const messageType = message.type || 'text'

        let userText = ''
        if (messageType === 'text') {
            userText = message.text?.body || ''
        }

        // 2. Identify Agent (Priority 1: ID from query, Priority 2: phone_number_id)
        const phoneNumberId = value.metadata.phone_number_id

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

        // 3. SMART FALLBACK: If still not found, find the most recent WhatsApp agent
        if (!agent) {
            console.log(`[WHATSAPP DEBUG V${VERSION}]: No exact match. Searching for most recent WhatsApp agent...`)
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
            console.error(`[WHATSAPP DEBUG V${VERSION}]: FATAL - No WhatsApp agent found in DB at all.`)
            return { success: false }
        }

        // 4. SELF-HEALING: Save the Phone ID to this agent if it's missing
        if (!agent.external_id && phoneNumberId) {
            console.log(`[WHATSAPP DEBUG V${VERSION}]: Auto-linking Phone ID ${phoneNumberId} to Agent ${agent.id}`)
            await supabase.from('agent_configs').update({ external_id: phoneNumberId }).eq('id', agent.id)
            agent.external_id = phoneNumberId
        }

        // --- SMART FALLBACK: Knowledge Sync ---
        if (!agent.knowledge || agent.knowledge.length < 5) {
            console.log(`[WHATSAPP DEBUG]: Primary agent ${agent.id} has no knowledge. Searching alternatives...`)
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
                console.log(`[WHATSAPP DEBUG]: Found User-level fallback: ${userFallback.id}`)
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
                    console.log(`[WHATSAPP DEBUG]: Found ID-level deep sync: ${idFallback.id}`)
                    agent = idFallback
                }
            }
        }

        // Auto-Bind Fix: If agent was found via agent_id, ensure its external_id matches the current phone number
        if (agentId && agent && agent.external_id !== phoneNumberId) {
            console.log(`[WHATSAPP DEBUG]: Binding/Updating Phone ID ${phoneNumberId} to Agent ${agent.id}`)
            await supabase.from('agent_configs').update({ external_id: phoneNumberId }).eq('id', agent.id)
        }

        const pageAccessToken = decrypt(agent.encrypted_token)
        const apiKey = await getApiKey('groq_api_key', 'groqApiKey')

        if (!apiKey) {
            console.error('[WHATSAPP DEBUG]: No Groq API Key found.')
            return { success: false }
        }

        // --- PROCESS MEDIA TYPES IF NECESSARY ---
        if (messageType === 'audio') {
            const mediaId = message.audio?.id
            console.log(`[WHATSAPP DEBUG V${VERSION}]: Processing audio. Media ID: ${mediaId}`)
            if (mediaId && pageAccessToken) {
                try {
                    const mediaUrl = await getMetaMediaUrl(mediaId, pageAccessToken)
                    const audioBuffer = await downloadMetaMedia(mediaUrl, pageAccessToken)
                    const mimeType = message.audio?.mime_type || 'audio/ogg'
                    userText = await transcribeAudio(audioBuffer, mimeType, apiKey)
                    console.log(`[WHATSAPP DEBUG V${VERSION}]: Audio transcription: "${userText}"`)
                } catch (audioErr: any) {
                    console.error('[WHATSAPP AUDIO EXCEPTION]:', audioErr.message)
                }
            }
            if (!userText) {
                userText = 'User sent a voice message.'
            }
        } else if (messageType === 'image') {
            const mediaId = message.image?.id
            const caption = message.image?.caption || ''
            console.log(`[WHATSAPP DEBUG V${VERSION}]: Processing image. Media ID: ${mediaId}, Caption: ${caption}`)
            let imageDescription = ''
            if (mediaId && pageAccessToken) {
                try {
                    const mediaUrl = await getMetaMediaUrl(mediaId, pageAccessToken)
                    const imageBuffer = await downloadMetaMedia(mediaUrl, pageAccessToken)
                    const base64Image = imageBuffer.toString('base64')
                    const mimeType = message.image?.mime_type || 'image/jpeg'
                    const visionPrompt = "Describe the products or items in this image in one concise sentence (e.g. 'A blue t-shirt hanging on a rack'). If it is a payment receipt, extract the transaction ID and amount."
                    imageDescription = await analyzeImage(base64Image, mimeType, visionPrompt, apiKey)
                    console.log(`[WHATSAPP DEBUG V${VERSION}]: Image vision description: "${imageDescription}"`)
                } catch (imgErr: any) {
                    console.error('[WHATSAPP IMAGE EXCEPTION]:', imgErr.message)
                }
            }
            if (imageDescription) {
                userText = `[User sent image: ${imageDescription}] ${caption}`.trim()
            } else {
                userText = caption || 'User sent an image.'
            }
        }

        // --- FETCH OR CREATE LEAD FOR SESSION STATE ---
        const emailKey = `${from}@whatsapp.com`
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

        // 1. Fetch History (limit to last 24 hours to prevent stale conversations from bleeding into new ones)
        const historyTimeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: historyData } = await supabase
            .from('chat_history')
            .select('role, content')
            .eq('agent_id', agent.id)
            .eq('user_external_id', from)
            .gte('created_at', historyTimeLimit)
            .order('created_at', { ascending: false })
            .limit(10)

        const history = (historyData || []).reverse()

        // 2. Save User Message
        await supabase.from('chat_history').insert({
            agent_id: agent.id,
            user_external_id: from,
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
            console.log(`[WHATSAPP DEBUG]: Sending reaction: ${emoji}`)
            $fetch(`https://graph.facebook.com/v19.0/${value.metadata.phone_number_id}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${pageAccessToken}` },
                body: {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: from,
                    type: 'reaction',
                    reaction: { message_id: messageId, emoji: emoji }
                }
            }).catch(e => console.error('[WHATSAPP REACTION ERROR]:', e.message))
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
                console.error(`[WHATSAPP ERROR]: Failed to update session lead:`, updateErr.message, updateErr)
            } else if (updatedLead) {
                sessionLead = updatedLead
                console.log(`[WHATSAPP DEBUG]: Updated session lead ${sessionLead.id}`)
            }
        } else {
            const { data: insertedLead, error: insertErr } = await supabase
                .from('leads')
                .insert({
                    email: emailKey,
                    source: 'ai_agent',
                    data: {
                        platform: 'whatsapp',
                        customer: from,
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
                console.error(`[WHATSAPP ERROR]: Failed to insert new lead:`, insertErr.message, insertErr)
            } else if (insertedLead) {
                sessionLead = insertedLead
                console.log(`[WHATSAPP DEBUG]: Created new session lead ${sessionLead.id}`)
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
                console.log(`[WHATSAPP DEBUG]: Stock deduction success. Total: ৳${deduction.deductedPrice}`)
                aiReply += `\n\n[STOCK RESERVED]: ${deduction.message}`
            } else {
                console.warn(`[WHATSAPP DEBUG]: Stock deduction failed: ${deduction.message}`)
                aiReply = `I am sorry, but we cannot complete this order because: ${deduction.message}`
            }

            // paymentTransactionId is already extracted at the top level

            if (sessionLead) {
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
                    console.error(`[WHATSAPP ERROR]: Failed to update lead with order:`, updateErr.message, updateErr)
                } else if (updatedLead) {
                    sessionLead = updatedLead
                    console.log(`[WHATSAPP DEBUG]: Lead updated with orderInfo.`)
                }
            } else {
                const { data: insertedLead, error: insertErr } = await supabase.from('leads').insert({
                    email: emailKey,
                    source: 'ai_agent',
                    data: {
                        platform: 'whatsapp',
                        customer: from,
                        order: orderInfo,
                        agent_id: agent.id,
                        user_id: agent.user_id,
                        current_state: 'sales',
                        collected_details: {},
                        payment_transaction_id: paymentTransactionId
                    }
                }).select().maybeSingle()
                
                if (insertErr) {
                    console.error(`[WHATSAPP ERROR]: Failed to insert brand new order lead:`, insertErr.message, insertErr)
                } else if (insertedLead) {
                    sessionLead = insertedLead
                    console.log(`[WHATSAPP DEBUG]: Brand new lead created with orderInfo.`)
                }
            }
        }

        if (hasImages) {
            aiReply = aiReply.replace(/^[📸📷🖼️\s,.:;-]+$/gu, '').trim()
        }

        // Fallback to prevent empty message errors when no images are sent
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
            user_external_id: from,
            role: 'assistant',
            content: aiReply,
            tokens_used: tokens
        })

        // 1. Send Text Reply First
        if (aiReply && aiReply.trim() !== '') {
            await $fetch(`https://graph.facebook.com/v19.0/${value.metadata.phone_number_id}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${pageAccessToken}` },
                body: {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: from,
                    type: 'text',
                    text: { body: aiReply }
                }
            })
        }

        // 2. Send Images Second
        if (hasImages && imagesToSend.length > 0) {
            for (const url of imagesToSend) {
                try {
                    await $fetch(`https://graph.facebook.com/v19.0/${value.metadata.phone_number_id}/messages`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${pageAccessToken}` },
                        body: {
                            messaging_product: 'whatsapp',
                            to: from,
                            type: 'image',
                            image: { link: url }
                        }
                    })
                } catch (e) { }
            }
        }

        console.log(`[WHATSAPP DEBUG V${VERSION}]: Replied to ${from}`)
        return { success: true }

    } catch (e: any) {
        console.error('[WHATSAPP ERROR]:', e.message)
        return { success: false, error: e.message }
    }
})
