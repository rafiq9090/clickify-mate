// server/api/webhook/telegram.ts
// DUPLICATE ROUTE FOR DEBUGGING 403 ISSUES

export default defineEventHandler(async (event) => {
    // 1. Set Bypass Headers immediately
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
    setResponseHeader(event, 'ngrok-skip-browser-warning', 'true')

    if (event.method === 'GET') {
        return { status: 'WEBHOOK_DEBUG_ACTIVE', path: '/api/webhook/telegram' }
    }

    const body = await readBody(event)
    console.log('[WEBHOOK DEBUG]: Message Received')

    // Copy-paste the rest of the logic from telegram.ts if this works
    // For now, let's just see if we can get a 200 OK from Telegram
    return { success: true }
})
