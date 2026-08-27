import crypto from 'crypto'
import { queryPg } from '../../utils/db'
import { loginAttemptKey, assertLoginAllowed, recordLoginFailure } from '../../utils/auth-session'
import { normalizeEmail } from '../../utils/password-policy'
import { sendPasswordResetEmail } from '../../utils/notifications'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = normalizeEmail(body?.email)
  const rateKey = loginAttemptKey(event, `password-reset:${email}`)
  await assertLoginAllowed(rateKey)
  await recordLoginFailure(rateKey)

  const userResult = await queryPg('SELECT id FROM public.users WHERE email = $1 AND account_status = $2', [email, 'active'])
  const user = userResult.rows[0]
  if (!user) {
    return { success: true, message: 'If that account exists, a reset code has been sent.' }
  }

  const code = crypto.randomBytes(6).toString('hex').toUpperCase()
  const tokenHash = crypto.createHash('sha256').update(code).digest('hex')
  await queryPg(
    `UPDATE public.auth_password_reset_tokens
        SET used_at = now()
      WHERE user_id = $1 AND used_at IS NULL`,
    [user.id]
  )
  await queryPg(
    `INSERT INTO public.auth_password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '15 minutes')`,
    [user.id, tokenHash]
  )

  try {
    await sendPasswordResetEmail(email, code)
  } catch (error) {
    console.error('[PASSWORD RESET EMAIL]:', error)
    if (process.env.NODE_ENV === 'production') {
      throw createError({ statusCode: 503, statusMessage: 'Password reset email is temporarily unavailable.' })
    }
  }

  return {
    success: true,
    message: 'If that account exists, a reset code has been sent.',
    ...(process.env.NODE_ENV !== 'production' ? { developmentCode: code } : {})
  }
})
