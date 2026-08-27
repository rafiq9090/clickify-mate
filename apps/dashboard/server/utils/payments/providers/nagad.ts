import crypto from 'crypto'
import type {
  CheckoutSessionResult,
  CreateCheckoutInput,
  MerchantGatewayConfig,
  PaymentProviderAdapter,
  ProviderPaymentResult
} from './types'
import { ProviderApiError, requestProviderJson } from './http'

function normalizeBaseUrl(gateway: MerchantGatewayConfig) {
  const configured = gateway.credentials.apiBaseUrl?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return gateway.environment === 'production'
    ? 'https://api.mynagad.com/api/dfs'
    : 'https://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs'
}

function formatNagadDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${value.year}${value.month}${value.day}${value.hour}${value.minute}${value.second}`
}

function rsaEncrypt(payload: Record<string, unknown>, publicKey: string) {
  return crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(JSON.stringify(payload), 'utf8')
  ).toString('base64')
}

function rsaDecrypt(payload: string, privateKey: string) {
  const decrypted = crypto.privateDecrypt(
    { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(payload, 'base64')
  )
  return JSON.parse(decrypted.toString('utf8')) as Record<string, any>
}

function rsaSign(payload: Record<string, unknown>, privateKey: string) {
  return crypto.sign('RSA-SHA256', Buffer.from(JSON.stringify(payload), 'utf8'), privateKey).toString('base64')
}

function paymentResult(raw: Record<string, any>, fallbackPaymentId: string): ProviderPaymentResult {
  const providerStatus = String(raw.status || raw.paymentStatus || raw.statusCode || 'Unknown')
  const normalized = providerStatus.toLowerCase()
  let status: ProviderPaymentResult['status'] = 'pending'
  if (['success', 'successful', 'completed', 'paid'].includes(normalized)) status = 'completed'
  else if (['cancel', 'cancelled', 'canceled'].includes(normalized)) status = 'cancelled'
  else if (['failed', 'failure', 'denied'].includes(normalized)) status = 'failed'

  return {
    status,
    providerStatus,
    providerPaymentId: String(raw.paymentRefId || raw.paymentReferenceId || fallbackPaymentId),
    providerTransactionId: raw.issuerPaymentRefNo
      ? String(raw.issuerPaymentRefNo)
      : raw.transactionId
        ? String(raw.transactionId)
        : undefined,
    amount: raw.amount == null ? undefined : Number(raw.amount),
    currency: String(raw.currency || raw.currencyCode || 'BDT').toUpperCase().replace('050', 'BDT'),
    failureCode: status === 'failed' ? String(raw.statusCode || 'NAGAD_FAILED') : undefined,
    failureMessage: status === 'failed' ? String(raw.message || 'Nagad payment failed') : undefined,
    raw
  }
}

export class NagadAdapter implements PaymentProviderAdapter {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>

  constructor(private readonly gateway: MerchantGatewayConfig) {
    this.baseUrl = normalizeBaseUrl(gateway)
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-KM-Api-Version': 'v-0.2.0',
      'X-KM-Client-Type': 'PC_WEB',
      'X-KM-IP-V4': process.env.PAYMENT_SERVER_IPV4 || '127.0.0.1'
    }
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSessionResult> {
    if (input.currency !== 'BDT') throw new ProviderApiError('Nagad checkout requires BDT currency')
    const merchantId = this.gateway.merchantNumber
    const privateKey = this.gateway.credentials.privateKey!
    const publicKey = this.gateway.credentials.publicKey!
    const dateTime = formatNagadDate()
    const challenge = crypto.randomBytes(20).toString('hex')
    const orderId = input.invoiceNumber.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40)
    const initializeSensitive = { merchantId, dateTime, orderId, challenge }

    const initialized = await requestProviderJson<Record<string, any>>(
      `${this.baseUrl}/check-out/initialize/${encodeURIComponent(merchantId)}/${encodeURIComponent(orderId)}`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          accountNumber: this.gateway.credentials.accountNumber || merchantId,
          dateTime,
          sensitiveData: rsaEncrypt(initializeSensitive, publicKey),
          signature: rsaSign(initializeSensitive, privateKey)
        })
      },
      'Nagad'
    )

    if (!initialized.sensitiveData) {
      throw new ProviderApiError(initialized.message || 'Nagad initialization did not return secured payment data')
    }

    const secured = rsaDecrypt(String(initialized.sensitiveData), privateKey)
    const paymentReferenceId = String(secured.paymentReferenceId || secured.paymentRefId || '')
    if (!paymentReferenceId || !secured.challenge) {
      throw new ProviderApiError('Nagad initialization response is missing payment reference data')
    }

    const completeSensitive = {
      merchantId,
      orderId,
      currencyCode: '050',
      amount: input.amount.toFixed(2),
      challenge: secured.challenge
    }
    const completed = await requestProviderJson<Record<string, any>>(
      `${this.baseUrl}/check-out/complete/${encodeURIComponent(paymentReferenceId)}`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          sensitiveData: rsaEncrypt(completeSensitive, publicKey),
          signature: rsaSign(completeSensitive, privateKey),
          merchantCallbackURL: input.callbackUrl,
          additionalMerchantInfo: { orderId: input.orderId, attemptId: input.attemptId }
        })
      },
      'Nagad'
    )

    const checkoutUrl = String(completed.callBackUrl || completed.callbackUrl || '')
    if (!checkoutUrl) throw new ProviderApiError(completed.message || 'Nagad did not return a hosted checkout URL')

    return {
      providerPaymentId: paymentReferenceId,
      checkoutUrl,
      providerStatus: String(completed.status || 'Initiated'),
      raw: { ...completed, paymentReferenceId }
    }
  }

  async completeFromCallback(
    providerPaymentId: string,
    callback: Record<string, string>
  ): Promise<ProviderPaymentResult> {
    const callbackStatus = String(callback.status || callback.paymentStatus || '').toLowerCase()
    if (['cancel', 'cancelled', 'failed'].includes(callbackStatus)) {
      return {
        status: callbackStatus.startsWith('cancel') ? 'cancelled' : 'failed',
        providerStatus: callbackStatus,
        providerPaymentId,
        failureCode: `NAGAD_CALLBACK_${callbackStatus.toUpperCase()}`,
        failureMessage: `Nagad checkout returned ${callbackStatus}`,
        raw: callback
      }
    }
    return this.queryPayment(providerPaymentId)
  }

  async queryPayment(providerPaymentId: string): Promise<ProviderPaymentResult> {
    const raw = await requestProviderJson<Record<string, any>>(
      `${this.baseUrl}/verify/payment/${encodeURIComponent(providerPaymentId)}`,
      { method: 'GET', headers: this.headers },
      'Nagad'
    )
    return paymentResult(raw, providerPaymentId)
  }
}

export { formatNagadDate, paymentResult as parseNagadPaymentResult }
