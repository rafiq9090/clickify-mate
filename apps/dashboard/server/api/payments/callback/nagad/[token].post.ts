import { processPaymentCallback } from '../../../../utils/payments/service'

export default defineEventHandler(async event => {
  const token = String(getRouterParam(event, 'token') || '')
  const body = await readBody<Record<string, unknown>>(event)
  const callback = Object.fromEntries(
    Object.entries(body || {}).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)])
  )
  const result = await processPaymentCallback('nagad', token, callback)
  return { received: true, status: result.status }
})
