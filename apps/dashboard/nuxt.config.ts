export default defineNuxtConfig({
  ssr: true,
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  css: ['~/assets/css/main.css', '~/assets/css/cicada-experience.css'],

  app: {
    head: {
      title: 'Clickify Mate — AI-Powered Conversational Commerce & Social Selling Automation',
      meta: [
        { name: 'description', content: 'Automate price inquiries, order taking, and comments into customer checkouts. Clickify Mate integrates AI agents across Facebook, WhatsApp, Telegram, and Instagram to grow your sales 24/7.' },
        { name: 'keywords', content: 'Conversational Commerce, Social Selling, Facebook Auto-Reply, Messenger AI Agent, Instagram AI Agent, WhatsApp Catalog Automation, Comment to DM, E-commerce Chatbots, Clickify Mate' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: 'Clickify Mate — Conversational Commerce & Social Selling AI' },
        { property: 'og:description', content: 'Connect your messaging channels, sync your catalogs, and let AI close sales 24/7.' },
        { property: 'og:type', content: 'website' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'canonical', href: process.env.PUBLIC_SITE_URL || 'https://clickifymate.com' },
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
      'Hanken+Grotesk': [300, 400, 500, 600, 700],
      'Work+Sans': [400, 500, 600, 700, 800]
    },
    display: 'swap',
    download: false,
    base64: false,
    inject: true,
    overwriting: true
  },

  runtimeConfig: {
    groqApiKey: process.env.GROQ_API_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    adminUser: process.env.ADMIN_USER,
    adminPass: process.env.ADMIN_PASS,
    public: {
      apiBase: '/api',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      verifyToken: process.env.VERIFY_TOKEN || '',
      showcaseMode: process.env.SHOWCASE_MODE === 'true',
      allowSignup: process.env.ALLOW_SIGNUP === 'true',
      googleOAuthEnabled: process.env.GOOGLE_OAUTH_ENABLED === 'true'
    }
  },

  nitro: {
    routeRules: {
      '/dashboard/**': { ssr: false },
      '/admin/**': { ssr: false },
      '/**': {
        headers: {
          'content-security-policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; font-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://docs.opencv.org; worker-src 'self' blob:; connect-src 'self' data: blob: ws: wss: https: https://api.telegram.org https://graph.facebook.com https://api.openai.com https://api.groq.com https://integrate.api.nvidia.com",
          'referrer-policy': 'strict-origin-when-cross-origin',
          'permissions-policy': 'camera=(), microphone=(self), geolocation=()',
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'DENY',
          'strict-transport-security': 'max-age=31536000; includeSubDomains'
        }
      }
    },
    externals: {
      // MongoDB uses Node runtime adapters with CommonJS fallbacks. Keep the
      // package external so the generated ESM server loads its native package.
      external: ['mongodb']
    },
    rollupConfig: {
      external: ['mongodb']
    },
    experimental: {
      asyncContext: true
    }
  },

  vite: {
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {}
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
