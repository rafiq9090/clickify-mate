import { optionalAdminSession, optionalDashboardUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const user = await optionalDashboardUser(event)
  const admin = optionalAdminSession(event)
  return {
    authenticated: Boolean(user),
    admin: Boolean(admin),
    user: user ? { id: user.id, email: user.email, role: user.role } : null
  }
})
