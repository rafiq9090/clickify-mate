import { createClient } from '@supabase/supabase-js'

export const useSupabaseAdmin = () => {
  const config = useRuntimeConfig()
  
  // Use the key mapped in nuxt.config.ts (runtimeConfig)
  const serviceKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || config.public.supabaseKey
  
  return createClient(
    config.public.supabaseUrl,
    serviceKey
  )
}