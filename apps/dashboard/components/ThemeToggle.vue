<script setup>
const colorMode = useColorMode()

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(val) {
    colorMode.preference = val ? 'dark' : 'light'
  }
})

const toggleTheme = () => {
  isDark.value = !isDark.value
}
</script>

<template>
  <button 
    @click="toggleTheme"
    type="button"
    class="relative inline-flex h-9 w-18 shrink-0 cursor-pointer items-center rounded-full p-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border border-[#E5E7EB] dark:border-[#374151] bg-[#F3F4F6] dark:bg-[#1E1E1E] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95"
    aria-label="Toggle theme"
  >
    <!-- Neumorphic inner track bevel/glow effect -->
    <div class="absolute inset-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#121212] opacity-80 z-0 pointer-events-none"></div>

    <!-- Switch Track Background Fill (Blue Gradient when dark) -->
    <div 
      class="absolute inset-1 rounded-full transition-all duration-500 ease-out z-10 overflow-hidden"
      :class="isDark ? 'opacity-100' : 'opacity-0'"
    >
      <div class="w-full h-full bg-gradient-to-r from-[#38bdf8] via-[#2563eb] to-[#1d4ed8] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"></div>
    </div>

    <!-- Inactive (Light Mode) soft shadow track -->
    <div 
      class="absolute inset-1 rounded-full bg-gradient-to-r from-[#e5e7eb] to-[#f3f4f6] transition-all duration-500 ease-out z-10 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.08)]"
      :class="isDark ? 'opacity-0' : 'opacity-100'"
    ></div>

    <!-- The Sliding Knob (Neumorphic Circle) -->
    <div
      class="relative h-7 w-7 rounded-full bg-[#FFFFFF] dark:bg-[#F9FAFB] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-20 flex items-center justify-center border border-white/60 dark:border-white/10"
      :class="isDark ? 'translate-x-8 shadow-[0_4px_12px_rgba(0,0,0,0.35),_0_2px_4px_rgba(37,117,252,0.2)]' : 'translate-x-0 shadow-[0_4px_10px_rgba(0,0,0,0.08),_inset_0_1px_0_rgba(255,255,255,0.9)]'"
    >
      <!-- Subtly animated icon inside for deluxe detail -->
      <span 
        class="material-symbols-outlined text-[15px] font-bold transition-all duration-500"
        :class="isDark ? 'text-[#2575FC] rotate-[360deg] scale-100' : 'text-[#F59E0B] rotate-0 scale-90'"
      >
        {{ isDark ? 'dark_mode' : 'light_mode' }}
      </span>
    </div>
  </button>
</template>

<style scoped>
/* Smooth cubic-bezier slide transitions */
.cubic-bezier {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
