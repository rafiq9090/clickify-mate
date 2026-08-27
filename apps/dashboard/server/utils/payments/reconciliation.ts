import { queryPg } from '../db'
import { processPaidOrderFulfillment } from './fulfillment'
import { queryAndReconcileAttempt } from './service'
import { releaseCatalogReservation } from '../catalog-store'

let reconciliationRunning = false

export async function reconcilePendingPayments(limit = 20) {
  if (reconciliationRunning) return { checked: 0, completed: 0, failed: 0 }
  reconciliationRunning = true
  let checked = 0
  let completed = 0
  let failed = 0

  try {
    const expiredOrders = await queryPg(
      `WITH expired AS (
         UPDATE public.payment_attempts
            SET status = 'expired', provider_status = 'Expired', updated_at = now()
          WHERE status IN ('created', 'pending') AND expires_at <= now()
          RETURNING order_id
       )
       UPDATE public.leads l
          SET data = l.data || '{"status":"payment_expired","payment_status":"expired","current_state":"AWAIT_PAYMENT"}'::jsonb
        FROM expired e
       WHERE l.id = e.order_id
       RETURNING l.id`
    )
    for (const row of expiredOrders.rows) {
      try {
        await releaseCatalogReservation(String(row.id))
      } catch (error: any) {
        console.warn(`[PAYMENT RESERVATION RELEASE] ${row.id}:`, error?.message || error)
      }
    }

    const pending = await queryPg(
      `SELECT *
         FROM public.payment_attempts
        WHERE status = 'pending' AND provider_payment_id IS NOT NULL AND expires_at > now()
        ORDER BY updated_at ASC
        LIMIT $1`,
      [Math.max(1, Math.min(limit, 100))]
    )

    for (const attempt of pending.rows) {
      checked++
      try {
        const result = await queryAndReconcileAttempt(attempt)
        if (result.status === 'completed') completed++
      } catch (error: any) {
        failed++
        console.warn(`[PAYMENT RECONCILIATION] ${attempt.id}:`, error?.message || error)
      }
    }

    const unfulfilled = await queryPg(
      `SELECT DISTINCT pa.order_id
         FROM public.payment_attempts pa
         JOIN public.leads l ON l.id = pa.order_id
        WHERE pa.status = 'completed'
          AND COALESCE(l.data->'inventory_job'->>'status', 'pending') <> 'completed'
        ORDER BY pa.order_id
        LIMIT $1`,
      [Math.max(1, Math.min(limit, 100))]
    )
    for (const row of unfulfilled.rows) {
      try {
        await processPaidOrderFulfillment(row.order_id)
      } catch (error: any) {
        console.warn(`[PAYMENT FULFILLMENT RETRY] ${row.order_id}:`, error?.message || error)
      }
    }
  } finally {
    reconciliationRunning = false
  }

  return { checked, completed, failed }
}
