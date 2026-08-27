import { requireDashboardUser } from '../../utils/auth-session'
import { createHostedCheckoutForOrder } from '../../utils/payments/service'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async event => {
  const user = await requireDashboardUser(event)
  const body = await readBody(event)
  const orderId = String(body?.orderId || '')
  const provider = String(body?.provider || '').toLowerCase()
  if (!UUID_PATTERN.test(orderId)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid order ID is required.' })
  }
  if (!['bkash', 'nagad', 'stripe'].includes(provider)) {
    throw createError({ statusCode: 400, statusMessage: 'Provider must be bKash, Nagad, or Stripe.' })
  }

  try {
    const checkout = await createHostedCheckoutForOrder({
      userId: user.id,
      orderId,
      provider,
      payerReference: typeof body?.payerReference === 'string' ? body.payerReference.slice(0, 100) : undefined,
      clientIp: getRequestIP(event, { xForwardedFor: true }) || undefined
    })
    setResponseHeader(event, 'Cache-Control', 'no-store')
    return { success: true, checkout }
  } catch (error: any) {
    console.error(`[PAYMENT CHECKOUT] ${provider} order ${orderId}:`, error?.message || error)
    throw createError({
      statusCode: /not found|not configured|inactive/i.test(error?.message || '') ? 400 : 502,
      statusMessage: error?.message || 'Unable to create hosted checkout.'
    })
  }
})
