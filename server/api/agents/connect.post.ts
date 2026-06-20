// server/api/agents/connect.post.ts
import { encrypt } from '../../utils/encryption'
import { decrypt } from '../../utils/encryption'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { platform, token, knowledge } = body

    if (!platform || !token) {
        throw createError({ statusCode: 400, statusMessage: 'Metadata missing' })
    }

    try {
        const supabase = useSupabaseAdmin()
        
        // Manual User Extraction (Since you are not using Nuxt Supabase Module)
        // We look for the user from the event context or the Authorization header
        const { data: { user: supabaseUser } } = await supabase.auth.getUser(getRequestHeader(event, 'authorization')?.split(' ')[1])

        if (!supabaseUser) {
            throw createError({ statusCode: 401, statusMessage: 'Session expired. Please log in again.' })
        }
        const user_id = supabaseUser.id

        const encryptedToken = encrypt(token)

        let externalId = null

        // 3.5 Auto-detect External ID for Meta Platforms (FB, Messenger, WhatsApp)
        if (['messenger', 'fb_comment', 'facebook', 'whatsapp'].includes(platform)) {
            try {
                // 1. Get the main account ID (Page ID or WABA ID)
                const metaData: any = await $fetch(`https://graph.facebook.com/v19.0/me?fields=id&access_token=${token}`)
                if (metaData?.id) {
                    externalId = metaData.id
                    
                    // 2. For WhatsApp, we specifically need the phone_number_id for messages
                    if (platform === 'whatsapp') {
                        try {
                            const phones: any = await $fetch(`https://graph.facebook.com/v19.0/${externalId}/phone_numbers?access_token=${token}`)
                            if (phones?.data?.[0]?.id) {
                                externalId = phones.data[0].id
                                console.log(`[AGENT CONNECT]: Auto-detected WhatsApp Phone ID: ${externalId}`)
                            }
                        } catch (phoneErr: any) {
                            console.warn(`[AGENT CONNECT]: Could not fetch WhatsApp phone numbers: ${phoneErr.message}`)
                        }
                    } else {
                        console.log(`[AGENT CONNECT]: Auto-detected Meta ID: ${externalId}`)
                    }
                }
            } catch (metaErr: any) {
                console.warn(`[AGENT CONNECT]: Could not auto-detect Meta ID: ${metaErr.message}`)
            }
        }

        // 3.6 Auto-detect External ID for Telegram
        if (platform === 'telegram') {
            try {
                const tgData: any = await $fetch(`https://api.telegram.org/bot${token}/getMe`)
                if (tgData?.result?.id) {
                    externalId = tgData.result.id.toString()
                    console.log(`[AGENT CONNECT]: Auto-detected Telegram Bot ID: ${externalId}`)
                }
            } catch (tgErr: any) {
                console.warn(`[AGENT CONNECT]: Could not fetch Telegram Bot info: ${tgErr.message}`)
            }
        }

        // Check if this token or external_id is already registered to another user
        if (externalId) {
            const { data: existingSameId } = await supabase
                .from('agent_configs')
                .select('id, user_id, platform')
                .eq('external_id', externalId)

            if (existingSameId && existingSameId.length > 0) {
                const otherUserAgent = existingSameId.find(a => a.user_id !== user_id)
                if (otherUserAgent) {
                    throw createError({
                        statusCode: 409,
                        statusMessage: `This ${platform} connection (ID: ${externalId}) is already connected by another user or agent.`
                    })
                }
            }
        }

        const { data: allPlatformAgents } = await supabase
            .from('agent_configs')
            .select('id, user_id, encrypted_token, platform')
            .eq('platform', platform)

        if (allPlatformAgents && allPlatformAgents.length > 0) {
            for (const agentConfig of allPlatformAgents) {
                if (agentConfig.user_id === user_id) continue
                try {
                    const decrypted = decrypt(agentConfig.encrypted_token)
                    if (decrypted === token) {
                        throw createError({
                            statusCode: 409,
                            statusMessage: `This webhook key/token is already connected to another user's website agent.`
                        })
                    }
                } catch (decErr) {
                    console.warn(`[AGENT CONNECT]: Decryption failed for agent config ${agentConfig.id}`)
                }
            }
        }

        const { data, error } = await supabase.from('agent_configs').upsert({
            platform,
            user_id: user_id,
            encrypted_token: encryptedToken,
            external_id: externalId,
            knowledge: knowledge || '',
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform' }).select()

        if (error) throw error

        const activeAgent = (data as any)?.[0]
        const agentId = activeAgent?.id

        const host = getRequestHeader(event, 'host')
        const protocol = host?.includes('localhost') ? 'http' : 'https'
        const siteUrl = `${protocol}://${host}`

        const config = useRuntimeConfig()
        const verifyToken = config.public.verifyToken

        // 4. If Facebook/Messenger, AUTOMATICALLY subscribe the App to the Page
        if (['messenger', 'fb_comment', 'facebook'].includes(platform) && externalId) {
            console.log(`[AGENT AUTO-SYNC]: Subscribing App to Page ${externalId}`)
            try {
                await $fetch(`https://graph.facebook.com/v19.0/${externalId}/subscribed_apps`, {
                    method: 'POST',
                    query: {
                        subscribed_fields: 'feed,messages,messaging_postbacks',
                        access_token: token
                    }
                })
                console.log(`[AGENT AUTO-SYNC]: SUCCESS! Meta is now pushing real-time data for Page ${externalId}`)
            } catch (fbErr: any) {
                console.error(`[AGENT AUTO-SYNC]: Failed to subscribe to Meta: ${fbErr.message}`)
            }
        }

        // 5. If Telegram, AUTOMATICALLY register the Webhook
        if (platform === 'telegram' && agentId) {
            const webhookUrl = `${siteUrl}/api/agents/telegram?agent_id=${agentId}`
            console.log(`[AGENT AUTO-SYNC]: Registering Webhook: ${webhookUrl}`)

            try {
                await $fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
                    method: 'POST',
                    body: { url: webhookUrl }
                })
                console.log(`[AGENT AUTO-SYNC]: SUCCESS! Telegram now points to this Agent ID: ${agentId}`)
            } catch (tgErr: any) {
                console.error(`[AGENT AUTO-SYNC]: Failed to sync with Telegram: ${tgErr.message}`)
            }
        }

        // 5. Unified Terminal Logs for Meta Platforms (WhatsApp, FB, Messenger)
        if (['whatsapp', 'messenger', 'fb_comment', 'facebook'].includes(platform) && agentId) {
            const endpoint = platform === 'whatsapp' ? 'whatsapp' : 'facebook'
            const smartUrl = `${siteUrl}/api/agents/${endpoint}`
            const manualUrl = `${smartUrl}?agent_id=${agentId}`

            console.log(`\n==================================================`)
            console.log(`[META SETUP]: NEW ${platform.toUpperCase()} CONNECTION!`)
            console.log(`VERIFY TOKEN: ${verifyToken}`)
            console.log(`--------------------------------------------------`)
            console.log(`SMART URL (Recommended): ${smartUrl}`)
            if (externalId) {
                console.log(`(We auto-detected ID: ${externalId})`)
            }
            console.log(`MANUAL URL (Fallback): ${manualUrl}`)
            console.log(`(Use the Manual URL if the Smart URL fails to find your agent)`)
            
            if (platform !== 'whatsapp') {
                console.log(`SUBSCRIPTIONS: messages, messaging_postbacks, feed`)
            }
            console.log(`==================================================\n`)
        }

        return {
            success: true,
            agent_id: agentId,
            message: platform === 'telegram' 
                ? 'Agent established and synced with Telegram.' 
                : 'Agent established! Please update your Meta Webhook with the ID shown in the terminal.'
        }

    } catch (e: any) {
        console.error('[AGENT CONNECT ERROR]:', e.message)
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
