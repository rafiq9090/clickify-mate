import { getMongo, queryPg } from '../utils/db'

export default defineEventHandler(async (event) => {
  const checks: Record<string, string> = {}
  try {
    await queryPg('SELECT 1')
    checks.postgres = 'healthy'
  } catch {
    checks.postgres = 'unavailable'
  }
  try {
    const { db } = await getMongo()
    await db.command({ ping: 1 })
    checks.mongodb = 'healthy'
  } catch {
    checks.mongodb = 'unavailable'
  }
  const healthy = Object.values(checks).every(value => value === 'healthy')
  if (!healthy) setResponseStatus(event, 503)
  return {
    status: healthy ? 'operational' : 'degraded',
    service: 'clickify-mate-dashboard',
    checks,
    timestamp: new Date().toISOString()
  }
})
