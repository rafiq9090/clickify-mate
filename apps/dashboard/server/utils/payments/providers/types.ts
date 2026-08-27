export type PaymentProviderName = 'bkash' | 'nagad' | 'stripe'
export type PaymentEnvironment = 'sandbox' | 'production'

export interface MerchantGatewayConfig {
  id: string
  userId: string
  provider: PaymentProviderName
  merchantName: string
  merchantNumber: string
  environment: PaymentEnvironment
  callbackUrl?: string
  credentials: Record<string, string>
}

export interface CreateCheckoutInput {
  attemptId: string
  orderId: string
  invoiceNumber: string
  amount: number
  currency: string
  payerReference: string
  callbackUrl: string
  resultUrl: string
  clientIp?: string
}

export interface CheckoutSessionResult {
  providerPaymentId: string
  checkoutUrl: string
  providerStatus: string
  raw: Record<string, unknown>
}

export interface ProviderPaymentResult {
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  providerStatus: string
  providerPaymentId: string
  providerTransactionId?: string
  amount?: number
  currency?: string
  failureCode?: string
  failureMessage?: string
  raw: Record<string, unknown>
}

export interface PaymentProviderAdapter {
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSessionResult>
  completeFromCallback(
    providerPaymentId: string,
    callback: Record<string, string>
  ): Promise<ProviderPaymentResult>
  queryPayment(providerPaymentId: string): Promise<ProviderPaymentResult>
}
