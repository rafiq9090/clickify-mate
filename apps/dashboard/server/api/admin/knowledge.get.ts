import { requireDashboardRole } from '../../utils/auth-session'
import { listShopKnowledgeDocuments } from '../../utils/agent/rag/knowledge_indexer'
import { queryPg } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = await requireDashboardRole(event, ['owner', 'admin', 'manager', 'support', 'viewer'])

  try {
    // 1. Get shop ID for current user
    const shopRes = await queryPg('SELECT id FROM public.shops WHERE owner_user_id = $1 LIMIT 1', [auth.id])
    const shopId = shopRes.rows[0]?.id ? String(shopRes.rows[0].id) : null

    if (!shopId) {
      return { success: false, error: 'Shop profile not found for this account', documents: [], stats: {} }
    }

    // 2. Fetch documents
    const documents = await listShopKnowledgeDocuments(shopId)

    // 3. Compute stats
    const totalChunks = documents.reduce((acc, doc) => acc + Number(doc.chunk_count || 0), 0)
    const docTypesCount: Record<string, number> = {}
    for (const doc of documents) {
      docTypesCount[doc.doc_type] = (docTypesCount[doc.doc_type] || 0) + 1
    }

    return {
      success: true,
      shopId,
      documents,
      stats: {
        totalDocuments: documents.length,
        totalChunks,
        docTypesCount
      }
    }
  } catch (err: any) {
    console.error('[KNOWLEDGE_GET_ERROR]:', err)
    return { success: false, error: err.message, documents: [], stats: {} }
  }
})
