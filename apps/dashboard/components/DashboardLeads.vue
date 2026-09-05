<template>
  <section class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header & Controls -->
    <div class="space-y-4 pb-2 border-b border-outline/40">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            
            <h2 class="text-xl font-bold tracking-tight text-on-surface">Customer Leads & Orders</h2>
          </div>
          <p class="text-xs text-on-surface-variant mt-1">
            Real-time orders and inquiries automatically gathered by your AI agents or added manually.
          </p>
        </div>

        <!-- Top Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Add Manual Lead Button -->
          <button 
            @click="$emit('open-create-lead')"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-accent shadow-xs transition-all cursor-pointer"
            title="Create New Order / Lead Manually"
          >
            <span class="material-symbols-outlined text-base">add_circle</span>
            Add Order
          </button>

          <button 
            @click="$emit('refresh')"
            :disabled="loading"
            class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-outline hover:bg-surface-hover text-on-surface transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh Leads"
          >
            <span class="material-symbols-outlined text-base text-primary" :class="loading ? 'animate-spin' : ''">refresh</span>
            Refresh
          </button>

          <button 
            @click="$emit('export-csv')"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-outline hover:bg-surface-hover text-on-surface transition-all shadow-xs cursor-pointer"
          >
            <span class="material-symbols-outlined text-base text-primary">download</span>
            Export CSV
          </button>

          <!-- Bulk Delete Button (When items are checked) -->
          <button 
            v-if="selectedLeads.length > 0"
            @click="$emit('bulk-delete')"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-outline hover:bg-surface-hover text-on-surface hover:text-primary transition-all shadow-xs cursor-pointer animate-in fade-in"
            title="Delete Selected Orders"
          >
            <span class="material-symbols-outlined text-base">delete_sweep</span>
            Delete {{ selectedLeads.length }} Selected
          </button>

          <!-- Bulk Dispatch Courier Button -->
          <button 
            v-if="selectedLeads.length > 0"
            @click="$emit('bulk-send-to-steadfast')"
            :disabled="sendingToSteadfast"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-accent transition-all shadow-xs disabled:opacity-50 cursor-pointer animate-in fade-in"
          >
            <span class="material-symbols-outlined text-base" :class="sendingToSteadfast ? 'animate-spin' : ''">local_shipping</span>
            Send {{ selectedLeads.length }} to Courier
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
            placeholder="Search by customer, phone, product, or Order ID..."
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
            v-for="tab in ['all', 'whatsapp', 'telegram', 'facebook', 'direct']" 
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
    </div>

    <!-- Data Table Container -->
    <div class="bg-surface border border-outline rounded-2xl overflow-hidden shadow-sm relative min-h-[350px]">
      <!-- Loading Overlay -->
      <div v-if="loading" class="absolute inset-0 z-20 bg-surface/70 backdrop-blur-xs flex items-center justify-center animate-in fade-in">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span class="text-xs font-medium text-on-surface-variant">Loading orders...</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr class="bg-surface-hover/50 border-b border-outline text-xs font-semibold text-on-surface-variant">
              <th class="py-3 px-3 w-10 text-center"></th>
              <th class="py-3 px-3 w-10 text-center">
                <input 
                  type="checkbox" 
                  :checked="isAllSelected" 
                  @change="toggleSelectAll" 
                  class="w-4 h-4 rounded text-primary border-outline focus:ring-primary/20 cursor-pointer" 
                />
              </th>
              <th class="py-3 px-4 w-12 text-center">#</th>
              <th class="py-3 px-4">Platform</th>
              <th class="py-3 px-4">Customer & Details</th>
              <th class="py-3 px-4">Order ID</th>
              <th class="py-3 px-4 text-right">Date & Time</th>
              <th class="py-3 px-4 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline/50 text-xs">
            <template v-for="(lead, index) in leads" :key="lead.id">
              <tr 
                @click="toggleLeadExpand(lead.id)"
                class="hover:bg-surface-hover/40 transition-colors cursor-pointer group"
                :class="{ 'bg-primary/5': expandedLeads.includes(lead.id) }"
              >
                <!-- Caret Toggle -->
                <td class="py-3.5 px-3 text-center">
                  <span 
                    class="material-symbols-outlined text-base text-on-surface-variant/50 group-hover:text-primary transition-transform inline-block"
                    :class="{ 'rotate-180': expandedLeads.includes(lead.id) }"
                  >
                    expand_more
                  </span>
                </td>

                <!-- Checkbox -->
                <td class="py-3.5 px-3 text-center" @click.stop>
                  <input 
                    type="checkbox" 
                    :checked="selectedLeads.includes(lead.id)" 
                    @change="toggleSelectLead(lead.id)" 
                    class="w-4 h-4 rounded text-primary border-outline focus:ring-primary/20 cursor-pointer" 
                  />
                </td>

                <!-- Row Number -->
                <td class="py-3.5 px-4 text-center font-mono text-on-surface-variant/60 font-medium">
                  {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                </td>

                <!-- Platform Tag -->
                <td class="py-3.5 px-4">
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border"
                    :class="getPlatformBadgeClass(lead.data?.platform)"
                  >
                    {{ lead.data?.platform || 'Direct' }}
                  </span>
                </td>

                <!-- Customer Info -->
                <td class="py-3.5 px-4">
                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-on-surface capitalize">{{ lead.data?.name || lead.data?.customer_name || lead.data?.customer || 'Customer' }}</span>
                      <span 
                        class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                        :class="getStatusBadgeClass(lead.data?.status)"
                      >
                        {{ lead.data?.status || 'Pending' }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span v-if="lead.data?.phone" class="font-medium text-primary">{{ lead.data.phone }}</span>
                      <span v-if="lead.data?.phone && lead.email" class="text-on-surface-variant/40">•</span>
                      <span class="truncate max-w-[200px]">{{ lead.email }}</span>
                    </div>
                  </div>
                </td>

                <!-- Order ID -->
                <td class="py-3.5 px-4" @click.stop>
                  <button 
                    @click="$emit('copy-text', lead.data?.invoice_number || lead.id)" 
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-hover hover:bg-primary/10 hover:text-primary border border-outline text-on-surface-variant text-xs font-mono transition-colors cursor-pointer group/id"
                    title="Click to copy full ID"
                  >
                    <span>#{{ lead.data?.invoice_number || lead.id.slice(0, 8) }}</span>
                    <span class="material-symbols-outlined text-xs opacity-50 group-hover/id:opacity-100">content_copy</span>
                  </button>
                </td>

                <!-- Time -->
                <td class="py-3.5 px-4 text-right text-on-surface-variant font-medium whitespace-nowrap">
                  <div>{{ new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
                  <div class="text-[10px] text-on-surface-variant/60">{{ new Date(lead.created_at).toLocaleDateString() }}</div>
                </td>

                <!-- Inline Action Buttons (Edit & Delete One-by-One) -->
                <td class="py-3.5 px-4 text-center" @click.stop>
                  <div class="inline-flex items-center gap-1">
                    <button 
                      @click="$emit('open-edit', lead)" 
                      class="p-1.5 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors cursor-pointer" 
                      title="Edit this Lead"
                    >
                      <span class="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button 
                      @click="$emit('delete', lead.id)" 
                      class="p-1.5 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors cursor-pointer" 
                      title="Delete this Lead"
                    >
                      <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Expanded Details Row -->
              <tr v-if="expandedLeads.includes(lead.id)" class="bg-surface-hover/20">
                <td colspan="8" class="p-4 sm:p-6 bg-surface-hover/30 border-b border-outline">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                    <!-- Order Items Breakdown -->
                    <div class="space-y-2 p-3.5 rounded-xl bg-surface border border-outline min-w-0">
                      <div class="font-semibold text-on-surface">
                        <span>Order Items & Details</span>
                      </div>
                      <div v-if="lead.data?.order && lead.data.order.includes(':')" class="space-y-1 pt-1">
                        <div 
                          v-for="(part, i) in lead.data.order.split('|')" 
                          :key="i"
                          class="flex items-center justify-between py-1 border-b border-outline/40 last:border-0 gap-2"
                        >
                          <span class="text-on-surface-variant truncate">{{ part.split(':')[0]?.trim() }}</span>
                          <span class="font-semibold text-on-surface shrink-0">{{ part.split(':')[1]?.trim() }}</span>
                        </div>
                      </div>
                      <div v-else-if="lead.data?.product" class="space-y-1 pt-1">
                        <div class="flex items-center justify-between py-1 border-b border-outline/40 gap-2">
                          <span class="text-on-surface-variant">Product</span>
                          <span class="font-semibold text-on-surface">{{ lead.data.product }}</span>
                        </div>
                        <div v-if="lead.data?.size || lead.data?.color" class="flex items-center justify-between py-1 border-b border-outline/40 gap-2">
                          <span class="text-on-surface-variant">Variant</span>
                          <span class="font-semibold text-on-surface">{{ [lead.data.size, lead.data.color].filter(Boolean).join(' / ') }}</span>
                        </div>
                        <div v-if="lead.data?.quantity" class="flex items-center justify-between py-1 border-b border-outline/40 gap-2">
                          <span class="text-on-surface-variant">Quantity</span>
                          <span class="font-semibold text-on-surface">{{ lead.data.quantity }} pcs</span>
                        </div>
                        <div v-if="lead.data?.delivery_fee" class="flex items-center justify-between py-1 border-b border-outline/40 gap-2">
                          <span class="text-on-surface-variant">Delivery Fee</span>
                          <span class="font-semibold text-on-surface">৳{{ lead.data.delivery_fee }}</span>
                        </div>
                        <div v-if="lead.data?.total || lead.data?.price" class="flex items-center justify-between py-1 border-b border-outline/40 gap-2">
                          <span class="text-on-surface-variant">Total</span>
                          <span class="font-bold text-primary">৳{{ lead.data.total || lead.data.price }}</span>
                        </div>
                        <div v-if="lead.data?.payment_method" class="flex items-center justify-between py-1 gap-2">
                          <span class="text-on-surface-variant">Method</span>
                          <span class="font-semibold text-on-surface uppercase">{{ lead.data.payment_method }}</span>
                        </div>
                      </div>
                      <p v-else class="text-on-surface font-medium pt-1 break-words">
                        {{ lead.data?.order || 'No specific order items listed' }}
                      </p>

                      <div v-if="lead.data?.address" class="pt-2 border-t border-outline/30">
                        <span class="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block mb-0.5">Delivery Address</span>
                        <p class="text-on-surface text-xs font-medium break-words leading-relaxed">{{ lead.data.address }}</p>
                      </div>
                    </div>

                    <!-- Courier & Fulfillment -->
                    <div class="space-y-2 p-3.5 rounded-xl bg-surface border border-outline min-w-0">
                      <div class="font-semibold text-on-surface">
                        <span>Courier Dispatch</span>
                      </div>

                      <div v-if="lead.data?.tracking_code" class="space-y-1.5 pt-1">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-on-surface-variant">Tracking:</span>
                          <span class="font-mono font-semibold text-primary select-all truncate">{{ lead.data.tracking_code }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-on-surface-variant">Status:</span>
                          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-hover text-on-surface border border-outline">
                            {{ lead.data.delivery_status || 'Handed Over' }}
                          </span>
                        </div>
                      </div>
                      <div v-else class="pt-1 flex flex-col gap-2">
                        <span class="text-on-surface-variant text-[11px]">Not dispatched to courier yet.</span>
                        <button 
                          @click.stop="$emit('send-to-steadfast', lead.id)" 
                          :disabled="sendingToSteadfast"
                          class="inline-flex items-center justify-center px-3.5 py-2 bg-primary text-white hover:bg-primary-accent rounded-xl text-xs font-semibold transition-colors cursor-pointer w-max shadow-xs disabled:opacity-50"
                        >
                          Dispatch via Steadfast
                        </button>
                      </div>
                    </div>

                    <!-- Action Controls -->
                    <div class="space-y-2 p-3.5 rounded-xl bg-surface border border-outline min-w-0 flex flex-col justify-between">
                      <div>
                        <div class="font-semibold text-on-surface mb-1">
                          <span>Record Controls</span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant leading-relaxed">
                          Update order status, change details, or archive this customer lead.
                        </p>
                      </div>

                      <div class="flex items-center gap-2 pt-2">
                        <button 
                          @click.stop="$emit('open-edit', lead)" 
                          class="flex-1 py-2 px-3 rounded-xl bg-surface-hover hover:bg-primary/10 hover:text-primary border border-outline font-semibold transition-colors flex items-center justify-center cursor-pointer"
                        >
                          Edit Details
                        </button>
                        <button 
                          @click.stop="$emit('delete', lead.id)" 
                          class="py-2 px-3.5 rounded-xl bg-surface-hover hover:bg-primary/10 text-on-surface hover:text-primary border border-outline font-semibold transition-colors flex items-center justify-center cursor-pointer"
                        >
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
      <div v-if="leads.length === 0 && !loading" class="py-16 text-center space-y-2">
        <span class="material-symbols-outlined text-4xl text-on-surface-variant/30">inventory_2</span>
        <h4 class="text-sm font-semibold text-on-surface">No records found</h4>
        <p class="text-xs text-on-surface-variant max-w-sm mx-auto">
          No customer leads match your current search and platform filter criteria.
        </p>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="px-5 py-4 bg-surface border-t border-outline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span class="text-on-surface-variant">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalLeads) }} of {{ totalLeads }} orders
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
import { ref, computed } from 'vue'

const props = defineProps({
  leads: { type: Array, required: true },
  loading: { type: Boolean, required: true },
  currentPage: { type: Number, required: true },
  itemsPerPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalLeads: { type: Number, required: true },
  searchQuery: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  activeTab: { type: String, required: true },
  selectedLeads: { type: Array, required: true },
  sendingToSteadfast: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:currentPage',
  'update:searchQuery',
  'update:startDate',
  'update:endDate',
  'update:activeTab',
  'update:selectedLeads',
  'open-create-lead',
  'open-edit',
  'delete',
  'bulk-delete',
  'send-to-steadfast',
  'bulk-send-to-steadfast',
  'export-csv',
  'copy-text',
  'refresh'
])

const expandedLeads = ref([])

const toggleLeadExpand = (leadId) => {
  const index = expandedLeads.value.indexOf(leadId)
  if (index > -1) {
    expandedLeads.value.splice(index, 1)
  } else {
    expandedLeads.value.push(leadId)
  }
}

const isAllSelected = computed(() => {
  if (props.leads.length === 0) return false
  return props.leads.every(lead => props.selectedLeads.includes(lead.id))
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    emit('update:selectedLeads', [])
  } else {
    emit('update:selectedLeads', props.leads.map(lead => lead.id))
  }
}

const toggleSelectLead = (id) => {
  const index = props.selectedLeads.indexOf(id)
  const updated = [...props.selectedLeads]
  if (index > -1) {
    updated.splice(index, 1)
  } else {
    updated.push(id)
  }
  emit('update:selectedLeads', updated)
}

const getPlatformBadgeClass = (platform) => {
  return 'bg-surface-hover text-on-surface border-outline/70'
}

const getStatusBadgeClass = (status) => {
  return 'bg-primary/10 text-primary border-primary/20'
}
</script>
