import { getPublicPaymentStatus } from '../../../utils/payments/service'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async event => {
  const token = String(getRouterParam(event, 'token') || '')
  if (!UUID_PATTERN.test(token)) throw createError({ statusCode: 404, statusMessage: 'Payment was not found.' })
  const payment = await getPublicPaymentStatus(token)
  if (!payment) throw createError({ statusCode: 404, statusMessage: 'Payment was not found.' })
  setResponseHeader(event, 'Cache-Control', 'no-store, private')
  return { success: true, payment }
})
