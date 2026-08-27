import { queryPg } from '../../utils/db'
import { requireDashboardUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const user = await requireDashboardUser(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const provider = String(getRouterParam(event, 'provider') || '').toLowerCase()
  if (!['bkash', 'nagad', 'stripe'].includes(provider)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown payment provider.' })
  }

  try {
    const result = await queryPg(
      `WITH deleted AS (
         DELETE FROM public.payment_gateways
          WHERE user_id = $1 AND provider = $2
          RETURNING id, user_id, provider
       ), logged AS (
         INSERT INTO public.payment_gateway_audit_logs (user_id, gateway_id, provider, action)
         SELECT user_id, NULL, provider, 'deleted' FROM deleted
       )
       SELECT provider FROM deleted`,
      [user.id, provider]
    )

    if (result.rows.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Payment gateway was not found.' })
    }

    return { success: true, provider }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error(`[Payment Gateway] Failed to remove ${provider} settings for user ${user.id}:`, error?.message || error)
    throw createError({ statusCode: 500, statusMessage: 'Unable to remove payment gateway settings.' })
  }
})
