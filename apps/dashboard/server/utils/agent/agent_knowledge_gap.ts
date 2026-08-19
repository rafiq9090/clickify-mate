import { useSupabaseAdmin } from '../supabase'

export interface KnowledgeGapRecord {
    agentId: string
    question: string
    normalizedTopic: string
    category: 'product_specs' | 'care_instructions' | 'warranty' | 'return_policy' | 'shipping_policy' | 'general'
    frequency: number
    customerContext?: string
    suggestedAnswer?: string
    status: 'detected' | 'draft' | 'review_required' | 'approved' | 'published' | 'rejected'
}

const NOISE_THRESHOLD_FREQUENCY = 3 // Minimum observations before promoting to merchant review

/**
 * Filter out transactional, personal, or non-knowledge questions.
 * Knowledge gaps should strictly capture missing business knowledge (e.g. fabric, wash, warranty).
 */
function isGenuineKnowledgeInquiry(text: string): boolean {
    if (!text || text.trim().length < 8) return false

    const lower = text.toLowerCase()

    // Discard spam / gibberish
    if (!/[a-zA-Z\u0980-\u09FF]/.test(lower)) return false
    if (/^(asdf|test|hi|hello|hey|hmm|ok|haa|na)$/i.test(lower)) return false

    // Discard transactional order inquiries (These belong to Tools, not Knowledge Gaps)
    const isTransactional = /(?:01[3-9]\d{8}|road|house|sector|mirpur|dhaka|chittagong|sylhet|bKash|nagad|trx|trxid|order|parcel|পার্সেল|অর্ডার|ট্র্যাকিং|ঠিকানা)/i.test(lower)
    if (isTransactional) return false

    // Discard stock/price inquiries handled by Catalog Tools
    const isCatalogQuery = /(?:size ache|price koto|koto taka|dam koto|stock ache|স্টক|দাম কত|সাইজ আছে)/i.test(lower)
    if (isCatalogQuery) return false

    return true
}

/**
 * Extract a high-level normalized topic to prevent duplicate fragmented clusters.
 */
function extractNormalizedTopic(text: string): { topic: string; category: KnowledgeGapRecord['category'] } {
    const lower = text.toLowerCase()

    if (/wash|clean|ধোয়া|রং|color fade|machine wash/i.test(lower)) {
        return { topic: 'Washing & Fabric Care Instructions', category: 'care_instructions' }
    }
    if (/fabric|material|gsm|cotton|কাপড়|ফেব্রিক/i.test(lower)) {
        return { topic: 'Fabric Material & GSM Specifications', category: 'product_specs' }
    }
    if (/warranty|guarantee|ওয়ারেন্টি|গ্যারান্টি|মেয়াদ/i.test(lower)) {
        return { topic: 'Warranty & Guarantee Terms', category: 'warranty' }
    }
    if (/return|exchange|ফেরত|পরিবর্তন|রিটার্ন/i.test(lower)) {
        return { topic: 'Product Return & Exchange Policy', category: 'return_policy' }
    }
    if (/wholesale|bulk|পাইকারি|বড় অর্ডার/i.test(lower)) {
        return { topic: 'Wholesale & Bulk Ordering Terms', category: 'product_specs' }
    }

    return { topic: text.slice(0, 80).trim(), category: 'general' }
}

/**
 * Record a detected knowledge gap with topic clustering, tenant scoping, and anti-noise threshold.
 */
export async function recordKnowledgeGap(gap: {
    agentId: string
    question: string
    category?: KnowledgeGapRecord['category']
    customerContext?: string
    suggestedAnswer?: string
}): Promise<void> {
    if (!gap.agentId || !gap.question || !isGenuineKnowledgeInquiry(gap.question)) {
        return
    }

    const supabase = useSupabaseAdmin()
    if (!supabase || !supabase.from) return

    try {
        const cleanedQuestion = gap.question.trim()
        const { topic, category } = extractNormalizedTopic(cleanedQuestion)

        // Multi-tenant search for existing cluster under this agent
        const { data: existing } = await supabase
            .from('knowledge_gaps')
            .select('id, frequency, sample_questions, status')
            .eq('agent_id', gap.agentId)
            .eq('normalized_topic', topic)
            .limit(1)
            .maybeSingle()

        if (existing && existing.id) {
            const newFreq = (existing.frequency || 1) + 1
            const currentSamples: string[] = Array.isArray(existing.sample_questions) ? existing.sample_questions : []
            const updatedSamples = Array.from(new Set([...currentSamples, cleanedQuestion])).slice(0, 5)

            // Promote to review_required only if frequency >= NOISE_THRESHOLD_FREQUENCY and wasn't published/rejected
            const nextStatus = (existing.status === 'detected' && newFreq >= NOISE_THRESHOLD_FREQUENCY)
                ? 'review_required'
                : existing.status

            await supabase
                .from('knowledge_gaps')
                .update({
                    frequency: newFreq,
                    sample_questions: updatedSamples,
                    status: nextStatus,
                    last_asked_at: new Date().toISOString()
                })
                .eq('id', existing.id)

            console.log(`[KNOWLEDGE CLUSTER]: Incremented cluster "${topic}" (Count: ${newFreq}, Status: ${nextStatus})`)
        } else {
            // Anti-Poisoning: Store with status 'detected' (quiet collection until frequency threshold is met)
            await supabase
                .from('knowledge_gaps')
                .insert({
                    agent_id: gap.agentId,
                    question: cleanedQuestion,
                    normalized_topic: topic,
                    category,
                    sample_questions: [cleanedQuestion],
                    frequency: 1,
                    customer_context: gap.customerContext || null,
                    suggested_answer: null, // Anti-poisoning: do not adopt unverified answers
                    status: 'detected',
                    created_at: new Date().toISOString(),
                    last_asked_at: new Date().toISOString()
                })

            console.log(`[KNOWLEDGE CLUSTER]: Quietly detected new topic "${topic}" for Agent ${gap.agentId} (Frequency: 1)`)
        }
    } catch (err: any) {
        console.warn(`[KNOWLEDGE GAP WARN]: ${err.message}`)
    }
}
