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
            Pre-paid orders with confirmed payment transactions (bKash, Nagad, Bank Cards & Net Banking).
          </p>
        </div>

        <!-- Top Actions -->
        <div class="hidden sm:flex items-center gap-2.5 flex-wrap">
          <button 
            @click="$emit('refresh')" 
            :disabled="loading"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-outline hover:bg-surface-hover text-on-surface transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh Paid Orders"
          >
            <span class="material-symbols-outlined text-base text-primary" :class="loading ? 'animate-spin' : ''">refresh</span>
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
            placeholder="Search customer, phone, TxID, or payment (bKash, Nagad, Bank)..."
            class="w-full h-10 pl-9 pr-8 bg-surface border border-outline rounded-xl text-xs text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-on-surface-variant/50"
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
              ? 'bg-surface text-primary shadow-xs font-semibold' 
              : 'text-on-surface-variant hover:text-on-surface font-medium'"
            class="flex-1 py-1.5 px-2.5 rounded-lg text-xs capitalize text-center transition-all truncate cursor-pointer"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <!-- Payment Method Quick Filter Pills -->
      <div class="flex items-center gap-2 pt-1 flex-wrap">
        <span class="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider mr-1">Payment:</span>
        <button 
          @click="$emit('update:paymentFilter', 'all')"
          :class="paymentFilter === 'all'
            ? 'bg-surface border-primary/50 text-primary font-bold shadow-xs'
            : 'bg-surface-hover/50 border-outline text-on-surface-variant hover:text-on-surface font-medium'"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border transition-all cursor-pointer"
        >
          <span>All Methods</span>
        </button>

        <button 
          @click="$emit('update:paymentFilter', 'bkash')"
          :class="paymentFilter === 'bkash'
            ? 'bg-[#E2136E]/15 border-[#E2136E] text-[#E2136E] font-bold shadow-xs'
            : 'bg-surface-hover/50 border-outline text-on-surface-variant hover:text-[#E2136E] font-medium'"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border transition-all cursor-pointer"
        >
          <!-- <span class="w-2 h-2 rounded-full bg-[#E2136E]"></span> -->
          <span>bKash</span>
        </button>

        <button 
          @click="$emit('update:paymentFilter', 'nagad')"
          :class="paymentFilter === 'nagad'
            ? 'bg-[#F7941D]/15 border-[#EA580C] text-[#EA580C] font-bold shadow-xs'
            : 'bg-surface-hover/50 border-outline text-on-surface-variant hover:text-[#EA580C] font-medium'"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border transition-all cursor-pointer"
        >
          <!-- <span class="w-2 h-2 rounded-full bg-[#EA580C]"></span> -->
          <span>Nagad</span>
        </button>

        <button 
          @click="$emit('update:paymentFilter', 'bank')"
          :class="paymentFilter === 'bank'
            ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
            : 'bg-surface-hover/50 border-outline text-on-surface-variant hover:text-blue-600 font-medium'"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border transition-all cursor-pointer"
        >
          <!-- <span class="w-2 h-2 rounded-full bg-blue-500"></span> -->
          <span>Bank / Card</span>
        </button>
      </div>
    </div>

    <!-- Data Table Container -->
    <div class="bg-surface border border-outline rounded-2xl overflow-hidden shadow-sm relative min-h-[350px]">
      <!-- Loading Overlay -->
      <div v-if="loading" class="absolute inset-0 z-20 bg-surface/70 backdrop-blur-xs flex items-center justify-center animate-in fade-in">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span class="text-xs font-medium text-on-surface-variant">Loading paid orders...</span>
        </div>
      </div>

      <div v-if="!loading && orders.length > 0" class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr class="bg-surface-hover/50 border-b border-outline text-xs font-semibold text-on-surface-variant">
              <th class="py-3 px-3 w-10 text-center"></th>
              <th class="py-3 px-4 w-12 text-center">#</th>
              <th class="py-3 px-4">Platform</th>
              <th class="py-3 px-4">Customer</th>
              <th class="py-3 px-4">Paid Via</th>
              <th class="py-3 px-4">Amount</th>
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
                :class="{ 'bg-primary/5': expandedOrders.includes(order.id) }"
              >
                <!-- Caret Toggle -->
                <td class="py-3.5 px-3 text-center">
                  <span 
                    class="material-symbols-outlined text-base text-on-surface-variant/50 group-hover:text-primary transition-transform inline-block"
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
                      <span class="font-semibold text-on-surface capitalize">{{ order.data?.name || order.data?.customer_name || order.data?.collected_details?.name || order.data?.customer || 'Customer' }}</span>
                      <span class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Paid
                      </span>
                    </div>
                    <span class="text-xs text-on-surface-variant truncate max-w-xs">{{ order.data?.phone || order.data?.collected_details?.phone || order.email }}</span>
                  </div>
                </td>

                <!-- Paid Via (bKash, Nagad, Bank, etc.) -->
                <td class="py-3.5 px-4" @click.stop>
                  <div class="flex flex-col gap-0.5 items-start">
                    <span class="text-xs font-semibold text-on-surface">
                      {{ getPaymentBadge(order).label }}
                    </span>
                    <span v-if="getPaymentBadge(order).sublabel" class="text-[10px] text-on-surface-variant/70 font-medium truncate max-w-[160px]">
                      {{ getPaymentBadge(order).sublabel }}
                    </span>
                  </div>
                </td>

                <!-- Amount -->
                <td class="py-3.5 px-4 whitespace-nowrap font-bold text-on-surface text-xs">
                  ৳{{ getOrderTotal(order) }}
                </td>

                <!-- Transaction ID -->
                <td class="py-3.5 px-4" @click.stop>
                  <button 
                    @click="$emit('copy-text', order.data?.payment_transaction_id || order.data?.trx_id)" 
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-primary/10 border border-outline text-primary text-xs font-mono font-semibold transition-colors cursor-pointer group/tx"
                    title="Click to copy Transaction ID"
                  >
                    <span>{{ order.data?.payment_transaction_id || order.data?.trx_id || 'N/A' }}</span>
                    <span class="material-symbols-outlined text-xs opacity-60 group-hover/tx:opacity-100">content_copy</span>
                  </button>
                </td>

                <!-- Order ID -->
                <td class="py-3.5 px-4" @click.stop>
                  <button 
                    @click="$emit('copy-text', order.data?.invoice_number || order.id)" 
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-hover hover:bg-primary/10 hover:text-primary border border-outline text-on-surface-variant text-xs font-mono transition-colors cursor-pointer group/id"
                    title="Click to copy full ID"
                  >
                    <span>#{{ order.data?.invoice_number || order.id.slice(0, 8) }}</span>
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
                <td colspan="9" class="p-4 sm:p-6 bg-surface-hover/30 border-b border-outline">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                    <!-- 1. Verified Payment Details Card -->
                    <div class="space-y-3 p-4 rounded-xl bg-surface border border-outline min-w-0">
                      <div class="flex items-center justify-between border-b border-outline/40 pb-2">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-on-surface">Payment Verification</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 dark:bg-primary/10 dark:text-on-surface-variant dark:border-primary/20">
                          CONFIRMED
                        </span>
                      </div>

                      <div class="space-y-2 pt-0.5">
                        <!-- Method -->
                        <div class="flex items-center justify-between py-1 border-b border-outline/30 gap-2">
                          <span class="text-on-surface-variant">Method:</span>
                          <span class="font-bold text-on-surface text-xs">
                            {{ getPaymentBadge(order).label }}
                          </span>
                        </div>

                        <!-- Specific Channel / Card / Bank -->
                        <div v-if="getPaymentChannelDetail(order)" class="flex items-center justify-between py-1 border-b border-outline/30 gap-2">
                          <span class="text-on-surface-variant">Paid Channel:</span>
                          <span class="font-semibold text-on-surface text-right truncate max-w-[180px]">
                            {{ getPaymentChannelDetail(order) }}
                          </span>
                        </div>

                        <!-- Card Number if available -->
                        <div v-if="order.data?.payment_details?.card_no" class="flex items-center justify-between py-1 border-b border-outline/30 gap-2">
                          <span class="text-on-surface-variant">Card Number:</span>
                          <span class="font-mono font-semibold text-on-surface">
                            {{ order.data.payment_details.card_no }}
                          </span>
                        </div>

                        <!-- Transaction ID -->
                        <div class="flex items-center justify-between py-1 border-b border-outline/30 gap-2">
                          <span class="text-on-surface-variant">Trx ID:</span>
                          <button 
                            @click.stop="$emit('copy-text', order.data?.payment_transaction_id || order.data?.trx_id)" 
                            class="font-mono font-bold text-primary hover:underline inline-flex items-center gap-1"
                            title="Copy TrxID"
                          >
                            <span>{{ order.data?.payment_transaction_id || order.data?.trx_id || 'N/A' }}</span>
                            <span class="material-symbols-outlined text-xs">content_copy</span>
                          </button>
                        </div>

                        <!-- Gateway / Aggregator -->
                        <div v-if="order.data?.payment_provider" class="flex items-center justify-between py-1 border-b border-outline/30 gap-2">
                          <span class="text-on-surface-variant">Gateway:</span>
                          <span class="font-semibold uppercase text-on-surface text-[11px]">
                            {{ order.data.payment_provider }}
                          </span>
                        </div>

                        <!-- Total Paid Amount -->
                        <div class="flex items-center justify-between py-1.5 gap-2">
                          <span class="text-on-surface-variant font-medium">Total Paid:</span>
                          <span class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                            ৳{{ getOrderTotal(order) }} BDT
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- 2. Order Items Breakdown -->
                    <div class="space-y-3 p-4 rounded-xl bg-surface border border-outline min-w-0">
                      <div class="font-bold text-on-surface border-b border-outline/40 pb-2 flex items-center justify-between">
                        <span>Purchased Items</span>
                        <span class="text-[11px] text-on-surface-variant font-normal">Details</span>
                      </div>

                      <!-- Parsed composite order string -->
                      <div v-if="order.data?.order && order.data.order.includes(':')" class="space-y-1 pt-0.5">
                        <div 
                          v-for="(part, i) in order.data.order.split('|')" 
                          :key="i"
                          class="flex items-center justify-between py-1 border-b border-outline/40 last:border-0 gap-2"
                        >
                          <span class="text-on-surface-variant truncate">{{ part.split(':')[0]?.trim() }}</span>
                          <span class="font-semibold text-primary font-bold shrink-0" v-if="part.toLowerCase().includes('total')">
                            {{ part.split(':')[1]?.trim() }}
                          </span>
                          <span class="font-semibold text-on-surface shrink-0" v-else>
                            {{ part.split(':')[1]?.trim() }}
                          </span>
                        </div>
                      </div>

                      <!-- Structured product or collected_details -->
                      <div v-else class="space-y-1.5 pt-0.5">
                        <div class="flex items-center justify-between py-1 border-b border-outline/30 gap-2">
                          <span class="text-on-surface-variant">Product:</span>
                          <span class="font-semibold text-on-surface text-right truncate max-w-[180px]">
                            {{ order.data?.product || order.data?.collected_details?.productName || order.data?.collected_details?.sku || 'Product Order' }}
                          </span>
                        </div>

                        <div v-if="order.data?.size || order.data?.color || order.data?.collected_details?.size || order.data?.collected_details?.color" class="flex items-center justify-between py-1 border-b border-outline/30 gap-2">
                          <span class="text-on-surface-variant">Variant:</span>
                          <span class="font-semibold text-on-surface">
                            {{ [order.data?.size || order.data?.collected_details?.size, order.data?.color || order.data?.collected_details?.color].filter(Boolean).join(' / ') }}
                          </span>
                        </div>

                        <div class="flex items-center justify-between py-1 border-b border-outline/30 gap-2">
                          <span class="text-on-surface-variant">Quantity:</span>
                          <span class="font-semibold text-on-surface">
                            {{ order.data?.quantity || order.data?.collected_details?.quantity || 1 }} pcs
                          </span>
                        </div>

                        <div v-if="order.data?.delivery_fee || order.data?.collected_details?.deliveryFee" class="flex items-center justify-between py-1 border-b border-outline/30 gap-2">
                          <span class="text-on-surface-variant">Delivery Fee:</span>
                          <span class="font-semibold text-on-surface">
                            ৳{{ order.data?.delivery_fee || order.data?.collected_details?.deliveryFee }}
                          </span>
                        </div>
                      </div>

                      <!-- Delivery Address -->
                      <div class="pt-2 border-t border-outline/40">
                        <span class="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block mb-0.5">Delivery Address</span>
                        <p class="text-on-surface text-xs font-medium break-words leading-relaxed">
                          {{ order.data?.address || order.data?.collected_details?.address || 'No address provided' }}
                        </p>
                      </div>
                    </div>

                    <!-- 3. Courier Status & Actions -->
                    <div class="space-y-3 p-4 rounded-xl bg-surface border border-outline min-w-0 flex flex-col justify-between">
                      <div>
                        <div class="font-bold text-on-surface border-b border-outline/40 pb-2 mb-3">
                          <span>Dispatch & Logistics</span>
                        </div>

                        <div v-if="order.data?.tracking_code" class="space-y-2">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-on-surface-variant">Tracking ID:</span>
                            <span class="font-mono font-bold text-primary select-all truncate">{{ order.data.tracking_code }}</span>
                          </div>
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-on-surface-variant">Courier Status:</span>
                            <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-hover text-on-surface border border-outline">
                              {{ order.data.delivery_status || 'Dispatched' }}
                            </span>
                          </div>
                        </div>
                        <div v-else class="space-y-2">
                          <span class="text-on-surface-variant text-[11px] block leading-relaxed">
                            Order is verified & paid. Ready for immediate parcel packaging and Steadfast courier booking.
                          </span>
                          <button 
                            @click.stop="$emit('send-to-steadfast', order.id)" 
                            :disabled="sendingToSteadfast"
                            class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary text-white hover:bg-primary-accent rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full shadow-xs disabled:opacity-50"
                          >
                            <span class="material-symbols-outlined text-sm">local_shipping</span>
                            Dispatch via Steadfast
                          </button>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 pt-4 border-t border-outline/30">
                        <button 
                          @click.stop="$emit('open-edit', order)" 
                          class="flex-1 py-2 px-3 rounded-xl bg-surface-hover hover:bg-primary/10 hover:text-primary border border-outline font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span class="material-symbols-outlined text-sm">edit</span>
                          Edit
                        </button>
                        <button 
                          @click.stop="$emit('delete', order.id)" 
                          class="py-2 px-3.5 rounded-xl bg-surface-hover hover:bg-red-500/10 text-on-surface hover:text-red-600 border border-outline font-semibold transition-colors flex items-center justify-center cursor-pointer"
                          title="Delete Order"
                        >
                          <span class="material-symbols-outlined text-sm">delete</span>
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
          Orders with confirmed payment transaction receipts (bKash, Nagad, Bank Cards) will appear here automatically.
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
              ? 'bg-primary text-white border-primary font-semibold' 
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
  paymentFilter: { type: String, default: 'all' },
  sendingToSteadfast: { type: Boolean, default: false }
})

defineEmits([
  'update:currentPage',
  'update:searchQuery',
  'update:startDate',
  'update:endDate',
  'update:activeTab',
  'update:paymentFilter',
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
  return 'bg-surface-hover text-on-surface border-outline/70'
}

const getOrderTotal = (order) => {
  const d = order.data || {}
  if (d.total) return d.total
  if (d.price) return d.price
  if (d.collected_details?.total) return d.collected_details.total
  if (d.collected_details?.price) return d.collected_details.price
  if (d.order && d.order.includes(':')) {
    const parts = d.order.split('|')
    for (const p of parts) {
      if (p.toLowerCase().includes('total')) {
        const val = p.split(':')[1]?.replace(/[^0-9.]/g, '').trim()
        if (val) return val
      }
    }
  }
  return '0'
}

const getPaymentBadge = (order) => {
  const d = order.data || {}
  const method = (d.payment_method || '').toLowerCase()
  const channel = (d.payment_channel || '').toLowerCase()
  const provider = (d.payment_provider || '').toLowerCase()
  const details = d.payment_details || {}
  const cardType = (details.card_type || d.card_type || '').toLowerCase()
  const cardBrand = (details.card_brand || d.card_brand || '').toLowerCase()
  const cardIssuer = (details.card_issuer || d.card_issuer || '').toLowerCase()

  const combined = `${method} ${channel} ${provider} ${cardType} ${cardBrand} ${cardIssuer}`.toLowerCase()

  // 1. bKash
  if (combined.includes('bkash')) {
    return {
      type: 'bkash',
      label: 'bKash',
      sublabel: provider === 'sslcommerz' ? 'via SSLCommerz' : 'Mobile Banking',
      badgeClass: 'bg-[#E2136E]/10 text-[#E2136E] border-[#E2136E]/30',
      dotClass: 'bg-[#E2136E]'
    }
  }

  // 2. Nagad
  if (combined.includes('nagad') || combined.includes('nogod')) {
    return {
      type: 'nagad',
      label: 'Nagad',
      sublabel: provider === 'sslcommerz' ? 'via SSLCommerz' : 'Mobile Banking',
      badgeClass: 'bg-[#F7941D]/10 text-[#EA580C] border-[#F7941D]/30',
      dotClass: 'bg-[#EA580C]'
    }
  }

  // 3. Rocket
  if (combined.includes('rocket')) {
    return {
      type: 'rocket',
      label: 'Rocket',
      sublabel: provider === 'sslcommerz' ? 'via SSLCommerz' : 'Dutch-Bangla Rocket',
      badgeClass: 'bg-[#8C3494]/10 text-[#8C3494] border-[#8C3494]/30',
      dotClass: 'bg-[#8C3494]'
    }
  }

  // 4. Bank / Card (Visa, Mastercard, Amex, Nexus, etc.)
  if (
    combined.includes('bank') ||
    combined.includes('visa') ||
    combined.includes('master') ||
    combined.includes('amex') ||
    combined.includes('nexus') ||
    cardType ||
    cardBrand ||
    cardIssuer
  ) {
    const brand = details.card_brand || (combined.includes('visa') ? 'Visa' : combined.includes('master') ? 'Mastercard' : 'Bank Card')
    const bank = details.bank_name || details.card_issuer || ''
    const shortLabel = bank ? bank.split(' ')[0] : `Bank (${brand})`

    return {
      type: 'bank',
      label: shortLabel.length > 18 ? shortLabel.slice(0, 18) + '...' : shortLabel,
      sublabel: details.card_type || (provider === 'sslcommerz' ? 'Card via SSLCommerz' : 'Cards & Net Banking'),
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      dotClass: 'bg-blue-500'
    }
  }

  // 5. Stripe
  if (combined.includes('stripe')) {
    return {
      type: 'stripe',
      label: 'Stripe',
      sublabel: 'Credit / Debit Card',
      badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      dotClass: 'bg-indigo-500'
    }
  }

  // 6. Generic Online Verified
  return {
    type: 'online',
    label: d.payment_method ? d.payment_method.toUpperCase() : 'Online Paid',
    sublabel: provider ? `via ${provider.toUpperCase()}` : 'Verified Payment',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500'
  }
}

const getPaymentChannelDetail = (order) => {
  const d = order.data || {}
  if (d.payment_channel) return d.payment_channel
  const details = d.payment_details || {}
  if (details.channel) return details.channel
  if (details.card_issuer && details.card_brand) {
    return `${details.card_issuer} (${details.card_brand})`
  }
  if (details.card_type) return details.card_type
  if (d.payment_method) {
    return d.payment_method.toUpperCase() + (d.payment_provider ? ` (${d.payment_provider.toUpperCase()})` : '')
  }
  return null
}
</script>
