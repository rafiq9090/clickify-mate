// server/api/agents/connect.post.ts
import { encrypt } from '../../utils/encryption'
import { requireDashboardRole } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
    const dashboardUser = await requireDashboardRole(event, ['owner', 'admin', 'manager'])
    const body = await readBody(event)
    const { platform, token, knowledge, name } = body

    if (!platform || !token) {
        throw createError({ statusCode: 400, statusMessage: 'Metadata missing: platform and token are required' })
    }

    if (process.env.NODE_ENV === 'production') {
        if (platform === 'telegram' && !process.env.TELEGRAM_WEBHOOK_SECRET) {
            throw createError({ statusCode: 500, statusMessage: 'TELEGRAM_WEBHOOK_SECRET must be configured before connecting Telegram.' })
        }
        if (['messenger', 'fb_comment', 'facebook', 'whatsapp', 'instagram', 'ig_comment'].includes(platform) && !(process.env.META_APP_SECRET || process.env.FB_APP_SECRET)) {
            throw createError({ statusCode: 500, statusMessage: 'META_APP_SECRET must be configured before connecting Meta channels.' })
        }
    }

    try {
        const supabase = useSupabaseAdmin()
        
        const user_id = dashboardUser.id

        const encryptedToken = encrypt(token)

        let externalId = null
        let detectedName = name || ''

        // Auto-detect External ID and Name for Meta Platforms (FB, Messenger, WhatsApp, Instagram)
        if (['messenger', 'fb_comment', 'facebook', 'whatsapp', 'instagram', 'ig_comment'].includes(platform)) {
            try {
                // 1. Get the main account ID (Page ID, WABA ID, or connected Instagram Account)
                const metaData: any = await $fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,instagram_business_account{id,username}&access_token=${token}`).catch(() => null)
                if (metaData?.id) {
                    externalId = metaData.id
                    if (!detectedName && metaData.name) {
                        detectedName = metaData.name
                    }

                    // 2. For Instagram, check connected Instagram Business Account
                    if (platform === 'instagram' || platform === 'ig_comment') {
                        if (metaData.instagram_business_account?.id) {
                            externalId = metaData.instagram_business_account.id
                            if (metaData.instagram_business_account.username) {
                                detectedName = `@${metaData.instagram_business_account.username} (Instagram)`
                            }
                            console.log(`[AGENT CONNECT]: Auto-detected Instagram Business ID: ${externalId}`)
                        }
                    }
                    
                    // 3. For WhatsApp, specifically fetch phone_number_id
                    if (platform === 'whatsapp') {
                        try {
                            const phones: any = await $fetch(`https://graph.facebook.com/v19.0/${externalId}/phone_numbers?access_token=${token}`).catch(() => null)
                            if (phones?.data?.[0]?.id) {
                                externalId = phones.data[0].id
                                if (phones.data[0].display_phone_number) {
                                    detectedName = `${detectedName || 'WhatsApp'} (${phones.data[0].display_phone_number})`
                                }
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

        // Auto-detect External ID for Telegram
        if (platform === 'telegram') {
            try {
                const tgData: any = await $fetch(`https://api.telegram.org/bot${token}/getMe`).catch(() => null)
                if (tgData?.result?.id) {
                    externalId = tgData.result.id.toString()
                    if (!detectedName && (tgData.result.first_name || tgData.result.username)) {
                        detectedName = tgData.result.first_name || `@${tgData.result.username}`
                    }
                    console.log(`[AGENT CONNECT]: Auto-detected Telegram Bot: ${detectedName} (${externalId})`)
                }
            } catch (tgErr: any) {
                console.warn(`[AGENT CONNECT]: Could not fetch Telegram Bot info: ${tgErr.message}`)
            }
        }

        const agentLabel = detectedName || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Agent`

        // Check if this external_id is already registered to ANOTHER user
        if (externalId) {
            const { data: existingSameId } = await supabase
                .from('agent_configs')
                .select('id, user_id, platform')
                .eq('external_id', externalId)

            if (existingSameId && existingSameId.length > 0) {
                const otherUserAgent = existingSameId.find((a: any) => a.user_id !== user_id)
                if (otherUserAgent) {
                    throw createError({
                        statusCode: 409,
                        statusMessage: `This ${platform} account/bot (ID: ${externalId}) is already connected by another user.`
                    })
                }
            }
        }

        // Check if this exact user already has this external_id or token -> update it; otherwise insert new agent!
        let existingUserAgent: any = null
        if (externalId) {
            const { data: found } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('user_id', user_id)
                .eq('external_id', externalId)
            if (found && found.length > 0) {
                existingUserAgent = found[0]
            }
        }

        let activeAgent: any = null

        if (existingUserAgent) {
            // Update existing agent configuration
            const { data, error } = await supabase
                .from('agent_configs')
                .update({
                    name: agentLabel,
                    encrypted_token: encryptedToken,
                    knowledge: knowledge || existingUserAgent.knowledge || '',
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingUserAgent.id)
                .select()
            if (error) throw error
            activeAgent = (data as any)?.[0] || existingUserAgent
        } else {
            // Insert brand new agent row (supports MULTIPLE agents on the same platform!)
            const { data, error } = await supabase
                .from('agent_configs')
                .insert({
                    user_id: user_id,
                    name: agentLabel,
                    platform,
                    encrypted_token: encryptedToken,
                    external_id: externalId,
                    knowledge: knowledge || '',
                    product_images: [],
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
            if (error) throw error
            activeAgent = (data as any)?.[0]
        }

        const agentId = activeAgent?.id

        const host = getRequestHeader(event, 'host')
        const protocol = host?.includes('localhost') ? 'http' : 'https'
        const siteUrl = `${protocol}://${host}`

        // Automatic Meta Subscription
        if (['messenger', 'fb_comment', 'facebook'].includes(platform) && externalId) {
            try {
                await $fetch(`https://graph.facebook.com/v19.0/${externalId}/subscribed_apps`, {
                    method: 'POST',
                    query: {
                        subscribed_fields: 'feed,messages,messaging_postbacks',
                        access_token: token
                    }
                }).catch(() => null)
                console.log(`[AGENT AUTO-SYNC]: Subscribed Meta App to Page ${externalId}`)
            } catch (fbErr: any) {
                console.error(`[AGENT AUTO-SYNC]: Meta subscription note: ${fbErr.message}`)
            }
        }

        // Automatic Telegram Webhook Registration
        if (platform === 'telegram' && agentId) {
            const webhookUrl = `${siteUrl}/api/agents/telegram?agent_id=${agentId}`
            try {
                await $fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
                    method: 'POST',
                    body: {
                        url: webhookUrl,
                        ...(process.env.TELEGRAM_WEBHOOK_SECRET ? { secret_token: process.env.TELEGRAM_WEBHOOK_SECRET } : {})
                    }
                }).catch(() => null)
                console.log(`[AGENT AUTO-SYNC]: Registered Telegram Webhook: ${webhookUrl}`)
            } catch (tgErr: any) {
                console.error(`[AGENT AUTO-SYNC]: Telegram webhook note: ${tgErr.message}`)
            }
        }

        return {
            success: true,
            agent_id: agentId,
            agent_name: agentLabel,
            message: `${agentLabel} connected successfully!`
        }

    } catch (e: any) {
        console.error('[AGENT CONNECT ERROR]:', e.message)
        if (e.statusCode) throw e
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
