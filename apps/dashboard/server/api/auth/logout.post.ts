import { clearAdminSession, clearDashboardSession } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  clearDashboardSession(event)
  clearAdminSession(event)
  return { success: true }
})
