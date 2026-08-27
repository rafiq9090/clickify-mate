import bcrypt from 'bcryptjs'
import { queryPg } from '../../utils/db'
import { clearDashboardSession, requireDashboardUser } from '../../utils/auth-session'
import { assertStrongPassword } from '../../utils/password-policy'

export default defineEventHandler(async (event) => {
  const user = await requireDashboardUser(event)
  const body = await readBody(event)
  const currentPassword = String(body?.currentPassword || body?.current_password || '')
  const newPassword = assertStrongPassword(body?.password)
  if (!currentPassword) throw createError({ statusCode: 400, statusMessage: 'Current password is required.' })

  const result = await queryPg('SELECT password_hash FROM public.users WHERE id = $1', [user.id])
  if (!result.rows[0] || !bcrypt.compareSync(currentPassword, result.rows[0].password_hash)) {
    throw createError({ statusCode: 401, statusMessage: 'Current password is incorrect.' })
  }

  const passwordHash = bcrypt.hashSync(newPassword, 12)
  await queryPg(
    `UPDATE public.users
        SET password_hash = $1, session_version = session_version + 1, updated_at = now()
      WHERE id = $2`,
    [passwordHash, user.id]
  )
  clearDashboardSession(event)
  return { success: true, message: 'Password updated. Sign in again on this device.' }
})
