const attempts = new Map<string, { count: number, lastAttempt: number }>()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

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

  // Admin Credentials — sourced from runtimeConfig or process.env only
  const config = useRuntimeConfig()
  const ADMIN_USER = config.adminUser || process.env.ADMIN_USER
  const ADMIN_PASS = config.adminPass || process.env.ADMIN_PASS

  if (!ADMIN_USER || !ADMIN_PASS) {
    throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' })
  }

  const isMatch = username?.trim().toLowerCase() === ADMIN_USER.trim().toLowerCase() &&
    password?.trim() === ADMIN_PASS.trim()

  if (isMatch) {
    // Reset attempts on success
    attempts.delete(ip)

    const token = getAdminAuthToken()

    // Set secure auth cookie
    setCookie(event, 'toolkit_admin_auth', token, {
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: false, // Allow client-side middleware to read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return {
      success: true,
      message: 'Login successful'
    }
  }

  // 🛡️ Increment attempts on failure
  const newCount = (userAttempts?.count || 0) + 1
  attempts.set(ip, { count: newCount, lastAttempt: now })

  throw createError({
    statusCode: 401,
    statusMessage: 'Invalid credentials.'
  })
})
