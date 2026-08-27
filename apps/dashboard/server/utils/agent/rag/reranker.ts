/**
 * Lightweight Contextual Re-Ranker for E-Commerce RAG.
 * Filters, re-scores, and deduplicates top candidates before injecting into the LLM system prompt.
 */

import type { SearchResultChunk } from './hybrid_search'

export interface RerankedChunk {
  chunk: SearchResultChunk
  relevanceScore: number
  reason: string
}

/**
 * Re-rank candidate chunks against query and conversation intent context.
 */
export function rerankCandidates(
  candidates: SearchResultChunk[],
  context: {
    query: string
    intent?: string
    entities?: Record<string, any>
    maxResults?: number
  }
): SearchResultChunk[] {
  const { query, intent, entities = {}, maxResults = 3 } = context
  if (!candidates || candidates.length === 0) return []

  const queryTerms = (query || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2)

  const entityValues = Object.values(entities)
    .filter(v => typeof v === 'string' && v.trim().length > 0)
    .map((v: any) => v.toLowerCase().trim())

  const scored: RerankedChunk[] = []
  const seenContentFingerprints = new Set<string>()

  for (const chunk of candidates) {
    // 1. Deduplication by normalized text fingerprint
    const fingerprint = chunk.content.replace(/\s+/g, ' ').toLowerCase().slice(0, 80)
    if (seenContentFingerprints.has(fingerprint)) {
      continue
    }
    seenContentFingerprints.add(fingerprint)

    let score = chunk.finalScore * 10 // Base fusion score
    const contentLower = chunk.content.toLowerCase()
    let matchedEntities = 0

    // 2. Keyword density & entity alignment boost
    let matchedTerms = 0
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        matchedTerms++
        score += 1.5
      }
    }

    // 3. Exact entity match boost (color, size, SKU, district)
    for (const ent of entityValues) {
      if (contentLower.includes(ent)) {
        score += 3.0
        matchedEntities++
      }
    }

    // 4. Intent-specific document type alignment boost
    const docType = chunk.metadata?.docType || ''
    let isIntentAligned = false
    if ((intent === 'RETURN_INQUIRY' || intent === 'COMPLAINT') && (docType === 'return_policy' || docType === 'policy')) {
      score += 5.0
      isIntentAligned = true
    } else if ((intent === 'DELIVERY_QUERY' || intent === 'DELIVERY_INQUIRY') && (docType === 'shipping_rules' || docType === 'policy')) {
      score += 5.0
      isIntentAligned = true
    } else if (intent === 'PRODUCT_INFO' && (docType === 'warranty' || docType === 'product_spec' || docType === 'sizing_guide')) {
      score += 5.0
      isIntentAligned = true
    } else if ((intent === 'PRODUCT_DISCOVERY' || intent === 'STOCK_QUERY') && (docType === 'product_spec' || docType === 'sizing_guide')) {
      score += 4.0
      isIntentAligned = true
    }

    const hasStrongSemanticMatch = Number(chunk.semanticScore || 0) >= 0.55
    const hasKeywordEvidence = Number(chunk.keywordScore || 0) > 0 || matchedTerms > 0
    if (!hasStrongSemanticMatch && !hasKeywordEvidence && matchedEntities === 0 && !isIntentAligned) {
      continue
    }

    // Hybrid search already applies lexical/vector relevance thresholds. Here we
    // retain its candidates and only change their order using conversation intent.
    scored.push({
      chunk,
      relevanceScore: score,
      reason: `matched_${matchedTerms}_terms${isIntentAligned ? '_intent_aligned' : ''}`
    })
  }

  // Sort descending and return top K
  return scored
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults)
    .map(s => s.chunk)
}
