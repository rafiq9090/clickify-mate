import telegramAgentHandler from '../agents/telegram'

// Compatibility alias for deployments that registered /api/webhook/telegram.
// The real handler performs secret-token verification and durable deduplication.
export default defineEventHandler(async (event) => telegramAgentHandler(event))
