import crypto from 'crypto'
import { queryPg } from '../../utils/db'
import { normalizeEmail } from '../../utils/password-policy'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = normalizeEmail(body?.email)
  const code = String(body?.token || '').trim().toUpperCase()

  if (!/^[A-F0-9]{12}$/.test(code)) {
    throw createError({ statusCode: 400, statusMessage: 'Reset code must be a valid 12-character code.' })
  }

  const tokenHash = crypto.createHash('sha256').update(code).digest('hex')

  const result = await queryPg(
    `SELECT prt.id
       FROM public.auth_password_reset_tokens prt
       JOIN public.users u ON u.id = prt.user_id
      WHERE u.email = $1
        AND prt.token_hash = $2
        AND prt.used_at IS NULL
        AND prt.expires_at > now()
      ORDER BY prt.created_at DESC
      LIMIT 1`,
    [email, tokenHash]
  )

  if (!result.rows[0]) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired recovery code. Please check your code or request a new one.' })
  }

  return { success: true, message: 'Recovery code verified successfully.' }
})
