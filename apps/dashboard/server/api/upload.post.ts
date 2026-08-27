// server/api/upload.post.ts
import { uploadToBackblaze } from '../utils/backblaze'
import { requireDashboardRole } from '../utils/auth-session'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function hasValidImageSignature(data: Buffer, type: string) {
  if (type === 'image/jpeg') return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  if (type === 'image/png') return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (type === 'image/webp') return data.length >= 12 && data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP'
  if (type === 'image/gif') return data.length >= 6 && ['GIF87a', 'GIF89a'].includes(data.subarray(0, 6).toString())
  return false
}

export default defineEventHandler(async (event) => {
  await requireDashboardRole(event, ['owner', 'admin', 'manager'])
  try {
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }

    const file = files.find(f => f.name === 'file' || f.name === 'image') || files[0]
    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid file payload' })
    }

    if (file.data.length > MAX_UPLOAD_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'Image must be 10 MB or smaller.' })
    }
    const contentType = String(file.type || '').toLowerCase()
    if (!IMAGE_TYPES.has(contentType) || !hasValidImageSignature(file.data, contentType)) {
      throw createError({ statusCode: 415, statusMessage: 'Only valid JPEG, PNG, WebP, or GIF images are allowed.' })
    }
    const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]
    const baseName = String(file.filename || `upload_${Date.now()}`)
      .replace(/\.[^.]+$/, '')
      .replace(/[^A-Za-z0-9_-]/g, '_')
      .slice(0, 80)
    const fileName = `${baseName || `upload_${Date.now()}`}.${extension}`

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
