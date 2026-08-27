import { requireDashboardRole } from '../../utils/auth-session'
import {
  upsertKnowledgeDocument,
  deleteKnowledgeDocument,
  syncProductToKnowledgeStore
} from '../../utils/agent/rag/knowledge_indexer'
import { performHybridSearch } from '../../utils/agent/rag/hybrid_search'
import { rerankCandidates } from '../../utils/agent/rag/reranker'
import { listCatalogForShop } from '../../utils/catalog-store'
import { queryPg } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = await requireDashboardRole(event, ['owner', 'admin'])
  const body = await readBody(event)
  const { action = 'upsert', document_id, title, content, doc_type = 'general', source_id, metadata = {}, query } = body || {}

  try {
    // 1. Resolve user's shop ID
    const shopRes = await queryPg('SELECT id FROM public.shops WHERE owner_user_id = $1 LIMIT 1', [auth.id])
    const shopId = shopRes.rows[0]?.id ? String(shopRes.rows[0].id) : null

    if (!shopId) {
      return { success: false, error: 'Shop profile not found for this account' }
    }

    // ==========================================
    // ACTION: DELETE DOCUMENT
    // ==========================================
    if (action === 'delete') {
      if (!document_id) {
        return { success: false, error: 'Missing document_id' }
      }
      const deleted = await deleteKnowledgeDocument(document_id, shopId)
      return {
        success: deleted,
        message: deleted ? 'Document and associated vector chunks deleted successfully.' : 'Document not found.'
      }
    }

    // ==========================================
    // ACTION: REINDEX ALL CATALOG & POLICIES
    // ==========================================
    if (action === 'reindex_all') {
      const catalog = await listCatalogForShop(shopId)
      let indexedProducts = 0

      for (const prod of catalog) {
        try {
          await syncProductToKnowledgeStore(prod, shopId)
          indexedProducts++
        } catch (err: any) {
          console.warn(`[REINDEX_PRODUCT_WARN]: ${prod.sku} (${err.message})`)
        }
      }

      return {
        success: true,
        message: `Successfully re-indexed ${indexedProducts} product(s) into vector RAG store!`,
        indexedProducts
      }
    }

    // ==========================================
    // ACTION: LIVE HYBRID SEARCH TEST
    // ==========================================
    if (action === 'search_test') {
      if (!query || typeof query !== 'string') {
        return { success: false, error: 'Missing search query string' }
      }

      const rawMatches = await performHybridSearch({
        query,
        shopId,
        limit: 10
      })

      const reranked = rerankCandidates(rawMatches, {
        query,
        maxResults: 5
      })

      return {
        success: true,
        query,
        rawCandidateCount: rawMatches.length,
        rerankedTopCount: reranked.length,
        results: reranked
      }
    }

    // ==========================================
    // ACTION: UPSERT KNOWLEDGE DOCUMENT
    // ==========================================
    if (!title || !content || typeof title !== 'string' || typeof content !== 'string') {
      return { success: false, error: 'Title and content are required' }
    }

    const result = await upsertKnowledgeDocument({
      shopId,
      docType: doc_type,
      title: title.trim(),
      sourceId: source_id || `doc_${Date.now()}`,
      content: content.trim(),
      metadata: {
        ...metadata,
        updatedBy: auth.email,
        updatedAt: new Date().toISOString()
      }
    })

    return {
      success: true,
      message: `Knowledge document "${title}" indexed successfully (${result.chunksIndexed} chunk(s) generated)!`,
      documentId: result.documentId,
      chunksIndexed: result.chunksIndexed
    }
  } catch (err: any) {
    console.error('[KNOWLEDGE_POST_ERROR]:', err)
    return { success: false, error: err.message }
  }
})
