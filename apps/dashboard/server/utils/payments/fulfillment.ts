import { queryPg } from '../db'
import { deductInventoryStock } from '../agent/tools/inventory'

const STALE_CLAIM_MS = 5 * 60 * 1000

export async function processPaidOrderFulfillment(orderId: string) {
  const orderResult = await queryPg(
    `SELECT id, data FROM public.leads WHERE id = $1 LIMIT 1`,
    [orderId]
  )
  const order = orderResult.rows[0]
  if (!order) throw new Error('Paid order no longer exists.')

  const data = order.data || {}
  const job = data.inventory_job || {}
  if (job.status === 'completed') return { success: true, alreadyProcessed: true }
  if (job.status === 'processing' && job.claimed_at) {
    const claimAge = Date.now() - new Date(job.claimed_at).getTime()
    if (claimAge < STALE_CLAIM_MS) return { success: true, alreadyProcessing: true }
  }

  const claimTime = new Date().toISOString()
  const claim = await queryPg(
    `UPDATE public.leads
        SET data = jsonb_set(
          data,
          '{inventory_job}',
          $2::jsonb,
          true
        )
      WHERE id = $1
        AND (
          COALESCE(data->'inventory_job'->>'status', 'pending') IN ('pending', 'retry_required')
          OR (
            data->'inventory_job'->>'status' = 'processing'
            AND COALESCE((data->'inventory_job'->>'claimed_at')::timestamptz, to_timestamp(0)) < now() - interval '5 minutes'
          )
        )
      RETURNING data`,
    [orderId, JSON.stringify({ status: 'processing', claimed_at: claimTime })]
  )
  if (!claim.rows[0]) return { success: true, alreadyProcessing: true }

  const claimedData = claim.rows[0].data || data
  try {
    const inventory = await deductInventoryStock({
      agentId: claimedData.agent_id,
      sku: claimedData.sku,
      color: claimedData.color,
      size: claimedData.size,
      quantity: Number(claimedData.quantity || 1),
      referenceId: orderId
    })
    if (!inventory.success) throw new Error(inventory.message || 'Inventory deduction failed')

    const completedAt = new Date().toISOString()
    await queryPg(
      `UPDATE public.leads
          SET data = jsonb_set(
            jsonb_set(
              data,
              '{inventory_job}',
              $2::jsonb,
              true
            ),
            '{courier_job}',
            $3::jsonb,
            true
          )
        WHERE id = $1`,
      [
        orderId,
        JSON.stringify({ status: 'completed', completed_at: completedAt, new_stock: inventory.newStock }),
        JSON.stringify({ status: 'pending', attempts: 0, max_attempts: 5, created_at: completedAt })
      ]
    )
    return { success: true, alreadyProcessed: false }
  } catch (error: any) {
    await queryPg(
      `UPDATE public.leads
          SET data = jsonb_set(data, '{inventory_job}', $2::jsonb, true)
        WHERE id = $1`,
      [orderId, JSON.stringify({
        status: 'retry_required',
        failed_at: new Date().toISOString(),
        error: String(error?.message || 'Inventory fulfillment failed').slice(0, 500)
      })]
    )
    throw error
  }
}
