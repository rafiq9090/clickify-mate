<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ClickifyCicadaExperience from '~/components/ClickifyCicadaExperience.vue'
import ClickifyMobileExperience from '~/components/ClickifyMobileExperience.vue'

definePageMeta({
  layout: false,
})

const isMobile = ref(false)

const checkDevice = () => {
  if (typeof window !== 'undefined') {
    const isPortrait = window.innerHeight > window.innerWidth
    isMobile.value = window.innerWidth <= 1024 || (isPortrait && window.innerWidth <= 1280)
  }
}

onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkDevice)
  }
})

useHead({
  title: 'Clickify Mate — Autonomous Social Commerce & Conversational AI Infrastructure',
  htmlAttrs: {
    lang: 'en',
    class: 'cicada-page'
  },
  meta: [
    { name: 'description', content: 'Turn customer DMs and comments into automated checkouts. Clickify Mate deploys autonomous AI swarms across WhatsApp, Instagram, and Facebook with real-time catalog sync.' },
    { name: 'keywords', content: 'Conversational Commerce, Social Selling, WhatsApp Business API, Instagram DM Automation, Facebook Auto-Reply, E-Commerce AI Agent, Multi-Agent Swarm, Clickify Mate' },
    { name: 'author', content: 'Clickify Mate Inc.' },
    { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    { name: 'theme-color', content: '#341F37' },
    // Open Graph
    { property: 'og:title', content: 'Clickify Mate — Autonomous Social Commerce & Conversational AI' },
    { property: 'og:description', content: 'Deploy intelligent AI agents across WhatsApp, Instagram, and Facebook. Sync your real-time catalog and capture every checkout 24/7.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://clickifymate.com/' },
    { property: 'og:site_name', content: 'Clickify Mate' },
    { property: 'og:locale', content: 'en_US' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@clickifymate' },
    { name: 'twitter:title', content: 'Clickify Mate — Autonomous Social Commerce AI' },
    { name: 'twitter:description', content: 'Turn customer DMs and comments into automated checkouts across WhatsApp, Instagram, and Facebook.' },
  ],
  link: [
    { rel: 'canonical', href: 'https://clickifymate.com/' }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://clickifymate.com/#organization',
            'name': 'Clickify Mate',
            'url': 'https://clickifymate.com',
            'logo': 'https://clickifymate.com/logo.png',
            'sameAs': [
              'https://twitter.com/clickifymate',
              'https://linkedin.com/company/clickifymate'
            ]
          },
          {
            '@type': 'WebSite',
            '@id': 'https://clickifymate.com/#website',
            'url': 'https://clickifymate.com',
            'name': 'Clickify Mate',
            'publisher': { '@id': 'https://clickifymate.com/#organization' }
          },
          {
            '@type': 'SoftwareApplication',
            'name': 'Clickify Mate Platform',
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Cloud, Web, Meta APIs',
            'description': 'Autonomous multi-agent conversational commerce and social selling automation platform for WhatsApp, Instagram, and Facebook.',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD'
            }
          },
          {
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'How does Clickify Mate automate DM sales on WhatsApp and Instagram?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Clickify Mate listens to incoming DMs and post comments via official Meta Graph APIs. Autonomous AI swarms analyze buyer intent, query real-time product stock, answer inquiries, and generate instant 1-click checkout links or automated COD confirmation.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Does Clickify Mate sync with my Shopify or WooCommerce catalog?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Yes. Clickify Mate automatically ingests your entire product catalog, inventory variants, promotional discounts, and return policies using semantic vector embeddings for real-time accuracy.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Is Clickify Mate compliant with Meta\'s official API terms?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': '100%. Clickify Mate routes all WhatsApp Business and Instagram Direct messages through official Meta Cloud API channels with certified BSP tier routing, ensuring zero account bans or template delivery issues.'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})
</script>

<template>
  <div class="landing-root">
    <!-- Desktop Experience (> 768px) -->
    <div v-if="!isMobile" class="desktop-view">
      <ClickifyCicadaExperience />
    </div>

    <!-- Native Mobile Experience (<= 768px) -->
    <div v-else class="mobile-view">
      <ClickifyMobileExperience />
    </div>
  </div>
</template>

<style>
html.cicada-page {
  font-size: calc(10000vw / 1920);
}

@media (min-width: 1025px) and (min-aspect-ratio: 1440 / 1080) {
  html.cicada-page {
    font-size: calc(10000vh / 1080);
  }
}

@media (max-width: 1024px), (max-width: 1280px) and (orientation: portrait) {
  html, body, html.cicada-page {
    font-size: 16px !important;
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
  }
}

html, body, html.cicada-page {
  margin: 0;
  padding: 0;
  background-color: #E0D8EB;
  color: #341F37;
  overflow-x: hidden;
  box-sizing: border-box;
}

.landing-root {
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

@media (max-width: 1024px), (max-width: 1280px) and (orientation: portrait) {
  .desktop-view {
    display: none !important;
  }
  .mobile-view {
    display: block !important;
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
  }
}

@media (min-width: 1025px) and (orientation: landscape) {
  .desktop-view {
    display: block !important;
  }
  .mobile-view {
    display: none !important;
  }
}
</style>
