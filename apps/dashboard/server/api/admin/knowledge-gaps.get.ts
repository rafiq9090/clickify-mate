import { useSupabaseAdmin } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
    requireAdminSession(event)
    const supabase = useSupabaseAdmin()
    if (!supabase || !supabase.from) {
        return { success: false, data: [] }
    }

    const query = getQuery(event)
    const agentId = query.agent_id

    try {
        let dbQuery = supabase
            .from('knowledge_gaps')
            .select('*')
            .order('frequency', { ascending: false })
            .order('last_asked_at', { ascending: false })

        if (agentId) {
            dbQuery = dbQuery.eq('agent_id', agentId)
        }

        const { data, error } = await dbQuery.limit(50)

        if (error) {
            return { success: false, error: error.message, data: [] }
        }

        return { success: true, data: data || [] }
    } catch (e: any) {
        return { success: false, error: e.message, data: [] }
    }
})
