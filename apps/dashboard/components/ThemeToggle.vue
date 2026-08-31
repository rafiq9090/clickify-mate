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
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button 
    @click="toggleTheme"
    type="button"
    class="theme-toggle-btn relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-all duration-300 focus:outline-none hover:scale-105 active:scale-95 shadow-inner"
    :class="isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-200 border border-slate-300'"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <!-- Sliding Knob -->
    <div
      class="h-5 w-5 rounded-full bg-white dark:bg-slate-900 transition-transform duration-300 flex items-center justify-center shadow-sm"
      :class="isDark ? 'translate-x-5' : 'translate-x-0'"
    >
      <span 
        class="material-symbols-outlined text-[13px] font-bold transition-all duration-300 select-none"
        :class="isDark ? 'text-sky-400' : 'text-amber-500'"
      >
        {{ isDark ? 'dark_mode' : 'light_mode' }}
      </span>
    </div>
  </button>
</template>

<style scoped>
.theme-toggle-btn {
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
