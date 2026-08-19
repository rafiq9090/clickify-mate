<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    <div 
      v-for="stat in stats" 
      :key="stat.label" 
      class="relative overflow-hidden rounded-2xl bg-surface border border-outline/70 p-6 shadow-sm hover:shadow-md transition-all duration-300 group hover:border-primary/40"
    >
      <!-- Background subtle glow -->
      <div class="absolute -right-6 -top-6 w-28 h-28 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
      
      <div class="relative z-10">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/15 transition-transform duration-300 group-hover:scale-110 shadow-sm">
            <span class="material-symbols-outlined text-2xl" :class="stat.color">{{ stat.icon }}</span>
          </div>
          <span v-if="stat.growth" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span class="material-symbols-outlined text-sm">trending_up</span>
            {{ stat.growth }}
          </span>
        </div>
        
        <div>
          <div class="text-3xl font-bold tracking-tight text-on-surface mb-1">{{ stat.value }}</div>
          <p class="text-xs font-medium uppercase tracking-wider text-on-surface-variant">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Array,
    required: true
  }
})
</script>
