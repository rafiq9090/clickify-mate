import { requireAdminSession } from '../../utils/auth-session'
import { saveAuthorProfileToFirestore, getAuthorProfileFromFirestore } from '../../utils/firebase'

// Firestore max field size is ~1 MB. Base64 adds ~33% overhead.
// We reject base64 photos larger than 800 KB raw to stay safely under the limit.
const MAX_PHOTO_BYTES = 800 * 1024

function sanitizePhoto(photo: string): string {
  if (!photo || !photo.startsWith('data:')) return photo  // URL — always fine
  // base64: measure byte length (each char ≈ 1 byte, padding accounted by length)
  const byteLen = Math.ceil((photo.length * 3) / 4)
  if (byteLen > MAX_PHOTO_BYTES) {
    console.warn(`[Author Profile] Photo too large (${Math.round(byteLen / 1024)} KB) — skipping Firestore write for photo field`)
    return '' // drop the photo rather than crash
  }
  return photo
}

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  // GET  /api/admin/author-profile  → load saved profile from Firestore
  if (event.method === 'GET') {
    const profile = await getAuthorProfileFromFirestore()
    return { success: true, profile }
  }

  // POST /api/admin/author-profile  → persist profile to Firestore
  if (event.method === 'POST') {
    const body = await readBody(event)
    const { author_name, author_role, author_photo } = body || {}

    if (typeof author_name !== 'string' || typeof author_role !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'author_name and author_role are required strings' })
    }

    const safePhoto = sanitizePhoto(typeof author_photo === 'string' ? author_photo : '')

    const saved = await saveAuthorProfileToFirestore({
      author_name: author_name.trim(),
      author_role: author_role.trim(),
      author_photo: safePhoto
    })

    if (!saved) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to save author profile to Firebase' })
    }

    return { success: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
