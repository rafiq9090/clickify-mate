import { defineEventHandler } from 'h3'
import { requireAdminSession } from '../../utils/auth-session'
import { getContactInquiriesFromFirestore } from '../../utils/firebase'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  try {
    const rawMessages = await getContactInquiriesFromFirestore()

    const messages = (rawMessages || []).map((r: any) => ({
      id: r.id,
      email: r.email,
      name: r.name || r.customer || 'Anonymous',
      message: r.message || r.raw_message || '-',
      platform: r.platform || 'Direct',
      volume: r.volume || '',
      created_at: r.created_at || r.submitted_at || new Date().toISOString()
    }))

    return { success: true, messages }
  } catch (err: any) {
    console.error('[LEADS_GET_EXCEPTION]:', err)
    return { success: false, error: err.message, messages: [] }
  }
})
