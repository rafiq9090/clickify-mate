export default defineNuxtConfig({
  ssr: true,
  routeRules: {
    '/dashboard': { ssr: false },
    '/login': { ssr: false },
    '/admin/**': { ssr: false }
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Clickify Mate — AI-Powered Conversational Commerce & Social Selling Automation',
      meta: [
        { name: 'description', content: 'Automate price inquiries, order taking, and comments into customer checkouts. Clickify Mate integrates AI agents across Facebook, WhatsApp, and Telegram to grow your sales 24/7.' },
        { name: 'keywords', content: 'Conversational Commerce, Social Selling, Facebook Auto-Reply, Messenger AI Agent, WhatsApp Catalog Automation, Comment to DM, E-commerce Chatbots, Clickify Mate' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: 'Clickify Mate — Conversational Commerce & Social Selling AI' },
        { property: 'og:description', content: 'Connect your messaging channels, sync your catalogs, and let AI close sales 24/7.' },
        { property: 'og:type', content: 'website' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      ]
    },
    pageTransition: false,
    layoutTransition: false
  },

  modules: ['@nuxt/ui', '@nuxtjs/google-fonts'],

  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
      Manrope: [400, 600, 700, 800],
      'Noto+Sans+Bengali': [400, 700],
      Outfit: [300, 400, 600, 700],
      'Plus+Jakarta+Sans': [400, 500, 600, 700, 800],
      'Hanken+Grotesk': [300, 400, 500, 600, 700]
    },
    display: 'swap',
    download: true,
    base64: false,
    inject: true,
    overwriting: true
  },

  runtimeConfig: {
    groqApiKey: process.env.GROQ_API_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    adminUser: process.env.ADMIN_USER || 'admin',
    adminPass: process.env.ADMIN_PASS || 'admin123',
    public: {
      apiBase: '/api',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      verifyToken: process.env.VERIFY_TOKEN || 'clickify_secure_verify',
      showcaseMode: process.env.SHOWCASE_MODE === 'true',
      allowSignup: process.env.ALLOW_SIGNUP !== 'false'
    }
  },

  nitro: {
    experimental: {
      asyncContext: true
    }
  },

  vite: {
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        maxParallelFileOps: 5,
      }
    },
    optimizeDeps: {
      include: [
        'vuedraggable',
        'jspdf',
        'vue3-emoji-picker'
      ]
    },
    server: {
      allowedHosts: true
    }
  },

  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    viewTransition: false
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: ''
  }
})
