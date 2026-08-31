<template>
  <header id="header" class="header" :class="{ 'is-scrolled': isScrolled }">
    <div class="header-wrapp">
      <!-- Logo (Standalone at top, smoothly docks inside pill on scroll) -->
      <div class="header-left">
        <NuxtLink to="/" class="header-logo-brand">
          Clickify Mate<span>.</span>
        </NuxtLink>
      </div>

      <!-- Center Liquid Glass Navigation Menu -->
      <nav 
        ref="navMenuRef" 
        class="liquid-glass-menu" 
        aria-label="Main Navigation"
        @mouseleave="handleMouseLeave"
      >
        <!-- Floating Liquid Glass Lens Pill -->
        <div 
          v-if="isReady" 
          class="liquid-glass-indicator"
          :style="indicatorStyle"
        >
          <!-- Top Specular Gloss Reflection -->
          <div class="indicator-top-gloss"></div>
        </div>

        <!-- Menu Navigation Items -->
        <NuxtLink 
          v-for="(item, index) in menuItems"
          :key="item.path"
          :ref="el => setItemRef(el, index)"
          :to="item.path" 
          class="liquid-menu-item"
          :class="{
            'is-active': activeIndex === index,
            'is-hovered': hoverIndex === index
          }"
          @mouseenter="handleMouseEnter(index)"
        >
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Right Action Buttons (Get Started CTA) -->
      <div class="header-right">
        <NuxtLink to="/dashboard" class="liquid-cta-btn">
          <span>Get Started</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </NuxtLink>

        <!-- Mobile Hamburger Trigger -->
        <button type="button" class="header-mobile-toggle" aria-label="Open Mobile Menu" @click="emit('toggleMenu')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

const emit = defineEmits<{
  (e: 'scroll', progress: number): void
  (e: 'toggleMenu'): void
}>()

const route = useRoute()

const menuItems = [
  { label: 'Product & Features', path: '/features' },
  { label: 'Solutions & Use Cases', path: '/solutions' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact Us', path: '/contact' }
]

const navMenuRef = ref<HTMLElement | null>(null)
const itemRefs = ref<any[]>([])
const isScrolled = ref(false)

const setItemRef = (el: any, index: number) => {
  if (el) {
    itemRefs.value[index] = el.$el || el
  }
}

const activeIndex = computed(() => {
  const currentPath = route.path
  if (currentPath === '/features' || currentPath.startsWith('/features/')) return 0
  if (currentPath === '/solutions' || currentPath.startsWith('/solutions/')) return 1
  if (currentPath === '/blog' || currentPath.startsWith('/blog/')) return 2
  if (currentPath === '/contact' || currentPath.startsWith('/contact/')) return 3
  return -1
})

const hoverIndex = ref<number | null>(null)
const isReady = ref(false)

const pillX = ref(0)
const pillY = ref(0)
const pillWidth = ref(0)
const pillHeight = ref(0)
const isVisible = ref(false)

const targetIndex = computed(() => {
  if (hoverIndex.value !== null) return hoverIndex.value
  if (activeIndex.value !== -1) return activeIndex.value
  return -1
})

const updateIndicatorPosition = () => {
  const container = navMenuRef.value
  const targetIdx = targetIndex.value

  if (!container || targetIdx === -1 || !itemRefs.value[targetIdx]) {
    isVisible.value = false
    return
  }

  const containerRect = container.getBoundingClientRect()
  const targetEl = itemRefs.value[targetIdx]
  if (!targetEl || typeof targetEl.getBoundingClientRect !== 'function') return
  
  const targetRect = targetEl.getBoundingClientRect()

  pillX.value = targetRect.left - containerRect.left
  pillY.value = targetRect.top - containerRect.top
  pillWidth.value = targetRect.width
  pillHeight.value = targetRect.height
  isVisible.value = true
}

const handleMouseEnter = (index: number) => {
  hoverIndex.value = index
  updateIndicatorPosition()
}

const handleMouseLeave = () => {
  hoverIndex.value = null
  updateIndicatorPosition()
}

const indicatorStyle = computed(() => ({
  transform: `translate3d(${pillX.value}px, ${pillY.value}px, 0)`,
  width: `${pillWidth.value}px`,
  height: `${pillHeight.value}px`,
  opacity: isVisible.value ? 1 : 0
}))

// Smooth animation frame tracker during scroll morph transition
let morphRafId: number | null = null
const animateIndicatorMorph = () => {
  const startTime = performance.now()
  const duration = 400
  const step = (now: number) => {
    updateIndicatorPosition()
    if (now - startTime < duration) {
      morphRafId = requestAnimationFrame(step)
    } else {
      updateIndicatorPosition()
    }
  }
  if (morphRafId) cancelAnimationFrame(morphRafId)
  morphRafId = requestAnimationFrame(step)
}

const handleScroll = () => {
  if (typeof window === 'undefined') return
  const scrolled = window.scrollY > 35
  if (isScrolled.value !== scrolled) {
    isScrolled.value = scrolled
    nextTick(() => {
      animateIndicatorMorph()
    })
  }
}

watch(() => route.path, () => {
  nextTick(() => {
    updateIndicatorPosition()
  })
})

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      updateIndicatorPosition()
      isReady.value = true
    }, 80)
  })
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', updateIndicatorPosition)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    if (morphRafId) cancelAnimationFrame(morphRafId)
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', updateIndicatorPosition)
  }
})
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  padding-top: 18px;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: padding 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.header.is-scrolled {
  padding-top: 12px;
}

/* ====================================================
   BASE WRAPPER (Top/Unscrolled State: Spread Across Page)
   ==================================================== */
.header-wrapp {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  pointer-events: auto;
  transition: 
    max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    padding 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    background 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.35s ease,
    gap 0.35s ease;
}

/* ====================================================
   SCROLLED STATE: UNIFIED SINGLE FLOATING GLASS CAPSULE
   ==================================================== */
.header.is-scrolled .header-wrapp {
  width: auto;
  max-width: fit-content;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 9999px;
  padding: 6px 8px 6px 18px;
  gap: 10px;
  box-shadow: 
    0 16px 40px -8px rgba(84, 51, 89, 0.12), 
    0 4px 14px 0 rgba(84, 51, 89, 0.05),
    inset 0 1px 1.5px 0 rgba(255, 255, 255, 1);
}

.header-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.header-logo-brand {
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #341F37;
  text-decoration: none;
  display: inline-flex;
  align-items: baseline;
  line-height: 1;
  white-space: nowrap;
  transition: font-size 0.35s cubic-bezier(0.16, 1, 0.3, 1), padding 0.35s ease, border-color 0.35s ease;
}

.header-logo-brand span {
  color: #7B4C85;
}

.header.is-scrolled .header-logo-brand {
  font-size: 16px;
  padding-right: 14px;
  margin-right: 2px;
  border-right: 1.5px solid rgba(123, 76, 133, 0.16);
}

/* ====================================================
   LIQUID GLASS MENU CONTAINER
   ==================================================== */
.liquid-glass-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 6px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 9999px;
  box-shadow: 
    0 12px 32px 0 rgba(84, 51, 89, 0.08), 
    0 2px 8px 0 rgba(84, 51, 89, 0.03),
    inset 0 1px 1.5px 0 rgba(255, 255, 255, 1);
  overflow: visible;
  transition: 
    background 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.35s ease,
    padding 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    gap 0.35s ease;
}

/* When header is scrolled, remove inner pill background so menu blends into master capsule */
.header.is-scrolled .liquid-glass-menu {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: none;
  box-shadow: none;
  padding: 0;
  gap: 2px;
}

/* ====================================================
   SLIDING LIQUID GLASS LENS INDICATOR
   ==================================================== */
.liquid-glass-indicator {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 9999px;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(245, 248, 255, 0.82) 50%,
    rgba(238, 245, 255, 0.92) 100%
  );
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 1);
  box-shadow: 
    0 10px 24px -4px rgba(40, 20, 55, 0.1),
    0 2px 6px rgba(40, 20, 55, 0.03),
    inset 0 2px 4px rgba(255, 255, 255, 1),
    inset 0 -1.5px 3px rgba(0, 0, 0, 0.02),
    inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  pointer-events: none;
  z-index: 1;
  transition: 
    transform 0.35s cubic-bezier(0.2, 1.22, 0.32, 1), 
    width 0.32s cubic-bezier(0.2, 1.22, 0.32, 1), 
    height 0.32s ease, 
    opacity 0.25s ease;
  will-change: transform, width;
}

.header.is-scrolled .liquid-glass-indicator {
  box-shadow: 
    0 4px 14px rgba(84, 51, 89, 0.08),
    0 1px 4px rgba(84, 51, 89, 0.03),
    inset 0 1.5px 3px rgba(255, 255, 255, 1);
  border: 1px solid rgba(123, 76, 133, 0.14);
}

/* Top Specular Gloss Highlight */
.indicator-top-gloss {
  position: absolute;
  top: 1px;
  left: 12%;
  right: 12%;
  height: 48%;
  border-radius: 9999px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 100%
  );
  pointer-events: none;
}

/* ====================================================
   MENU ITEM BUTTONS
   ==================================================== */
.liquid-menu-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 8px 18px;
  border-radius: 9999px;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  font-weight: 600;
  color: #55445E;
  text-decoration: none;
  cursor: pointer;
  z-index: 2;
  white-space: nowrap;
  transition: 
    color 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
    transform 0.32s cubic-bezier(0.2, 1.22, 0.32, 1), 
    font-size 0.3s ease, 
    padding 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-shadow: none !important;
  user-select: none;
}

.header.is-scrolled .liquid-menu-item {
  padding: 6px 14px;
  font-size: 13px;
}

.liquid-menu-item:hover,
.liquid-menu-item.is-active {
  color: #1A1220;
  font-weight: 700;
}

.liquid-menu-item.is-hovered {
  transform: scale(1.03);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.liquid-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #341F37 0%, #543359 50%, #7B4C85 100%);
  color: #FFFFFF;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 20px rgba(52, 31, 55, 0.22);
  transition: 
    padding 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    font-size 0.35s ease,
    box-shadow 0.3s ease,
    transform 0.25s ease;
  cursor: pointer;
}

.header.is-scrolled .liquid-cta-btn {
  padding: 7px 16px;
  font-size: 12.5px;
  box-shadow: 0 4px 12px rgba(52, 31, 55, 0.18);
}

.liquid-cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(52, 31, 55, 0.3);
  filter: brightness(1.08);
}

.header-mobile-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(84, 51, 89, 0.15);
  color: #341F37;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(12px);
}

.header-mobile-toggle:hover {
  background: #FFFFFF;
  border-color: #7B4C85;
  color: #7B4C85;
}

@media (max-width: 900px) {
  .header.is-scrolled .header-wrapp,
  .header-wrapp {
    width: 100% !important;
    max-width: 100% !important;
    padding: 12px 18px !important;
    background: rgba(250, 248, 252, 0.95) !important;
    backdrop-filter: blur(24px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
    border-radius: 0 !important;
    border-bottom: 1px solid rgba(123, 76, 133, 0.12) !important;
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    box-shadow: 0 4px 20px rgba(52, 31, 55, 0.06) !important;
  }
  .header {
    padding-top: 0 !important;
  }
  .header-logo-brand {
    font-size: 20px !important;
    border-right: none !important;
    padding-right: 0 !important;
    margin-right: 0 !important;
  }
  .liquid-glass-menu {
    display: none !important;
  }
  .liquid-cta-btn {
    display: none !important;
  }
  .header-mobile-toggle {
    display: inline-flex !important;
  }
}
</style>
