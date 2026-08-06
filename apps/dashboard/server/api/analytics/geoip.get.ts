export default defineEventHandler(async (event) => {
    try {
        // Get real client IP from request headers
        const ip = getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
            || getHeader(event, 'x-real-ip')
            || event.node.req.socket?.remoteAddress
            || ''

        // Strip IPv6 local loopback
        const cleanIp = ip === '::1' || ip === '127.0.0.1' ? '' : ip

        // If no real IP (localhost dev), use geojs without specifying IP
        const target = cleanIp ? `https://get.geojs.io/v1/ip/geo/${cleanIp}.json` : `https://get.geojs.io/v1/ip/geo.json`

        const res: any = await $fetch(target)

        if (res && res.ip) {
            return {
                success: true,
                ip: res.ip || cleanIp || 'Unknown',
                city: res.city || 'Unknown',
                country: res.country || 'Unknown',
                isp: res.organization_name || 'Unknown'
            }
        }
    } catch (e) {
        // silent fail
    }
    return { success: false, ip: 'Unknown', city: 'Unknown', country: 'Unknown', isp: 'Unknown' }
})
