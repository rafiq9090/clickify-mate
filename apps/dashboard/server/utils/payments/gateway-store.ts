import { queryPg } from '../db'
import { decryptPaymentCredentials } from './credentials-crypto'
import type { MerchantGatewayConfig, PaymentProviderName } from './providers'

const REQUIRED_CREDENTIALS: Record<PaymentProviderName, string[]> = {
  bkash: ['username', 'password', 'appKey', 'appSecret'],
  nagad: ['privateKey', 'publicKey'],
  stripe: ['secretKey', 'webhookSecret'],
  sslcommerz: ['storeId', 'storePassword']
}

function mapGateway(row: any, credentials: Record<string, string>): MerchantGatewayConfig {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    merchantName: row.merchant_name,
    merchantNumber: row.merchant_number,
    environment: row.environment,
    callbackUrl: row.callback_url || undefined,
    credentials
  }
}

async function decryptCredentials(row: any) {
  if (!row.credentials_encrypted) throw new Error(`${row.provider} API credentials are not configured.`)
  let credentials: Record<string, string>
  try {
    credentials = JSON.parse(await decryptPaymentCredentials(row.credentials_encrypted))
  } catch {
    throw new Error(`${row.provider} credentials cannot be decrypted. Check PAYMENT_CREDENTIALS_KEY.`)
  }

  const missing = REQUIRED_CREDENTIALS[row.provider as PaymentProviderName].filter(field => !credentials[field]?.trim())
  if (missing.length) throw new Error(`${row.provider} credentials are incomplete: ${missing.join(', ')}`)
  return credentials
}

export async function loadActiveGateway(userId: string, provider: PaymentProviderName) {
  const result = await queryPg(
    `SELECT id, user_id, provider, merchant_name, merchant_number, environment,
            callback_url, credentials_encrypted
       FROM public.payment_gateways
      WHERE user_id = $1 AND provider = $2 AND is_active = true
      LIMIT 1`,
    [userId, provider]
  )
  let row = result.rows[0]

  // If merchant does not have a direct provider account (e.g. direct bKash/Nagad),
  // but has SSLCOMMERZ active, seamlessly route through SSLCOMMERZ since it aggregates bKash, Nagad, Cards & Banks.
  if (!row && (provider === 'bkash' || provider === 'nagad')) {
    const sslResult = await queryPg(
      `SELECT id, user_id, provider, merchant_name, merchant_number, environment,
              callback_url, credentials_encrypted
         FROM public.payment_gateways
        WHERE user_id = $1 AND provider = 'sslcommerz' AND is_active = true
        LIMIT 1`,
      [userId]
    )
    if (sslResult.rows[0]) {
      row = sslResult.rows[0]
    }
  }

  if (!row) throw new Error(`No active ${provider} merchant account is configured for this shop.`)
  return mapGateway(row, await decryptCredentials(row))
}

export async function loadGatewayById(gatewayId: string) {
  const result = await queryPg(
    `SELECT id, user_id, provider, merchant_name, merchant_number, environment,
            callback_url, credentials_encrypted
       FROM public.payment_gateways
      WHERE id = $1 AND is_active = true
      LIMIT 1`,
    [gatewayId]
  )
  const row = result.rows[0]
  if (!row) throw new Error('The merchant gateway for this payment is inactive or missing.')
  return mapGateway(row, await decryptCredentials(row))
}
