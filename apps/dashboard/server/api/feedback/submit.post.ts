import { defineEventHandler, readBody, createError } from 'h3'
import { saveUserFeedbackToFirestore } from '../../utils/firebase'
import { requireDashboardRole } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const session = await requireDashboardRole(event, ['owner', 'admin', 'manager'])
  const body = await readBody(event)
  const { title, category, priority, description, attachments } = body || {}

  if (!title || !description) {
    throw createError({ statusCode: 400, statusMessage: 'Title and description are required.' })
  }

  try {
    const s = session as any
    const feedbackPayload = {
      title: String(title).trim().slice(0, 180),
      category: category || 'Bug Report',
      priority: priority || 'Medium',
      description: String(description).trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      user_id: s?.id || s?.user?.id || 'unknown',
      user_email: s?.email || s?.user?.email || 'user@example.com',
      status: 'open',
      admin_reply: '',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    // Save directly to Firebase Firestore
    const result = await saveUserFeedbackToFirestore(feedbackPayload)

    return {
      success: true,
      ticketId: result.id,
      data: result.data
    }
  } catch (err: any) {
    console.error('[FEEDBACK SUBMIT ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to submit problem feedback.' })
  }
})
