import { queryPg } from '../../utils/db'
import { decryptPaymentCredentials } from '../../utils/payments/credentials-crypto'
import { requireDashboardUser } from '../../utils/auth-session'

const CREDENTIAL_FIELDS: Record<string, string[]> = {
  bkash: ['username', 'password', 'appKey', 'appSecret'],
  nagad: ['accountNumber', 'privateKey', 'publicKey'],
  stripe: ['secretKey', 'webhookSecret']
}

export default defineEventHandler(async (event) => {
  const user = await requireDashboardUser(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')

  try {
    const result = await queryPg(
      `SELECT id, provider, merchant_name, merchant_number, environment,
              callback_url, credentials_encrypted, is_active, created_at, updated_at
         FROM public.payment_gateways
        WHERE user_id = $1
        ORDER BY provider ASC`,
      [user.id]
    )

    const gateways = await Promise.all(result.rows.map(async (row: any) => {
      const configuredCredentials: Record<string, boolean> = {}
      const allowedFields = CREDENTIAL_FIELDS[row.provider] || []
      let credentials: Record<string, unknown> = {}

      if (row.credentials_encrypted) {
        try {
          credentials = JSON.parse(await decryptPaymentCredentials(row.credentials_encrypted))
        } catch (error) {
          console.error(`[Payment Gateway] Unable to read encrypted ${row.provider} credentials for user ${user.id}.`)
        }
      }

      for (const field of allowedFields) {
        configuredCredentials[field] = typeof credentials[field] === 'string' && Boolean(String(credentials[field]).trim())
      }

      return {
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
    }))

    return { success: true, gateways }
  } catch (error: any) {
    console.error('[Payment Gateway] Failed to load gateway settings:', error?.message || error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to load payment gateway settings.'
    })
  }
})
