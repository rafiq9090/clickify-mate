import { defineEventHandler, readBody, createError } from 'h3'
import { saveContactInquiryToFirestore } from '~/server/utils/firebase'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, message, platform, volume } = body || {}

  if (!email || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Email and message are required.' })
  }

  try {
    const formattedMessage = platform || volume 
      ? `[Platform: ${platform || 'N/A'}, Volume: ${volume || 'N/A'}]\n\n${message}`
      : message

    const inquiryPayload = {
      name: name || 'Anonymous',
      email: email.trim(),
      customer: name || 'Anonymous',
      message: formattedMessage,
      raw_message: message,
      platform: platform || 'direct',
      volume: volume || 'standard',
      source: 'contact_form',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    // Save EXCLUSIVELY to Firebase Firestore
    const saved = await saveContactInquiryToFirestore(inquiryPayload)

    return {
      success: true,
      data: inquiryPayload,
      firebaseSaved: saved
    }
  } catch (err: any) {
    console.error('[CONTACT_SUBMIT_ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to submit contact message.' })
  }
})
