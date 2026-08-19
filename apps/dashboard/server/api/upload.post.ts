// server/api/upload.post.ts
import { uploadToBackblaze } from '../utils/backblaze'

export default defineEventHandler(async (event) => {
  try {
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }

    const file = files.find(f => f.name === 'file' || f.name === 'image') || files[0]
    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid file payload' })
    }

    const fileName = file.filename || `upload_${Date.now()}.jpg`
    const contentType = file.type || 'image/jpeg'

    // Upload to Backblaze B2
    const result = await uploadToBackblaze(file.data, fileName, contentType, 'products')

    return {
      success: true,
      url: result.url,
      proxyUrl: result.proxyUrl,
      key: result.key,
      size: result.size,
      contentType: result.contentType
    }
  } catch (error: any) {
    console.error('[BACKBLAZE UPLOAD ERROR]:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to upload to Backblaze B2'
    })
  }
})
