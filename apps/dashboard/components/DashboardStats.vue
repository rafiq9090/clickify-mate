<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
    <div v-for="stat in stats" :key="stat.label" class="bg-surface/40 border border-outline/60 p-6 md:p-8 rounded-[2rem] md:rounded-[1.5rem] shadow-md hover:shadow-primary/20 transition-all group overflow-hidden relative">
      <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
      <div class="flex items-center justify-between mb-4">
        <span class="material-symbols-outlined text-3xl" :class="stat.color">{{ stat.icon }}</span>
        <span class="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">trending_up</span> {{ stat.growth }}
        </span>
      </div>
      <div class="text-4xl font-black tracking-tighter mb-1 text-on-surface">{{ stat.value }}</div>
      <div class="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{{ stat.label }}</div>
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
