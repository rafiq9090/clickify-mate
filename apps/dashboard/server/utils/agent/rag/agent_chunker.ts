/**
 * Semantic and Structure-Aware Chunker for E-Commerce Policies, FAQs, and Product Catalogs.
 */

export interface KnowledgeChunkInput {
  documentId?: string
  shopId: string
  agentId?: string
  chunkIndex: number
  content: string
  tokenCount: number
  metadata: Record<string, any>
}

const DEFAULT_MAX_CHUNK_TOKENS = 400
const DEFAULT_CHUNK_OVERLAP_TOKENS = 50

/**
 * Fast token count estimator (approx. 4 chars per token for English, ~2 chars per token for Bengali).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  const bengaliChars = (text.match(/[\u0980-\u09FF]/g) || []).length
  const otherChars = text.length - bengaliChars
  return Math.ceil((bengaliChars / 2.2) + (otherChars / 3.8))
}

/**
 * Split text into semantic chunks respecting paragraphs, headers, and bullet points.
 */
export function chunkTextSemantically(
  text: string,
  options: {
    shopId: string
    agentId?: string
    documentId?: string
    title?: string
    docType?: string
    maxTokens?: number
    overlapTokens?: number
    metadata?: Record<string, any>
  }
): KnowledgeChunkInput[] {
  const maxTokens = options.maxTokens || DEFAULT_MAX_CHUNK_TOKENS
  const overlapTokens = options.overlapTokens || DEFAULT_CHUNK_OVERLAP_TOKENS
  const cleanText = (text || '').trim()

  if (!cleanText) return []

  // If text is short enough, return as single chunk
  const totalEstimatedTokens = estimateTokens(cleanText)
  if (totalEstimatedTokens <= maxTokens) {
    return [
      {
        documentId: options.documentId,
        shopId: options.shopId,
        agentId: options.agentId,
        chunkIndex: 0,
        content: options.title ? `[${options.title}]\n${cleanText}` : cleanText,
        tokenCount: totalEstimatedTokens,
        metadata: {
          title: options.title || '',
          docType: options.docType || 'general',
          ...(options.metadata || {})
        }
      }
    ]
  }

  // Split into semantic paragraphs / sections (headers, double newlines, bullet lists)
  const rawSections = cleanText
    .split(/\n\s*(?:#{1,6}\s+|(?:\d+\.|\*|-)\s+|\n\s*\n)/)
    .map(s => s.trim())
    .filter(Boolean)

  const chunks: KnowledgeChunkInput[] = []
  let currentBuffer: string[] = []
  let currentTokenCount = 0
  let chunkIndex = 0

  for (const section of rawSections) {
    const sectionTokens = estimateTokens(section)

    if (currentTokenCount + sectionTokens > maxTokens && currentBuffer.length > 0) {
      // Flush current buffer
      const chunkBody = currentBuffer.join('\n\n')
      const formattedContent = options.title ? `[${options.title}]\n${chunkBody}` : chunkBody

      chunks.push({
        documentId: options.documentId,
        shopId: options.shopId,
        agentId: options.agentId,
        chunkIndex,
        content: formattedContent,
        tokenCount: estimateTokens(formattedContent),
        metadata: {
          title: options.title || '',
          docType: options.docType || 'general',
          ...(options.metadata || {})
        }
      })
      chunkIndex++

      // Create overlap from last item if possible
      const lastItem = currentBuffer[currentBuffer.length - 1]
      const lastItemTokens = estimateTokens(lastItem || '')
      if (lastItemTokens <= overlapTokens) {
        currentBuffer = lastItem ? [lastItem, section] : [section]
        currentTokenCount = lastItemTokens + sectionTokens
      } else {
        currentBuffer = [section]
        currentTokenCount = sectionTokens
      }
    } else {
      currentBuffer.push(section)
      currentTokenCount += sectionTokens
    }
  }

  // Flush remaining buffer
  if (currentBuffer.length > 0) {
    const chunkBody = currentBuffer.join('\n\n')
    const formattedContent = options.title ? `[${options.title}]\n${chunkBody}` : chunkBody

    chunks.push({
      documentId: options.documentId,
      shopId: options.shopId,
      agentId: options.agentId,
      chunkIndex,
      content: formattedContent,
      tokenCount: estimateTokens(formattedContent),
      metadata: {
        title: options.title || '',
        docType: options.docType || 'general',
        ...(options.metadata || {})
      }
    })
  }

  return chunks
}

/**
 * Format a Product Variant / Catalog item into a structured, searchable knowledge chunk.
 */
export function formatProductAsKnowledge(product: {
  id?: string
  name: string
  sku: string
  description?: string
  price: number
  regular_price?: number
  stock_quantity?: number
  currency?: string
  images?: any[]
  variants?: Array<{ color?: string; size?: string; price?: number; quantity?: number }>
  metadata?: Record<string, any>
}): string {
  const lines: string[] = [
    `Product: ${product.name}`,
    `SKU: ${product.sku}`,
    `Base Price: ${product.price} ${product.currency || 'BDT'}`,
  ]

  if (product.regular_price && product.regular_price > product.price) {
    lines.push(`Regular Price: ${product.regular_price} ${product.currency || 'BDT'}`)
  }

  if (product.description) {
    lines.push(`Description & Specs: ${product.description}`)
  }

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const variantList = product.variants
      .map(v => `${v.color || 'Standard'} / ${v.size || 'Free Size'} (Price: ${v.price || product.price} BDT)`)
      .join('; ')
    lines.push(`Available Variants: ${variantList}`)
  }

  return lines.join('\n')
}
