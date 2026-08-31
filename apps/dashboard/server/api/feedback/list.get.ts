import { defineEventHandler, createError } from 'h3'
import { getUserFeedbackListFromFirestore } from '../../utils/firebase'
import { requireDashboardRole } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const session = await requireDashboardRole(event, ['owner', 'admin', 'manager'])
  
  try {
    const s = session as any
    const userEmail = s?.email || s?.user?.email || ''
    const tickets = await getUserFeedbackListFromFirestore(userEmail)
    return {
      success: true,
      tickets: tickets || []
    }
  } catch (err: any) {
    console.error('[FEEDBACK LIST ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to fetch feedback history.' })
  }
})
