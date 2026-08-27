import { useSupabaseAdmin } from '../../utils/supabase'
import { requireAdminSession } from '../../utils/auth-session'
import { syncKnowledgeGapToStore } from '../../utils/agent/rag/knowledge_indexer'
import { shopIdForAgent } from '../../utils/catalog-store'

export default defineEventHandler(async (event) => {
    const auth = requireAdminSession(event)
    const adminIdentity = `system:${auth.username}`

    const supabase = useSupabaseAdmin()
    if (!supabase || !supabase.from) {
        return { success: false, error: 'Database client unavailable' }
    }

    const body = await readBody(event)
    const { gap_id, action, approved_answer, rollback_to_version } = body || {}

    if (!gap_id && !rollback_to_version) {
        return { success: false, error: 'Missing gap_id or rollback_to_version' }
    }

    try {
        // ==========================================
        // A. HANDLE KNOWLEDGE ROLLBACK (Immutable Audit Trail)
        // ==========================================
        if (action === 'rollback' && rollback_to_version && body.agent_id) {
            const { data: agent } = await supabase
                .from('agent_configs')
                .select('id, knowledge, data')
                .eq('id', body.agent_id)
                .maybeSingle()

            if (!agent) {
                return { success: false, error: 'Agent not found' }
            }

            const currentData = agent.data || {}
            const history: any[] = currentData.knowledge_history || []
            const targetSnapshot = history.find((h: any) => h.version === rollback_to_version)

            if (!targetSnapshot) {
                return { success: false, error: `Version ${rollback_to_version} not found in knowledge snapshot history` }
            }

            // Create new audit version for the rollback action (never overwrite/destroy audit history)
            const newVersion = (history.length || 0) + 1
            const updatedHistory = [
                ...history,
                {
                    version: newVersion,
                    knowledge: targetSnapshot.knowledge,
                    created_at: new Date().toISOString(),
                    action: 'ROLLBACK',
                    restored_from_version: rollback_to_version,
                    topic: `Restored from Version ${rollback_to_version}`,
                    approved_by: adminIdentity
                }
            ].slice(-30) // Keep last 30 snapshots

            await supabase
                .from('agent_configs')
                .update({
                    knowledge: targetSnapshot.knowledge,
                    data: {
                        ...currentData,
                        knowledge_version: newVersion,
                        knowledge_history: updatedHistory
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', body.agent_id)

            return {
                success: true,
                message: `Successfully rolled back knowledge to Version ${rollback_to_version} (Created Version ${newVersion} audit entry)`
            }
        }

        // ==========================================
        // B. HANDLE GAP REJECTION
        // ==========================================
        if (action === 'reject') {
            await supabase
                .from('knowledge_gaps')
                .update({
                    status: 'rejected',
                    approved_by: adminIdentity,
                    last_asked_at: new Date().toISOString()
                })
                .eq('id', gap_id)

            return { success: true, message: 'Knowledge gap rejected' }
        }

        // ==========================================
        // C. HANDLE GAP APPROVAL & PUBLICATION
        // ==========================================
        const { data: gap } = await supabase
            .from('knowledge_gaps')
            .select('*')
            .eq('id', gap_id)
            .maybeSingle()

        if (!gap) {
            return { success: false, error: 'Knowledge gap not found' }
        }

        const finalAnswer = approved_answer || gap.suggested_answer || ''
        if (!finalAnswer || finalAnswer.trim().length < 5) {
            return { success: false, error: 'Approved answer must be at least 5 characters long' }
        }

        // 1. Mark gap as published with author audit stamp
        await supabase
            .from('knowledge_gaps')
            .update({
                status: 'published',
                approved_answer: finalAnswer,
                approved_by: adminIdentity,
                approved_at: new Date().toISOString()
            })
            .eq('id', gap_id)

        // 2. Fetch agent, snapshot current version, and append FAQ
        const { data: agent } = await supabase
            .from('agent_configs')
            .select('id, knowledge, data')
            .eq('id', gap.agent_id)
            .maybeSingle()

        if (agent) {
            const currentKnowledge = agent.knowledge || ''
            const currentData = agent.data || {}
            const existingHistory = currentData.knowledge_history || []
            const newVersion = (existingHistory.length || 0) + 1

            const updatedHistory = [
                ...existingHistory,
                {
                    version: newVersion,
                    knowledge: currentKnowledge,
                    created_at: new Date().toISOString(),
                    gap_id: gap.id,
                    topic: gap.normalized_topic || gap.question,
                    approved_by: adminIdentity
                }
            ].slice(-30)

            const newFaqEntry = `\n\n[FAQ - ${gap.normalized_topic || gap.question}]:\n${finalAnswer}`

            await supabase
                .from('agent_configs')
                .update({
                    knowledge: currentKnowledge + newFaqEntry,
                    data: {
                        ...currentData,
                        knowledge_version: newVersion,
                        knowledge_history: updatedHistory
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', agent.id)
        }

        // 3. Auto-sync to Multi-Tenant Vector RAG Knowledge Store
        try {
            const shopId = await shopIdForAgent(gap.agent_id)
            if (shopId) {
                syncKnowledgeGapToStore({
                    id: gap.id,
                    shopId,
                    agentId: gap.agent_id,
                    question: gap.normalized_topic || gap.question,
                    approvedAnswer: finalAnswer,
                    category: gap.category
                }).catch(err => {
                    console.warn(`[KNOWLEDGE_GAP_RAG_SYNC_WARN]: ${err.message}`)
                })
            }
        } catch (syncErr: any) {
            console.warn(`[KNOWLEDGE_GAP_RAG_ERROR]: ${syncErr.message}`)
        }

        return {
            success: true,
            message: `Knowledge gap "${gap.normalized_topic || gap.question}" published successfully with version snapshot & RAG vector sync!`
        }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
})
