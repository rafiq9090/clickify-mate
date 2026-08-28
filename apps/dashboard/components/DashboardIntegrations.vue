<template>
  <section class="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="pb-2 border-b border-outline/40">
      <div class="flex items-center gap-2.5">
        
        <h2 class="text-xl font-bold tracking-tight text-on-surface">Store Settings &amp; Integrations</h2>
      </div>
      <p class="text-xs text-on-surface-variant mt-1">
        Configure automated courier dispatch, mobile banking payment accounts, and external store sync.
      </p>
    </div>

    <div class="space-y-4 sm:space-y-5 w-full min-w-0">
      <!-- 1. Steadfast Courier Integration Card -->
      <div class="bg-surface border border-outline rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 w-full min-w-0">
        <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 border-b border-outline/40 pb-3">
          <div class="flex items-center gap-3 min-w-0">
           
            <div class="min-w-0">
              <h3 class="text-sm font-bold text-on-surface">Steadfast Courier Logistics</h3>
              <p class="text-xs text-on-surface-variant line-clamp-2 sm:line-clamp-none">Automate parcel booking and tracking code generation directly from customer orders.</p>
            </div>
          </div>

          <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20 shrink-0">
            Courier Partner
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="space-y-1">
            <label class="font-medium text-on-surface-variant">Steadfast API Key</label>
            <input 
              :value="integrations.steadfast_api_key"
              @input="$emit('update:integration-field', { field: 'steadfast_api_key', value: $event.target.value })"
              type="password" 
              placeholder="Paste Steadfast API Key" 
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
            />
          </div>

          <div class="space-y-1">
            <label class="font-medium text-on-surface-variant">Steadfast Secret Key</label>
            <input 
              :value="integrations.steadfast_secret_key"
              @input="$emit('update:integration-field', { field: 'steadfast_secret_key', value: $event.target.value })"
              type="password" 
              placeholder="Paste Steadfast Secret Key" 
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
            />
          </div>
        </div>
      </div>

      <!-- 2. Payment Accounts moved to the dedicated secure workspace -->
      <div class="bg-surface border border-outline rounded-2xl p-4 sm:p-6 shadow-sm w-full min-w-0">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            
            <div>
              <h3 class="text-sm font-bold text-on-surface">Payment Gateway Accounts</h3>
              <p class="text-xs text-on-surface-variant">bKash, Nagad, and Stripe merchant accounts have a separate encrypted settings area.</p>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 w-full sm:w-auto"
            @click="$emit('switch-tab', 'payment-gateways')"
          >
            Manage gateways
            <span class="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>

      <!-- 3. External Store Sync (Shopify / WooCommerce) -->
      <div class="bg-surface border border-outline rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 w-full min-w-0">
        <div class="flex items-center gap-3 border-b border-outline/40 pb-3">
          
          <div>
            <h3 class="text-sm font-bold text-on-surface">Store Connection (Optional)</h3>
            <p class="text-xs text-on-surface-variant">Choose your product inventory source.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div class="space-y-1">
            <label class="font-medium text-on-surface-variant">Inventory Source</label>
            <select 
              :value="integrations.shop_type || 'mock'"
              @change="$emit('update:integration-field', { field: 'shop_type', value: $event.target.value })"
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs font-medium text-on-surface outline-none focus:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="mock">Built-in Product Catalog</option>
              <option value="shopify">Shopify Store</option>
              <option value="woocommerce">WooCommerce Store</option>
            </select>
          </div>

          <div class="space-y-1" v-if="integrations.shop_type !== 'mock'">
            <label class="font-medium text-on-surface-variant">
              {{ integrations.shop_type === 'shopify' ? 'Shopify Domain (*.myshopify.com)' : 'WordPress / WooCommerce URL' }}
            </label>
            <input 
              :value="integrations.shop_api_url"
              @input="$emit('update:integration-field', { field: 'shop_api_url', value: $event.target.value })"
              :placeholder="integrations.shop_type === 'shopify' ? 'mystore.myshopify.com' : 'https://mywordpress.com'" 
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
            />
          </div>

          <div class="space-y-1" v-if="integrations.shop_type !== 'mock'">
            <label class="font-medium text-on-surface-variant">
              {{ integrations.shop_type === 'shopify' ? 'Admin API Access Token (shpat_...)' : 'Consumer Key (ck_...)' }}
            </label>
            <input 
              :value="integrations.shop_api_key"
              @input="$emit('update:integration-field', { field: 'shop_api_key', value: $event.target.value })"
              type="password" 
              :placeholder="integrations.shop_type === 'shopify' ? 'shpat_xxxx...' : 'ck_xxxx...'" 
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
            />
          </div>

          <div class="space-y-1" v-if="integrations.shop_type === 'woocommerce'">
            <label class="font-medium text-on-surface-variant">Consumer Secret (cs_...)</label>
            <input 
              :value="integrations.shop_api_secret"
              @input="$emit('update:integration-field', { field: 'shop_api_secret', value: $event.target.value })"
              type="password" 
              placeholder="cs_xxxx..." 
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
            />
          </div>
        </div>
      </div>

      <!-- Save Credentials Action Button -->
      <button 
        @click="$emit('save-integrations')" 
        :disabled="savingIntegrations" 
        class="w-full py-3.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
      >
        {{ savingIntegrations ? 'Saving Changes...' : 'Save All Settings' }}
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  integrations: { type: Object, required: true },
  savingIntegrations: { type: Boolean, required: true }
})

defineEmits([
  'update:integration-field',
  'save-integrations',
  'copy-text',
  'switch-tab'
])
</script>
