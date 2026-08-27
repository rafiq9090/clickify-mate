import type {
  CheckoutSessionResult,
  CreateCheckoutInput,
  MerchantGatewayConfig,
  PaymentProviderAdapter,
  ProviderPaymentResult
} from './types'
import { ProviderApiError, requestProviderJson } from './http'

interface BkashToken {
  id_token: string
  expires_in?: number
  statusCode?: string
  statusMessage?: string
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>()

function normalizeBaseUrl(gateway: MerchantGatewayConfig) {
  const configured = gateway.credentials.apiBaseUrl?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return gateway.environment === 'production'
    ? 'https://tokenized.pay.bka.sh/v1.2.0-beta'
    : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
}

function paymentResult(raw: Record<string, any>, fallbackPaymentId: string): ProviderPaymentResult {
  const providerStatus = String(raw.transactionStatus || raw.status || raw.statusMessage || 'Unknown')
  const normalized = providerStatus.toLowerCase()
  let status: ProviderPaymentResult['status'] = 'pending'
  if (normalized === 'completed' && (!raw.statusCode || raw.statusCode === '0000')) status = 'completed'
  else if (['cancelled', 'canceled'].includes(normalized)) status = 'cancelled'
  else if (['failed', 'failure'].includes(normalized) || (raw.statusCode && raw.statusCode !== '0000')) status = 'failed'

  return {
    status,
    providerStatus,
    providerPaymentId: String(raw.paymentID || fallbackPaymentId),
    providerTransactionId: raw.trxID ? String(raw.trxID) : undefined,
    amount: raw.amount == null ? undefined : Number(raw.amount),
    currency: raw.currency ? String(raw.currency).toUpperCase() : undefined,
    failureCode: status === 'failed' ? String(raw.statusCode || 'BKASH_FAILED') : undefined,
    failureMessage: status === 'failed' ? String(raw.statusMessage || 'bKash payment failed') : undefined,
    raw
  }
}

export class BkashAdapter implements PaymentProviderAdapter {
  private readonly baseUrl: string

  constructor(private readonly gateway: MerchantGatewayConfig) {
    this.baseUrl = normalizeBaseUrl(gateway)
  }

  private async token() {
    const cached = tokenCache.get(this.gateway.id)
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token

    const response = await requestProviderJson<BkashToken>(
      `${this.baseUrl}/tokenized/checkout/token/grant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          username: this.gateway.credentials.username!,
          password: this.gateway.credentials.password!
        },
        body: JSON.stringify({
          app_key: this.gateway.credentials.appKey,
          app_secret: this.gateway.credentials.appSecret
        })
      },
      'bKash'
    )

    if (!response.id_token || (response.statusCode && response.statusCode !== '0000')) {
      throw new ProviderApiError(response.statusMessage || 'bKash did not issue an access token', undefined, response.statusCode)
    }

    const expiresIn = Math.max(120, Number(response.expires_in || 3600))
    tokenCache.set(this.gateway.id, {
      token: response.id_token,
      expiresAt: Date.now() + expiresIn * 1000
    })
    return response.id_token
  }

  private async call<T extends Record<string, any>>(path: string, body: Record<string, unknown>) {
    const token = await this.token()
    return requestProviderJson<T>(
      `${this.baseUrl}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          authorization: token,
          'x-app-key': this.gateway.credentials.appKey!
        },
        body: JSON.stringify(body)
      },
      'bKash'
    )
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSessionResult> {
    if (input.currency !== 'BDT') throw new ProviderApiError('bKash checkout requires BDT currency')
    const raw = await this.call<Record<string, any>>('/tokenized/checkout/create', {
      mode: '0011',
      payerReference: input.payerReference || input.orderId,
      callbackURL: input.callbackUrl,
      amount: input.amount.toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: input.invoiceNumber.slice(0, 100)
    })

    if (raw.statusCode !== '0000' || !raw.paymentID || !raw.bkashURL) {
      throw new ProviderApiError(raw.statusMessage || 'bKash checkout creation failed', undefined, raw.statusCode)
    }

    return {
      providerPaymentId: String(raw.paymentID),
      checkoutUrl: String(raw.bkashURL),
      providerStatus: String(raw.transactionStatus || 'Initiated'),
      raw
    }
  }

  async completeFromCallback(
    providerPaymentId: string,
    callback: Record<string, string>
  ): Promise<ProviderPaymentResult> {
    const callbackStatus = String(callback.status || '').toLowerCase()
    if (callbackStatus && callbackStatus !== 'success') {
      return {
        status: callbackStatus === 'cancel' || callbackStatus === 'cancelled' ? 'cancelled' : 'failed',
        providerStatus: callbackStatus,
        providerPaymentId,
        failureCode: `BKASH_CALLBACK_${callbackStatus.toUpperCase()}`,
        failureMessage: `bKash checkout returned ${callbackStatus}`,
        raw: callback
      }
    }

    const raw = await this.call<Record<string, any>>('/tokenized/checkout/execute', { paymentID: providerPaymentId })
    const result = paymentResult(raw, providerPaymentId)
    if (result.status === 'pending') return this.queryPayment(providerPaymentId)
    return result
  }

  async queryPayment(providerPaymentId: string): Promise<ProviderPaymentResult> {
    const raw = await this.call<Record<string, any>>('/tokenized/checkout/payment/status', {
      paymentID: providerPaymentId
    })
    return paymentResult(raw, providerPaymentId)
  }
}

export { paymentResult as parseBkashPaymentResult }
