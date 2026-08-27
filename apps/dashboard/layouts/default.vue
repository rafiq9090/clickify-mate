<script setup>
import { useVisitorTracker } from '~/composables/useVisitorTracker'

const isScrolled = ref(false)
const isSidebarOpen = ref(false)

const route = useRoute()
const isLanding = computed(() => route.path === '/')
const handleHomeClick = (path, event) => {
  if (route.path === path || (path === '/' && route.path === '/')) {
    if (process.client) {
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}

// Brand Logo Typing Animation State
const runtimeConfig = useRuntimeConfig()
const isShowcaseMode = computed(() => runtimeConfig.public.showcaseMode === true || runtimeConfig.public.showcaseMode === 'true')

const displayName = ref('Clickify Mate')
const isTyping = ref(false)

const logoParts = computed(() => {
  const name = displayName.value
  if (name.length <= 8) {
    return { first: name, second: '' }
  }
  return { first: name.slice(0, 8), second: name.slice(8) }
})

const startTypingAnimation = () => {
  if (process.server) return
  const fullText = 'Clickify Mate'
  displayName.value = ''
  isTyping.value = true
  let i = 0
  if (window.typingTimer) {
    clearInterval(window.typingTimer)
  }
  window.typingTimer = setInterval(() => {
    if (i < fullText.length) {
      displayName.value += fullText.charAt(i)
      i++
    } else {
      clearInterval(window.typingTimer)
      isTyping.value = false
    }
  }, 100)
}

const { data: globalData } = useAsyncData('global-app-settings', () => $fetch('/api/settings'), {
  immediate: true
})

const navigation = computed(() => {
  return [
    { label: 'Home', path: '/',  },
    { label: 'How it works', path: '#live-demo', },
    { label: 'Channels', path: '#channels', },
    { label: 'Intelligence', path: '#features', },
    { label: 'FAQ', path: '#faq', }
  ]
})

const settings = computed(() => {
  if (globalData.value?.success && globalData.value.settings) {
    return globalData.value.settings
  }
  return { site_name: 'Clickify Mate', adsense_pub_id: '', adsense_code: '' }
})

watch([() => settings.value.site_name, isShowcaseMode], () => {
  if (process.client) {
    startTypingAnimation()
  }
})

// Handle Dynamic Head Injection
useHead(() => ({
  titleTemplate: (titleChunk) => {
    if (titleChunk && (titleChunk.includes(settings.value.site_name) || titleChunk.includes('Clickify Mate'))) {
      return titleChunk
    }
    return titleChunk ? `${titleChunk} - ${settings.value.site_name}` : settings.value.site_name
  },
  htmlAttrs: {
    lang: 'en',
    dir: 'ltr'
  },
  link: [],
  meta: [
    { property: 'og:image', content: 'https://clickifymate.com/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:type', content: 'image/png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: 'https://clickifymate.com/og-image.png' },
    ...(settings.value.google_search_console_id ? [{
      name: 'google-site-verification',
      content: settings.value.google_search_console_id
    }] : []),
    ...(settings.value.bing_webmaster_id ? [{
      name: 'msvalidate.01',
      content: settings.value.bing_webmaster_id
    }] : []),
    ...(settings.value.yandex_webmaster_id ? [{
      name: 'yandex-verification',
      content: settings.value.yandex_webmaster_id
    }] : [])
  ],
  script: [
    ...(settings.value.google_analytics_id ? [
      { 
        src: `https://www.googletagmanager.com/gtag/js?id=${settings.value.google_analytics_id}`,
        async: true
      },
      {
        type: 'text/javascript',
        innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${settings.value.google_analytics_id}');
        `
      }
    ] : [])
  ],
  noscript: []
}))

const handleScroll = () => {
  if (process.client) {
    isScrolled.value = window.scrollY > 10
  }
}

// Cookie Consent
const showCookieBanner = ref(false)
const acceptCookies = () => {
  localStorage.setItem('cookie_consent', 'accepted')
  showCookieBanner.value = false
}
const declineCookies = () => {
  localStorage.setItem('cookie_consent', 'declined')
  showCookieBanner.value = false
}

const user = ref(null)
const supabase = useSupabase()

onMounted(async () => {
  const { initTracking } = useVisitorTracker()
  initTracking()
  
  // Real-time Auth Check
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user || null
  })

  if (process.client) {
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    startTypingAnimation()
    
    // Show cookie banner if consent not yet given
    if (!localStorage.getItem('cookie_consent')) {
      setTimeout(() => { showCookieBanner.value = true }, 1500)
    }
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('scroll', handleScroll)
  }
})

const scrollProgress = ref(0)
let lastScrollTime = 0

const handleScrollProgress = () => {
  const now = Date.now()
  if (now - lastScrollTime < 32) return // Throttle to ~30fps
  lastScrollTime = now

  if (process.client) {
    const doc = document.documentElement
    const win = window
    const totalHeight = doc.scrollHeight - win.innerHeight
    scrollProgress.value = totalHeight > 0 ? win.scrollY / totalHeight : 0
  }
}

onMounted(() => {
  if (process.client) {
    window.addEventListener('scroll', handleScrollProgress)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('scroll', handleScrollProgress)
  }
})

const handleLogout = async () => {
    await supabase.auth.signOut()
    isSidebarOpen.value = false
    navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-transparent relative overflow-x-hidden">
    <!-- Scroll Progress Bar -->
    <div 
        class="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary via-primary-accent to-secondary z-[100] transition-transform duration-100 origin-left"
        :style="{ transform: `scaleX(${scrollProgress})` }" 
    ></div>

    <!-- Background -->
    <div class="fixed inset-0 z-0 pointer-events-none bg-background">
    </div>
    <!-- Dynamic Sidebar -->
    <div 
      v-if="isSidebarOpen" 
      class="fixed inset-0 bg-black/60 z-[60] lg:hidden"
      @click="isSidebarOpen = false"
    ></div>
    
    <aside 
      :class="[isSidebarOpen ? 'translate-x-0' : '-translate-x-full']"
      class="fixed left-0 top-0 h-full w-[300px] bg-background z-[70] shadow-lg transition-transform duration-500 ease-in-out p-8 flex flex-col border-r border-outline"
    >
        <div class="flex items-center justify-between mb-8">
            <NuxtLink to="/" class="flex items-center gap-2 group" @click="handleHomeClick('/', $event); isSidebarOpen = false">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                </svg>
                <span class="text-lg font-black tracking-tight text-on-background">
                  <span class="text-primary">{{ logoParts.first }}</span>{{ logoParts.second }}
                </span>
            </NuxtLink>
            <button @click="isSidebarOpen = false" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
               <span class="material-symbols-outlined">close</span>
            </button>
       </div>

        <div class="flex-grow overflow-y-auto custom-scrollbar-premium pr-2">
            <!-- Mobile-only Action Buttons -->
            <div class="lg:hidden flex flex-col gap-4 mb-10 px-2">
                
                <div class="mt-2">
                    <template v-if="user">
                        <NuxtLink to="/dashboard" @click="isSidebarOpen = false" class="w-full bg-primary text-on-primary py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] text-center shadow-lg block">
                            DASHBOARD
                        </NuxtLink>
                    </template>
                    <NuxtLink v-else to="/login" @click="isSidebarOpen = false" class="w-full bg-primary text-on-primary py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] text-center shadow-lg block">
                        GET STARTED
                    </NuxtLink>
                </div>
            </div>

            <!-- Navigation items loop -->
            <div class="space-y-2">
                <div class="space-y-1">
                    <NuxtLink 
                        v-for="item in navigation" 
                        :key="item.path" 
                        :to="item.path"
                        @click="isSidebarOpen = false"
                        class="flex items-center gap-4 p-4 rounded-2xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all group"
                    >
                        <span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">{{ item.icon }}</span>
                        {{ item.label }}
                    </NuxtLink>
                </div>
            </div>
            <!-- Mobile Auth Actions (Logout Only) -->
            <div v-if="user" class="mt-12 px-2 pb-8 space-y-3">
                <button 
                    @click="handleLogout"
                    class="w-full h-14 bg-white/5 text-white/40 border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-error hover:text-white hover:border-error transition-all"
                >
                    <span class="material-symbols-outlined text-lg">logout</span>
                    Logout
                </button>
            </div>
        </div>
     </aside>

    <nav 
      :class="[
        isScrolled ? 'h-16 md:h-20' : 'h-20 md:h-24',
        isLanding ? 'landing-nav' : 'bg-background border-b border-outline'
      ]"
      class="fixed top-0 w-full z-50 transition-all duration-300 flex items-center px-0"
    >
      <div class="max-w-[1500px] mx-auto pl-4 pr-1.5 md:px-8 w-full flex justify-between items-center">
        <!-- Left Group -->
        <div class="flex items-center gap-2 md:gap-12 flex-1">
          <div class="flex items-center gap-1.5 md:gap-4 shrink-0">
            <NuxtLink to="/" class="flex items-center gap-2 group" @click="handleHomeClick('/', $event)">
              <span class="text-xl font-black tracking-tight landing-brand">
                Clickify <b>Mate</b>
              </span>
            </NuxtLink>
          </div>
          <div class="hidden lg:flex items-center space-x-8">
            <NuxtLink 
              v-for="item in navigation" 
              :key="item.path" 
              :to="item.path"
              @click="handleHomeClick(item.path, $event)"
              class="text-xs font-bold uppercase tracking-widest opacity-80 text-on-background hover:text-primary transition-colors flex items-center gap-2"
            >
              <span class="material-symbols-outlined  text-[18px] opacity-80">{{ item.icon }}</span>
              {{ item.label }}
            </NuxtLink>
          </div>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-3 md:space-x-4">
          <!-- Dark/Light Theme Toggle -->
          <ThemeToggle v-if="!isLanding" class="mr-1" />

          <!-- Mobile Navigation Actions -->
          <template v-if="!user">
            <NuxtLink 
              to="/login" 
              class="lg:hidden h-10 px-5 bg-primary text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Login
            </NuxtLink>
          </template>

          <!-- Mobile Menu Toggle (Logged In Only) -->
          <button 
            v-else
            @click="isSidebarOpen = true" 
            class="lg:hidden p-2.5 bg-white/5 border border-white/10 rounded-xl text-white active:scale-95 transition-all shadow-lg group"
          >
            <div class="w-5 h-4 flex flex-col justify-between items-end">
              <span class="w-full h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-3"></span>
              <span class="w-3.5 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-full"></span>
              <span class="w-5 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-2"></span>
            </div>
          </button>

          <template v-if="user">
            <NuxtLink to="/dashboard" class="hidden lg:flex items-center justify-center bg-[#2575FC] hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full h-10 px-6 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm whitespace-nowrap">
               Dashboard
            </NuxtLink>
          </template>
          <NuxtLink v-else to="/login" class="landing-nav-cta hidden lg:flex items-center justify-center text-white text-xs font-bold rounded-full h-11 px-6 transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap">
            Build your agent
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <main class="pt-20 md:pt-24 flex-grow relative z-10">
      <slot />
    </main>


    <AppFooter :settings="settings" />

    <!-- Cookie Consent Banner (GDPR / AdSense Requirement) -->
    <Transition name="cookie-slide">
      <div 
        v-if="showCookieBanner" 
        class="fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6"
      >
        <div class="max-w-5xl mx-auto bg-surface/80  border border-white/10 rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6">
          <span class="material-symbols-outlined text-3xl text-primary shrink-0">cookie</span>
          <div class="flex-grow text-center md:text-left">
            <p class="text-sm font-bold text-on-surface">We use cookies to improve your experience &amp; serve relevant ads.</p>
            <p class="text-xs text-on-surface-variant mt-1">
              By clicking "Accept", you agree to our 
              <NuxtLink to="/privacy" class="text-primary font-bold hover:underline">Privacy Policy</NuxtLink> and the use of cookies including Google AdSense. 
              <NuxtLink to="/terms" class="text-primary font-bold hover:underline">Terms of Service</NuxtLink>
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button @click="declineCookies" class="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-colors border border-outline-variant/20">
              Decline
            </button>
            <button @click="acceptCookies" class="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20">
              Accept All
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.cookie-slide-enter-active,
.cookie-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.cookie-slide-enter-from,
.cookie-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Premium Custom Scrollbar - Smooth & Sunlight Themed */
.custom-scrollbar-premium::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar-premium::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar-premium::-webkit-scrollbar-thumb {
  background: rgba(217, 119, 6, 0.2);
  border-radius: 10px;
}

.custom-scrollbar-premium::-webkit-scrollbar-thumb:hover {
  background: rgba(217, 119, 6, 0.4);
}

/* For Firefox */
.custom-scrollbar-premium {
  scrollbar-width: thin;
  scrollbar-color: rgba(217, 119, 6, 0.2) transparent;
}

.landing-nav {
  border-bottom: 1px solid rgba(23, 52, 74, 0.08);
  background: rgba(248, 251, 255, 0.78);
  box-shadow: 0 10px 40px rgba(50, 76, 110, 0.06);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
}

.landing-brand { color: #102639; }
.landing-brand b { color: #4167ed; font-weight: 900; }
.landing-nav-cta { background: #10263a; box-shadow: 0 10px 24px rgba(16, 38, 58, 0.18); }
.landing-nav-cta:hover { background: #193b55; box-shadow: 0 14px 30px rgba(16, 38, 58, 0.24); }

</style>
