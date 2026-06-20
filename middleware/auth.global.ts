export default defineNuxtRouteMiddleware(async (to, from) => {
  const adminAuth = useCookie('toolkit_admin_auth')
  const supabase = useSupabase()
  const localePath = useLocalePath()

  // Helper to handle i18n paths (e.g., /bn/tools/ai-reply -> /tools/ai-reply)
  const localePattern = /^\/[a-z]{2}(\/|$)/
  const cleanPath = to.path.replace(localePattern, '/')

  // Showcase Mode Guard
  const runtimeConfig = useRuntimeConfig()
  const isShowcaseMode = runtimeConfig.public.showcaseMode
  if (isShowcaseMode) {
    if (cleanPath.startsWith('/tools/') && cleanPath !== '/tools/ai-reply') {
      return navigateTo(localePath('/'))
    }
  }

  // 1. Admin Protection
  if (cleanPath.startsWith('/admin') && cleanPath !== '/admin/login') {
    if (!adminAuth.value) {
      return navigateTo(localePath('/admin/login'))
    }
  }

  // 2. Protected Routes (Supabase Auth)
  const protectedRoutes = ['/dashboard']
  const isProtected = protectedRoutes.some(route => cleanPath.startsWith(route))

  if (isProtected) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return navigateTo(localePath('/login'))
    }
  }

  // 3. Prevent accessing login pages if already authenticated
  if (cleanPath === '/admin/login' && adminAuth.value) {
    return navigateTo(localePath('/admin'))
  }

  if (cleanPath === '/login') {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      return navigateTo(localePath('/dashboard'))
    }
  }
})



