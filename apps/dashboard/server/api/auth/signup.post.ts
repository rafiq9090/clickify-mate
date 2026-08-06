import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { queryPg } from '../../utils/db'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-in-prod-9988'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  if (runtimeConfig.public.allowSignup === false || runtimeConfig.public.allowSignup === 'false') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Public registration is disabled.'
    })
  }

  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required.'
    })
  }

  try {
    // Check if user already exists
    const checkRes = await queryPg('SELECT id FROM public.users WHERE email = $1', [email])
    if (checkRes.rows.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This email is already in use.'
      })
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(password, salt)

    // Insert user
    const insertRes = await queryPg(
      'INSERT INTO public.users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    )
    const user = insertRes.rows[0]

    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1d'
    })

    // Set cookie
    setCookie(event, 'toolkit_user_auth', token, {
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: false, // Accessible by Nuxt client-side middleware/composables
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return {
      success: true,
      token,
      user
    }
  } catch (err: any) {
    console.error('[SIGNUP ERROR]:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Failed to complete signup.'
    })
  }
})
