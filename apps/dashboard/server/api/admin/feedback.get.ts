import { defineEventHandler, createError } from 'h3'
import { getUserFeedbackListFromFirestore } from '../../utils/firebase'
import { requireAdminSession } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  try {
    // Fetch ALL feedback reports across all users from Firebase Firestore
    const tickets = await getUserFeedbackListFromFirestore()
    return {
      success: true,
      tickets: tickets || []
    }
  } catch (err: any) {
    console.error('[ADMIN FEEDBACK LIST ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to fetch feedback reports from Firebase.' })
  }
})
