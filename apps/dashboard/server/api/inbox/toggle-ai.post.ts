// server/api/inbox/toggle-ai.post.ts
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { user_external_id, platform, agent_id, ai_disabled } = body || {}

    if (!user_external_id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing user_external_id' })
    }

    const supabase = useSupabaseAdmin()
    const targetPlatform = platform || 'telegram'
    const emailKey = `${user_external_id}@${targetPlatform}.org`

    // Look up existing lead
    const { data: existingLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('email', emailKey)
        .order('created_at', { ascending: false })
        .limit(1)

    if (existingLeads && existingLeads.length > 0) {
        const lead = existingLeads[0]
        const updatedData = {
            ...(lead.data || {}),
            ai_disabled: Boolean(ai_disabled)
        }

        const { error } = await supabase
            .from('leads')
            .update({ data: updatedData })
            .eq('id', lead.id)

        if (error) {
            console.error('[TOGGLE AI LEAD ERROR]:', error.message)
            throw createError({ statusCode: 500, statusMessage: 'Failed to update AI state: ' + error.message })
        }
    } else {
        // Create new lead with AI state
        const { error } = await supabase
            .from('leads')
            .insert({
                email: emailKey,
                source: 'ai_agent',
                data: {
                    platform: targetPlatform,
                    customer: user_external_id.toString(),
                    agent_id: agent_id || null,
                    ai_disabled: Boolean(ai_disabled)
                }
            })

        if (error) {
            console.error('[TOGGLE AI INSERT LEAD ERROR]:', error.message)
            throw createError({ statusCode: 500, statusMessage: 'Failed to create lead state: ' + error.message })
        }
    }

    return {
        success: true,
        user_external_id,
        ai_disabled: Boolean(ai_disabled)
    }
})
