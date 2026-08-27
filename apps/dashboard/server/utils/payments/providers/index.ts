import { BkashAdapter } from './bkash'
import { NagadAdapter } from './nagad'
import { StripeAdapter } from './stripe'
import type { MerchantGatewayConfig, PaymentProviderAdapter } from './types'

export function createPaymentProvider(gateway: MerchantGatewayConfig): PaymentProviderAdapter {
  if (gateway.provider === 'bkash') return new BkashAdapter(gateway)
  if (gateway.provider === 'nagad') return new NagadAdapter(gateway)
  if (gateway.provider === 'stripe') return new StripeAdapter(gateway)
  throw new Error(`Unsupported payment provider: ${gateway.provider}`)
}

export type * from './types'
