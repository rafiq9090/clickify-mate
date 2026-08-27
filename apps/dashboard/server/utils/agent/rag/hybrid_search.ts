/**
 * Production Hybrid Search Engine for Multi-Tenant Commerce Agents.
 * Combines Semantic Vector Search (pgvector/embeddings) with Full-Text Keyword Search (tsvector).
 * Enforces strict multi-tenant isolation (WHERE shop_id = $shop_id).
 */

import { queryPg } from '../../db'
import { getEmbedding } from './embeddings'

export interface SearchResultChunk {
  id: string
  documentId: string
  shopId: string
  agentId?: string
  content: string
  tokenCount: number
  metadata: Record<string, any>
  semanticScore?: number
  keywordScore?: number
  finalScore: number
  matchType: 'vector' | 'keyword' | 'hybrid'
}

const RRF_K = 60 // Standard Reciprocal Rank Fusion constant

/**
 * Perform multi-tenant hybrid search combining semantic vectors and keyword indexing.
 */
export async function performHybridSearch(options: {
  query: string
  shopId: string
  agentId?: string
  docTypes?: string[]
  limit?: number
}): Promise<SearchResultChunk[]> {
  const { query, shopId, agentId, docTypes, limit = 5 } = options
  const cleanQuery = (query || '').trim()

  if (!cleanQuery || !shopId) return []

  // 1. Keyword / Full-Text Search using PostgreSQL tsvector + ILIKE for SKUs
  let keywordSql = `
    SELECT kc.id, kc.document_id, kc.shop_id, kc.agent_id, kc.content, kc.token_count, kc.metadata,
           ts_rank_cd(kc.tsv_content, plainto_tsquery('simple', $1)) AS tsv_rank
      FROM public.knowledge_chunks kc
     WHERE kc.shop_id = $2
       AND (kc.tsv_content @@ plainto_tsquery('simple', $1) OR kc.content ILIKE $3)
  `
  const keywordParams: any[] = [cleanQuery, shopId, `%${cleanQuery}%`]
  let paramIdx = 4

  if (agentId) {
    keywordSql += ` AND (kc.agent_id IS NULL OR kc.agent_id = $${paramIdx})`
    keywordParams.push(agentId)
    paramIdx++
  }

  if (Array.isArray(docTypes) && docTypes.length > 0) {
    keywordSql += ` AND kc.metadata->>'docType' = ANY($${paramIdx})`
    keywordParams.push(docTypes)
    paramIdx++
  }

  // Also include exact substring / SKU match bonus
  keywordSql += `
     ORDER BY (ts_rank_cd(kc.tsv_content, plainto_tsquery('simple', $1)) + CASE WHEN kc.content ILIKE $3 THEN 2.0 ELSE 0.0 END) DESC
     LIMIT 15
  `

  let keywordRows: any[] = []
  try {
    const res = await queryPg(keywordSql, keywordParams)
    keywordRows = res.rows || []
  } catch (err: any) {
    console.warn(`[HYBRID_SEARCH_KEYWORD_WARN]: ${err.message}`)
  }

  // 2. Vector Semantic Search
  let vectorRows: any[] = []

  try {
    const queryEmbedding = await getEmbedding(cleanQuery)
    // Check if pgvector embedding column exists and query directly
    let pgVectorSql = `
      SELECT kc.id, kc.document_id, kc.shop_id, kc.agent_id, kc.content, kc.token_count, kc.metadata,
             1 - (kc.embedding <=> $1::vector) AS vector_similarity
        FROM public.knowledge_chunks kc
       WHERE kc.shop_id = $2
         AND kc.embedding IS NOT NULL
    `
    const vectorParams: any[] = [`[${queryEmbedding.join(',')}]`, shopId]
    let vectorParamIdx = 3
    if (agentId) {
      pgVectorSql += ` AND (kc.agent_id IS NULL OR kc.agent_id = $${vectorParamIdx})`
      vectorParams.push(agentId)
      vectorParamIdx++
    }
    if (Array.isArray(docTypes) && docTypes.length > 0) {
      pgVectorSql += ` AND kc.metadata->>'docType' = ANY($${vectorParamIdx})`
      vectorParams.push(docTypes)
    }
    pgVectorSql += ` ORDER BY kc.embedding <=> $1::vector ASC LIMIT 15`
    const vecRes = await queryPg(pgVectorSql, vectorParams)
    vectorRows = vecRes.rows || []
    // Low similarity chunks are worse than no context and encourage hallucinations.
    vectorRows = vectorRows.filter(row => Number(row.vector_similarity || 0) >= 0.30)
  } catch (vectorErr: any) {
    console.warn(`[HYBRID_SEARCH_VECTOR_WARN]: ${vectorErr?.message || 'Vector search unavailable'}`)
  }

  // 3. Reciprocal Rank Fusion (RRF) Merge
  const mergedMap = new Map<string, SearchResultChunk>()

  // Process Keyword Ranks
  keywordRows.forEach((row, rank) => {
    const id = String(row.id)
    const kScore = 1 / (RRF_K + rank + 1)

    mergedMap.set(id, {
      id,
      documentId: String(row.document_id),
      shopId: String(row.shop_id),
      agentId: row.agent_id ? String(row.agent_id) : undefined,
      content: row.content,
      tokenCount: Number(row.token_count || 0),
      metadata: row.metadata || {},
      keywordScore: Number(row.tsv_rank || 0),
      finalScore: kScore,
      matchType: 'keyword'
    })
  })

  // Process Vector Ranks
  vectorRows.forEach((row, rank) => {
    const id = String(row.id)
    const vScore = 1 / (RRF_K + rank + 1)
    const existing = mergedMap.get(id)

    if (existing) {
      existing.finalScore += vScore
      existing.semanticScore = Number(row.vector_similarity || 0)
      existing.matchType = 'hybrid'
    } else {
      mergedMap.set(id, {
        id,
        documentId: String(row.document_id),
        shopId: String(row.shop_id),
        agentId: row.agent_id ? String(row.agent_id) : undefined,
        content: row.content,
        tokenCount: Number(row.token_count || 0),
        metadata: row.metadata || {},
        semanticScore: Number(row.vector_similarity || 0),
        finalScore: vScore,
        matchType: 'vector'
      })
    }
  })

  // Sort by final fusion score descending
  const sorted = Array.from(mergedMap.values())
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit)

  return sorted
}
