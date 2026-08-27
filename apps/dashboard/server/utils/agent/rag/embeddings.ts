/**
 * Universal Vector Embeddings Engine.
 * Supports OpenAI (text-embedding-3-small), custom endpoints, and a deterministic local fallback.
 */

import { getApiKey } from '../../settings'

const EMBEDDING_DIMENSION = 1536
const _embeddingMemoryCache = new Map<string, number[]>()
const MAX_CACHE_ENTRIES = 500

/**
 * Deterministic, normalized local vector fallback (1536-D) based on hashing and character n-grams.
 * Ensures the system operates without failures even when offline or before external API keys are configured.
 */
function generateLocalVector(text: string): number[] {
  const vec = new Array(EMBEDDING_DIMENSION).fill(0)
  if (!text) return vec

  const normalized = text.toLowerCase().trim()
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i)
    const idx1 = (charCode * 31 + i * 17) % EMBEDDING_DIMENSION
    const idx2 = (charCode * 59 + i * 37) % EMBEDDING_DIMENSION
    vec[idx1] += 1.0
    vec[idx2] += 0.5
  }

  // 3-gram hashing for sub-word semantic density
  for (let i = 0; i < normalized.length - 2; i++) {
    const gram = normalized.slice(i, i + 3)
    let hash = 0
    for (let j = 0; j < gram.length; j++) {
      hash = (hash << 5) - hash + gram.charCodeAt(j)
      hash |= 0
    }
    const idx = Math.abs(hash) % EMBEDDING_DIMENSION
    vec[idx] += 1.5
  }

  // L2 Normalization
  let norm = 0
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    norm += vec[i] * vec[i]
  }
  norm = Math.sqrt(norm) || 1.0

  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    vec[i] = Number((vec[i] / norm).toFixed(6))
  }

  return vec
}

/**
 * Generate embedding for a single text string.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const clean = (text || '').trim()
  if (!clean) return new Array(EMBEDDING_DIMENSION).fill(0)

  if (_embeddingMemoryCache.has(clean)) {
    return _embeddingMemoryCache.get(clean)!
  }

  const openaiKey = await getApiKey('openai_api_key', 'OPENAI_API_KEY')

  let embedding: number[] | null = null

  if (openaiKey && !openaiKey.includes('your_')) {
    try {
      const response = await $fetch<any>('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          input: clean.slice(0, 4000),
          model: 'text-embedding-3-small',
          dimensions: EMBEDDING_DIMENSION
        },
        timeout: 10000
      })

      if (response?.data?.[0]?.embedding) {
        embedding = response.data[0].embedding
      }
    } catch (err: any) {
      console.warn(`[EMBEDDING_API_WARN]: OpenAI embedding failed (${err?.message}). Using local embedding engine.`)
    }
  }

  if (!embedding) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('A real embedding provider is required for production semantic search.')
    }
    embedding = generateLocalVector(clean)
  }

  // Cache in memory
  if (_embeddingMemoryCache.size > MAX_CACHE_ENTRIES) {
    const firstKey = _embeddingMemoryCache.keys().next().value
    if (firstKey) _embeddingMemoryCache.delete(firstKey)
  }
  _embeddingMemoryCache.set(clean, embedding)

  return embedding
}

/**
 * Generate embeddings for multiple chunks in batch.
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = []
  for (const t of texts) {
    results.push(await getEmbedding(t))
  }
  return results
}
