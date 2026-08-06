import { defineEventHandler } from 'h3'
import telegramAgentHandler from '../../api/agents/telegram'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method || 'GET'

  if (method === 'GET') {
    return {
      status: 'ACTIVE',
      platform: 'telegram',
      path: '/webhook/telegram'
    }
  }

  return telegramAgentHandler(event)
})
