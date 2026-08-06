import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { queryPg } from '../../utils/db'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-in-prod-9988'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { password } = body
  
  if (!password) {
    throw createError({ statusCode: 400, statusMessage: 'Password is required.' })
  }

  // Retrieve JWT token from headers or cookie
  const authHeader = getRequestHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : getCookie(event, 'toolkit_user_auth')

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized. Log in first.' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Hash new password
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(password, salt)

    await queryPg('UPDATE public.users SET password_hash = $1 WHERE id = $2', [hash, decoded.id])

    return { success: true }
  } catch (err: any) {
    console.error('[UPDATE PASSWORD ERROR]:', err)
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session.' })
  }
})
