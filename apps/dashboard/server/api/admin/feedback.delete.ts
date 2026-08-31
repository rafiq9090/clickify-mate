import { defineEventHandler, readBody, createError } from 'h3'
import { deleteUserFeedbackFromFirestore } from '../../utils/firebase'
import { requireAdminSession } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const body = await readBody(event)
  const { id, ids } = body || {}

  const targetIds: string[] = Array.isArray(ids) ? ids.filter(Boolean) : (id ? [String(id)] : [])

  if (targetIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID or IDs array is required.' })
  }

  try {
    let deletedCount = 0
    for (const targetId of targetIds) {
      const ok = await deleteUserFeedbackFromFirestore(targetId)
      if (ok) deletedCount++
    }

    return {
      success: true,
      deletedCount,
      totalRequested: targetIds.length
    }
  } catch (err: any) {
    console.error('[ADMIN FEEDBACK DELETE ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to delete feedback ticket(s).' })
  }
})
