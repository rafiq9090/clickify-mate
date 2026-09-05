import { processPaymentCallback } from '../../../../utils/payments/service'

export default defineEventHandler(async event => {
  const token = String(getRouterParam(event, 'token') || '')
  const body = await readBody<Record<string, unknown>>(event)
  const callback = Object.fromEntries(
    Object.entries(body || {}).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)])
  )

  try {
    const result = await processPaymentCallback('sslcommerz', token, callback)
    // SSLCOMMERZ checkout posts back to the browser; redirect the customer to the result page
    return sendRedirect(event, `${result.resultUrl}&result=${encodeURIComponent(result.status)}`, 302)
  } catch (error: any) {
    console.error('[SSLCOMMERZ POST CALLBACK]:', error?.message || error)
    return sendRedirect(event, `/payment/result?token=${encodeURIComponent(token)}&result=verification_failed`, 302)
  }
})
