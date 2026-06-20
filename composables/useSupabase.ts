import { createClient } from '@supabase/supabase-js'

export const useSupabase = () => {
  const nuxtApp = useNuxtApp()
  
  // Cache the instance on the nuxtApp context to prevent duplicate client/auth instances
  if (nuxtApp._supabase) {
    return nuxtApp._supabase as ReturnType<typeof createClient>
  }

  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  nuxtApp._supabase = supabase
  return supabase
}

