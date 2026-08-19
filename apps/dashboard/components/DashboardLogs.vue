<template>
  <section class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="pb-2 border-b border-outline/40">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
          <span class="material-symbols-outlined text-xl">shield</span>
        </div>
        <h2 class="text-xl font-bold tracking-tight text-on-surface">Auto-Moderation & Event Logs</h2>
      </div>
      <p class="text-xs text-on-surface-variant mt-1">
        Real-time audit log of automated spam deletions, private reply triggers, and AI moderation actions.
      </p>
    </div>

    <!-- Table Card -->
    <div class="bg-surface border border-outline rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr class="bg-surface-hover/50 border-b border-outline text-on-surface-variant font-semibold">
              <th class="py-3 px-4">Moderated Event / User</th>
              <th class="py-3 px-4">Platform</th>
              <th class="py-3 px-4">Action Taken</th>
              <th class="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline/50">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-surface-hover/40 transition-colors">
              <td class="py-3.5 px-4">
                <div class="flex flex-col gap-0.5">
                  <span v-if="log.profile" class="text-xs font-semibold text-primary capitalize">{{ log.profile }}</span>
                  <span class="text-xs text-on-surface font-medium truncate max-w-md" :title="log.event">{{ log.event }}</span>
                </div>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-hover border border-outline text-on-surface uppercase">
                  {{ log.platform }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Auto-Filtered
                </span>
              </td>
              <td class="py-3.5 px-4 text-right text-on-surface-variant font-medium whitespace-nowrap">
                {{ log.time }}
              </td>
            </tr>

            <tr v-if="logs.length === 0">
              <td colspan="4" class="py-12 text-center text-xs text-on-surface-variant">
                No moderation log events recorded yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="logsTotalPages > 1" class="px-5 py-4 bg-surface border-t border-outline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span class="text-on-surface-variant">
          Showing {{ (logsCurrentPage - 1) * logsItemsPerPage + 1 }} to {{ Math.min(logsCurrentPage * logsItemsPerPage, totalLogs) }} of {{ totalLogs }} logs
        </span>

        <div class="flex items-center gap-1.5">
          <button 
            @click="logsCurrentPage > 1 && $emit('update:logsCurrentPage', logsCurrentPage - 1)"
            :disabled="logsCurrentPage === 1"
            class="p-1.5 rounded-lg border border-outline hover:bg-surface-hover disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">chevron_left</span>
          </button>

          <button 
            v-for="p in logsTotalPages" 
            :key="p"
            @click="$emit('update:logsCurrentPage', p)"
            :class="logsCurrentPage === p 
              ? 'bg-primary text-white border-primary font-semibold' 
              : 'border-outline text-on-surface hover:bg-surface-hover font-medium'"
            class="w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            {{ p }}
          </button>

          <button 
            @click="logsCurrentPage < logsTotalPages && $emit('update:logsCurrentPage', logsCurrentPage + 1)"
            :disabled="logsCurrentPage === logsTotalPages"
            class="p-1.5 rounded-lg border border-outline hover:bg-surface-hover disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  logs: { type: Array, required: true },
  logsTotalPages: { type: Number, required: true },
  logsCurrentPage: { type: Number, required: true },
  logsItemsPerPage: { type: Number, required: true },
  totalLogs: { type: Number, required: true }
})

defineEmits(['update:logsCurrentPage'])
</script>
