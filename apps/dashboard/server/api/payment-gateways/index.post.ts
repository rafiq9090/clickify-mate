import { queryPg } from '../../utils/db'
import { decryptPaymentCredentials, encryptPaymentCredentials } from '../../utils/payments/credentials-crypto'
import { requireDashboardUser } from '../../utils/auth-session'

const PROVIDERS = {
  bkash: {
    credentialFields: ['username', 'password', 'appKey', 'appSecret']
  },
  nagad: {
    credentialFields: ['accountNumber', 'privateKey', 'publicKey']
  },
  stripe: {
    credentialFields: ['secretKey', 'webhookSecret']
  }
} as const

type Provider = keyof typeof PROVIDERS

function cleanText(value: unknown, field: string, maxLength: number, required = false) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (required && !text) {
    throw createError({ statusCode: 400, statusMessage: `${field} is required.` })
  }
  if (text.length > maxLength) {
    throw createError({ statusCode: 400, statusMessage: `${field} is too long.` })
  }
  return text
}

function validateCallbackUrl(value: unknown, environment: string) {
  const callbackUrl = cleanText(value, 'Callback URL', 500)
  if (!callbackUrl) return ''

  try {
    const url = new URL(callbackUrl)
    const isLocalSandbox = environment === 'sandbox' && ['localhost', '127.0.0.1'].includes(url.hostname)
    if (url.protocol !== 'https:' && !(isLocalSandbox && url.protocol === 'http:')) {
      throw new Error('HTTPS required')
    }
    return url.toString()
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Callback URL must be a valid HTTPS URL (HTTP localhost is allowed in sandbox).'
    })
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireDashboardUser(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const body = await readBody(event)
  const provider = String(body?.provider || '').toLowerCase() as Provider
  if (!(provider in PROVIDERS)) {
    throw createError({ statusCode: 400, statusMessage: 'Provider must be bKash, Nagad, or Stripe.' })
  }

  const merchantName = cleanText(body?.merchantName, 'Merchant name', 120, true)
  const merchantNumber = cleanText(body?.merchantNumber, 'Merchant number', 40, true)
  if (!/^[A-Za-z0-9+._-]{6,40}$/.test(merchantNumber)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Merchant number may contain only letters, numbers, +, period, underscore, or hyphen.'
    })
  }

  const environment = body?.environment === 'production' ? 'production' : 'sandbox'
  const callbackUrl = validateCallbackUrl(body?.callbackUrl, environment)
  const isActive = body?.isActive === true

  try {
    const existingResult = await queryPg(
      `SELECT credentials_encrypted
         FROM public.payment_gateways
        WHERE user_id = $1 AND provider = $2
        LIMIT 1`,
      [user.id, provider]
    )

    let mergedCredentials: Record<string, string> = {}
    const encryptedExisting = existingResult.rows[0]?.credentials_encrypted
    if (encryptedExisting) {
      try {
        mergedCredentials = JSON.parse(await decryptPaymentCredentials(encryptedExisting))
      } catch {
        throw createError({
          statusCode: 500,
          statusMessage: 'Saved credentials cannot be decrypted. Check the server encryption key before updating.'
        })
      }
    }

    const incomingCredentials = body?.credentials && typeof body.credentials === 'object'
      ? body.credentials
      : {}

    for (const field of PROVIDERS[provider].credentialFields) {
      const value = cleanText(incomingCredentials[field], 'Credential', field.includes('Key') ? 12000 : 2000)
      if (value) mergedCredentials[field] = value
    }

    if (isActive) {
      const missingCredentials = PROVIDERS[provider].credentialFields.filter(field => !mergedCredentials[field]?.trim())
      if (missingCredentials.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: `Complete all ${provider} API credentials before enabling hosted checkout.`
        })
      }

      if (provider === 'stripe') {
        const expectedKeyPrefix = environment === 'production' ? 'sk_live_' : 'sk_test_'
        if (!String(mergedCredentials.secretKey || '').startsWith(expectedKeyPrefix)) {
          throw createError({
            statusCode: 400,
            statusMessage: `Stripe ${environment === 'production' ? 'live' : 'test'} mode requires a ${expectedKeyPrefix} secret key.`
          })
        }
        if (!String(mergedCredentials.webhookSecret || '').startsWith('whsec_')) {
          throw createError({ statusCode: 400, statusMessage: 'Stripe webhook secret must start with whsec_.' })
        }
      }
    }

    const credentialsEncrypted = Object.keys(mergedCredentials).length > 0
      ? encryptPaymentCredentials(JSON.stringify(mergedCredentials))
      : null

    const result = await queryPg(
      `WITH saved AS (
         INSERT INTO public.payment_gateways (
           user_id, provider, merchant_name, merchant_number, environment,
           callback_url, credentials_encrypted, is_active, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), $7, $8, now())
         ON CONFLICT (user_id, provider) DO UPDATE SET
           merchant_name = EXCLUDED.merchant_name,
           merchant_number = EXCLUDED.merchant_number,
           environment = EXCLUDED.environment,
           callback_url = EXCLUDED.callback_url,
           credentials_encrypted = EXCLUDED.credentials_encrypted,
           is_active = EXCLUDED.is_active,
           updated_at = now()
         RETURNING id, provider, merchant_name, merchant_number, environment,
                   callback_url, is_active, created_at, updated_at
       ), logged AS (
         INSERT INTO public.payment_gateway_audit_logs (user_id, gateway_id, provider, action)
         SELECT $1, id, provider,
                CASE WHEN $9 THEN 'configured' ELSE 'updated' END
           FROM saved
       )
       SELECT * FROM saved`,
      [
        user.id,
        provider,
        merchantName,
        merchantNumber,
        environment,
        callbackUrl,
        credentialsEncrypted,
        isActive,
        existingResult.rows.length === 0
      ]
    )

    const row = result.rows[0]
    const configuredCredentials: Record<string, boolean> = {}
    for (const field of PROVIDERS[provider].credentialFields) {
      configuredCredentials[field] = Boolean(mergedCredentials[field])
    }

    return {
      success: true,
      gateway: {
        id: row.id,
        provider: row.provider,
        merchantName: row.merchant_name,
        merchantNumber: row.merchant_number,
        environment: row.environment,
        callbackUrl: row.callback_url || '',
        isActive: row.is_active,
        configuredCredentials,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error(`[Payment Gateway] Failed to save ${provider} settings for user ${user.id}:`, error?.message || error)
    throw createError({ statusCode: 500, statusMessage: 'Unable to save payment gateway settings.' })
  }
})
