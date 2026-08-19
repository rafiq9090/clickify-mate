import { useSupabaseAdmin } from '../supabase'
import { createCourierParcel } from './tools/courier'

export interface CourierJobState {
    status: 'pending' | 'processing' | 'completed' | 'retry_required' | 'failed'
    attempts: number
    max_attempts: number
    created_at: string
    last_attempt?: string
    next_retry_at?: string
    worker_id?: string
    locked_at?: string
    error?: string
}

let isProcessingQueue = false
const currentWorkerId = `worker_${process.pid}_${Math.random().toString(36).slice(2, 7)}`

/**
 * Process all pending or retryable courier jobs with atomic claiming and stale-lock recovery.
 * Safe across multi-instance Nitro server deployments.
 */
export async function processDurableCourierQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (isProcessingQueue) {
        return { processed: 0, succeeded: 0, failed: 0 }
    }

    isProcessingQueue = true
    const supabase = useSupabaseAdmin()
    let processed = 0
    let succeeded = 0
    let failed = 0

    if (!supabase || !supabase.from) {
        isProcessingQueue = false
        return { processed, succeeded, failed }
    }

    try {
        const now = Date.now()
        const nowIso = new Date(now).toISOString()

        // Fetch recent leads that might have uncompleted courier jobs
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, email, data')
            .order('created_at', { ascending: false })
            .limit(20)

        if (error || !Array.isArray(leads)) {
            isProcessingQueue = false
            return { processed, succeeded, failed }
        }

        for (const lead of leads) {
            const data = lead.data || {}
            const job: CourierJobState = data.courier_job

            if (!job || job.status === 'completed' || job.status === 'failed') {
                continue
            }

            // 1. Stale-Lock Check: If locked by another worker within the last 5 minutes, skip
            if (job.status === 'processing' && job.locked_at) {
                const lockAgeMs = now - new Date(job.locked_at).getTime()
                if (lockAgeMs < 5 * 60 * 1000) {
                    continue // Actively being processed by another worker
                }
                console.warn(`[COURIER QUEUE]: Reclaiming stale lock on Order ${lead.id} (Locked ${Math.round(lockAgeMs / 1000)}s ago)`)
            }

            // 2. Next Retry Check: If scheduled for future backoff, skip
            if (job.status === 'retry_required' && job.next_retry_at) {
                if (new Date(job.next_retry_at).getTime() > now) {
                    continue
                }
            }

            // 3. Duplicate Consignment Protection: If already has a tracking code in DB, mark completed
            if (data.tracking_code || data.consignment_id) {
                await supabase
                    .from('leads')
                    .update({
                        data: {
                            ...data,
                            courier_status: 'booked',
                            courier_job: {
                                ...job,
                                status: 'completed',
                                completed_at: nowIso
                            }
                        }
                    })
                    .eq('id', lead.id)
                succeeded++
                processed++
                continue
            }

            // 4. Atomic Multi-Worker Claim: Transition to 'processing' with worker ID & locked_at
            const attempts = (job.attempts || 0) + 1
            const maxAttempts = job.max_attempts || 5

            const claimingData = {
                ...data,
                courier_job: {
                    ...job,
                    status: 'processing',
                    worker_id: currentWorkerId,
                    locked_at: nowIso,
                    attempts
                }
            }

            const { error: claimErr } = await supabase
                .from('leads')
                .update({ data: claimingData })
                .eq('id', lead.id)

            if (claimErr) {
                console.warn(`[COURIER QUEUE]: Failed to claim Order ${lead.id}: ${claimErr.message}`)
                continue
            }

            processed++

            // 5. Dispatch Consignment to Courier
            try {
                const courierResult = await createCourierParcel({
                    invoice: lead.id,
                    recipientName: data.name || 'Customer',
                    recipientPhone: data.phone || '',
                    recipientAddress: data.address || 'Bangladesh',
                    codAmount: data.is_paid ? 0 : (data.total || 0),
                    note: `${data.sku || ''} (${data.color || ''} ${data.size || ''}) Qty: ${data.quantity || 1}`
                })

                if (courierResult && courierResult.success && courierResult.trackingCode) {
                    await supabase
                        .from('leads')
                        .update({
                            data: {
                                ...data,
                                consignment_id: courierResult.consignmentId,
                                tracking_code: courierResult.trackingCode,
                                courier_status: 'booked',
                                courier_job: {
                                    status: 'completed',
                                    attempts,
                                    max_attempts: maxAttempts,
                                    worker_id: currentWorkerId,
                                    completed_at: new Date().toISOString()
                                }
                            }
                        })
                        .eq('id', lead.id)

                    succeeded++
                    console.log(`[DURABLE COURIER QUEUE]: Successfully booked parcel for Order ${lead.id} (Tracking: ${courierResult.trackingCode})`)
                } else {
                    throw new Error(courierResult?.message || 'Courier API rejected consignment')
                }
            } catch (err: any) {
                failed++
                console.warn(`[DURABLE COURIER QUEUE]: Attempt ${attempts}/${maxAttempts} failed for Order ${lead.id}: ${err.message}`)

                const isFinalFailure = attempts >= maxAttempts
                // Exponential backoff: 1m, 2m, 4m, 8m
                const backoffMs = Math.min(Math.pow(2, attempts - 1) * 60 * 1000, 15 * 60 * 1000)
                const nextRetryIso = new Date(Date.now() + backoffMs).toISOString()

                await supabase
                    .from('leads')
                    .update({
                        data: {
                            ...data,
                            courier_job: {
                                status: isFinalFailure ? 'failed' : 'retry_required',
                                attempts,
                                max_attempts: maxAttempts,
                                error: err.message,
                                worker_id: currentWorkerId,
                                last_attempt: new Date().toISOString(),
                                next_retry_at: isFinalFailure ? undefined : nextRetryIso
                            }
                        }
                    })
                    .eq('id', lead.id)
            }
        }
    } catch (queueErr: any) {
        console.error('[DURABLE COURIER QUEUE ERROR]:', queueErr.message)
    } finally {
        isProcessingQueue = false
    }

    return { processed, succeeded, failed }
}
