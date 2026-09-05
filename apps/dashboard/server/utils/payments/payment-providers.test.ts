import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { parseBkashPaymentResult } from './providers/bkash'
import { formatNagadDate, parseNagadPaymentResult } from './providers/nagad'
import {
  parseStripeCheckoutSession,
  StripeAdapter,
  stripeAmountToMinor,
  verifyStripeWebhookSignature
} from './providers/stripe'
import {
  parseSslcommerzPaymentResult,
  SslcommerzAdapter
} from './providers/sslcommerz'

test('bKash parser accepts only a completed successful provider response', () => {
  const completed = parseBkashPaymentResult({
    statusCode: '0000',
    transactionStatus: 'Completed',
    paymentID: 'TR001',
    trxID: 'BK123456789',
    amount: '2500.00',
    currency: 'BDT'
  }, 'TR001')
  assert.equal(completed.status, 'completed')
  assert.equal(completed.amount, 2500)
  assert.equal(completed.providerTransactionId, 'BK123456789')

  const rejected = parseBkashPaymentResult({
    statusCode: '2056',
    statusMessage: 'Payment failed',
    transactionStatus: 'Failed'
  }, 'TR002')
  assert.equal(rejected.status, 'failed')
})

test('Nagad parser normalizes successful verification fields', () => {
  const result = parseNagadPaymentResult({
    status: 'Success',
    paymentRefId: 'NAGAD-REF-1',
    issuerPaymentRefNo: 'NAGAD-TRX-1',
    amount: '999.50',
    currencyCode: '050'
  }, 'NAGAD-REF-1')
  assert.equal(result.status, 'completed')
  assert.equal(result.currency, 'BDT')
  assert.equal(result.amount, 999.5)
  assert.equal(result.providerTransactionId, 'NAGAD-TRX-1')
})

test('Nagad timestamps use Bangladesh local time', () => {
  assert.equal(formatNagadDate(new Date('2026-08-20T00:00:00.000Z')), '20260820060000')
})

test('Stripe parser accepts only a complete paid Checkout Session', () => {
  const result = parseStripeCheckoutSession({
    id: 'cs_test_checkout1',
    status: 'complete',
    payment_status: 'paid',
    payment_intent: 'pi_payment1',
    amount_total: 97000,
    currency: 'bdt'
  })
  assert.equal(result.status, 'completed')
  assert.equal(result.amount, 970)
  assert.equal(result.currency, 'BDT')
  assert.equal(result.providerTransactionId, 'pi_payment1')
  assert.equal(stripeAmountToMinor(970, 'BDT'), 97000)
})

test('Stripe webhook verification rejects tampering and replayed timestamps', () => {
  const body = JSON.stringify({ id: 'evt_test1', type: 'checkout.session.completed' })
  const secret = 'whsec_test_secret'
  const timestamp = 1_800_000_000
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  const header = `t=${timestamp},v1=${signature}`

  assert.equal(verifyStripeWebhookSignature(body, header, secret, timestamp), true)
  assert.equal(verifyStripeWebhookSignature(`${body} `, header, secret, timestamp), false)
  assert.equal(verifyStripeWebhookSignature(body, header, secret, timestamp + 301), false)
})

test('Stripe adapter creates a hosted Checkout Session with exact order metadata', async () => {
  const originalFetch = globalThis.fetch
  let sentBody = new URLSearchParams()
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    sentBody = new URLSearchParams(String(init?.body || ''))
    return new Response(JSON.stringify({
      id: 'cs_test_checkout2', url: 'https://checkout.stripe.com/c/pay/test',
      status: 'open', payment_status: 'unpaid'
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch

  try {
    const adapter = new StripeAdapter({
      id: 'gateway-1', userId: 'user-1', provider: 'stripe', merchantName: 'Test Shop',
      merchantNumber: 'acct_test123', environment: 'sandbox',
      credentials: { secretKey: 'sk_test_secret', webhookSecret: 'whsec_secret' }
    })
    const result = await adapter.createCheckout({
      attemptId: '11111111-1111-4111-8111-111111111111',
      orderId: '22222222-2222-4222-8222-222222222222', invoiceNumber: 'CM-100',
      amount: 970, currency: 'BDT', payerReference: '01700000000',
      callbackUrl: 'https://pay.example.com/api/payments/callback/stripe/token',
      resultUrl: 'https://pay.example.com/payment/result?token=token'
    })
    assert.equal(result.providerPaymentId, 'cs_test_checkout2')
    assert.equal(sentBody.get('success_url'), 'https://pay.example.com/payment/result?token=token&session_id={CHECKOUT_SESSION_ID}')
    assert.equal(sentBody.get('metadata[attempt_id]'), '11111111-1111-4111-8111-111111111111')
    assert.equal(sentBody.get('line_items[0][price_data][unit_amount]'), '97000')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('SSLCOMMERZ parser accepts VALID validation API response and handles failures', () => {
  const completed = parseSslcommerzPaymentResult({
    status: 'VALID',
    tran_id: 'attempt-uuid-1',
    val_id: 'val_1234567890',
    amount: '1500.00',
    currency: 'BDT',
    bank_tran_id: 'BANK_TRX_999'
  }, 'attempt-uuid-1')

  assert.equal(completed.status, 'completed')
  assert.equal(completed.amount, 1500)
  assert.equal(completed.currency, 'BDT')
  assert.equal(completed.providerPaymentId, 'val_1234567890')
  assert.equal(completed.providerTransactionId, 'BANK_TRX_999')

  const failed = parseSslcommerzPaymentResult({
    status: 'FAILED',
    failedreason: 'Insufficient funds'
  }, 'fallback-id')

  assert.equal(failed.status, 'failed')
  assert.equal(failed.failureCode, 'Insufficient funds')

  const cancelled = parseSslcommerzPaymentResult({
    status: 'CANCELLED'
  }, 'fallback-id')

  assert.equal(cancelled.status, 'cancelled')
})

test('SSLCOMMERZ adapter creates a hosted session with correct URL-encoded parameters', async () => {
  const originalFetch = globalThis.fetch
  let sentBody = new URLSearchParams()
  let requestUrl = ''
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    requestUrl = String(url)
    sentBody = new URLSearchParams(String(init?.body || ''))
    return new Response(JSON.stringify({
      status: 'SUCCESS',
      sessionkey: 'test_session_key_123',
      GatewayPageURL: 'https://sandbox.sslcommerz.com/EasyCheckOut/testc123'
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch

  try {
    const adapter = new SslcommerzAdapter({
      id: 'gateway-ssl', userId: 'user-1', provider: 'sslcommerz', merchantName: 'Test Store',
      merchantNumber: 'testbox', environment: 'sandbox',
      credentials: { storeId: 'testbox', storePassword: 'qwerty' }
    })
    const result = await adapter.createCheckout({
      attemptId: '11111111-2222-3333-4444-555555555555',
      orderId: '66666666-7777-8888-9999-000000000000',
      invoiceNumber: 'INV-550',
      amount: 1250,
      currency: 'BDT',
      payerReference: '01711112222',
      callbackUrl: 'https://pay.example.com/api/payments/callback/sslcommerz/token',
      resultUrl: 'https://pay.example.com/payment/result?token=token'
    })

    assert.equal(result.providerPaymentId, 'test_session_key_123')
    assert.equal(result.checkoutUrl, 'https://sandbox.sslcommerz.com/EasyCheckOut/testc123')
    assert.equal(sentBody.get('store_id'), 'testbox')
    assert.equal(sentBody.get('store_passwd'), 'qwerty')
    assert.equal(sentBody.get('total_amount'), '1250.00')
    assert.equal(sentBody.get('currency'), 'BDT')
    assert.equal(sentBody.get('tran_id'), '11111111-2222-3333-4444-555555555555')
    assert.equal(sentBody.get('success_url'), 'https://pay.example.com/api/payments/callback/sslcommerz/token')
    assert.equal(requestUrl, 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php')
  } finally {
    globalThis.fetch = originalFetch
  }
})
