<template>
  <section class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header & Controls -->
    <div class="space-y-4 pb-2 border-b border-outline/40">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            
            <h2 class="text-xl font-bold tracking-tight text-on-surface">Verified Paid Orders</h2>
          </div>
          <p class="text-xs text-on-surface-variant mt-1">
            Pre-paid orders with verified mobile banking or gateway transaction IDs.
          </p>
        </div>

        <!-- Top Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button 
            @click="$emit('refresh')"
            :disabled="loading"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-outline hover:bg-surface-hover text-on-surface transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh Paid Orders"
          >
            <span class="material-symbols-outlined text-base text-emerald-500" :class="loading ? 'animate-spin' : ''">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
        <!-- Search Input -->
        <div class="md:col-span-5 relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg">search</span>
          <input 
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            type="text" 
            placeholder="Search by customer, phone, TxID, or Order ID..."
            class="w-full h-10 pl-9 pr-8 bg-surface border border-outline rounded-xl text-xs text-on-surface outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-on-surface-variant/50"
          >
          <button 
            v-if="searchQuery" 
            @click="$emit('update:searchQuery', '')" 
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Date Range Filter -->
        <div class="md:col-span-4 flex items-center h-10 px-3 bg-surface border border-outline rounded-xl gap-2">
          <span class="material-symbols-outlined text-sm text-on-surface-variant/50">calendar_today</span>
          <input 
            :value="startDate"
            @input="$emit('update:startDate', $event.target.value)"
            type="date" 
            class="bg-transparent text-xs text-on-surface outline-none w-full cursor-pointer"
          >
          <span class="text-on-surface-variant/30 font-medium">to</span>
          <input 
            :value="endDate"
            @input="$emit('update:endDate', $event.target.value)"
            type="date" 
            class="bg-transparent text-xs text-on-surface outline-none w-full cursor-pointer"
          >
        </div>

        <!-- Platform Tabs Filter -->
        <div class="md:col-span-3 flex items-center bg-surface-hover/70 p-1 border border-outline rounded-xl overflow-x-auto">
          <button 
            v-for="tab in ['all', 'whatsapp', 'telegram', 'facebook']" 
            :key="tab"
            @click="$emit('update:activeTab', tab)"
            :class="activeTab === tab 
              ? 'bg-surface text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold' 
              : 'text-on-surface-variant hover:text-on-surface font-medium'"
            class="flex-1 py-1.5 px-2.5 rounded-lg text-xs capitalize text-center transition-all truncate cursor-pointer"
          >
            {{ tab }}
          </button>
        </div>
      </div>
    </div>

    <!-- Data Table Container -->
    <div class="bg-surface border border-outline rounded-2xl overflow-hidden shadow-sm relative min-h-[350px]">
      <!-- Loading Overlay -->
      <div v-if="loading" class="absolute inset-0 z-20 bg-surface/70 backdrop-blur-xs flex items-center justify-center animate-in fade-in">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <span class="text-xs font-medium text-on-surface-variant">Loading paid orders...</span>
        </div>
      </div>

      <div v-if="!loading && orders.length > 0" class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr class="bg-surface-hover/50 border-b border-outline text-xs font-semibold text-on-surface-variant">
              <th class="py-3 px-3 w-10 text-center"></th>
              <th class="py-3 px-4 w-12 text-center">#</th>
              <th class="py-3 px-4">Platform</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Transaction ID</th>
              <th class="py-3 px-4">Order ID</th>
              <th class="py-3 px-4 text-right">Date & Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline/50 text-xs">
            <template v-for="(order, index) in orders" :key="order.id">
              <tr 
                @click="toggleOrderExpand(order.id)"
                class="hover:bg-surface-hover/40 transition-colors cursor-pointer group"
                :class="{ 'bg-emerald-500/5': expandedOrders.includes(order.id) }"
              >
                <!-- Caret Toggle -->
                <td class="py-3.5 px-3 text-center">
                  <span 
                    class="material-symbols-outlined text-base text-on-surface-variant/50 group-hover:text-emerald-500 transition-transform inline-block"
                    :class="{ 'rotate-180': expandedOrders.includes(order.id) }"
                  >
                    expand_more
                  </span>
                </td>

                <!-- Row Number -->
                <td class="py-3.5 px-4 text-center font-mono text-on-surface-variant/60 font-medium">
                  {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                </td>

                <!-- Platform Tag -->
                <td class="py-3.5 px-4">
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border"
                    :class="getPlatformBadgeClass(order.data?.platform)"
                  >
                    {{ formatPlatformName(order.data?.platform) }}
                  </span>
                </td>

                <!-- Customer Info -->
                <td class="py-3.5 px-4">
                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-on-surface capitalize">{{ order.data?.customer || 'Customer' }}</span>
                      <span class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Paid
                      </span>
                    </div>
                    <span class="text-xs text-on-surface-variant truncate max-w-xs">{{ order.data?.collected_details?.phone || order.email }}</span>
                  </div>
                </td>

                <!-- Transaction ID -->
                <td class="py-3.5 px-4" @click.stop>
                  <button 
                    @click="$emit('copy-text', order.data?.payment_transaction_id)" 
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold transition-colors cursor-pointer group/tx"
                    title="Click to copy Transaction ID"
                  >
                    <span>{{ order.data?.payment_transaction_id || 'N/A' }}</span>
                    <span class="material-symbols-outlined text-xs opacity-60 group-hover/tx:opacity-100">content_copy</span>
                  </button>
                </td>

                <!-- Order ID -->
                <td class="py-3.5 px-4" @click.stop>
                  <button 
                    @click="$emit('copy-text', order.id)" 
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-hover hover:bg-primary/10 hover:text-primary border border-outline text-on-surface-variant text-xs font-mono transition-colors cursor-pointer group/id"
                    title="Click to copy full ID"
                  >
                    <span>#{{ order.id.slice(0, 8) }}</span>
                    <span class="material-symbols-outlined text-xs opacity-50 group-hover/id:opacity-100">content_copy</span>
                  </button>
                </td>

                <!-- Time -->
                <td class="py-3.5 px-4 text-right text-on-surface-variant font-medium whitespace-nowrap">
                  <div>{{ new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
                  <div class="text-[10px] text-on-surface-variant/60">{{ new Date(order.created_at).toLocaleDateString() }}</div>
                </td>
              </tr>

              <!-- Expanded Details Row -->
              <tr v-if="expandedOrders.includes(order.id)" class="bg-surface-hover/20">
                <td colspan="7" class="p-4 sm:p-6 bg-surface-hover/30 border-b border-outline">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                    <!-- Order Items Breakdown -->
                    <div class="space-y-2 p-3.5 rounded-xl bg-surface border border-outline">
                      <div class="flex items-center gap-1.5 font-semibold text-on-surface">
                        <span class="material-symbols-outlined text-sm text-emerald-500">receipt</span>
                        <span>Payment & Items</span>
                      </div>
                      <div v-if="order.data?.order && order.data.order.includes(':')" class="space-y-1 pt-1">
                        <div 
                          v-for="(part, i) in order.data.order.split('|')" 
                          :key="i"
                          class="flex items-center justify-between py-1 border-b border-outline/40 last:border-0"
                        >
                          <span class="text-on-surface-variant">{{ part.split(':')[0]?.trim() }}</span>
                          <span class="font-semibold" :class="part.toLowerCase().includes('total') ? 'text-emerald-500 font-bold' : 'text-on-surface'">
                            {{ part.split(':')[1]?.trim() }}
                          </span>
                        </div>
                      </div>
                      <p v-else class="text-on-surface font-medium pt-1">
                        {{ order.data?.order || 'No items listed' }}
                      </p>
                    </div>

                    <!-- Courier Status -->
                    <div class="space-y-2 p-3.5 rounded-xl bg-surface border border-outline">
                      <div class="flex items-center gap-1.5 font-semibold text-on-surface">
                        <span class="material-symbols-outlined text-sm text-orange-500">local_shipping</span>
                        <span>Courier Status</span>
                      </div>

                      <div v-if="order.data?.tracking_code" class="space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <span class="text-on-surface-variant">Tracking:</span>
                          <span class="font-mono font-semibold text-orange-500 select-all">{{ order.data.tracking_code }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-on-surface-variant">Status:</span>
                          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {{ order.data.delivery_status || 'Delivered to Courier' }}
                          </span>
                        </div>
                      </div>
                      <div v-else class="pt-1 flex flex-col gap-2">
                        <span class="text-on-surface-variant text-[11px]">Ready for packaging & dispatch.</span>
                        <button 
                          @click.stop="$emit('send-to-steadfast', order.id)" 
                          :disabled="sendingToSteadfast"
                          class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white border border-orange-500/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer w-max"
                        >
                          <span class="material-symbols-outlined text-sm">local_shipping</span>
                          Dispatch via Steadfast
                        </button>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="space-y-2 p-3.5 rounded-xl bg-surface border border-outline flex flex-col justify-between">
                      <div>
                        <div class="flex items-center gap-1.5 font-semibold text-on-surface mb-2">
                          <span class="material-symbols-outlined text-sm text-secondary">tune</span>
                          <span>Order Actions</span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant">
                          Update verified payment status or view captured customer notes.
                        </p>
                      </div>

                      <div class="flex items-center gap-2 pt-2">
                        <button 
                          @click.stop="$emit('open-edit', order)" 
                          class="flex-1 py-1.5 px-3 rounded-lg bg-surface-hover hover:bg-primary/10 hover:text-primary border border-outline font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span class="material-symbols-outlined text-sm">edit</span>
                          Edit
                        </button>
                        <button 
                          @click.stop="$emit('delete', order.id)" 
                          class="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span class="material-symbols-outlined text-sm">delete</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="py-16 text-center space-y-2">
        <span class="material-symbols-outlined text-4xl text-on-surface-variant/30">paid</span>
        <h4 class="text-sm font-semibold text-on-surface">No paid orders recorded</h4>
        <p class="text-xs text-on-surface-variant max-w-sm mx-auto">
          Orders with confirmed payment transaction receipts will appear here automatically.
        </p>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="px-5 py-4 bg-surface border-t border-outline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span class="text-on-surface-variant">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalOrders) }} of {{ totalOrders }} orders
        </span>

        <div class="flex items-center gap-1.5">
          <button 
            @click="currentPage > 1 && $emit('update:currentPage', currentPage - 1)"
            :disabled="currentPage === 1"
            class="p-1.5 rounded-lg border border-outline hover:bg-surface-hover disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">chevron_left</span>
          </button>

          <button 
            v-for="p in totalPages" 
            :key="p"
            @click="$emit('update:currentPage', p)"
            :class="currentPage === p 
              ? 'bg-emerald-500 text-white border-emerald-500 font-semibold' 
              : 'border-outline text-on-surface hover:bg-surface-hover font-medium'"
            class="w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            {{ p }}
          </button>

          <button 
            @click="currentPage < totalPages && $emit('update:currentPage', currentPage + 1)"
            :disabled="currentPage === totalPages"
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
import { ref } from 'vue'

defineProps({
  orders: { type: Array, required: true },
  loading: { type: Boolean, required: true },
  currentPage: { type: Number, required: true },
  itemsPerPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalOrders: { type: Number, required: true },
  searchQuery: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  activeTab: { type: String, required: true },
  sendingToSteadfast: { type: Boolean, default: false }
})

defineEmits([
  'update:currentPage',
  'update:searchQuery',
  'update:startDate',
  'update:endDate',
  'update:activeTab',
  'open-edit',
  'delete',
  'send-to-steadfast',
  'copy-text'
])

const expandedOrders = ref([])

const toggleOrderExpand = (orderId) => {
  const index = expandedOrders.value.indexOf(orderId)
  if (index > -1) {
    expandedOrders.value.splice(index, 1)
  } else {
    expandedOrders.value.push(orderId)
  }
}

const formatPlatformName = (platform) => {
  if (platform === 'fb_comment') return 'Facebook Comment'
  if (platform === 'messenger') return 'Messenger'
  if (platform === 'whatsapp') return 'WhatsApp'
  if (platform === 'telegram') return 'Telegram'
  return platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Direct'
}

const getPlatformBadgeClass = (platform) => {
  if (platform === 'whatsapp') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  if (platform === 'telegram') return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
  if (platform === 'facebook' || platform === 'messenger' || platform === 'fb_comment') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
  return 'bg-primary/10 text-primary border-primary/20'
}
</script>
