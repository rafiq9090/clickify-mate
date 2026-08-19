// server/api/media/[...path].get.ts
import { getFileFromBackblaze } from '../../utils/backblaze'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: 'Media path required' })
  }

  try {
    const data = await getFileFromBackblaze(path)
    if (!data || !data.Body) {
      throw createError({ statusCode: 404, statusMessage: 'Media file not found' })
    }

    if (data.ContentType) {
      setHeader(event, 'Content-Type', data.ContentType)
    }
    if (data.ContentLength) {
      setHeader(event, 'Content-Length', data.ContentLength)
    }
    setHeader(event, 'Cache-Control', 'public, max-age=86400, immutable')

    // Stream byte array / stream
    const byteArray = await data.Body.transformToByteArray()
    return byteArray
  } catch (error: any) {
    console.error('[MEDIA PROXY ERROR]:', error.message)
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found or access denied in Backblaze B2'
    })
  }
})
