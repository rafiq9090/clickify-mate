import { defineEventHandler, readBody, createError } from 'h3'
import { saveUserFeedbackToFirestore } from '../../utils/firebase'
import { requireAdminSession } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const body = await readBody(event)
  const { id, status, admin_reply } = body || {}

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID is required.' })
  }

  try {
    const updatePayload: Record<string, any> = { id }
    if (status !== undefined) updatePayload.status = status
    if (admin_reply !== undefined) updatePayload.admin_reply = admin_reply

    const result = await saveUserFeedbackToFirestore(updatePayload)
    return {
      success: true,
      data: result
    }
  } catch (err: any) {
    console.error('[ADMIN FEEDBACK UPDATE ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to update feedback report in Firebase.' })
  }
})
