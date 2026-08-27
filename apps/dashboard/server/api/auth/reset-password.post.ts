import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { withPgTransaction } from '../../utils/db'
import { normalizeEmail, assertStrongPassword } from '../../utils/password-policy'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = normalizeEmail(body?.email)
  const code = String(body?.token || '').trim().toUpperCase()
  const password = assertStrongPassword(body?.password)
  if (!/^[A-F0-9]{12}$/.test(code)) {
    throw createError({ statusCode: 400, statusMessage: 'Reset code is invalid.' })
  }

  const tokenHash = crypto.createHash('sha256').update(code).digest('hex')
  const passwordHash = bcrypt.hashSync(password, 12)

  const changed = await withPgTransaction(async client => {
    const result = await client.query(
      `SELECT prt.id, prt.user_id
         FROM public.auth_password_reset_tokens prt
         JOIN public.users u ON u.id = prt.user_id
        WHERE u.email = $1
          AND prt.token_hash = $2
          AND prt.used_at IS NULL
          AND prt.expires_at > now()
        ORDER BY prt.created_at DESC
        LIMIT 1
        FOR UPDATE OF prt`,
      [email, tokenHash]
    )
    const token = result.rows[0]
    if (!token) return false

    await client.query(
      `UPDATE public.users
          SET password_hash = $1, session_version = session_version + 1, updated_at = now()
        WHERE id = $2`,
      [passwordHash, token.user_id]
    )
    await client.query('UPDATE public.auth_password_reset_tokens SET used_at = now() WHERE id = $1', [token.id])
    return true
  })

  if (!changed) throw createError({ statusCode: 400, statusMessage: 'Reset code is invalid or expired.' })
  return { success: true, message: 'Password reset successful. Sign in with your new password.' }
})
