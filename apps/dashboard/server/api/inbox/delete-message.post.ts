// server/api/inbox/delete-message.post.ts
import { decrypt } from '../../utils/encryption'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id, message_id, media_message_ids, user_external_id, agent_id, platform, permanent } = body || {}

    if (!id && !message_id && !user_external_id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing message ID or user external ID' })
    }

    const supabase = useSupabaseAdmin()
    let agent: any = null

    if (agent_id) {
        const { data } = await supabase.from('agent_configs').select('*').eq('id', agent_id).maybeSingle()
        agent = data
    } else {
        const { data } = await supabase.from('agent_configs').select('*').eq('platform', platform || 'telegram').maybeSingle()
        agent = data
    }

    let deletedFromPlatform = false

    // 1. Delete message from Telegram if token and message_id available
    if (agent && agent.encrypted_token && user_external_id && (platform === 'telegram' || agent.platform === 'telegram')) {
        try {
            const token = await decrypt(agent.encrypted_token)
            const idsToDelete = [
                ...(message_id ? [message_id] : []),
                ...(Array.isArray(media_message_ids) ? media_message_ids : [])
            ].filter(Boolean)

            for (const mid of idsToDelete) {
                try {
                    await $fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
                        method: 'POST',
                        body: {
                            chat_id: user_external_id,
                            message_id: parseInt(mid.toString())
                        }
                    })
                    deletedFromPlatform = true
                    console.log(`[TELEGRAM DELETE]: Successfully deleted message #${mid} from chat ${user_external_id}`)
                } catch (delErr: any) {
                    console.warn(`[TELEGRAM DELETE WARNING]: Could not delete message #${mid} from Telegram:`, delErr.data?.description || delErr.message)
                }
            }
        } catch (e: any) {
            console.error('[TELEGRAM DELETE ERROR]:', e.message)
        }
    }

    // 2. Update or delete in chat_history database table
    try {
        if (permanent && id) {
            await supabase.from('chat_history').delete().eq('id', id)
        } else if (id) {
            await supabase.from('chat_history').update({
                is_deleted: true,
                deleted_at: new Date().toISOString()
            }).eq('id', id)
        } else if (user_external_id && permanent) {
            // Delete entire thread
            await supabase.from('chat_history').delete().eq('user_external_id', user_external_id)
        }
    } catch (dbErr: any) {
        console.warn('[DELETE HISTORY DB WARNING]:', dbErr.message)
    }

    return {
        success: true,
        deleted_from_platform: deletedFromPlatform
    }
})
