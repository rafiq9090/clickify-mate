import { defineEventHandler, readBody } from 'h3'
import { requireAdminSession } from '../../utils/auth-session'
import { deleteContactInquiryFromFirestore, getFirestoreDb } from '../../utils/firebase'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const body = await readBody(event)

  try {
    const db = getFirestoreDb()

    // 1. Clear all inquiries
    if (body.action === 'clear_all' && db) {
      const snapshot = await db.collection('contact_inquiries').get()
      const batch = db.batch()
      snapshot.docs.forEach(doc => batch.delete(doc.ref))
      await batch.commit()
      return { success: true, message: 'Cleared all lead inquiries from Firebase Firestore' }
    }

    // 2. Delete single lead by ID
    if (!body.id) {
      return { success: false, error: 'Message ID is required' }
    }

    const deleted = await deleteContactInquiryFromFirestore(body.id)
    if (!deleted) {
      return { success: false, error: 'Failed to delete message from Firebase Firestore' }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error deleting records from Firebase' }
  }
})
