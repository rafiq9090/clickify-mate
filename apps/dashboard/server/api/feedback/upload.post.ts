import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { uploadToBackblaze } from '../../utils/backblaze'
import { requireDashboardRole } from '../../utils/auth-session'

const MAX_FEEDBACK_UPLOAD_BYTES = 50 * 1024 * 1024 // 50 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime'
])

export default defineEventHandler(async (event) => {
  await requireDashboardRole(event, ['owner', 'admin', 'manager'])
  
  try {
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }

    const file = files.find(f => f.name === 'file' || f.name === 'attachment' || f.name === 'media') || files[0]
    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid file payload' })
    }

    if (file.data.length > MAX_FEEDBACK_UPLOAD_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'File size must be 50 MB or smaller.' })
    }

    const contentType = String(file.type || '').toLowerCase()
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      throw createError({ statusCode: 415, statusMessage: 'Only JPEG, PNG, WebP, GIF images and MP4, WebM, MOV videos are allowed.' })
    }

    const extension = contentType.includes('video/mp4') ? 'mp4' :
                      contentType.includes('video/webm') ? 'webm' :
                      contentType.includes('video/quicktime') ? 'mov' :
                      contentType === 'image/jpeg' ? 'jpg' :
                      contentType.split('/')[1] || 'bin'

    const baseName = String(file.filename || `feedback_${Date.now()}`)
      .replace(/\.[^.]+$/, '')
      .replace(/[^A-Za-z0-9_-]/g, '_')
      .slice(0, 80)
      
    const fileName = `${baseName || `feedback_${Date.now()}`}.${extension}`

    // Upload to Backblaze B2 in feedback bucket folder
    const result = await uploadToBackblaze(file.data, fileName, contentType, 'feedback')

    return {
      success: true,
      url: result.url,
      proxyUrl: result.proxyUrl,
      fileName,
      size: result.size,
      contentType: result.contentType,
      isImage: contentType.startsWith('image/'),
      isVideo: contentType.startsWith('video/')
    }
  } catch (error: any) {
    console.error('[FEEDBACK UPLOAD ERROR]:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to upload feedback attachment'
    })
  }
})
