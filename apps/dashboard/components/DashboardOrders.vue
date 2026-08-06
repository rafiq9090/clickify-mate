<template>
  <section class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex flex-col lg:flex-col lg:items-left justify-left gap-6 pb-6">
      <div class="space-y-2">
        <div class="flex items-left gap-3">
          <span class="w-2 bg-success rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.5)]"></span>
          <h2 class="text-xl md:text-2xl font-black tracking-tight text-on-surface">Paid Orders</h2>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3">
        <!-- Search Input -->
        <div class="relative group w-full lg:w-auto">
          <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg group-focus-within:text-primary transition-all">search</span>
          <input 
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            type="text" 
            placeholder="Find orders by name, phone, or transaction ID..."
            class="w-full lg:min-w-[280px] h-10 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold text-white outline-none focus:border-primary/50 focus:bg-primary/10 transition-all placeholder:text-on-surface-variant/30"
          >
          <button v-if="searchQuery" @click="$emit('update:searchQuery', '')" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-white transition-colors">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Date Range -->
        <div class="flex items-center h-10 px-3 bg-white/5 rounded-2xl border border-white/10 group focus-within:border-primary/30 transition-all w-full lg:w-auto overflow-hidden">
          <span class="material-symbols-outlined text-sm text-on-surface-variant/40 mr-2 flex-shrink-0">calendar_today</span>
          <input 
            :value="startDate"
            @input="$emit('update:startDate', $event.target.value)"
            type="date" 
            class="bg-transparent text-[10px] font-black text-white outline-none [color-scheme:dark] w-full"
          >
          <span class="text-on-surface-variant/20 font-bold mx-1">-</span>
          <input 
            :value="endDate"
            @input="$emit('update:endDate', $event.target.value)"
            type="date" 
            class="bg-transparent text-[10px] font-black text-white outline-none [color-scheme:dark] w-full"
          >
        </div>

        <!-- Platform Filters -->
        <div class="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar w-full lg:w-auto">
          <button 
            v-for="tab in ['all', 'whatsapp', 'telegram', 'facebook']" 
            :key="tab"
            @click="$emit('update:activeTab', tab)"
            :class="activeTab === tab ? 'bg-success text-white shadow-lg shadow-success/20 scale-105' : 'text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-white/5'"
            class="flex-1 lg:flex-none px-4 lg:px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
          >
            {{ tab }}
          </button>
        </div>
      </div>
    </div>

    <div class="bg-surface/40 border border-outline/60 rounded-[0.9rem] overflow-hidden shadow-2xl backdrop-blur-xl relative min-h-[400px]">
      <!-- Loading Overlay -->
      <div v-if="loading" class="absolute inset-0 z-20 bg-surface/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
        <div class="flex flex-col items-center gap-6">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-success/20 border-t-success rounded-full animate-spin"></div>
            <div class="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-secondary rounded-full animate-spin [animation-duration:1.5s]"></div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div v-if="!loading && orders.length > 0" class="overflow-x-auto">
        <table class="w-full text-left min-w-[800px]">
          <thead>
            <tr class="bg-primary/5 border-b border-white/5">
              <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-primary/60 w-10"></th>
              <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-primary/60 w-12">No.</th>
              <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-primary/60 w-24">Platform</th>
              <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/60">Customer Info</th>
              <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/60">Transaction ID</th>
              <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/60">Order ID</th>
              <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/60 w-28">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <template v-for="(order, index) in orders" :key="order.id">
              <!-- Compact Row -->
              <tr 
                @click="toggleOrderExpand(order.id)"
                class="cursor-pointer hover:bg-primary/5 transition-all group border-b border-white/5"
                :class="{ 'bg-primary/5': expandedOrders.includes(order.id) }"
              >
                <!-- Caret Toggle -->
                <td class="px-2 py-3 md:px-4 md:py-4 text-center w-10">
                  <span class="material-symbols-outlined text-sm text-on-surface-variant/40 group-hover:text-primary transition-colors inline-block" :class="{ 'rotate-180': expandedOrders.includes(order.id) }">expand_more</span>
                </td>
                <!-- Number -->
                <td class="px-2 py-3 md:px-4 md:py-4 text-[10px] font-mono font-bold text-white/40">
                  #{{ (currentPage - 1) * itemsPerPage + index + 1 }}
                </td>
                <!-- Platform -->
                <td class="px-2 py-3 md:px-4 md:py-4">
                  <span class="text-[9px] font-black uppercase tracking-widest text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-lg">{{ formatPlatformName(order.data?.platform) }}</span>
                </td>
                <!-- Customer Info -->
                <td class="px-2 py-3 md:px-4 md:py-4">
                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-black text-white capitalize">{{ order.data?.customer || 'N/A' }}</span>
                      <span class="px-1.5 py-0.2 bg-success/15 text-success text-[7px] font-black rounded uppercase">Paid</span>
                      <span class="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border transition-all"
                        :class="{
                          'bg-green-500/10 text-green-400 border-green-500/20': order.data?.status === 'complete',
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': order.data?.status === 'hold',
                          'bg-red-500/10 text-red-400 border-red-500/20': order.data?.status === 'cancelled',
                          'bg-blue-500/10 text-blue-400 border-blue-500/20': !order.data?.status || order.data?.status === 'pending'
                        }">
                        {{ order.data?.status || 'pending' }}
                      </span>
                    </div>
                    <span class="text-[8px] font-medium text-on-surface-variant/40 tracking-wider">{{ order.data?.collected_details?.phone || order.email }}</span>
                  </div>
                </td>
                <!-- Transaction ID -->
                <td class="px-2 py-3 md:px-4 md:py-4" @click.stop>
                  <div class="inline-flex items-center gap-1 group/id cursor-pointer bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg hover:border-success/40 transition-colors" @click="$emit('copy-text', order.data?.payment_transaction_id)" title="Click to copy Transaction ID">
                    <span class="font-mono text-[9px] text-success/80 group-hover/id:text-success transition-colors font-bold">{{ order.data?.payment_transaction_id }}</span>
                    <span class="material-symbols-outlined text-[10px] text-white/30 group-hover/id:text-success transition-colors">content_copy</span>
                  </div>
                </td>
                <!-- Order ID -->
                <td class="px-2 py-3 md:px-4 md:py-4" @click.stop>
                  <div class="inline-flex items-center gap-1 group/id cursor-pointer bg-white/5 border border-white/10 px-2 py-1 rounded-lg hover:border-primary/40 transition-colors" @click="$emit('copy-text', order.id)" title="Click to copy full Order ID">
                    <span class="font-mono text-[9px] text-white/50 group-hover/id:text-primary transition-colors">#{{ order.id.slice(0, 8) }}</span>
                    <span class="material-symbols-outlined text-[10px] text-white/30 group-hover/id:text-primary transition-colors">content_copy</span>
                  </div>
                </td>
                <!-- Time -->
                <td class="px-2 py-3 md:px-4 md:py-4">
                  <div class="text-[9px] font-black text-white/70 uppercase tracking-widest flex flex-col whitespace-nowrap">
                    <span class="whitespace-nowrap">{{ new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                    <span class="text-[8px] opacity-40 whitespace-nowrap">{{ new Date(order.created_at).toLocaleDateString() }}</span>
                  </div>
                </td>
              </tr>

              <!-- Expanded Row Details -->
              <tr v-if="expandedOrders.includes(order.id)" class="bg-primary/5/10 border-b border-white/5">
                <td colspan="7" class="px-4 py-4 md:px-8 md:py-6 bg-surface-container-lowest/30">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    <!-- Order Analysis column -->
                    <div class="space-y-3">
                      <h5 class="text-[9px] font-black uppercase tracking-wider text-warning/80 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 bg-warning rounded-full"></span>Order Analysis
                      </h5>
                      <div v-if="order.data?.order && order.data.order.includes(':')" class="flex flex-wrap gap-2 max-w-full">
                        <div v-for="(part, i) in order.data.order.split('|')" :key="i" 
                          class="px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center">
                          <span class="text-[8px] font-black uppercase text-warning/50 mr-1.5">
                            {{ part.split(':')[0]?.trim() }}:
                          </span>
                          <span class="text-[9px] font-bold" 
                            :class="part.toLowerCase().includes('total') ? 'text-success' : 'text-white'">
                            {{ part.split(':')[1]?.trim() }}
                          </span>
                        </div>
                      </div>
                      <span v-else class="text-[10px] font-bold text-success/80">{{ order.data?.order || 'No order details collected' }}</span>
                    </div>

                    <!-- Courier Status column -->
                    <div class="space-y-3">
                      <h5 class="text-[9px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>Courier Status
                      </h5>
                      <div v-if="order.data?.tracking_code" class="flex flex-col gap-1.5">
                        <span class="text-[9px] font-mono font-black text-orange-400 select-all flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">local_shipping</span>
                          {{ order.data.tracking_code }}
                        </span>
                        <span class="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-black rounded uppercase border border-green-500/20 w-max">
                          {{ order.data.delivery_status || 'Delivered to Courier' }}
                        </span>
                      </div>
                      <div v-else class="flex flex-col gap-2">
                        <span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">Not Booked</span>
                        <button @click.stop="$emit('send-to-steadfast', order.id)" :disabled="sendingToSteadfast" class="px-3 py-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.05em] transition-all w-max flex items-center gap-1 disabled:opacity-50">
                          <span class="material-symbols-outlined text-[11px]">local_shipping</span>
                          Send to Steadfast
                        </button>
                      </div>
                    </div>

                    <!-- Actions column -->
                    <div class="space-y-3">
                      <h5 class="text-[9px] font-black uppercase tracking-wider text-error/80 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 bg-error rounded-full"></span>Actions
                      </h5>
                      <div class="flex items-center gap-2">
                        <button @click.stop="$emit('open-edit', order)" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white">
                          <span class="material-symbols-outlined text-[11px]">edit</span>
                          Edit
                        </button>
                        
                        <button @click.stop="$emit('delete', order.id)" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-red-400">
                          <span class="material-symbols-outlined text-[11px]">delete</span>
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
      <div v-else class="flex flex-col items-center justify-center py-16 px-8 text-center">
        <span class="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">inbox</span>
        <h3 class="text-lg font-black text-white/60 mb-2">No Paid Orders Yet</h3>
        <p class="text-sm text-on-surface-variant/40">Orders with payment transaction IDs will appear here</p>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="px-8 py-6 bg-white/5 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalOrders) }} of {{ totalOrders }} Orders
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="currentPage > 1 && $emit('update:currentPage', currentPage - 1)"
            :disabled="currentPage === 1"
            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <span class="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          
          <div class="flex items-center gap-1">
            <button 
              v-for="p in totalPages" 
              :key="p"
              @click="$emit('update:currentPage', p)"
              :class="currentPage === p ? 'bg-success text-white border-success' : 'bg-white/5 border-white/10 text-on-surface-variant/60'"
              class="w-10 h-10 rounded-xl border font-black text-xs flex items-center justify-center transition-all"
            >
              {{ p }}
            </button>
          </div>

          <button 
            @click="currentPage < totalPages && $emit('update:currentPage', currentPage + 1)"
            :disabled="currentPage === totalPages"
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
  if (platform === 'fb_comment') return 'FB comment'
  if (platform === 'messenger') return 'Messenger'
  if (platform === 'whatsapp') return 'WhatsApp'
  if (platform === 'telegram') return 'Telegram'
  return platform || ''
}
</script>
