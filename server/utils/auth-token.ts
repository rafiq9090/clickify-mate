import crypto from 'crypto'

export function getAdminAuthToken(): string {
  const config = useRuntimeConfig()
  const username = config.adminUser || process.env.ADMIN_USER || 'admin'
  const password = config.adminPass || process.env.ADMIN_PASS || 'admin'
  
  // Use a secret unique to the project to sign the token
  const secret = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-salt-key-9090'

  return crypto
    .createHmac('sha256', secret)
    .update(`${username}:${password}`)
    .digest('hex')
}
