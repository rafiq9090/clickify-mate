import { processPaymentCallback } from '../../../../utils/payments/service'

export default defineEventHandler(async event => {
  const token = String(getRouterParam(event, 'token') || '')
  const query = getQuery(event)
  const callback = Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? String(value[0] || '') : String(value || '')])
  )

  try {
    const result = await processPaymentCallback('sslcommerz', token, callback)
    return sendRedirect(event, `${result.resultUrl}&result=${encodeURIComponent(result.status)}`, 302)
  } catch (error: any) {
    console.error('[SSLCOMMERZ GET CALLBACK]:', error?.message || error)
    return sendRedirect(event, `/payment/result?token=${encodeURIComponent(token)}&result=verification_failed`, 302)
  }
})
