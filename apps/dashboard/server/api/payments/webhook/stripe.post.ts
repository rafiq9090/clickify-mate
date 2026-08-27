import { processStripeWebhook } from '../../../utils/payments/service'

export default defineEventHandler(async event => {
  const rawBody = await readRawBody(event, 'utf8')
  const signature = getHeader(event, 'stripe-signature') || ''
  if (!rawBody || !signature) {
    throw createError({ statusCode: 400, statusMessage: 'Stripe webhook body and signature are required.' })
  }

  try {
    const result = await processStripeWebhook(rawBody, signature)
    setResponseHeader(event, 'Cache-Control', 'no-store')
    return result
  } catch (error: any) {
    console.error('[STRIPE WEBHOOK]:', error?.message || error)
    throw createError({
      statusCode: /signature|JSON|reference|not found|does not match|invalid/i.test(error?.message || '') ? 400 : 500,
      statusMessage: error?.message || 'Stripe webhook could not be processed.'
    })
  }
})
