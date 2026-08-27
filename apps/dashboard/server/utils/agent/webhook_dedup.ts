import { queryPg } from '../db'
import { useSupabaseAdmin } from '../supabase'

/**
 * Multi-Tenant Durable Webhook Deduplicator & Anti-Replay Subsystem.
 * 
 * Provides two tiers of duplicate suppression:
 * 1. Process-local sub-millisecond memory cache (prevents storming local event loops)
 * 2. Multi-instance PostgreSQL durable deduplication table (prevents cross-replica replay attacks)
 */

const localMemoryCache = new Map<string, number>()
const DEDUP_TTL_MS = 15 * 60 * 1000 // 15 minutes TTL
let hasEnsuredTable = false

async function ensureWebhookTable() {
    if (hasEnsuredTable) return
    try {
        await queryPg(`
            CREATE TABLE IF NOT EXISTS public.webhook_events (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                agent_id UUID,
                channel TEXT NOT NULL,
                external_message_id TEXT NOT NULL,
                received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                status TEXT DEFAULT 'received',
                CONSTRAINT unq_agent_channel_message UNIQUE(agent_id, channel, external_message_id)
            );
            CREATE INDEX IF NOT EXISTS idx_webhook_events_lookup ON public.webhook_events (agent_id, channel, external_message_id);
        `)
        hasEnsuredTable = true
    } catch (e: any) {
        // Table already initialized or permissions constrained
        hasEnsuredTable = true
    }
}

function cleanupMemoryCache(now: number) {
    if (localMemoryCache.size > 2000) {
        for (const [k, timestamp] of localMemoryCache.entries()) {
            if (now - timestamp > DEDUP_TTL_MS) {
                localMemoryCache.delete(k)
            }
        }
    }
}

export interface WebhookDedupOptions {
    channel: string
    messageId: string | number | undefined
    agentId?: string
    merchantId?: string
}

/**
 * Asynchronously checks and records a webhook event atomically.
 * Returns `true` if the event is a duplicate (should be dropped).
 * Returns `false` if the event is new (lock acquired, proceed with processing).
 */
export async function checkAndRecordWebhookEvent(options: WebhookDedupOptions): Promise<boolean> {
    const { channel, messageId, agentId, merchantId } = options
    if (!messageId) return false

    const strMessageId = String(messageId).trim()
    if (!strMessageId) return false

    const tenantId = agentId || merchantId || 'global'
    const cacheKey = `${tenantId}:${channel}:${strMessageId}`
    const now = Date.now()

    // 1. Tier 1: Local In-Memory Cache Check
    cleanupMemoryCache(now)
    if (localMemoryCache.has(cacheKey)) {
        const firstSeen = localMemoryCache.get(cacheKey)!
        if (now - firstSeen < DEDUP_TTL_MS) {
            console.log(`[WEBHOOK DEDUP (L1 Cache)]: Blocked duplicate event for tenant ${tenantId} (${channel}:${strMessageId})`)
            return true
        }
    }

    // 2. Tier 2: Durable Database Deduplication (PostgreSQL Atomic Insert)
    try {
        await ensureWebhookTable()

        const insertSql = `
            INSERT INTO public.webhook_events (agent_id, channel, external_message_id, received_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (agent_id, channel, external_message_id) DO NOTHING
            RETURNING id;
        `
        const validAgentUuid = (agentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId)) ? agentId : null
        const res = await queryPg(insertSql, [validAgentUuid, channel, strMessageId])

        if (res && res.rows && res.rows.length === 0) {
            // No row was inserted because of unique conflict on (agent_id, channel, external_message_id)
            console.log(`[WEBHOOK DEDUP (L2 DB)]: Blocked duplicate event for tenant ${tenantId} (${channel}:${strMessageId})`)
            localMemoryCache.set(cacheKey, now)
            return true
        }
    } catch (dbErr: any) {
        // Fallback gracefully to L1 in-memory deduplication without noisy console spam
    }

    // Lock acquired: mark in local cache
    localMemoryCache.set(cacheKey, now)
    return false
}

/**
 * Synchronous in-memory fallback helper.
 */
export function isDuplicateWebhookMessage(
    channel: string,
    messageId: string | number | undefined,
    agentId?: string
): boolean {
    if (!messageId) return false

    const now = Date.now()
    const tenantId = agentId || 'global'
    const key = `${tenantId}:${channel}:${messageId}`

    cleanupMemoryCache(now)

    if (localMemoryCache.has(key)) {
        const firstSeen = localMemoryCache.get(key)!
        if (now - firstSeen < DEDUP_TTL_MS) {
            console.log(`[WEBHOOK DEDUP]: Blocked duplicate message: ${key}`)
            return true
        }
    }

    localMemoryCache.set(key, now)
    return false
}
