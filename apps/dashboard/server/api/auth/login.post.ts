import bcrypt from 'bcryptjs'
import { queryPg } from '../../utils/db'
import { normalizeEmail } from '../../utils/password-policy'
import {
  assertLoginAllowed,
  clearLoginFailures,
  loginAttemptKey,
  recordLoginFailure,
  setAdminSession,
  setDashboardSession,
  timingSafeTextEqual
} from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const emailInput = body?.email
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  const identity = emailInput ? String(emailInput) : username

  if (!identity || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Identity and password are required.' })
  }

  const attemptKey = loginAttemptKey(event, identity)
  await assertLoginAllowed(attemptKey)

  if (emailInput) {
    const email = normalizeEmail(emailInput)
    try {
      const result = await queryPg(
        `SELECT id, email, password_hash, role, session_version, account_status
           FROM public.users
          WHERE email = $1
          LIMIT 1`,
        [email]
      )
      const user = result.rows[0]
      const passwordValid = user && user.password_hash ? await bcrypt.compare(password, user.password_hash) : false
      if (!user || user.account_status !== 'active' || !passwordValid) {
        throw new Error('Invalid credentials.')
      }

      await clearLoginFailures(attemptKey)
      setDashboardSession(event, {
        id: String(user.id),
        email: String(user.email),
        role: user.role,
        sessionVersion: Number(user.session_version)
      })
      await queryPg('UPDATE public.users SET last_login_at = now() WHERE id = $1', [user.id])

      return {
        success: true,
        user: { id: String(user.id), email: String(user.email), role: user.role },
        message: 'Login successful'
      }
    } catch (error: any) {
      await recordLoginFailure(attemptKey)
      if (error?.statusCode) throw error
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials.' })
    }
  }

  const config = useRuntimeConfig()
  const adminUser = String(config.adminUser || process.env.ADMIN_USER || '').trim()
  const adminPass = String(config.adminPass || process.env.ADMIN_PASS || '')
  if (!adminUser || !adminPass || adminPass.length < 12) {
    throw createError({ statusCode: 500, statusMessage: 'Administrator authentication is not configured securely.' })
  }

  const validUsername = timingSafeTextEqual(username.toLowerCase(), adminUser.toLowerCase())
  const validPassword = timingSafeTextEqual(password, adminPass)
  if (!validUsername || !validPassword) {
    await recordLoginFailure(attemptKey)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials.' })
  }

  await clearLoginFailures(attemptKey)
  setAdminSession(event, adminUser)
  return { success: true, admin: true, message: 'Login successful' }
})
