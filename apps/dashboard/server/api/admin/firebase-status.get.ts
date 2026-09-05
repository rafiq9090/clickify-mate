import { defineEventHandler } from 'h3'
import { getFirestoreDb } from '~/server/utils/firebase'
import { requireAdminSession } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  try {
    const db = getFirestoreDb()
    if (!db) {
      return {
        success: false,
        status: 'UNINITIALIZED',
        message: 'Firebase Admin could not find or load the serviceAccountKey.json file.'
      }
    }

    // Try reading the 'blogs' collection
    const snapshot = await db.collection('blogs').limit(5).get()
    const count = snapshot.size
    const sampleDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return {
      success: true,
      status: 'CONNECTED',
      message: 'Successfully connected to Firebase Firestore!',
      blogsCount: count,
      sampleDocs
    }
  } catch (err: any) {
    return {
      success: false,
      status: 'ERROR',
      message: err.message || 'Error connecting to Firestore database.'
    }
  }
})
