import bcrypt from 'bcryptjs'
import { withPgTransaction } from '../../utils/db'
import { setDashboardSession } from '../../utils/auth-session'
import { normalizeEmail } from '../../utils/password-policy'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const isSignupAllowed = Boolean(runtimeConfig.public.allowSignup === true || 
                          (runtimeConfig.public.allowSignup as any) === 'true' || 
                          process.env.ALLOW_SIGNUP !== 'false')

  if (!isSignupAllowed) {
    throw createError({ statusCode: 403, statusMessage: 'Public registration is disabled.' })
  }

  const body = await readBody(event)
  const email = normalizeEmail(body?.email)
  const password = String(body?.password || '')
  
  if (password.length < 6 || password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be between 6 and 128 characters.' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)

  try {
    const user = await withPgTransaction(async client => {
      const existing = await client.query('SELECT id FROM public.users WHERE email = $1', [email])
      if (existing.rows.length > 0) {
        throw createError({ statusCode: 409, statusMessage: 'This email is already in use.' })
      }

      const inserted = await client.query(
        `INSERT INTO public.users (email, password_hash, role, account_status)
         VALUES ($1, $2, 'owner', 'active')
         RETURNING id, email, role, session_version`,
        [email, passwordHash]
      )
      const row = inserted.rows[0]
      const shopName = (email.split('@')[0] || 'My') + ' Store'
      const shop = await client.query(
        `INSERT INTO public.shops (owner_user_id, name, default_currency, default_country)
         VALUES ($1, $2, 'BDT', 'BD')
         RETURNING id`,
        [row.id, shopName]
      )
      await client.query(
        `INSERT INTO public.shop_members (shop_id, user_id, role, status)
         VALUES ($1, $2, 'owner', 'active')`,
        [shop.rows[0].id, row.id]
      )
      return row
    })

    setDashboardSession(event, {
      id: String(user.id),
      email: String(user.email),
      role: user.role,
      sessionVersion: Number(user.session_version)
    })

    return { success: true, user: { id: String(user.id), email: String(user.email), role: user.role } }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('[SIGNUP ERROR]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to complete signup.' })
  }
})
