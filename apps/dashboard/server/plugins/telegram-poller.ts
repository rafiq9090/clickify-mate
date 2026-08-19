// server/plugins/telegram-poller.ts
import { decrypt } from '../utils/encryption'

export default defineNitroPlugin((nitroApp) => {
  // Only activate in local development / dev mode or when explicitly enabled
  const isDev = process.env.NODE_ENV !== 'production'
  
  console.log('[TELEGRAM POLLER]: Initializing automatic local Telegram long-polling service...')

  const pollingTokens = new Set<string>()

  async function pollAgent(agent: any) {
    if (!agent.encrypted_token) return
    let token = ''
    try {
      token = await decrypt(agent.encrypted_token)
    } catch (e: any) {
      console.warn(`[TELEGRAM POLLER]: Could not decrypt token for agent ${agent.id}: ${e.message}`)
      return
    }

    if (!token || pollingTokens.has(token)) return
    pollingTokens.add(token)

    console.log(`[TELEGRAM POLLER]: Starting live polling for ${agent.name || 'Telegram Agent'} (${agent.id.slice(-6)})`)

    // 1. Delete any dead/stale webhook so getUpdates works
    try {
      await $fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`).catch(() => null)
    } catch (e) {
      // Ignore
    }

    let offset = 0

    // 2. Continuous Polling Loop
    const poll = async () => {
      while (pollingTokens.has(token)) {
        try {
          const res: any = await $fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
            params: {
              offset: offset,
              timeout: 10
            },
            timeout: 15000
          }).catch(() => null)

          if (res?.ok && Array.isArray(res.result) && res.result.length > 0) {
            for (const update of res.result) {
              offset = update.update_id + 1

              // Process message internally via local endpoint
              try {
                await $fetch(`http://localhost:3000/api/agents/telegram?agent_id=${agent.id}`, {
                  method: 'POST',
                  body: update
                })
                console.log(`[TELEGRAM POLLER]: Processed message from chat ${update.message?.chat?.id}`)
              } catch (procErr: any) {
                console.error(`[TELEGRAM POLLER ERROR]: Failed to process update ${update.update_id}:`, procErr.message)
              }
            }
          }
        } catch (pollErr: any) {
          // Pause briefly on network error before retrying
          await new Promise(r => setTimeout(r, 3000))
        }

        // Small interval between polls
        await new Promise(r => setTimeout(r, 500))
      }
    }

    poll()
  }

  async function discoverAndStartPollers() {
    try {
      const supabase = useSupabaseAdmin()
      const { data: agents } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('platform', 'telegram')
        .eq('is_active', true)

      if (agents && agents.length > 0) {
        for (const agent of agents) {
          pollAgent(agent)
        }
      }
    } catch (e: any) {
      console.warn('[TELEGRAM POLLER]: Discovery check note:', e.message)
    }
  }

  // Initial discovery after server boot
  setTimeout(discoverAndStartPollers, 2000)

  // Periodic discovery for newly connected agents every 15 seconds
  setInterval(discoverAndStartPollers, 15000)
})
