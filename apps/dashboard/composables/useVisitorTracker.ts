import { useRoute } from '#app'
import { watch } from 'vue'

export const useVisitorTracker = () => {
  const route = useRoute()
  
  const getBrowserInfo = () => {
    if (!process.client) return { browser: 'Unknown', os: 'Unknown', device: 'Desktop' }
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let os = 'Unknown'
    let device = 'Desktop'

    if (ua.includes('Chrome')) browser = 'Chrome'
    else if (ua.includes('Safari')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edge')) browser = 'Edge'

    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Macintosh')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) {
      os = 'Android'
      device = 'Mobile'
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'iOS'
      device = ua.includes('iPad') ? 'Tablet' : 'Mobile'
    }

    return { browser, os, device }
  }

  const getSessionId = () => {
    if (!process.client) return ''
    let sessionId = localStorage.getItem('visitor_session_id')
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      localStorage.setItem('visitor_session_id', sessionId)
    }
    return sessionId
  }

  const trackPing = async (toolUsed?: string, timeIncrement: number = 10) => {
    if (!process.client) return
    const sessionId = getSessionId()
    const { browser, os, device } = getBrowserInfo()

    try {
      await $fetch('/api/analytics/track', {
        method: 'POST',
        body: {
          session_id: sessionId,
          path: route.path,
          tool_used: toolUsed,
          time_increment: timeIncrement,
          os,
          browser,
          device
        }
      })
    } catch (err) {
      console.warn('Visitor tracking ping failed:', err)
    }
  }

  const initTracking = () => {
    if (!process.client) return

    // Send immediate initial ping
    trackPing(undefined, 0)

    // Watch for route changes to send a ping
    watch(() => route.path, () => {
      trackPing(undefined, 0)
    })

    // Setup periodic heartbeats
    setInterval(() => {
      trackPing(undefined, 10)
    }, 10000)
  }

  return {
    initTracking,
    trackPing
  }
}
