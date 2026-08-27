import crypto from 'crypto'
import { queryPg, withPgTransaction } from '../db'
import { createPaymentProvider } from './providers'
import { verifyStripeWebhookSignature } from './providers/stripe'
import type { PaymentProviderName, ProviderPaymentResult } from './providers'
import { loadActiveGateway, loadGatewayById } from './gateway-store'
import { processPaidOrderFulfillment } from './fulfillment'
import { releaseCatalogReservation } from '../catalog-store'

export interface HostedCheckoutResult {
  attemptId: string
  orderId: string
  provider: PaymentProviderName
  status: string
  checkoutUrl?: string
  expiresAt?: string
  alreadyExists?: boolean
}

function cleanProvider(provider: unknown): PaymentProviderName {
  const normalized = String(provider || '').toLowerCase()
  if (!['bkash', 'nagad', 'stripe'].includes(normalized)) {
    throw new Error('Payment provider must be bKash, Nagad, or Stripe.')
  }
  return normalized as PaymentProviderName
}

function publicCallbackUrl(provider: PaymentProviderName, callbackToken: string, configuredUrl?: string) {
  if (!process.env.PAYMENT_PUBLIC_BASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('PAYMENT_PUBLIC_BASE_URL is required for production hosted checkout.')
  }
  const configuredBase = process.env.PAYMENT_PUBLIC_BASE_URL || configuredUrl

  const base = new URL(configuredBase || 'http://localhost:3000')
  return new URL(`/api/payments/callback/${provider}/${callbackToken}`, base.origin).toString()
}

function publicResultUrl(callbackToken: string) {
  const configuredBase = process.env.PAYMENT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return new URL(`/payment/result?token=${encodeURIComponent(callbackToken)}`, configuredBase).toString()
}

function paymentAttemptResult(row: any, alreadyExists = false): HostedCheckoutResult {
  return {
    attemptId: row.id,
    orderId: row.order_id,
    provider: row.provider,
    status: row.status,
    checkoutUrl: row.checkout_url || undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
    alreadyExists
  }
}

export async function createHostedCheckoutForOrder(input: {
  userId: string
  orderId: string
  provider: PaymentProviderName | string
  payerReference?: string
  clientIp?: string
}): Promise<HostedCheckoutResult> {
  const provider = cleanProvider(input.provider)
  const orderResult = await queryPg(
    `SELECT id, data
       FROM public.leads
      WHERE id = $1 AND data->>'user_id' = $2
      LIMIT 1`,
    [input.orderId, input.userId]
  )
  const order = orderResult.rows[0]
  if (!order) throw new Error('Order was not found for this shop.')

  const orderData = order.data || {}
  if (orderData.payment_status === 'paid') throw new Error('This order is already paid.')
  const amount = Number(orderData.total)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Order total is invalid.')
  const currency = String(orderData.currency || 'BDT').toUpperCase()

  const gateway = await loadActiveGateway(input.userId, provider)
  const existingResult = await queryPg(
    `SELECT *
       FROM public.payment_attempts
      WHERE order_id = $1 AND gateway_id = $2
        AND status IN ('created', 'pending', 'completed')
      ORDER BY created_at DESC
      LIMIT 1`,
    [input.orderId, gateway.id]
  )
  const existing = existingResult.rows[0]
  if (existing && (existing.status === 'completed' || new Date(existing.expires_at).getTime() > Date.now())) {
    return paymentAttemptResult(existing, true)
  }

  const idempotencyKey = `checkout:${input.orderId}:${provider}:${crypto.randomUUID()}`
  const inserted = await queryPg(
    `INSERT INTO public.payment_attempts (
       order_id, user_id, gateway_id, provider, amount, currency, idempotency_key, expires_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7,
       now() + CASE WHEN $4 = 'stripe' THEN interval '31 minutes' ELSE interval '15 minutes' END
     )
     RETURNING *`,
    [input.orderId, input.userId, gateway.id, provider, amount, currency, idempotencyKey]
  )
  const attempt = inserted.rows[0]

  try {
    const adapter = createPaymentProvider(gateway)
    const callbackUrl = publicCallbackUrl(provider, attempt.callback_token, gateway.callbackUrl)
    const resultUrl = publicResultUrl(attempt.callback_token)
    const session = await adapter.createCheckout({
      attemptId: attempt.id,
      orderId: order.id,
      invoiceNumber: String(orderData.invoice_number || order.id),
      amount,
      currency,
      payerReference: input.payerReference || orderData.phone || orderData.customer || order.id,
      callbackUrl,
      resultUrl,
      clientIp: input.clientIp
    })

    const updated = await queryPg(
      `UPDATE public.payment_attempts
          SET provider_payment_id = $2,
              checkout_url = $3,
              provider_status = $4,
              provider_response = $5::jsonb,
              status = 'pending',
              updated_at = now()
        WHERE id = $1
        RETURNING *`,
      [attempt.id, session.providerPaymentId, session.checkoutUrl, session.providerStatus, JSON.stringify(session.raw)]
    )
    await queryPg(
      `UPDATE public.leads
          SET data = data || $2::jsonb
        WHERE id = $1`,
      [order.id, JSON.stringify({
        status: 'pending_payment',
        payment_status: 'pending',
        payment_provider: provider,
        payment_attempt_id: attempt.id,
        payment_expires_at: updated.rows[0].expires_at,
        current_state: 'AWAIT_PAYMENT'
      })]
    )
    return paymentAttemptResult(updated.rows[0])
  } catch (error: any) {
    await queryPg(
      `UPDATE public.payment_attempts
          SET status = 'failed', failure_code = 'CHECKOUT_CREATE_FAILED',
              failure_message = $2, updated_at = now()
        WHERE id = $1`,
      [attempt.id, String(error?.message || 'Checkout creation failed').slice(0, 500)]
    )
    throw error
  }
}

async function completePaymentAttempt(attemptId: string, result: ProviderPaymentResult) {
  let completion: { orderId: string; alreadyCompleted: boolean }
  try {
    completion = await withPgTransaction(async client => {
    const locked = await client.query(
      `SELECT pa.*, l.data AS order_data
         FROM public.payment_attempts pa
         JOIN public.leads l ON l.id = pa.order_id
        WHERE pa.id = $1
        FOR UPDATE OF pa, l`,
      [attemptId]
    )
    const attempt = locked.rows[0]
    if (!attempt) throw new Error('Payment attempt was not found.')
    if (attempt.status === 'completed') return { orderId: attempt.order_id, alreadyCompleted: true }
    if (result.status !== 'completed') throw new Error('Provider payment is not completed.')
    if (!result.providerTransactionId) throw new Error('Provider did not return a transaction ID.')
    if (result.providerPaymentId !== attempt.provider_payment_id) throw new Error('Provider payment ID does not match the checkout attempt.')
    if (result.amount == null || !Number.isFinite(result.amount)) throw new Error('Provider did not return a verifiable payment amount.')
    if (Math.abs(Number(attempt.amount) - Number(result.amount)) > 0.001) throw new Error('Provider payment amount does not match the order total.')
    if (!result.currency || result.currency.toUpperCase() !== String(attempt.currency).toUpperCase()) {
      throw new Error('Provider payment currency does not match the order currency.')
    }

    await client.query(
      `INSERT INTO public.payment_transactions (
         attempt_id, order_id, user_id, gateway_id, provider,
         provider_payment_id, provider_transaction_id, amount, currency,
         provider_response, completed_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,now())`,
      [
        attempt.id, attempt.order_id, attempt.user_id, attempt.gateway_id, attempt.provider,
        result.providerPaymentId, result.providerTransactionId, result.amount,
        result.currency.toUpperCase(), JSON.stringify(result.raw)
      ]
    )

    await client.query(
      `UPDATE public.payment_attempts
          SET status = 'completed', provider_status = $2,
              provider_transaction_id = $3, provider_response = $4::jsonb,
              completed_at = now(), updated_at = now(),
              failure_code = NULL, failure_message = NULL
        WHERE id = $1`,
      [attempt.id, result.providerStatus, result.providerTransactionId, JSON.stringify(result.raw)]
    )

    const paidAt = new Date().toISOString()
    const orderData = {
      ...(attempt.order_data || {}),
      status: 'confirmed',
      payment_status: 'paid',
      is_paid: true,
      payment_method: attempt.provider,
      payment_provider: attempt.provider,
      payment_attempt_id: attempt.id,
      provider_payment_id: result.providerPaymentId,
      trx_id: result.providerTransactionId,
      paid_at: paidAt,
      current_state: 'ORDER_CONFIRMED',
      inventory_job: { status: 'pending', created_at: paidAt }
    }
    delete orderData.courier_job
    await client.query(`UPDATE public.leads SET data = $2::jsonb WHERE id = $1`, [attempt.order_id, JSON.stringify(orderData)])
    await client.query(
      `UPDATE public.orders
          SET status = 'confirmed', payment_status = 'paid', updated_at = now(),
              metadata = metadata || $2::jsonb
        WHERE legacy_lead_id = $1`,
      [attempt.order_id, JSON.stringify({
        payment_attempt_id: attempt.id,
        provider_payment_id: result.providerPaymentId,
        provider_transaction_id: result.providerTransactionId,
        paid_at: paidAt
      })]
    )
    return { orderId: attempt.order_id, alreadyCompleted: false }
    })
  } catch (error: any) {
    if (error?.code === '23505') {
      await queryPg(
        `UPDATE public.payment_attempts
            SET status = 'failed', failure_code = 'DUPLICATE_PROVIDER_TRANSACTION',
                failure_message = 'Provider transaction ID was already used by another payment.',
                updated_at = now()
          WHERE id = $1 AND status <> 'completed'`,
        [attemptId]
      )
      throw new Error('This provider transaction has already been used for another order.')
    }
    throw error
  }

  try {
    await processPaidOrderFulfillment(completion.orderId)
  } catch (error: any) {
    console.error(`[PAYMENT FULFILLMENT] Paid order ${completion.orderId} needs retry:`, error?.message || error)
  }
  return completion
}

async function markAttemptResult(attemptId: string, result: ProviderPaymentResult) {
  if (result.status === 'completed') return completePaymentAttempt(attemptId, result)
  if (result.status === 'failed' || result.status === 'cancelled') {
    await queryPg(
      `UPDATE public.payment_attempts
          SET status = $2, provider_status = $3, provider_response = $4::jsonb,
              failure_code = $5, failure_message = $6, updated_at = now()
        WHERE id = $1 AND status <> 'completed'`,
      [
        attemptId, result.status, result.providerStatus, JSON.stringify(result.raw),
        result.failureCode || null, result.failureMessage || null
      ]
    )
    await queryPg(
      `UPDATE public.orders
          SET payment_status = 'failed',
              status = CASE WHEN $2 = 'cancelled' THEN 'cancelled' ELSE status END,
              updated_at = now()
        WHERE legacy_lead_id = (
          SELECT order_id FROM public.payment_attempts WHERE id = $1
        )`,
      [attemptId, result.status]
    )
    const order = await queryPg('SELECT order_id FROM public.payment_attempts WHERE id = $1', [attemptId])
    if (order.rows[0]?.order_id) await releaseCatalogReservation(String(order.rows[0].order_id))
  }
  return { orderId: '', alreadyCompleted: false }
}

export async function processPaymentCallback(
  providerInput: string,
  callbackToken: string,
  callback: Record<string, string>
) {
  const provider = cleanProvider(providerInput)
  const attemptResult = await queryPg(
    `SELECT * FROM public.payment_attempts
      WHERE callback_token = $1 AND provider = $2
      LIMIT 1`,
    [callbackToken, provider]
  )
  const attempt = attemptResult.rows[0]
  if (!attempt) throw new Error('Payment callback is invalid or expired.')

  const eventHash = crypto.createHash('sha256').update(JSON.stringify(callback)).digest('hex')
  const externalEventId = `${callbackToken}:${eventHash}`
  const recordedEvent = await queryPg(
    `INSERT INTO public.payment_webhook_events (
       provider, gateway_id, attempt_id, external_event_id, payload_sha256, payload, signature_valid
     ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,false)
      ON CONFLICT (provider, external_event_id) DO NOTHING
      RETURNING id`,
    [provider, attempt.gateway_id, attempt.id, externalEventId, eventHash, JSON.stringify(callback)]
  )

  if (!recordedEvent.rows[0]) {
    const existingEvent = await queryPg(
      `SELECT status FROM public.payment_webhook_events
        WHERE provider = $1 AND external_event_id = $2 LIMIT 1`,
      [provider, externalEventId]
    )
    if (existingEvent.rows[0]?.status === 'processed' || attempt.status === 'completed') {
      return { status: attempt.status, resultUrl: publicResultUrl(callbackToken) }
    }
    if (existingEvent.rows[0]?.status !== 'failed') {
      return { status: 'processing', resultUrl: publicResultUrl(callbackToken) }
    }
    await queryPg(
      `UPDATE public.payment_webhook_events
          SET status = 'received', error_message = NULL, processed_at = NULL
        WHERE provider = $1 AND external_event_id = $2`,
      [provider, externalEventId]
    )
  }

  if (attempt.status === 'completed') {
    return { status: 'completed', resultUrl: publicResultUrl(callbackToken) }
  }

  try {
    const gateway = await loadGatewayById(attempt.gateway_id)
    const adapter = createPaymentProvider(gateway)
    const result = await adapter.completeFromCallback(attempt.provider_payment_id, callback)
    await markAttemptResult(attempt.id, result)
    await queryPg(
      `UPDATE public.payment_webhook_events
          SET status = 'processed', signature_valid = true, processed_at = now()
        WHERE provider = $1 AND external_event_id = $2`,
      [provider, externalEventId]
    )
    return { status: result.status, resultUrl: publicResultUrl(callbackToken) }
  } catch (error: any) {
    await queryPg(
      `UPDATE public.payment_webhook_events
          SET status = 'failed', error_message = $3, processed_at = now()
        WHERE provider = $1 AND external_event_id = $2`,
      [provider, externalEventId, String(error?.message || 'Callback processing failed').slice(0, 500)]
    )
    throw error
  }
}

export async function queryAndReconcileAttempt(attempt: any) {
  const gateway = await loadGatewayById(attempt.gateway_id)
  const adapter = createPaymentProvider(gateway)
  const result = await adapter.queryPayment(attempt.provider_payment_id)
  await markAttemptResult(attempt.id, result)
  return result
}

export async function getPublicPaymentStatus(callbackToken: string) {
  const result = await queryPg(
    `SELECT pa.status, pa.provider, pa.amount, pa.currency, pa.expires_at, pa.completed_at,
            l.data->>'invoice_number' AS invoice_number
       FROM public.payment_attempts pa
       JOIN public.leads l ON l.id = pa.order_id
      WHERE pa.callback_token = $1
      LIMIT 1`,
    [callbackToken]
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    status: row.status,
    provider: row.provider,
    amount: Number(row.amount),
    currency: row.currency,
    invoiceNumber: row.invoice_number,
    expiresAt: row.expires_at,
    completedAt: row.completed_at
  }
}

const STRIPE_WEBHOOK_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired'
])

export async function processStripeWebhook(rawBody: string, signatureHeader: string) {
  let stripeEvent: any
  try {
    stripeEvent = JSON.parse(rawBody)
  } catch {
    throw new Error('Stripe webhook body is not valid JSON.')
  }

  const checkout = stripeEvent?.data?.object
  const attemptId = String(checkout?.metadata?.attempt_id || checkout?.client_reference_id || '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
    throw new Error('Stripe webhook is missing a valid checkout attempt reference.')
  }

  const attemptResult = await queryPg(
    `SELECT * FROM public.payment_attempts WHERE id = $1 AND provider = 'stripe' LIMIT 1`,
    [attemptId]
  )
  const attempt = attemptResult.rows[0]
  if (!attempt) throw new Error('Stripe checkout attempt was not found.')

  const gateway = await loadGatewayById(attempt.gateway_id)
  if (!verifyStripeWebhookSignature(rawBody, signatureHeader, String(gateway.credentials.webhookSecret || ''))) {
    throw new Error('Stripe webhook signature is invalid or expired.')
  }
  const expectedLiveMode = gateway.environment === 'production'
  if ((stripeEvent?.livemode === true) !== expectedLiveMode) {
    throw new Error('Stripe webhook mode does not match the configured gateway environment.')
  }

  const eventId = String(stripeEvent?.id || '')
  const eventType = String(stripeEvent?.type || '')
  const sessionId = String(checkout?.id || '')
  if (!/^evt_[A-Za-z0-9]+$/.test(eventId)) throw new Error('Stripe webhook event ID is invalid.')
  if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) throw new Error('Stripe webhook session ID is invalid.')
  if (attempt.provider_payment_id && sessionId !== attempt.provider_payment_id) {
    throw new Error('Stripe webhook session does not match the checkout attempt.')
  }

  const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex')
  const auditPayload = {
    id: eventId,
    type: eventType,
    created: stripeEvent?.created,
    livemode: stripeEvent?.livemode === true,
    checkoutSessionId: sessionId,
    attemptId
  }
  const inserted = await queryPg(
    `INSERT INTO public.payment_webhook_events (
       provider, gateway_id, attempt_id, external_event_id, payload_sha256, payload,
       signature_valid, status
     ) VALUES ('stripe',$1,$2,$3,$4,$5::jsonb,true,'processing')
      ON CONFLICT (provider, external_event_id) DO NOTHING
      RETURNING id`,
    [attempt.gateway_id, attempt.id, eventId, payloadHash, JSON.stringify(auditPayload)]
  )

  if (!inserted.rows[0]) {
    const prior = await queryPg(
      `SELECT status FROM public.payment_webhook_events
        WHERE provider = 'stripe' AND external_event_id = $1 LIMIT 1`,
      [eventId]
    )
    const priorStatus = prior.rows[0]?.status
    if (['processed', 'ignored'].includes(priorStatus) || attempt.status === 'completed') {
      return { received: true, duplicate: true, status: attempt.status }
    }
    if (priorStatus !== 'failed') return { received: true, duplicate: true, status: 'processing' }
    await queryPg(
      `UPDATE public.payment_webhook_events
          SET status = 'processing', error_message = NULL, processed_at = NULL
        WHERE provider = 'stripe' AND external_event_id = $1`,
      [eventId]
    )
  }

  if (!STRIPE_WEBHOOK_EVENTS.has(eventType)) {
    await queryPg(
      `UPDATE public.payment_webhook_events SET status = 'ignored', processed_at = now()
        WHERE provider = 'stripe' AND external_event_id = $1`,
      [eventId]
    )
    return { received: true, ignored: true, status: attempt.status }
  }

  try {
    const adapter = createPaymentProvider(gateway)
    const result = await adapter.completeFromCallback(sessionId, { eventType, eventId })
    await markAttemptResult(attempt.id, result)
    await queryPg(
      `UPDATE public.payment_webhook_events SET status = 'processed', processed_at = now()
        WHERE provider = 'stripe' AND external_event_id = $1`,
      [eventId]
    )
    return { received: true, status: result.status }
  } catch (error: any) {
    await queryPg(
      `UPDATE public.payment_webhook_events
          SET status = 'failed', error_message = $2, processed_at = now()
        WHERE provider = 'stripe' AND external_event_id = $1`,
      [eventId, String(error?.message || 'Stripe webhook processing failed').slice(0, 500)]
    )
    throw error
  }
}
