<script setup>
import { useVisitorTracker } from '~/composables/useVisitorTracker'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const settings = ref({ site_name: 'Clickify Mate' })

const loadSettings = async () => {
  try {
    const data = await $fetch('/api/settings')
    if (data && data.settings) {
      settings.value = data.settings
    }
  } catch (err) {}
}

onMounted(() => {
  const { initTracking } = useVisitorTracker()
  initTracking()
  loadSettings()
})

useHead(() => ({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - ${settings.value.site_name} Dashboard` : `${settings.value.site_name} Dashboard`
  },
  htmlAttrs: {
    lang: 'en'
  },
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
}))
</script>

<template>
  <div class="min-h-screen bg-background relative overflow-x-hidden text-on-background flex flex-col">
    <!-- Dynamic grid background decoration -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none z-0"></div>
    <div class="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
    <div class="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

    <main class="flex-grow flex flex-col relative z-10">
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* High-performance scrollbar styling */
:deep(::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.02);
}

:deep(::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.25);
}
</style>
