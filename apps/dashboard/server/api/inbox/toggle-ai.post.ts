// server/api/inbox/toggle-ai.post.ts
import { useSupabaseAdmin } from '../../utils/supabase'
import { requireDashboardRole } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
    const user = await requireDashboardRole(event, ['owner', 'admin', 'manager', 'support'])
    const body = await readBody(event)
    const { user_external_id, platform, agent_id, ai_disabled } = body || {}

    if (!user_external_id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing user_external_id' })
    }

    const supabase = useSupabaseAdmin()
    const targetPlatform = (platform || 'telegram').toLowerCase()
    const emailKey = `${user_external_id}@${targetPlatform}.org`
    const isAiDisabled = Boolean(ai_disabled)

    // Look up all matching leads for this customer
    const { data: allMatchingLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('data->>user_id', user.id)
        .order('created_at', { ascending: false })

    let updatedCount = 0
    if (Array.isArray(allMatchingLeads) && allMatchingLeads.length > 0) {
        for (const lead of allMatchingLeads) {
            const leadEmail = lead.email || ''
            const leadCustomer = lead.data?.customer || ''
            if (
                leadEmail === emailKey ||
                leadEmail.startsWith(`${user_external_id}@`) ||
                leadCustomer === user_external_id.toString()
            ) {
                const updatedData = {
                    ...(lead.data || {}),
                    ai_disabled: isAiDisabled
                }

                await supabase
                    .from('leads')
                    .update({ data: updatedData })
                    .eq('id', lead.id)

                updatedCount++
            }
        }
    }

    if (updatedCount === 0) {
        // Create new lead state
        await supabase
            .from('leads')
            .insert({
                email: emailKey,
                source: 'ai_agent',
                data: {
                    platform: targetPlatform,
                    customer: user_external_id.toString(),
                    agent_id: agent_id || null,
                    user_id: user.id,
                    ai_disabled: isAiDisabled
                }
            })
    }

    return {
        success: true,
        user_external_id,
        platform: targetPlatform,
        ai_disabled: isAiDisabled,
        updatedCount
    }
})
