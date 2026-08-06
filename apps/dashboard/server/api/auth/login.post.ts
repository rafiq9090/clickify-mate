import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { queryPg } from '../../utils/db'

const attempts = new Map<string, { count: number, lastAttempt: number }>()
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-in-prod-9988'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, email, password } = body

  // 🛡️ Rate Limiting Logic
  const ip = getRequestIP(event) || 'unknown'
  const now = Date.now()
  const userAttempts = attempts.get(ip)

  // Block for 15 minutes if more than 5 attempts
  if (userAttempts && userAttempts.count >= 5 && now - userAttempts.lastAttempt < 15 * 60 * 1000) {
    const timeLeft = Math.ceil((15 * 60 * 1000 - (now - userAttempts.lastAttempt)) / 1000 / 60)
    throw createError({
      statusCode: 429,
      statusMessage: `Too many login attempts. Please try again in ${timeLeft} minutes.`
    })
  }

  // 1. Standard User Auth (Dashboard)
  if (email) {
    try {
      const userRes = await queryPg('SELECT * FROM public.users WHERE email = $1', [email])
      if (userRes.rows.length === 0) {
        throw new Error('Invalid credentials.')
      }

      const user = userRes.rows[0]
      const isValid = bcrypt.compareSync(password, user.password_hash)
      if (!isValid) {
        throw new Error('Invalid credentials.')
      }

      // Reset attempts
      attempts.delete(ip)

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '1d'
      })

      // Set cookie
      setCookie(event, 'toolkit_user_auth', token, {
        maxAge: 60 * 60 * 24, // 1 day
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })

      return {
        success: true,
        token,
        message: 'Login successful'
      }
    } catch (err: any) {
      // Increment rate limit on failure
      const newCount = (userAttempts?.count || 0) + 1
      attempts.set(ip, { count: newCount, lastAttempt: now })

      throw createError({
        statusCode: 401,
        statusMessage: err.message || 'Invalid credentials.'
      })
    }
  }

  // 2. Admin Credentials Auth (Admin Panel)
  const config = useRuntimeConfig()
  const ADMIN_USER = config.adminUser || process.env.ADMIN_USER
  const ADMIN_PASS = config.adminPass || process.env.ADMIN_PASS

  if (!ADMIN_USER || !ADMIN_PASS) {
    throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' })
  }

  const isMatch = username?.trim().toLowerCase() === ADMIN_USER.trim().toLowerCase() &&
    password?.trim() === ADMIN_PASS.trim()

  if (isMatch) {
    attempts.delete(ip)

    const token = getAdminAuthToken()

    setCookie(event, 'toolkit_admin_auth', token, {
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return {
      success: true,
      message: 'Login successful'
    }
  }

  // Increment attempts on failure
  const newCount = (userAttempts?.count || 0) + 1
  attempts.set(ip, { count: newCount, lastAttempt: now })

  throw createError({
    statusCode: 401,
    statusMessage: 'Invalid credentials.'
  })
})

