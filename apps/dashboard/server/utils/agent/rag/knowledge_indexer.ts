/**
 * Auto-Indexing & Knowledge Base Synchronization Engine.
 * Handles document upserts, chunking, embedding generation, and DB synchronization for products & policies.
 */

import { queryPg, withPgTransaction } from '../../db'
import { chunkTextSemantically, formatProductAsKnowledge } from './agent_chunker'
import { getEmbedding } from './embeddings'

export interface UpsertDocumentInput {
  shopId: string
  agentId?: string
  docType: 'policy' | 'faq' | 'product_spec' | 'sizing_guide' | 'care_instructions' | 'warranty' | 'shipping_rules' | 'general'
  title: string
  sourceId?: string
  content: string
  metadata?: Record<string, any>
}

/**
 * Upsert a knowledge document and automatically chunk, embed, and index it.
 */
export async function upsertKnowledgeDocument(input: UpsertDocumentInput): Promise<{ documentId: string; chunksIndexed: number }> {
  const { shopId, agentId, docType, title, sourceId, content, metadata = {} } = input
  if (!shopId || !title || !content) {
    throw new Error('shopId, title, and content are required for knowledge document indexing.')
  }

  return await withPgTransaction(async (client) => {
    // 1. Upsert document in public.knowledge_documents
    const docRes = await client.query(
      `INSERT INTO public.knowledge_documents (shop_id, agent_id, doc_type, title, source_id, content, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (shop_id, doc_type, source_id)
       DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          agent_id = EXCLUDED.agent_id,
          updated_at = now()
       RETURNING id`,
      [shopId, agentId || null, docType, title, sourceId || 'default', content, JSON.stringify(metadata)]
    )

    const documentId = String(docRes.rows[0].id)

    // 2. Remove old chunks for this document
    await client.query('DELETE FROM public.knowledge_chunks WHERE document_id = $1', [documentId])

    // 3. Create semantic chunks
    const chunks = chunkTextSemantically(content, {
      shopId,
      agentId,
      documentId,
      title,
      docType,
      metadata
    })

    // 4. Check if vector column exists
    let hasVectorCol = false
    try {
      const checkVec = await client.query(
        `SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'knowledge_chunks' AND column_name = 'embedding'`
      )
      hasVectorCol = (checkVec.rows || []).length > 0
    } catch (_err) {
      hasVectorCol = false
    }

    // 5. Insert each chunk with embedding
    let indexedCount = 0
    for (const chunk of chunks) {
      let embedding: number[] | null = null
      if (hasVectorCol) {
        try {
          embedding = await getEmbedding(chunk.content)
        } catch (error: any) {
          // Keyword chunks are still production-safe. Never index deterministic
          // pseudo-vectors as if they were semantic embeddings.
          console.warn(`[KNOWLEDGE_VECTOR_DEFERRED]: ${error?.message || 'Embedding provider unavailable'}`)
        }
      }

      if (hasVectorCol && embedding) {
        await client.query(
          `INSERT INTO public.knowledge_chunks (
             document_id, shop_id, agent_id, chunk_index, content, token_count, metadata, embedding
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)`,
          [
            documentId,
            shopId,
            agentId || null,
            chunk.chunkIndex,
            chunk.content,
            chunk.tokenCount,
            JSON.stringify(chunk.metadata),
            `[${embedding.join(',')}]`
          ]
        )
      } else {
        await client.query(
          `INSERT INTO public.knowledge_chunks (
             document_id, shop_id, agent_id, chunk_index, content, token_count, metadata
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            documentId,
            shopId,
            agentId || null,
            chunk.chunkIndex,
            chunk.content,
            chunk.tokenCount,
            JSON.stringify(chunk.metadata)
          ]
        )
      }
      indexedCount++
    }

    return { documentId, chunksIndexed: indexedCount }
  })
}

/**
 * Synchronize a product into the knowledge store.
 */
export async function syncProductToKnowledgeStore(
  product: any,
  shopId: string,
  agentId?: string
): Promise<void> {
  if (!product || !shopId) return

  const formattedText = formatProductAsKnowledge(product)
  const sourceId = `prod_${product.sku || product.id || 'unknown'}`
  const title = `Product: ${product.name} (${product.sku || 'SKU'})`

  await upsertKnowledgeDocument({
    shopId,
    agentId,
    docType: 'product_spec',
    title,
    sourceId,
    content: formattedText,
    metadata: {
      productId: product.id,
      sku: product.sku,
      price: product.price,
      currency: product.currency || 'BDT',
      category: product.metadata?.category || 'apparel'
    }
  })
}

/**
 * Synchronize an approved knowledge gap into the permanent RAG store.
 */
export async function syncKnowledgeGapToStore(
  gap: {
    id?: string
    shopId: string
    agentId?: string
    question: string
    approvedAnswer: string
    category?: string
  }
): Promise<void> {
  if (!gap.shopId || !gap.approvedAnswer) return

  const docType = gap.category === 'return_policy' ? 'policy'
    : gap.category === 'warranty' ? 'warranty'
    : gap.category === 'care_instructions' ? 'care_instructions'
    : 'faq'

  await upsertKnowledgeDocument({
    shopId: gap.shopId,
    agentId: gap.agentId,
    docType: docType as any,
    title: `FAQ: ${gap.question.slice(0, 100)}`,
    sourceId: `gap_${gap.id || Date.now()}`,
    content: `Question: ${gap.question}\nAnswer: ${gap.approvedAnswer}`,
    metadata: {
      gapId: gap.id,
      source: 'merchant_approved_knowledge_gap',
      category: gap.category || 'faq'
    }
  })
}

/**
 * List all knowledge documents for a shop.
 */
export async function listShopKnowledgeDocuments(shopId: string): Promise<any[]> {
  const result = await queryPg(
    `SELECT kd.id, kd.shop_id, kd.agent_id, kd.doc_type, kd.title, kd.source_id,
            kd.content, kd.metadata, kd.is_active, kd.created_at, kd.updated_at,
            (SELECT COUNT(*) FROM public.knowledge_chunks kc WHERE kc.document_id = kd.id)::int AS chunk_count
       FROM public.knowledge_documents kd
      WHERE kd.shop_id = $1
      ORDER BY kd.updated_at DESC`,
    [shopId]
  )
  return result.rows || []
}

/**
 * Delete a knowledge document.
 */
export async function deleteKnowledgeDocument(documentId: string, shopId: string): Promise<boolean> {
  const res = await queryPg(
    'DELETE FROM public.knowledge_documents WHERE id = $1 AND shop_id = $2 RETURNING id',
    [documentId, shopId]
  )
  return (res.rows || []).length > 0
}
