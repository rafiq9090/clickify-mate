// server/api/media/stream.get.ts
import { requireDashboardUser } from '../../utils/auth-session'

const MAX_MEDIA_BYTES = 25 * 1024 * 1024

function allowedMediaHost(hostname: string) {
    const configured = String(process.env.MEDIA_ALLOWED_HOSTS || '')
        .split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
    const known = ['api.telegram.org', 'graph.facebook.com']
    const host = hostname.toLowerCase()
    return [...known, ...configured].some(allowed => host === allowed || host.endsWith(`.${allowed}`)) ||
        host.endsWith('.fbcdn.net') || host.endsWith('.backblazeb2.com')
}

export default defineEventHandler(async (event) => {
    await requireDashboardUser(event)
    const query = getQuery(event)
    const mediaUrl = query.url as string

    if (!mediaUrl) {
        throw createError({ statusCode: 400, statusMessage: 'Missing media URL parameter' })
    }

    try {
        const decodedUrl = decodeURIComponent(mediaUrl)
        const upstream = new URL(decodedUrl)
        if (upstream.protocol !== 'https:' || !allowedMediaHost(upstream.hostname)) {
            throw createError({ statusCode: 403, statusMessage: 'Media source is not allowed.' })
        }
        
        // Fetch raw media from source (Telegram, Meta, or CDN)
        const res = await fetch(decodedUrl, {
            redirect: 'error',
            signal: AbortSignal.timeout(10_000),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        if (!res.ok) {
            throw createError({ statusCode: res.status, statusMessage: 'Failed to fetch media from upstream source' })
        }

        const announcedLength = Number(res.headers.get('content-length') || 0)
        if (announcedLength > MAX_MEDIA_BYTES) {
            throw createError({ statusCode: 413, statusMessage: 'Media file is too large.' })
        }

        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        if (buffer.length > MAX_MEDIA_BYTES) {
            throw createError({ statusCode: 413, statusMessage: 'Media file is too large.' })
        }
        const totalLength = buffer.length

        const contentType = (String(res.headers.get('content-type') || '').split(';')[0] || '').toLowerCase()
        if (!/^(image\/(jpeg|png|webp|gif)|audio\/(ogg|mpeg|mp4|webm)|video\/(mp4|webm))$/.test(contentType)) {
            throw createError({ statusCode: 415, statusMessage: 'Unsupported upstream media type.' })
        }

        setHeader(event, 'Content-Type', contentType)
        setHeader(event, 'Accept-Ranges', 'bytes')
        setHeader(event, 'Cache-Control', 'private, max-age=3600')

        // Handle HTTP Range header for smooth video seeking & streaming
        const rangeHeader = getRequestHeader(event, 'range') || ''
        if (rangeHeader && rangeHeader.startsWith('bytes=')) {
            const parts = rangeHeader.replace(/bytes=/, '').split('-')
            const start = parseInt(parts[0] || '0', 10)
            const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1

            if (start >= totalLength || end >= totalLength) {
                setHeader(event, 'Content-Range', `bytes */${totalLength}`)
                setResponseStatus(event, 416)
                return 'Requested Range Not Satisfiable'
            }

            const chunk = buffer.subarray(start, end + 1)
            setResponseStatus(event, 206)
            setHeader(event, 'Content-Range', `bytes ${start}-${end}/${totalLength}`)
            setHeader(event, 'Content-Length', chunk.length)
            return chunk
        }

        setHeader(event, 'Content-Length', totalLength)
        return buffer
    } catch (err: any) {
        console.error('[MEDIA STREAM ERROR]: Upstream media request failed.')
        if (err?.statusCode) throw err
        throw createError({ statusCode: 502, statusMessage: 'Media streaming failed.' })
    }
})
