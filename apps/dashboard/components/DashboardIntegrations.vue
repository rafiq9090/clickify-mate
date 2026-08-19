<template>
  <section class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="pb-2 border-b border-outline/40">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-xl">settings</span>
        </div>
        <h2 class="text-xl font-bold tracking-tight text-on-surface">Store Settings &amp; Integrations</h2>
      </div>
      <p class="text-xs text-on-surface-variant mt-1">
        Configure automated courier dispatch, mobile banking payment accounts, and external store sync.
      </p>
    </div>

    <div class="space-y-5">
      <!-- 1. Steadfast Courier Integration Card -->
      <div class="bg-surface border border-outline rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-outline/40 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <span class="material-symbols-outlined text-xl">local_shipping</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-on-surface">Steadfast Courier Logistics</h3>
              <p class="text-xs text-on-surface-variant">Automate parcel booking and tracking code generation directly from customer orders.</p>
            </div>
          </div>

          <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">
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

      <!-- 2. Payment Accounts & Gateways Card -->
      <div class="bg-surface border border-outline rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-outline/40 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <span class="material-symbols-outlined text-xl">payments</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-on-surface">Payment &amp; Mobile Banking Accounts</h3>
              <p class="text-xs text-on-surface-variant">Accounts provided to customers during chat for advance payments or full checkout.</p>
            </div>
          </div>

          <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            bKash / Nagad / Gateway
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="space-y-1">
            <label class="font-medium text-on-surface-variant">bKash Merchant / Personal Number</label>
            <input 
              :value="integrations.sslcommerz_store_id"
              @input="$emit('update:integration-field', { field: 'sslcommerz_store_id', value: $event.target.value })"
              placeholder="e.g. 017XXXXXXXX (Personal / Merchant)" 
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
            />
          </div>

          <div class="space-y-1">
            <label class="font-medium text-on-surface-variant">Nagad / Rocket Number</label>
            <input 
              :value="integrations.sslcommerz_store_password"
              @input="$emit('update:integration-field', { field: 'sslcommerz_store_password', value: $event.target.value })"
              placeholder="e.g. 018XXXXXXXX" 
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
            />
          </div>
        </div>
      </div>

      <!-- 3. External Store Sync (Shopify / WooCommerce) -->
      <div class="bg-surface border border-outline rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div class="flex items-center gap-3 border-b border-outline/40 pb-3">
          <div class="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <span class="material-symbols-outlined text-xl">store</span>
          </div>
          <div>
            <h3 class="text-sm font-bold text-on-surface">Store Connection (Optional)</h3>
            <p class="text-xs text-on-surface-variant">Choose your product inventory source.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
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
            <label class="font-medium text-on-surface-variant">Store Domain URL</label>
            <input 
              :value="integrations.shop_api_url"
              @input="$emit('update:integration-field', { field: 'shop_api_url', value: $event.target.value })"
              placeholder="https://mystore.myshopify.com" 
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
            />
          </div>

          <div class="space-y-1" v-if="integrations.shop_type !== 'mock'">
            <label class="font-medium text-on-surface-variant">Store API Key / Access Token</label>
            <input 
              :value="integrations.shop_api_key"
              @input="$emit('update:integration-field', { field: 'shop_api_key', value: $event.target.value })"
              type="password" 
              placeholder="API Access Token" 
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
            />
          </div>
        </div>
      </div>

      <!-- 4. Developer API Keys -->
      <div class="bg-surface border border-outline rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline/40 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <span class="material-symbols-outlined text-xl">vpn_key</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-on-surface">Developer API Tokens</h3>
              <p class="text-xs text-on-surface-variant">Use API keys to automatically pull leads and orders into your custom website.</p>
            </div>
          </div>

          <button 
            @click="$emit('generate-api-key')" 
            :disabled="generatingApiKey"
            class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-accent shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-sm">add</span>
            {{ generatingApiKey ? 'Generating...' : 'Generate New Key' }}
          </button>
        </div>

        <div v-if="apiKeys.length > 0" class="space-y-2">
          <div 
            v-for="key in apiKeys" 
            :key="key.id" 
            class="flex items-center justify-between p-3 rounded-xl bg-surface-hover border border-outline text-xs"
          >
            <div class="min-w-0 pr-2">
              <span class="font-semibold text-on-surface block truncate">{{ key.name }}</span>
              <span class="text-[11px] text-on-surface-variant font-mono">Created {{ new Date(key.created_at).toLocaleDateString() }}</span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <div class="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-lg border border-outline">
                <span class="font-mono text-xs text-primary font-semibold">...{{ key.key_value.slice(-10) }}</span>
                <button 
                  @click.stop="$emit('copy-text', key.key_value)" 
                  class="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" 
                  title="Copy Key"
                >
                  <span class="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>

              <button 
                @click="$emit('delete-api-key', key.id)" 
                class="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer" 
                title="Revoke Key"
              >
                <span class="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="py-4 text-center text-xs text-on-surface-variant border border-dashed border-outline rounded-xl">
          No API Keys generated yet.
        </div>
      </div>

      <!-- Save Credentials Action Button -->
      <button 
        @click="$emit('save-integrations')" 
        :disabled="savingIntegrations" 
        class="w-full py-3.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
      >
        <span class="material-symbols-outlined text-base">save</span>
        {{ savingIntegrations ? 'Saving Changes...' : 'Save All Settings' }}
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  integrations: { type: Object, required: true },
  savingIntegrations: { type: Boolean, required: true },
  apiKeys: { type: Array, required: true },
  generatingApiKey: { type: Boolean, required: true }
})

defineEmits([
  'update:integration-field',
  'save-integrations',
  'generate-api-key',
  'delete-api-key',
  'copy-text'
])
</script>
