// server/utils/settings.ts
// (Note: useSupabaseAdmin is auto-imported by Nuxt)

let _cachedSettings: any = null
let _lastFetch = 0
const CACHE_TTL = 30000 // 30 seconds cache for settings

export async function getSystemSettings(): Promise<Record<string, any>> {
    const now = Date.now()
    if (_cachedSettings && (now - _lastFetch < CACHE_TTL)) {
        return _cachedSettings
    }

    try {
        const supabase = useSupabaseAdmin()
        if (!supabase || !supabase.from) return {}

        const { data, error } = await supabase.from('settings').select('*').limit(1).single()
        
        if (!error && data) {
            _cachedSettings = data
            _lastFetch = now
            return data
        }
        if (error) console.warn('[SETTINGS_DB_WARN]:', error?.message || 'Unknown DB Error')
    } catch (e) {
        console.error('[SETTINGS_FETCH_ERROR]:', e)
    }

    return {}
}

export function clearSettingsCache() {
    _cachedSettings = null
    _lastFetch = 0
}

export async function getApiKey(keyName: string, envName: string): Promise<string | undefined> {
    const config = useRuntimeConfig()
    const settings = await getSystemSettings()
    
    let dbKey = settings[keyName]
    let envKey = config[envName] || process.env[envName]
    
    // Convert to string and prune placeholders
    const isValid = (k: any) => typeof k === 'string' && k.trim().length > 10 && !k.includes('your_') && !k.includes('•') && !k.includes('*')

    const finalKey = isValid(dbKey) ? dbKey : (isValid(envKey) ? envKey : undefined)
    
    const cleanKey = typeof finalKey === 'string' ? finalKey.trim() : undefined

    if (dbKey && typeof dbKey === 'string') {
        console.log(`[AUTH_DEBUG]: Found ${keyName} in DB (starts with: ${dbKey.substring(0, 8)}...) - Valid: ${isValid(dbKey)}`)
    } 
    
    if (envKey && typeof envKey === 'string') {
        console.log(`[AUTH_DEBUG]: Found ${envName} in Env (starts with: ${envKey.substring(0, 8)}...) - Valid: ${isValid(envKey)}`)
    }

    return cleanKey
}

export async function getApiKeyList(keyName: string, envName: string): Promise<string[]> {
    const config = useRuntimeConfig()
    const settings = await getSystemSettings()
    
    let dbKey = settings[keyName]
    let envKey = config[envName] || process.env[envName]
    
    const isValid = (k: any) => typeof k === 'string' && k.trim().length > 10 && !k.includes('your_') && !k.includes('•') && !k.includes('*')

    const rawValue = isValid(dbKey) ? dbKey : (isValid(envKey) ? envKey : undefined)
    if (!rawValue || typeof rawValue !== 'string') return []

    // Split by commas, newlines, or semicolons
    return rawValue
        .split(/[,\n;]+/)
        .map((k: string) => k.trim())
        .filter((k: string) => isValid(k))
}





