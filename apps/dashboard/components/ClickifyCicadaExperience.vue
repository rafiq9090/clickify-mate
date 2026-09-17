<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import CicadaNavbar from './cicada/CicadaNavbar.vue'
import AgentSwarmHero from './cicada/AgentSwarmHero.vue'
import CicadaHomeContent from './cicada/CicadaHomeContent.vue'
import CicadaDrawerMenu from './cicada/CicadaDrawerMenu.vue'
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

let resizeHandler: any = null

onMounted(async () => {
  if (!import.meta.client) return
  document.documentElement.classList.add('cicada-active')

  function setRem() {
    let ww = window.innerWidth
    let vh = window.innerHeight
    if (ww <= 1024) {
      document.documentElement.style.fontSize = '16px'
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

  try {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    const refreshST = () => {
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
    }
    setTimeout(refreshST, 250)
    setTimeout(refreshST, 750)
  } catch (e) {
    // ignore
  }
})

const handleHeroReady = async () => {
  if (typeof window === 'undefined') return
  try {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
  } catch (e) {
    // ignore
  }
}

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.documentElement.classList.remove('cicada-active')
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
    document.documentElement.style.fontSize = ''
  }
})
</script>

<template>
  <div class="cicada-root-container">
    <CicadaNavbar @scroll="scrollToProgress" @toggle-menu="toggleMenu" />
    <CicadaDrawerMenu :is-open="isMenuOpen" @close="closeMenu" />
    
    <main id="main" data-page-id="home">
      <AgentSwarmHero @hero-ready="handleHeroReady" />
    </main>

    <!-- Complete Home Content Sections -->
    <CicadaHomeContent />

    <!-- Unified Footer -->
    <CicadaFooter @scroll-top="scrollToProgress(0)" />
  </div>
</template>

<style scoped>
/* Page container transitions */
.cicada-root-container {
  overflow-x: hidden;
}
</style>
