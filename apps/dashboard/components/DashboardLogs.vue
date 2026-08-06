<template>
  <section class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h2 class="text-xl font-black tracking-tight flex items-center gap-3 text-on-surface">
      <span class="w-2 h-8 bg-rose-500 rounded-full"></span>
      Auto-Moderation Logs
    </h2>
    <div class="bg-surface/40 border border-outline/60 rounded-[0.9rem] overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left min-w-[800px]">
          <thead>
            <tr class="bg-surface-container-low border-b border-white/5">
              <th class="px-4 py-4 md:px-8 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">Moderated Event</th>
              <th class="px-4 py-4 md:px-8 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">Platform</th>
              <th class="px-4 py-4 md:px-8 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">Action Status</th>
              <th class="px-4 py-4 md:px-8 md:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">Timestamp</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-surface-container-lowest transition-colors group">
              <td class="px-4 py-4 md:px-8 md:py-6">
                <div class="flex items-center gap-3">
                  <div class="flex flex-col gap-1.5 min-w-0">
                    <div v-if="log.profile" class="flex items-center gap-2">
                      <span class="text-[10px] font-black uppercase tracking-widest text-rose-400">{{ log.profile }}</span>
                    </div>
                    <span class="text-xs font-bold text-white truncate max-w-[250px] sm:max-w-[450px] md:max-w-[600px]" :title="log.event">{{ log.event }}</span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 md:px-8 md:py-6">
                <span class="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant/80">{{ log.platform }}</span>
              </td>
              <td class="px-4 py-4 md:px-8 md:py-6">
                <span class="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Auto-Deleted</span>
              </td>
              <td class="px-4 py-4 md:px-8 md:py-6 text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">{{ log.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination Footer -->
      <div v-if="logsTotalPages > 1" class="px-8 py-6 bg-white/5 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
          Showing {{ (logsCurrentPage - 1) * logsItemsPerPage + 1 }} to {{ Math.min(logsCurrentPage * logsItemsPerPage, totalLogs) }} of {{ totalLogs }} Records
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="logsCurrentPage > 1 && $emit('update:logsCurrentPage', logsCurrentPage - 1)"
            :disabled="logsCurrentPage === 1"
            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <span class="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          
          <div class="flex items-center gap-1">
            <button 
              v-for="p in logsTotalPages" 
              :key="p"
              @click="$emit('update:logsCurrentPage', p)"
              :class="logsCurrentPage === p ? 'bg-primary text-white border-primary' : 'bg-white/5 border-white/10 text-on-surface-variant/60'"
              class="w-10 h-10 rounded-xl border font-black text-xs flex items-center justify-center transition-all"
            >
              {{ p }}
            </button>
          </div>

          <button 
            @click="logsCurrentPage < logsTotalPages && $emit('update:logsCurrentPage', logsCurrentPage + 1)"
            :disabled="logsCurrentPage === logsTotalPages"
            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <span class="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  logs: { type: Array, required: true },
  logsCurrentPage: { type: Number, required: true },
  logsTotalPages: { type: Number, required: true },
  totalLogs: { type: Number, required: true },
  logsItemsPerPage: { type: Number, required: true }
})
defineEmits(['update:logsCurrentPage'])
</script>
