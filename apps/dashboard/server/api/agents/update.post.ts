// server/api/agents/update.post.ts
import { requireDashboardRole } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
    const dashboardUser = await requireDashboardRole(event, ['owner', 'admin', 'manager', 'support'])
    const body = await readBody(event)
    const { id, knowledge, product_images, agent_behavior, is_active } = body

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Agent ID is required' })
    }

    const supabase = useSupabaseAdmin()

    // Clean product_images: only save non-empty strings/URLs
    const cleanImages = Array.isArray(product_images)
        ? product_images
            .map((img: any) => typeof img === 'string' ? img.trim() : (img?.url || '').trim())
            .filter((url: string) => url.length > 0)
        : []

    const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString()
    }

    if (knowledge !== undefined) updatePayload.knowledge = String(knowledge || '')
    if (product_images !== undefined) updatePayload.product_images = cleanImages
    if (agent_behavior !== undefined) updatePayload.agent_behavior = agent_behavior
    if (is_active !== undefined) updatePayload.is_active = Boolean(is_active)

    const { data, error } = await supabase
        .from('agent_configs')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('[AGENT UPDATE ERROR]:', error)
        throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to update agent knowledge' })
    }

    return {
        success: true,
        message: 'Agent knowledge and settings saved successfully!',
        agent: data
    }
})
