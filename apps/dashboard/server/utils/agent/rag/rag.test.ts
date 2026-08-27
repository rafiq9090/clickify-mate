import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  estimateTokens,
  chunkTextSemantically,
  formatProductAsKnowledge
} from './agent_chunker'
import { getEmbedding } from './embeddings'
import { rerankCandidates } from './reranker'
import type { SearchResultChunk } from './hybrid_search'

describe('RAG Pipeline & Hybrid Search Unit Tests', () => {

  describe('1. Semantic Chunker (agent_chunker.ts)', () => {
    it('estimates tokens accurately for English and Bengali', () => {
      const enText = 'Hello, this is a premium quality cotton t-shirt with fast delivery.'
      const bnText = 'আমাদের ডেলিভারি চার্জ ঢাকার ভেতর ৮০ টাকা এবং ঢাকার বাইরে ১৫০ টাকা।'
      
      const enTokens = estimateTokens(enText)
      const bnTokens = estimateTokens(bnText)

      assert.ok(enTokens > 5 && enTokens < 30, `Expected reasonable English token count, got ${enTokens}`)
      assert.ok(bnTokens > 10 && bnTokens < 50, `Expected reasonable Bengali token count, got ${bnTokens}`)
    })

    it('chunks long policy text by semantic boundaries', () => {
      const samplePolicy = `
# Return and Exchange Policy
Customers can exchange items within 7 days of delivery.
Item must be unworn, unwashed, and in original packaging.

## Refund Rules
Advance delivery fee is non-refundable if the customer cancels after dispatch.
Damaged items will be replaced free of charge within 48 hours.

## Shipping Timeline
Inside Dhaka delivery takes 24 to 48 hours.
Outside Dhaka delivery takes 3 to 5 business days via Steadfast Courier.
      `.trim()

      const chunks = chunkTextSemantically(samplePolicy, {
        shopId: 'shop-uuid-123',
        title: 'Store Return & Shipping Policy',
        docType: 'policy',
        maxTokens: 50 // small maxTokens to force multiple semantic chunks
      })

      assert.ok(chunks.length >= 2, `Expected at least 2 chunks, got ${chunks.length}`)
      assert.equal(chunks[0]!.shopId, 'shop-uuid-123')
      assert.equal(chunks[0]!.metadata.docType, 'policy')
      assert.ok(chunks[0]!.content.includes('Store Return & Shipping Policy'))
    })

    it('formats product catalog into structured knowledge specs', () => {
      const product = {
        name: 'Premium Winter Hoodie',
        sku: 'HOODIE-BLK-01',
        price: 1200,
        regular_price: 1500,
        description: '320 GSM combed cotton fleece with double-lined hood.',
        variants: [
          { color: 'Black', size: 'L', price: 1200, quantity: 15 },
          { color: 'Maroon', size: 'XL', price: 1200, quantity: 8 }
        ]
      }

      const formatted = formatProductAsKnowledge(product)
      assert.ok(formatted.includes('Product: Premium Winter Hoodie'))
      assert.ok(formatted.includes('SKU: HOODIE-BLK-01'))
      assert.ok(formatted.includes('320 GSM combed cotton'))
      assert.ok(formatted.includes('Black / L'))
    })
  })

  describe('2. Universal Vector Embeddings Engine (embeddings.ts)', () => {
    it('generates 1536-dimensional normalized vectors with local fallback', async () => {
      const text = 'Return policy for defective products'
      const vec = await getEmbedding(text)

      assert.equal(vec.length, 1536, 'Vector must have 1536 dimensions')
      
      // Check L2 normalization (sum of squares ~ 1.0)
      let sumSquares = 0
      for (const val of vec) sumSquares += val * val
      assert.ok(Math.abs(sumSquares - 1.0) < 0.05, `Vector must be normalized, magnitude squared was ${sumSquares}`)
    })

    it('produces deterministic output and caches results in memory', async () => {
      const text = 'Steadfast Courier COD delivery charge'
      const vec1 = await getEmbedding(text)
      const vec2 = await getEmbedding(text)

      assert.deepEqual(vec1, vec2, 'Repeated calls for identical text must produce identical vectors')
    })
  })

  describe('3. Contextual Re-Ranker (reranker.ts)', () => {
    const mockCandidates: SearchResultChunk[] = [
      {
        id: '1',
        documentId: 'doc-1',
        shopId: 'shop-1',
        content: 'Our return policy allows exchanges within 7 days for any size issue.',
        tokenCount: 25,
        metadata: { docType: 'return_policy', title: 'Return Rules' },
        finalScore: 0.03,
        matchType: 'hybrid'
      },
      {
        id: '2',
        documentId: 'doc-2',
        shopId: 'shop-1',
        content: 'Delivery fee inside Dhaka is 80 BDT and outside Dhaka is 150 BDT via Steadfast.',
        tokenCount: 30,
        metadata: { docType: 'shipping_rules', title: 'Delivery Fees' },
        finalScore: 0.025,
        matchType: 'keyword'
      },
      {
        id: '3',
        documentId: 'doc-3',
        shopId: 'shop-1',
        content: 'Cotton T-Shirt Maroon XL with high durability wash care.',
        tokenCount: 20,
        metadata: { docType: 'product_spec', title: 'T-Shirt Specs' },
        finalScore: 0.02,
        matchType: 'vector'
      }
    ]

    it('boosts return policy chunk when intent is RETURN_INQUIRY', () => {
      const reranked = rerankCandidates(mockCandidates, {
        query: 'How can I return or change size?',
        intent: 'RETURN_INQUIRY',
        maxResults: 2
      })

      assert.ok(reranked.length >= 1 && reranked.length <= 2)
      assert.equal(reranked[0]!.id, '1', 'Return policy chunk must be ranked #1 for RETURN_INQUIRY')
    })

    it('boosts shipping rules when intent is DELIVERY_QUERY', () => {
      const reranked = rerankCandidates(mockCandidates, {
        query: 'Delivery charge koto Dhaka te?',
        intent: 'DELIVERY_INQUIRY',
        maxResults: 2
      })

      assert.ok(reranked.length >= 1 && reranked.length <= 2)
      assert.equal(reranked[0]!.id, '2', 'Delivery chunk must be ranked #1 for DELIVERY_QUERY')
    })
  })
})
