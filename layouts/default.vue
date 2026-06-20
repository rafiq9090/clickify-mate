<script setup>
const isScrolled = ref(false)
const isSidebarOpen = ref(false)
const hideAllAds = useCookie('toolkit_hide_all_ads')
const { locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const handleHomeClick = (path, event) => {
  const resolvedPath = localePath(path)
  if (route.path === resolvedPath || (path === '/' && route.path === '/')) {
    if (process.client) {
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
const i18nHead = useLocaleHead({
  addDirAttribute: true,
  identifierAttribute: 'id',
  addSeoAttributes: true
})

// Brand Logo Typing Animation State
const runtimeConfig = useRuntimeConfig()
const isShowcaseMode = computed(() => runtimeConfig.public.showcaseMode === true || runtimeConfig.public.showcaseMode === 'true')

const displayName = ref('Clickify Mate')
const isTyping = ref(false)

const midpoint = computed(() => {
  const name = 'Clickify Mate'
  return Math.ceil(name.length / 2)
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
  if (globalData.value?.success && globalData.value.navigation?.length) {
    return globalData.value.navigation
  }
  return [
    { label: 'Home', path: '/', icon: 'home' }
  ]
})

const settings = computed(() => {
  if (globalData.value?.success && globalData.value.settings) {
    return globalData.value.settings
  }
  return { site_name: 'PaperSnapPro', adsense_pub_id: '', adsense_code: '' }
})

let prevSiteName = 'PaperSnapPro'
watch([() => settings.value.site_name, isShowcaseMode], ([newName, newShowcase]) => {
  if (process.client) {
    startTypingAnimation()
  }
})


// Handle Dynamic Head Injection
useHead(() => ({
  titleTemplate: (titleChunk) => {
    if (titleChunk && (titleChunk.includes(settings.value.site_name) || titleChunk.includes('PaperSnapPro'))) {
      return titleChunk
    }
    return titleChunk ? `${titleChunk} - ${settings.value.site_name}` : settings.value.site_name
  },
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs.lang,
    dir: i18nHead.value.htmlAttrs.dir
  },
  link: [
    ...(i18nHead.value.link || []),
  ],
  meta: [
    ...(i18nHead.value.meta || []),
    { property: 'og:image', content: 'https://papersnappro.com/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:type', content: 'image/png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: 'https://papersnappro.com/og-image.png' },
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

const isLanguageOpen = ref(false)
const languageDropdownRef = ref(null)
let langTimer = null

const openLanguage = () => {
  if (langTimer) clearTimeout(langTimer)
  isLanguageOpen.value = true
}

const closeLanguage = () => {
  langTimer = setTimeout(() => {
    isLanguageOpen.value = false
  }, 300)
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

// Tools Mega Menu with Delay
const isToolsOpen = ref(false)
const toolsDropdownRef = ref(null)
let toolsTimer = null

const openTools = () => {
  if (toolsTimer) clearTimeout(toolsTimer)
  isToolsOpen.value = true
}

const closeTools = () => {
  toolsTimer = setTimeout(() => {
    isToolsOpen.value = false
  }, 300)
}


const toolCategories = [
  {
    name: 'Creative Suite',
    icon: 'auto_fix_high',
    color: 'text-primary',
    tools: [
      { label: 'Sales Copywriter', path: '/tools/product-description', icon: 'edit_note' },
      { label: 'Viral Hook Gen', path: '/tools/tiktok-hook', icon: 'bolt' },
      { label: 'AI PDF Scanner', path: '/tools/camera-to-pdf', icon: 'document_scanner' },
      { label: 'AI Note Scanner', path: '/tools/advanced-ocr', icon: 'document_scanner' },
      { label: 'Line Breaker', path: '/tools/line-breaker', icon: 'format_line_spacing' },
    ]
  },
  {
    name: 'Web & QR',
    icon: 'construction',
    color: 'text-primary',
    tools: [
      { label: 'WhatsApp Link', path: '/tools/whatsapp-link', icon: 'link' },
      { label: 'QR Machine', path: '/tools/qr-code', icon: 'qr_code' },
      { label: 'AI Auto-Reply', path: '/tools/ai-reply', icon: 'smart_toy' },
      { label: 'Comment Reply', path: '/tools/comment-reply', icon: 'chat_bubble' },
    ]
  },
  {
    name: 'Text & SEO',
    icon: 'text_snippet',
    color: 'text-primary',
    tools: [
      { label: 'Word Counter', path: '/tools/word-counter', icon: '123' },
      { label: 'Case Converter', path: '/tools/case-converter', icon: 'text_fields' },
      { label: 'Fancy Fonts', path: '/tools/fancy-fonts', icon: 'brush' },
      { label: 'Diff Checker', path: '/tools/diff-checker', icon: 'difference' },
    ]
  },
  {
    name: 'Utilities',
    icon: 'rocket_launch',
    color: 'text-primary',
    tools: [
      { label: 'Focus Timer', path: '/tools/pomodoro', icon: 'timer' },
      { label: 'KeyForge Pass', path: '/tools/password-generator', icon: 'key' },
      { label: 'UTM Builder', path: '/tools/utm-builder', icon: 'ads_click' },
      { label: 'Randomizer', path: '/tools/randomizer', icon: 'celebration' },
    ]
  }
]

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
    
    const handleClickOutside = (e) => {
      if (languageDropdownRef.value && !languageDropdownRef.value.contains(e.target)) {
        isLanguageOpen.value = false
      }
      if (toolsDropdownRef.value && !toolsDropdownRef.value.contains(e.target)) {
        isToolsOpen.value = false
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('scroll', handleScroll)
  }
})

import { useWindowSize } from '@vueuse/core'

const { height } = useWindowSize()

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

const isSidebarLanguageOpen = ref(false)
const openSections = ref({
    professional: false,
    creative: false,
    web: false,
    text: false,
    utilities: false
})

const toggleSection = (section) => {
    openSections.value[section] = !openSections.value[section]
}

const handleLogout = async () => {
    await supabase.auth.signOut()
    isSidebarOpen.value = false
    navigateTo('/login')
}

const handleUpgrade = () => {
    alert('Pro features coming soon!')
    isSidebarOpen.value = false
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
            <NuxtLink :to="localePath('/')" class="flex items-center gap-3 group" @click="handleHomeClick('/', $event); isSidebarOpen = false">
                <div class="w-12 h-12 bg-gradient-to-br from-primary to-primary/90 text-white rounded-[0.9rem] md:rounded-[1.2rem] flex items-center justify-center font-black text-3xl font-leckerli-one shadow-lg shadow-primary/20 shrink-0 pt-1 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-[0_0_25px_rgba(0,91,179,0.6)]">{{ settings?.site_name?.charAt(0) || 'P' }}</div>
               <span class="text-xl font-black tracking-tighter transition-all duration-300 group-hover:text-primary flex items-center">
                 <span>{{ displayName.slice(0, midpoint) }}</span>
                 <span class="text-primary italic group-hover:text-secondary-container transition-colors duration-300">{{ displayName.slice(midpoint) }}</span>
                 <span class="w-[2px] h-4 bg-primary ml-0.5 animate-pulse shrink-0" v-if="isTyping"></span>
               </span>
            </NuxtLink>
            <button @click="isSidebarOpen = false" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
               <span class="material-symbols-outlined">close</span>
            </button>
       </div>

        <div class="flex-grow overflow-y-auto custom-scrollbar-premium pr-2">
            <!-- Mobile-only Action Buttons -->
            <div class="lg:hidden flex flex-col gap-4 mb-10 px-2">
                <button 
                    @click="isSidebarLanguageOpen = !isSidebarLanguageOpen"
                    class="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.15em] text-on-surface hover:text-primary transition-colors mb-2 w-full"
                >
                    Localization
                    <span class="material-symbols-outlined text-xs transition-transform duration-300" :class="{ 'rotate-180': isSidebarLanguageOpen }">expand_more</span>
                </button>
                
                <Transition
                    enter-active-class="transition-all duration-300 ease-out"
                    enter-from-class="max-h-0 opacity-0 overflow-hidden"
                    enter-to-class="max-h-[300px] opacity-100 overflow-hidden"
                    leave-active-class="transition-all duration-300 ease-in"
                    leave-from-class="max-h-[300px] opacity-100 overflow-hidden"
                    leave-to-class="max-h-0 opacity-0 overflow-hidden"
                >
                    <div v-if="isSidebarLanguageOpen" class="grid grid-cols-3 gap-2">
                        <button 
                        v-for="loc in locales" 
                        :key="loc.code"
                        @click="setLocale(loc.code)"
                        :class="[locale === loc.code ? 'bg-primary text-white border-primary' : 'bg-white/5 text-on-surface-variant hover:text-white border-white/5']"
                        class="py-3 rounded-xl text-[11px] font-bold uppercase transition-all border"
                        >
                        {{ loc.name }}
                        </button>
                    </div>
                </Transition>
                
                <div class="mt-2">
                    <template v-if="user">
                        <NuxtLink :to="localePath('/dashboard')" @click="isSidebarOpen = false" class="w-full bg-primary text-on-primary py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] text-center shadow-lg block">
                            DASHBOARD
                        </NuxtLink>
                    </template>
                    <NuxtLink v-else :to="localePath('/login')" @click="isSidebarOpen = false" class="w-full bg-primary text-on-primary py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] text-center shadow-lg block">
                        {{ $t('navbar.format').toUpperCase() }}
                    </NuxtLink>
                </div>
            </div>



            <!-- Navigation items loop -->
            <div class="space-y-2">
                <!-- Professional Menu Section -->
                <div>
                    <button 
                        @click="toggleSection('professional')"
                        class="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.15em] text-on-surface hover:text-primary transition-colors px-5 mb-2 w-full group/header"
                    >
                        Professional Menu
                        <span class="material-symbols-outlined text-xs transition-transform duration-300" :class="{ 'rotate-180': openSections.professional }">expand_more</span>
                    </button>
                    
                    <Transition
                        enter-active-class="transition-all duration-300 ease-out"
                        enter-from-class="max-h-0 opacity-0 overflow-hidden"
                        enter-to-class="max-h-[500px] opacity-100 overflow-hidden"
                        leave-active-class="transition-all duration-300 ease-in"
                        leave-from-class="max-h-[500px] opacity-100 overflow-hidden"
                        leave-to-class="max-h-0 opacity-0 overflow-hidden"
                    >
                        <div v-if="openSections.professional" class="space-y-1">
                            <NuxtLink 
                                v-for="item in navigation" 
                                :key="item.path" 
                                :to="localePath(item.path)"
                                @click="isSidebarOpen = false"
                                class="flex items-center gap-4 p-4 rounded-2xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all group"
                            >
                                <span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">{{ item.icon }}</span>
                                {{ item.label }}
                            </NuxtLink>
                        </div>
                    </Transition>
                </div>

                <!-- Tool Categories Sections -->
                <div v-if="!isShowcaseMode" v-for="category in toolCategories" :key="category.name" class="pt-2">
                    <button 
                        @click="toggleSection(category.name.toLowerCase().split(' ')[0])"
                        class="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-on-surface hover:text-primary transition-colors px-5 mb-2 w-full group/header"
                    >
                        {{ category.name }}
                        <span class="material-symbols-outlined text-xs transition-transform duration-300" :class="{ 'rotate-180': openSections[category.name.toLowerCase().split(' ')[0]] }">expand_more</span>
                    </button>
                    
                    <Transition
                        enter-active-class="transition-all duration-300 ease-out"
                        enter-from-class="max-h-0 opacity-0 overflow-hidden"
                        enter-to-class="max-h-[500px] opacity-100 overflow-hidden"
                        leave-active-class="transition-all duration-300 ease-in"
                        leave-from-class="max-h-[500px] opacity-100 overflow-hidden"
                        leave-to-class="max-h-0 opacity-0 overflow-hidden"
                    >
                        <div v-if="openSections[category.name.toLowerCase().split(' ')[0]]" class="grid grid-cols-1 gap-1">
                            <NuxtLink 
                                v-for="tool in category.tools" 
                                :key="tool.path" 
                                :to="localePath(tool.path)"
                                @click="isSidebarOpen = false" 
                                class="flex items-center gap-4 p-4 rounded-2xl text-on-surface-variant font-bold text-xs uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all group"
                            >
                                <span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">{{ tool.icon }}</span>
                                <span class="flex-grow">{{ tool.label }}</span>
                            </NuxtLink>
                        </div>
                    </Transition>
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

    <!-- Global Header Ad Placement -->
    <AdContainer placementId="header" />

    <nav 
      :class="[isScrolled ? 'h-16 md:h-20 bg-background border-b border-outline' : 'h-20 md:h-24 bg-background shadow-lg border-b border-outline']"
      class="fixed top-0 w-full z-50 transition-all duration-300 flex items-center px-0"
    >
      <div class="max-w-7xl mx-auto pl-4 pr-1.5 md:px-6 w-full flex justify-between items-center">
        <!-- Left Group -->
        <div class="flex items-center gap-2 md:gap-12 flex-1">
          <div class="flex items-center gap-1.5 md:gap-4 shrink-0">
            <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5 md:gap-4 group" @click="handleHomeClick('/', $event)">
              <div class="logo w-10 h-10 md:w-14 md:h-14 bg-linear-to-br from-primary to-primary/90 text-white rounded-[0.9rem] md:rounded-[1.2rem] flex items-center justify-center font-black text-2xl md:text-5xl font-leckerli-one shadow-xl shadow-primary/20 shrink-0 pt-1 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-[0_0_25px_rgba(0,91,179,0.6)]">
                {{ settings.site_name?.charAt(0) || 'P' }}
              </div>
              <div class="relative h-8 md:h-10 flex items-center text-xl md:text-3xl font-black tracking-[-0.05em] select-none shrink-0 overflow-visible">
                <!-- Spacer to reserve width -->
                <span class="opacity-0 pointer-events-none">Clickify Mate</span>
                
                <!-- Top Split Half (slightly extended below 50% to prevent subpixel line gap) -->
                <span class="absolute inset-0 text-white flex items-center transition-transform duration-500 [clip-path:polygon(0_0,120%_0,120%_51%,0_51%)] group-hover:-translate-y-2 md:group-hover:-translate-y-3">
                  <span>{{ displayName.slice(0, midpoint) }}</span>
                  <span class="text-primary italic">{{ displayName.slice(midpoint) }}</span>
                  <span class="w-[2px] h-5 bg-primary ml-0.5 animate-pulse shrink-0" v-if="isTyping"></span>
                </span>
                
                <!-- Bottom Split Half (slightly extended above 50% to prevent subpixel line gap) -->
                <span class="absolute inset-0 text-white flex items-center transition-transform duration-500 [clip-path:polygon(0_49%,120%_49%,120%_100%,0_100%)] group-hover:translate-y-2 md:group-hover:translate-y-3">
                  <span>{{ displayName.slice(0, midpoint) }}</span>
                  <span class="text-primary italic">{{ displayName.slice(midpoint) }}</span>
                  <span class="w-[2px] h-5 bg-primary ml-0.5 animate-pulse shrink-0" v-if="isTyping"></span>
                </span>
                
                <!-- Center reveal text -->
                <span class="absolute left-0 right-0 top-1/2 -translate-y-1/2 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center bg-primary text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] py-0.5 text-center select-none rounded-[0.25rem] shadow-sm z-10 whitespace-nowrap">
                  AI Tools
                </span>
              </div>
            </NuxtLink>
          </div>
          
          <div class="hidden lg:flex items-center space-x-8">
            <NuxtLink 
              v-for="item in navigation" 
              :key="item.path" 
              :to="localePath(item.path)"
              @click="handleHomeClick(item.path, $event)"
              class="text-xs font-bold uppercase tracking-widest opacity-80 text-white hover:text-primary transition-colors flex items-center gap-2"
            >
              <span class="material-symbols-outlined  text-[18px] opacity-80">{{ item.icon }}</span>
              {{ item.label }}
            </NuxtLink>

            <!-- Tools Dropdown (Mega Menu) -->
            <div v-if="!isShowcaseMode" class="relative group/tools" ref="toolsDropdownRef" @mouseleave="closeTools">
                <button 
                    @mouseenter="openTools"
                    @click="isToolsOpen = !isToolsOpen"
                    class="text-xs font-bold uppercase tracking-widest opacity-80 text-white hover:text-primary transition-colors flex items-center gap-1.5"
                    :class="{ 'text-primary': isToolsOpen }"
                >
                    <span class="material-symbols-outlined text-[18px] opacity-80">apps</span>
                    Tools
                    <span class="material-symbols-outlined text-[14px] transition-transform duration-300" :class="{ 'rotate-180': isToolsOpen }">expand_more</span>
                </button>

                <!-- Mega Dropdown -->
                <div 
                    v-if="isToolsOpen"
                    @mouseenter="openTools"
                    class="absolute top-full right-0 w-[600px] pt-4 z-[100]"
                >
                    <div class="bg-surface/95 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/10 p-8 animate-in fade-in zoom-in-95 duration-200 grid grid-cols-2 gap-8 text-left max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar-premium">

                        <div v-for="category in toolCategories" :key="category.name" class="space-y-4">
                            <div class="flex items-center gap-2.5">
                                <span class="material-symbols-outlined text-lg font-black" :class="category.color">{{ category.icon }}</span>
                                <h4 class="text-xs uppercase tracking-widest font-bold text-white/50">{{ category.name }}</h4>
                            </div>
                            <div class="grid grid-cols-1 gap-1 text-left">
                                <NuxtLink 
                                    v-for="tool in category.tools" 
                                    :key="tool.path" 
                                    :to="localePath(tool.path)"
                                    @click="isToolsOpen = false" 
                                    class="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-all group/item text-left justify-start"
                                >
                                    <span class="material-symbols-outlined text-[20px] text-white opacity-80 group-hover/item:text-primary group-hover/item:scale-110 transition-all font-light">{{ tool.icon }}</span>
                                    <span class="text-xs font-bold text-white opacity-80 group-hover/item:text-primary transition-colors">{{ tool.label }}</span>
                                </NuxtLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-3 md:space-x-4">
          <!-- Mobile Navigation Actions -->
          <template v-if="!user">
            <NuxtLink 
              :to="localePath('/login')" 
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

          <div class="relative hidden lg:block" ref="languageDropdownRef" @mouseleave="closeLanguage">
            <button 
              @mouseenter="openLanguage"
              @click="isLanguageOpen = !isLanguageOpen"
              class="text-xs font-bold uppercase tracking-widest text-white opacity-80 flex items-center gap-1.5 hover:text-primary transition-colors bg-surface-container-low px-3 md:px-4 py-2 md:py-2.5 h-9 md:h-11 rounded-xl border border-white/15 shadow-sm"
            >
              <span class="hidden sm:inline">{{ locales.find(l => l.code === locale)?.name || 'Language' }}</span>
              <span class="sm:hidden">{{ locale.toUpperCase() }}</span>
              <span class="material-symbols-outlined text-[14px] md:text-xs" :class="{ 'rotate-180': isLanguageOpen }">expand_more</span>
            </button>
            
            <div 
              v-if="isLanguageOpen"
              @mouseenter="openLanguage"
              class="absolute top-full right-0 w-40 pt-3 z-[100]"
            >
              <div class="bg-surface/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 p-2 animate-in fade-in zoom-in-95 duration-200">
                <button 
                  v-for="loc in locales"
                  :key="loc.code"
                  @click="setLocale(loc.code); isLanguageOpen = false"
                  class="w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 flex items-center justify-between"
                  :class="{ 'text-primary bg-primary/5': locale === loc.code }"
                >
                  {{ loc.name }} <span v-if="locale === loc.code" class="material-symbols-outlined text-sm">check</span>
                </button>
              </div>
            </div>
          </div>

          <template v-if="user">
            <NuxtLink :to="localePath('/dashboard')" class="hidden lg:flex bg-primary text-on-primary px-4 md:px-5 h-9 md:h-11 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/20 items-center justify-center whitespace-nowrap">
               Dashboard
            </NuxtLink>
          </template>
          <NuxtLink v-else :to="localePath('/login')" class="hidden lg:flex bg-primary text-on-primary px-4 md:px-5 h-9 md:h-11 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/20 items-center justify-center whitespace-nowrap">
            {{ $t('navbar.format') }}
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
              <NuxtLink :to="localePath('/privacy')" class="text-primary font-bold hover:underline">Privacy Policy</NuxtLink> and the use of cookies including Google AdSense. 
              <NuxtLink :to="localePath('/terms')" class="text-primary font-bold hover:underline">Terms of Service</NuxtLink>
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

</style>
