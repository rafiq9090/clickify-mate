import crypto from 'node:crypto'
import type {
  CheckoutSessionResult,
  CreateCheckoutInput,
  MerchantGatewayConfig,
  PaymentProviderAdapter,
  ProviderPaymentResult
} from './types'
import { ProviderApiError } from './http'

const STRIPE_API_BASE = 'https://api.stripe.com/v1'
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF',
  'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
])

function currencyScale(currency: string) {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 1 : 100
}

export function stripeAmountToMinor(amount: number, currency: string) {
  const minor = Math.round(amount * currencyScale(currency))
  if (!Number.isSafeInteger(minor) || minor <= 0) throw new ProviderApiError('Stripe payment amount is invalid')
  return minor
}

function stripeAmountFromMinor(amount: unknown, currency: string) {
  const minor = Number(amount)
  return Number.isFinite(minor) ? minor / currencyScale(currency) : undefined
}

function objectId(value: unknown) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: unknown }).id || '')
  return ''
}

export function parseStripeCheckoutSession(raw: Record<string, any>): ProviderPaymentResult {
  const providerPaymentId = String(raw.id || '')
  const currency = String(raw.currency || '').toUpperCase()
  const paymentIntentId = objectId(raw.payment_intent)
  const paid = raw.status === 'complete' && raw.payment_status === 'paid'
  const expired = raw.status === 'expired'

  return {
    status: paid ? 'completed' : expired ? 'cancelled' : 'pending',
    providerStatus: `${String(raw.status || 'unknown')}:${String(raw.payment_status || 'unknown')}`,
    providerPaymentId,
    providerTransactionId: paid ? paymentIntentId || providerPaymentId : undefined,
    amount: currency ? stripeAmountFromMinor(raw.amount_total, currency) : undefined,
    currency: currency || undefined,
    failureCode: expired ? 'STRIPE_CHECKOUT_EXPIRED' : undefined,
    failureMessage: expired ? 'Stripe Checkout Session expired before payment.' : undefined,
    raw
  }
}

async function stripeRequest<T>(
  gateway: MerchantGatewayConfig,
  path: string,
  init: RequestInit = {},
  idempotencyKey?: string
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${gateway.credentials.secretKey}`)
  headers.set('Stripe-Version', '2025-08-27.basil')
  if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey)

  let response: Response
  try {
    response = await fetch(`${STRIPE_API_BASE}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(15_000)
    })
  } catch (error: any) {
    throw new ProviderApiError(`Stripe is temporarily unreachable: ${error?.message || 'network error'}`)
  }

  const rawText = await response.text()
  let payload: any = {}
  try {
    payload = rawText ? JSON.parse(rawText) : {}
  } catch {
    payload = { error: { message: rawText.slice(0, 500) } }
  }
  if (!response.ok) {
    throw new ProviderApiError(
      `Stripe rejected the request: ${payload?.error?.message || `HTTP ${response.status}`}`,
      response.status,
      payload?.error?.code
    )
  }
  return payload as T
}

export class StripeAdapter implements PaymentProviderAdapter {
  constructor(private readonly gateway: MerchantGatewayConfig) {}

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSessionResult> {
    const currency = input.currency.toLowerCase()
    const successUrl = `${input.resultUrl}${input.resultUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`
    const params = new URLSearchParams({
      mode: 'payment',
      client_reference_id: input.attemptId,
      success_url: successUrl,
      cancel_url: input.resultUrl,
      expires_at: String(Math.floor(Date.now() / 1000) + (31 * 60)),
      'line_items[0][price_data][currency]': currency,
      'line_items[0][price_data][unit_amount]': String(stripeAmountToMinor(input.amount, input.currency)),
      'line_items[0][price_data][product_data][name]': `Order ${input.invoiceNumber}`.slice(0, 250),
      'line_items[0][quantity]': '1',
      'metadata[attempt_id]': input.attemptId,
      'metadata[order_id]': input.orderId,
      'metadata[invoice_number]': input.invoiceNumber.slice(0, 500),
      'payment_intent_data[metadata][attempt_id]': input.attemptId,
      'payment_intent_data[metadata][order_id]': input.orderId
    })

    const raw = await stripeRequest<Record<string, any>>(
      this.gateway,
      '/checkout/sessions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      },
      input.attemptId
    )
    if (!raw.id || !raw.url) throw new ProviderApiError('Stripe did not return a hosted Checkout URL')
    return {
      providerPaymentId: String(raw.id),
      checkoutUrl: String(raw.url),
      providerStatus: `${String(raw.status || 'open')}:${String(raw.payment_status || 'unpaid')}`,
      raw
    }
  }

  async completeFromCallback(
    providerPaymentId: string,
    callback: Record<string, string>
  ): Promise<ProviderPaymentResult> {
    const eventType = String(callback.eventType || '')
    if (eventType === 'checkout.session.async_payment_failed') {
      return {
        status: 'failed', providerStatus: eventType, providerPaymentId,
        failureCode: 'STRIPE_ASYNC_PAYMENT_FAILED',
        failureMessage: 'Stripe reported that the asynchronous payment failed.', raw: callback
      }
    }
    if (eventType === 'checkout.session.expired') {
      return {
        status: 'cancelled', providerStatus: eventType, providerPaymentId,
        failureCode: 'STRIPE_CHECKOUT_EXPIRED',
        failureMessage: 'Stripe Checkout Session expired before payment.', raw: callback
      }
    }
    return this.queryPayment(providerPaymentId)
  }

  async queryPayment(providerPaymentId: string): Promise<ProviderPaymentResult> {
    if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(providerPaymentId)) {
      throw new ProviderApiError('Stripe Checkout Session ID is invalid')
    }
    const raw = await stripeRequest<Record<string, any>>(
      this.gateway,
      `/checkout/sessions/${encodeURIComponent(providerPaymentId)}`
    )
    return parseStripeCheckoutSession(raw)
  }
}

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300
) {
  const values = signatureHeader.split(',').map(value => value.trim())
  const timestampText = values.find(value => value.startsWith('t='))?.slice(2) || ''
  const timestamp = Number(timestampText)
  const signatures = values.filter(value => value.startsWith('v1=')).map(value => value.slice(3))
  if (!Number.isInteger(timestamp) || timestamp <= 0 || signatures.length === 0) return false
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false

  const expected = crypto.createHmac('sha256', webhookSecret).update(`${timestamp}.${rawBody}`, 'utf8').digest()
  return signatures.some(signature => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false
    const received = Buffer.from(signature, 'hex')
    return received.length === expected.length && crypto.timingSafeEqual(received, expected)
  })
}
