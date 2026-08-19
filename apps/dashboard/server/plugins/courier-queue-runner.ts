// server/plugins/courier-queue-runner.ts
import { processDurableCourierQueue } from '../utils/agent/courier_queue'

export default defineNitroPlugin((nitroApp) => {
    console.log('[COURIER QUEUE RUNNER]: Initializing background durable courier processor...')

    // 1. Run immediate recovery check on server start (recovers any pending jobs from before restart)
    setTimeout(async () => {
        try {
            await processDurableCourierQueue()
        } catch (e: any) {
            console.warn('[COURIER QUEUE RUNNER]: Startup recovery check finished:', e.message)
        }
    }, 5000)

    // 2. Periodic Queue Poller (every 25 seconds)
    setInterval(async () => {
        try {
            await processDurableCourierQueue()
        } catch (e: any) {
            // Suppress unhandled interval errors
        }
    }, 25000)
})
