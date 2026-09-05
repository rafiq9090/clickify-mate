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
    ? 'https://securepay.sslcommerz.com'
    : 'https://sandbox.sslcommerz.com'
}

export function parseSslcommerzPaymentResult(
  raw: Record<string, any>,
  fallbackPaymentId: string
): ProviderPaymentResult {
  const matchedElement = Array.isArray(raw.element)
    ? (raw.element.find((e: any) => ['VALID', 'VALIDATED'].includes(String(e?.status).toUpperCase())) || raw.element[0] || {})
    : (raw.element || {})

  const providerStatus = String(raw.status || matchedElement.status || 'Unknown')
  const normalized = providerStatus.toUpperCase()
  let status: ProviderPaymentResult['status'] = 'pending'

  if (normalized === 'VALID' || normalized === 'VALIDATED') {
    status = 'completed'
  } else if (normalized === 'CANCELLED' || normalized === 'CANCEL') {
    status = 'cancelled'
  } else if (['FAILED', 'FAIL', 'UNATTEMPTED', 'EXPIRED'].includes(normalized)) {
    status = 'failed'
  }

  const providerTransactionId = raw.bank_tran_id || matchedElement.bank_tran_id || raw.tran_id || matchedElement.tran_id || undefined
  const valId = raw.val_id || matchedElement.val_id || fallbackPaymentId
  const amountStr = raw.amount != null ? raw.amount : matchedElement.amount
  const currencyStr = raw.currency || matchedElement.currency

  return {
    status,
    providerStatus,
    providerPaymentId: String(valId || fallbackPaymentId),
    providerTransactionId: providerTransactionId ? String(providerTransactionId) : undefined,
    amount: amountStr != null ? Number(amountStr) : undefined,
    currency: currencyStr ? String(currencyStr).toUpperCase() : undefined,
    failureCode: status === 'failed' ? String(raw.failedreason || matchedElement.error || normalized) : undefined,
    failureMessage: status === 'failed' ? String(raw.failedreason || matchedElement.error || raw.error || 'SSLCOMMERZ payment was not validated') : undefined,
    raw
  }
}

export class SslcommerzAdapter implements PaymentProviderAdapter {
  private readonly baseUrl: string

  constructor(private readonly gateway: MerchantGatewayConfig) {
    this.baseUrl = normalizeBaseUrl(gateway)
  }

  private get storeId(): string {
    return this.gateway.credentials.storeId?.trim() || this.gateway.merchantNumber?.trim() || ''
  }

  private get storePassword(): string {
    return this.gateway.credentials.storePassword?.trim() || ''
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSessionResult> {
    if (input.currency !== 'BDT') {
      throw new ProviderApiError('SSLCOMMERZ checkout requires BDT currency')
    }

    const postData = new URLSearchParams({
      store_id: this.storeId,
      store_passwd: this.storePassword,
      total_amount: input.amount.toFixed(2),
      currency: 'BDT',
      tran_id: input.attemptId,
      success_url: input.callbackUrl,
      fail_url: input.callbackUrl,
      cancel_url: input.callbackUrl,
      ipn_url: input.callbackUrl,
      cus_name: input.payerReference || 'Valued Customer',
      cus_email: 'customer@clickifymate.internal',
      cus_add1: 'Dhaka, Bangladesh',
      cus_city: 'Dhaka',
      cus_postcode: '1200',
      cus_country: 'Bangladesh',
      cus_phone: input.payerReference || '01700000000',
      shipping_method: 'NO',
      product_name: `Order ${input.invoiceNumber}`,
      product_category: 'Ecommerce',
      product_profile: 'general'
    })

    const raw = await requestProviderJson<Record<string, any>>(
      `${this.baseUrl}/gwprocess/v4/api.php`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: postData.toString()
      },
      'SSLCOMMERZ'
    )

    if (String(raw.status || '').toUpperCase() !== 'SUCCESS' || !raw.GatewayPageURL) {
      throw new ProviderApiError(
        raw.failedreason || raw.error || 'SSLCOMMERZ session initialization failed',
        undefined,
        raw.status
      )
    }

    return {
      providerPaymentId: String(raw.sessionkey || input.attemptId),
      checkoutUrl: String(raw.GatewayPageURL),
      providerStatus: String(raw.status || 'SUCCESS'),
      raw
    }
  }

  async completeFromCallback(
    providerPaymentId: string,
    callback: Record<string, string>
  ): Promise<ProviderPaymentResult> {
    const callbackStatus = String(callback.status || '').toUpperCase()
    if (callbackStatus === 'CANCELLED' || callbackStatus === 'CANCEL') {
      return {
        status: 'cancelled',
        providerStatus: callbackStatus,
        providerPaymentId,
        failureCode: 'SSLCOMMERZ_CALLBACK_CANCELLED',
        failureMessage: 'SSLCOMMERZ checkout was cancelled by the customer.',
        raw: callback
      }
    }

    if (callbackStatus === 'FAILED' || callbackStatus === 'FAIL') {
      return {
        status: 'failed',
        providerStatus: callbackStatus,
        providerPaymentId,
        failureCode: String(callback.failedreason || 'SSLCOMMERZ_CALLBACK_FAILED'),
        failureMessage: String(callback.error || callback.failedreason || 'SSLCOMMERZ checkout failed.'),
        raw: callback
      }
    }

    const valId = callback.val_id
    if (valId) {
      return this.queryPayment(valId)
    }

    return this.queryPayment(providerPaymentId)
  }

  async queryPayment(valIdOrTranId: string): Promise<ProviderPaymentResult> {
    const queryUrl = new URL(
      valIdOrTranId.startsWith('val_') || !valIdOrTranId.includes('-')
        ? `${this.baseUrl}/validator/api/validationserverAPI.php`
        : `${this.baseUrl}/validator/api/merchantTransIDvalidationAPI.php`
    )

    if (valIdOrTranId.startsWith('val_') || !valIdOrTranId.includes('-')) {
      queryUrl.searchParams.set('val_id', valIdOrTranId)
    } else {
      queryUrl.searchParams.set('tran_id', valIdOrTranId)
    }
    queryUrl.searchParams.set('store_id', this.storeId)
    queryUrl.searchParams.set('store_passwd', this.storePassword)
    queryUrl.searchParams.set('v', '1')
    queryUrl.searchParams.set('format', 'json')

    const raw = await requestProviderJson<Record<string, any>>(
      queryUrl.toString(),
      { method: 'GET' },
      'SSLCOMMERZ'
    )

    return parseSslcommerzPaymentResult(raw, valIdOrTranId)
  }
}
