<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useCicadaAnimation } from '~/composables/useCicadaAnimation'
import CicadaNavbar from './cicada/CicadaNavbar.vue'
import CicadaHeroSection from './cicada/CicadaHeroSection.vue'
import CicadaWingsSvg from './cicada/CicadaWingsSvg.vue'
import CicadaResearchTree from './cicada/CicadaResearchTree.vue'
import CicadaDrawerMenu from './cicada/CicadaDrawerMenu.vue'
import CicadaMetricsSection from './cicada/CicadaMetricsSection.vue'
import CicadaWorkflowSection from './cicada/CicadaWorkflowSection.vue'
import CicadaIntegrationsSection from './cicada/CicadaIntegrationsSection.vue'
import CicadaFaqSection from './cicada/CicadaFaqSection.vue'
import CicadaFooter from './cicada/CicadaFooter.vue'

const isMenuOpen = ref(false)
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
const closeMenu = () => {
  isMenuOpen.value = false
}

const scrollToProgress = (targetProgress: number) => {
  if (typeof window === 'undefined') return
  const scrollMax = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({
    top: scrollMax * targetProgress,
    behavior: 'smooth'
  })
}

const { initAnimation, cleanupAnimation } = useCicadaAnimation()
let resizeHandler: any = null
let deckCtx: any = null

onMounted(async () => {
  if (!import.meta.client) return
  document.documentElement.classList.add('cicada-active')

  function setRem() {
    let ww = window.innerWidth
    let vh = window.innerHeight
    if (ww <= 768) {
      document.documentElement.style.fontSize = (ww / 400) * 100 + 'px'
    } else if (ww / vh < 1440 / 1080) {
      document.documentElement.style.fontSize = (ww / 1920) * 100 + 'px'
    } else {
      document.documentElement.style.fontSize = (vh / 1080) * 100 + 'px'
    }
  }

  resizeHandler = setRem
  setRem()
  window.addEventListener('resize', resizeHandler)

  await nextTick()
  await initAnimation()

  try {
    const gsapModule = await import('gsap')
    const gsap = gsapModule.default || gsapModule.gsap
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    gsap.registerPlugin(ScrollTrigger)

    deckCtx = gsap.context(() => {
      // Set initial positions: cards 2, 3, 4 are below the viewport
      gsap.set('.deck-card-2, .deck-card-3, .deck-card-4', { yPercent: 100 })

      const tlDeck = gsap.timeline({
        scrollTrigger: {
          trigger: '#deck-pinned-wrapper',
          start: 'top 12%',
          end: '+=3000',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        }
      })

      tlDeck
        .to('.deck-card-2', { yPercent: 0, duration: 1, ease: 'none' })
        .to('.deck-card-3', { yPercent: 0, duration: 1, ease: 'none' })
        .to('.deck-card-4', { yPercent: 0, duration: 1, ease: 'none' })
    })
  } catch (e) {
    console.warn('Deck ScrollTrigger init error:', e)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.documentElement.classList.remove('cicada-active')
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
    document.documentElement.style.fontSize = ''
  }
  if (deckCtx) deckCtx.revert()
  cleanupAnimation()
})
</script>

<template>
  <div class="cicada-root-container">
    <CicadaNavbar @scroll="scrollToProgress" @toggle-menu="toggleMenu" />
    <CicadaDrawerMenu :is-open="isMenuOpen" @close="closeMenu" />
    
    <main id="main" data-page-id="home">
      <CicadaHeroSection />
      <CicadaWingsSvg />
      <CicadaResearchTree />
    </main>

    <!-- GSAP Pinned Overlapping Stack Deck -->
    <div id="deck-pinned-wrapper" class="deck-pin-container">
      <div class="deck-cards-viewport">
        <div class="deck-card deck-card-1">
          <CicadaMetricsSection />
        </div>
        <div class="deck-card deck-card-2">
          <CicadaWorkflowSection />
        </div>
        <div class="deck-card deck-card-3">
          <CicadaIntegrationsSection />
        </div>
        <div class="deck-card deck-card-4">
          <CicadaFaqSection />
        </div>
      </div>
    </div>

    <!-- Unified Footer -->
    <CicadaFooter @scroll-top="scrollToProgress(0)" />
  </div>
</template>

<style scoped>
.deck-pin-container {
  position: relative;
  z-index: 10;
  width: 100%;
  padding: 0.4rem 0.4rem;
  background: #FAF8FC;
  display: flex;
  justify-content: center;
  align-items: center;
}

.deck-cards-viewport {
  position: relative;
  width: 100%;
  max-width: 13.8rem;
  height: 82vh;
  min-height: 82vh;
  margin: 0 auto;
  border-radius: 0.32rem;
  overflow: hidden;
  box-shadow: 0 28px 70px -15px rgba(52, 31, 55, 0.15),
              0 12px 30px -5px rgba(84, 51, 89, 0.08);
}

.deck-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 0.32rem;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  will-change: transform;
}

.deck-card-1 {
  z-index: 1;
}

.deck-card-2 {
  z-index: 2;
  box-shadow: 0 -20px 50px rgba(52, 31, 55, 0.16);
}

.deck-card-3 {
  z-index: 3;
  box-shadow: 0 -20px 50px rgba(52, 31, 55, 0.16);
}

.deck-card-4 {
  z-index: 4;
  box-shadow: 0 -20px 50px rgba(52, 31, 55, 0.16);
}

@media (max-width: 768px) {
  .deck-pin-container {
    padding: 0.15rem 0.12rem;
  }
  .deck-cards-viewport {
    max-width: 100%;
    height: 86vh;
    min-height: 86vh;
    border-radius: 0.22rem;
  }
  .deck-card {
    border-radius: 0.22rem;
  }
}
</style>
