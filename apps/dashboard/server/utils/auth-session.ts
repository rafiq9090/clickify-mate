import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { queryPg } from './db'

export const DASHBOARD_COOKIE = 'toolkit_user_auth'
export const ADMIN_COOKIE = 'toolkit_admin_auth'

export type DashboardRole = 'owner' | 'admin' | 'manager' | 'support' | 'viewer'

export interface DashboardUser {
  id: string
  email: string
  role: DashboardRole
  sessionVersion: number
}

interface DashboardTokenPayload extends jwt.JwtPayload {
  id: string
  email: string
  role: DashboardRole
  session_version: number
  token_type: 'dashboard'
}

export interface AdminTokenPayload extends jwt.JwtPayload {
  token_type: 'system_admin'
  username: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function requiredSecret(name: 'JWT_SECRET' | 'ADMIN_SESSION_SECRET') {
  const fallback = name === 'ADMIN_SESSION_SECRET' ? process.env.JWT_SECRET : undefined
  const value = process.env[name] || fallback
  if (!value || value.length < 32) {
    throw createError({
      statusCode: 500,
      statusMessage: `${name} must be configured with at least 32 characters.`
    })
  }
  return value
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge
  }
}

export function assertSameOrigin(event: any) {
  const method = String(event.method || 'GET').toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return

  const origin = getRequestHeader(event, 'origin')
  if (!origin) {
    const authHeader = getRequestHeader(event, 'authorization')
    if (/^Bearer\s+\S+/i.test(authHeader || '')) return
    if (process.env.NODE_ENV === 'production') {
      throw createError({ statusCode: 403, statusMessage: 'Request origin is required.' })
    }
    return
  }

  const forwardedHost = getRequestHeader(event, 'x-forwarded-host')
  const host = forwardedHost || getRequestHeader(event, 'host')
  if (!host) throw createError({ statusCode: 403, statusMessage: 'Request origin could not be verified.' })

  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'Request origin is invalid.' })
  }

  if (originHost.toLowerCase() !== host.toLowerCase()) {
    throw createError({ statusCode: 403, statusMessage: 'Cross-site request rejected.' })
  }
}

function requestToken(event: any, cookieName: string) {
  const authHeader = getRequestHeader(event, 'authorization')
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
  return bearerToken || getCookie(event, cookieName)
}

export function signDashboardSession(user: DashboardUser) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      session_version: user.sessionVersion,
      token_type: 'dashboard'
    },
    requiredSecret('JWT_SECRET'),
    { expiresIn: '8h', issuer: 'clickify-mate', audience: 'dashboard' }
  )
}

export function setDashboardSession(event: any, user: DashboardUser) {
  setCookie(event, DASHBOARD_COOKIE, signDashboardSession(user), cookieOptions(8 * 60 * 60))
}

export function clearDashboardSession(event: any) {
  setCookie(event, DASHBOARD_COOKIE, '', cookieOptions(0))
}

export function signAdminSession(username: string) {
  return jwt.sign(
    { token_type: 'system_admin', username },
    requiredSecret('ADMIN_SESSION_SECRET'),
    { expiresIn: '8h', issuer: 'clickify-mate', audience: 'system-admin' }
  )
}

export function setAdminSession(event: any, username: string) {
  setCookie(event, ADMIN_COOKIE, signAdminSession(username), cookieOptions(8 * 60 * 60))
}

export function clearAdminSession(event: any) {
  setCookie(event, ADMIN_COOKIE, '', cookieOptions(0))
}

export async function requireDashboardUser(event: any): Promise<DashboardUser> {
  assertSameOrigin(event)
  const token = requestToken(event, DASHBOARD_COOKIE)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Authentication required.' })

  let payload: DashboardTokenPayload
  try {
    payload = jwt.verify(token, requiredSecret('JWT_SECRET'), {
      issuer: 'clickify-mate',
      audience: 'dashboard'
    }) as DashboardTokenPayload
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Your session is invalid or expired.' })
  }

  if (payload.token_type !== 'dashboard' || !UUID_PATTERN.test(String(payload.id))) {
    throw createError({ statusCode: 401, statusMessage: 'Your session is invalid.' })
  }

  const result = await queryPg(
    `SELECT id, email, role, session_version, account_status
       FROM public.users
      WHERE id = $1
      LIMIT 1`,
    [payload.id]
  )
  const row = result.rows[0]
  if (!row || row.account_status !== 'active' || Number(row.session_version) !== Number(payload.session_version)) {
    throw createError({ statusCode: 401, statusMessage: 'Your session has been revoked.' })
  }

  return {
    id: String(row.id),
    email: String(row.email),
    role: row.role as DashboardRole,
    sessionVersion: Number(row.session_version)
  }
}

export async function optionalDashboardUser(event: any): Promise<DashboardUser | null> {
  try {
    return await requireDashboardUser(event)
  } catch (error: any) {
    if (error?.statusCode === 401) return null
    throw error
  }
}

export async function requireDashboardRole(event: any, roles: DashboardRole[]) {
  const user = await requireDashboardUser(event)
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission for this action.' })
  }
  return user
}

export function requireAdminSession(event: any): AdminTokenPayload {
  assertSameOrigin(event)
  const token = requestToken(event, ADMIN_COOKIE)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Administrator authentication required.' })

  try {
    const payload = jwt.verify(token, requiredSecret('ADMIN_SESSION_SECRET'), {
      issuer: 'clickify-mate',
      audience: 'system-admin'
    }) as AdminTokenPayload
    if (payload.token_type !== 'system_admin' || !payload.username) throw new Error('Invalid admin token')
    return payload
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Administrator session is invalid or expired.' })
  }
}

export function optionalAdminSession(event: any): AdminTokenPayload | null {
  try {
    return requireAdminSession(event)
  } catch (error: any) {
    if (error?.statusCode === 401) return null
    throw error
  }
}

export function timingSafeTextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function loginAttemptKey(event: any, identity: string) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  return crypto.createHash('sha256').update(`${ip}|${identity.trim().toLowerCase()}`).digest('hex')
}

export async function assertLoginAllowed(keyHash: string) {
  const result = await queryPg(
    `SELECT attempt_count
       FROM public.auth_login_attempts
      WHERE key_hash = $1 AND last_attempt_at > now() - interval '15 minutes'`,
    [keyHash]
  )
  const row = result.rows[0]
  if (row && Number(row.attempt_count) >= 5) {
    throw createError({ statusCode: 429, statusMessage: 'Too many login attempts. Try again in 15 minutes.' })
  }
}

export async function recordLoginFailure(keyHash: string) {
  await queryPg(
    `INSERT INTO public.auth_login_attempts (key_hash, attempt_count, last_attempt_at)
     VALUES ($1, 1, now())
     ON CONFLICT (key_hash) DO UPDATE
       SET attempt_count = CASE
             WHEN public.auth_login_attempts.last_attempt_at <= now() - interval '15 minutes' THEN 1
             ELSE public.auth_login_attempts.attempt_count + 1
           END,
           last_attempt_at = now()`,
    [keyHash]
  )
}

export async function clearLoginFailures(keyHash: string) {
  await queryPg('DELETE FROM public.auth_login_attempts WHERE key_hash = $1', [keyHash])
}
