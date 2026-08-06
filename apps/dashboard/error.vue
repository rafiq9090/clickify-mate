<template>
  <div class="error-page min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
    <!-- Ambient Glows -->
    <div class="absolute -top-64 -right-64 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="relative z-10 space-y-12 max-w-2xl">
      <!-- Error Visual -->
      <div class="relative inline-block">
        <div class="text-[12rem] md:text-[18rem] font-black tracking-tighter leading-none text-surface-container-highest opacity-50 select-none">
          {{ error.statusCode }}
        </div>
        <div class="absolute inset-0 flex items-center justify-center">
             <div class="w-32 h-32 md:w-48 md:h-48 bg-white rounded-full shadow-lg flex items-center justify-center border border-outline-variant/15 animate-bounce">
                <span class="material-symbols-outlined text-6xl md:text-8xl text-primary">search_off</span>
             </div>
        </div>
      </div>

      <!-- Error Message -->
      <div class="space-y-6">
        <h1 class="text-4xl md:text-6xl font-black tracking-tight text-on-surface">
          System <span class="text-primary italic">Anomaly.</span>
        </h1>
        <p class="text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed max-w-lg mx-auto">
          {{ error.message || "The module you are looking for has been moved, archived, or never existed in this dimension." }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
        <button @click="handleError" class="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          Return to Base
        </button>
        <NuxtLink to="/dashboard" class="w-full sm:w-auto px-10 py-5 bg-white border border-outline-variant/20 text-on-surface rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-container transition-all">
          Go to Dashboard
        </NuxtLink>
      </div>
    </div>

    <!-- Background Decoration -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.02]">
        <svg width="100%" height="100%"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  error: Object
})

const handleError = () => clearError({ redirect: '/' })

useHead({
  title: `${props.error.statusCode} Error - Clickify Mate`,
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<style scoped>
.error-page {
  font-family: 'Manrope', sans-serif;
}
</style>
