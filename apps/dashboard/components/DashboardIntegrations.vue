<template>
  <section class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-black tracking-tight flex items-center gap-3 text-on-surface">
        <span class="w-2 h-8 bg-secondary rounded-full"></span>
        System Settings & Integrations
      </h2>
    </div>

    <!-- Integration Credentials -->
    <div class="bg-surface/40 border border-outline/60 p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
      <div class="absolute -right-4 -top-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl"></div>
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-lg text-secondary">settings</span>
          Business Integrations
        </h3>
        <button @click="showIntegrations = !showIntegrations" class="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white flex items-center gap-1 transition-colors">
          <span class="material-symbols-outlined text-sm">{{ showIntegrations ? 'expand_less' : 'expand_more' }}</span>
          {{ showIntegrations ? 'Collapse' : 'Configure' }}
        </button>
      </div>

      <div v-show="showIntegrations" class="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
        <p class="text-[10px] font-medium text-on-surface-variant/60 leading-relaxed">These credentials are stored securely per agent. The VPS backend reads them dynamically for each shop owner.</p>

        <!-- Store Inventory Connection -->
        <div class="space-y-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
          <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-400">
            <span class="material-symbols-outlined text-sm">database</span>
            Store Inventory Connection
          </div>
          <p class="text-[10px] font-medium text-on-surface-variant/60">Connect your Shopify or WooCommerce store to enable live stock scanning and automated order syncing. Select 'Mock Demo Store' to test using the local mock inventory database.</p>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">Store Type</span>
              <select 
                :value="integrations.shop_type"
                @change="$emit('update:integration-field', { field: 'shop_type', value: $event.target.value })"
                class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-emerald-400/50 transition-colors"
              >
                <option value="mock" class="bg-surface text-white">Mock Demo Store</option>
                <option value="shopify" class="bg-surface text-white">Shopify Store</option>
                <option value="woocommerce" class="bg-surface text-white">WooCommerce Store</option>
                <option value="custom" class="bg-surface text-white">Custom REST API</option>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">Store URL / Domain</span>
              <input 
                :value="integrations.shop_api_url"
                @input="$emit('update:integration-field', { field: 'shop_api_url', value: $event.target.value })"
                placeholder="e.g. https://api.mycustomshop.com" 
                class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-emerald-400/50 transition-colors placeholder:text-white/15" 
              />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">API Access Token / Client Key</span>
              <input 
                :value="integrations.shop_api_key"
                @input="$emit('update:integration-field', { field: 'shop_api_key', value: $event.target.value })"
                type="password" 
                placeholder="Bearer Token / API Key" 
                class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-emerald-400/50 transition-colors placeholder:text-white/15" 
              />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">API Secret / Consumer Secret</span>
              <input 
                :value="integrations.shop_api_secret"
                @input="$emit('update:integration-field', { field: 'shop_api_secret', value: $event.target.value })"
                type="password" 
                placeholder="Secret Key (Optional)" 
                class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-emerald-400/50 transition-colors placeholder:text-white/15" 
              />
            </div>
          </div>

          <!-- Developer Integration Info for Custom API -->
          <div v-if="integrations.shop_type === 'custom'" class="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] text-white/80 space-y-2">
            <div class="font-black text-emerald-400 uppercase flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">terminal</span>
              Custom REST API Connection Documentation
            </div>
            <p class="text-[10px] text-on-surface-variant/70">To connect any custom store or database (e.g. PHP Laravel, Node.js, Python), implement these endpoints on your server:</p>
            <div class="space-y-3 pl-2">
              <div>
                <div class="font-bold text-on-surface">1. Real-Time Stock Check</div>
                <div class="font-mono bg-black/40 px-2 py-1 rounded text-white/90 inline-block mt-0.5">GET [Store URL]/inventory?query=[Search Term]</div>
                <div class="text-[9px] text-on-surface-variant/60 mt-0.5">Expected Response:</div>
                <pre class="bg-black/30 p-2 rounded text-[8px] font-mono mt-1 overflow-x-auto text-emerald-300">
{
  "success": true,
  "products": [
    {
      "name": "Blue Denim Jacket",
      "price": 1850,
      "stock": 25
    }
  ]
}</pre>
              </div>
              <div>
                <div class="font-bold text-on-surface">2. Automatic Order Sync / Confirmation</div>
                <div class="font-mono bg-black/40 px-2 py-1 rounded text-white/90 inline-block mt-0.5">POST [Store URL]/orders</div>
                <div class="text-[9px] text-on-surface-variant/60 mt-0.5">Incoming Request Body:</div>
                <pre class="bg-black/30 p-2 rounded text-[8px] font-mono mt-1 overflow-x-auto text-orange-300">
{
  "item": "Blue Denim Jacket",
  "qty": 1,
  "customer": {
    "name": "Rafiq",
    "phone": "017XXXXXXXX",
    "address": "Mirpur, Dhaka"
  },
  "payment_method": "cod",
  "payment_transaction_id": ""
}</pre>
                <div class="text-[9px] text-on-surface-variant/60 mt-1">Expected Response:</div>
                <pre class="bg-black/30 p-2 rounded text-[8px] font-mono mt-1 overflow-x-auto text-emerald-300">
{
  "success": true,
  "order_id": "98745",
  "total_price": 1850
}</pre>
              </div>
            </div>
            <div class="text-[9px] text-on-surface-variant/50 border-t border-white/5 pt-2">
              * All requests will include an <code>Authorization: Bearer [API Access Token]</code> header for secure access validation.
            </div>
          </div>
        </div>

        <!-- Steadfast Courier -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-orange-400">
            <span class="material-symbols-outlined text-sm">local_shipping</span>
            Steadfast Courier
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input 
              :value="integrations.steadfast_api_key"
              @input="$emit('update:integration-field', { field: 'steadfast_api_key', value: $event.target.value })"
              type="password" 
              placeholder="API Key" 
              class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/15" 
            />
            <input 
              :value="integrations.steadfast_secret_key"
              @input="$emit('update:integration-field', { field: 'steadfast_secret_key', value: $event.target.value })"
              type="password" 
              placeholder="Secret Key" 
              class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/15" 
            />
            <input 
              :value="integrations.steadfast_webhook_url"
              @input="$emit('update:integration-field', { field: 'steadfast_webhook_url', value: $event.target.value })"
              placeholder="Webhook URL (optional)" 
              class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/15" 
            />
          </div>
        </div>

        <!-- Twilio -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-400">
            <span class="material-symbols-outlined text-sm">call</span>
            Twilio (IVR Calls)
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input 
              :value="integrations.twilio_account_sid"
              @input="$emit('update:integration-field', { field: 'twilio_account_sid', value: $event.target.value })"
              type="password" 
              placeholder="Account SID" 
              class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-red-400/50 transition-colors placeholder:text-white/15" 
            />
            <input 
              :value="integrations.twilio_auth_token"
              @input="$emit('update:integration-field', { field: 'twilio_auth_token', value: $event.target.value })"
              type="password" 
              placeholder="Auth Token" 
              class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-red-400/50 transition-colors placeholder:text-white/15" 
            />
            <input 
              :value="integrations.twilio_phone_number"
              @input="$emit('update:integration-field', { field: 'twilio_phone_number', value: $event.target.value })"
              placeholder="Phone Number (+880...)" 
              class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-red-400/50 transition-colors placeholder:text-white/15" 
            />
          </div>
        </div>

        <!-- SSLCommerz -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-400">
            <span class="material-symbols-outlined text-sm">payment</span>
            SSLCommerz / bKash
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input 
              :value="integrations.sslcommerz_store_id"
              @input="$emit('update:integration-field', { field: 'sslcommerz_store_id', value: $event.target.value })"
              placeholder="Store ID" 
              class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-blue-400/50 transition-colors placeholder:text-white/15" 
            />
            <input 
              :value="integrations.sslcommerz_store_password"
              @input="$emit('update:integration-field', { field: 'sslcommerz_store_password', value: $event.target.value })"
              type="password" 
              placeholder="Store Password" 
              class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-blue-400/50 transition-colors placeholder:text-white/15" 
            />
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  :checked="integrations.sslcommerz_sandbox" 
                  @change="$emit('update:integration-field', { field: 'sslcommerz_sandbox', value: $event.target.checked })"
                  class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-primary focus:ring-primary/20 cursor-pointer" 
                />
                <span class="text-[10px] font-bold text-white/60">Sandbox Mode</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Developer API Keys (Incoming Connections) -->
        <div class="space-y-4 p-5 bg-white/5 border border-white/5 rounded-2xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
              <span class="material-symbols-outlined text-sm">vpn_key</span>
              Developer API Keys
            </div>
            <button @click="$emit('generate-api-key')" :disabled="generatingApiKey" class="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50">
              {{ generatingApiKey ? 'Generating...' : '+ Generate API Key' }}
            </button>
          </div>
          <p class="text-[10px] font-medium text-on-surface-variant/60">Generate secure API keys to connect your external custom websites (Laravel, Node, etc.) to this agent platform, letting you pull customer leads and orders automatically.</p>

          <!-- API Keys List -->
          <div v-if="apiKeys.length > 0" class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            <div v-for="key in apiKeys" :key="key.id" class="flex items-center justify-between p-3 bg-surface border border-white/5 rounded-xl text-[10px] font-bold text-white">
              <div class="flex flex-col gap-1 min-w-0">
                <span class="text-white font-black truncate max-w-[120px] md:max-w-[200px]">{{ key.name }}</span>
                <span class="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">Created: {{ new Date(key.created_at).toLocaleDateString() }}</span>
              </div>
              <div class="flex items-center gap-2">
                <!-- Obfuscated key view with copy option -->
                <div class="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                  <span class="font-mono text-[9px] text-primary/80">...{{ key.key_value.slice(-10) }}</span>
                  <button @click.stop="$emit('copy-text', key.key_value)" class="text-on-surface-variant/60 hover:text-white transition-colors cursor-pointer" title="Copy Key">
                    <span class="material-symbols-outlined text-[10px]">content_copy</span>
                  </button>
                </div>
                <button @click="$emit('delete-api-key', key.id)" class="text-red-400/80 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors" title="Revoke Key">
                  <span class="material-symbols-outlined text-xs">delete</span>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/30 bg-black/20 border border-dashed border-white/5 rounded-xl">
            No Active API Keys Found
          </div>

          <!-- Developer Integration Info -->
          <div v-if="apiKeys.length > 0" class="p-3 bg-primary/5 border border-primary/10 rounded-xl text-[9px] text-white/80 space-y-2">
            <div class="font-black text-primary/80 uppercase">🔗 Pull Data via API:</div>
            <ul class="space-y-1.5 font-mono text-[8px] text-on-surface-variant/80">
              <li>
                <span class="text-emerald-400">GET</span> /api/external/leads<br>
                <span class="text-white/40 pl-2">Fetch customer leads</span>
              </li>
              <li>
                <span class="text-emerald-400">GET</span> /api/external/orders<br>
                <span class="text-white/40 pl-2">Fetch prepaid orders</span>
              </li>
            </ul>
            <p class="text-[8px] text-on-surface-variant/50 pt-1 border-t border-white/5">
              Send header: <code>Authorization: Bearer [Your Key]</code>
            </p>
          </div>
        </div>

        <button @click="$emit('save-integrations')" :disabled="savingIntegrations" class="w-full py-4 bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-sm">save</span>
          {{ savingIntegrations ? 'Saving...' : 'Save Integration Credentials' }}
        </button>
      </div>
    </div>

    <!-- Mock Inventory Database (Demo Testing) -->
    <div class="bg-surface/40 border border-outline/60 p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
      <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl"></div>
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-lg text-emerald-400">database</span>
          Mock Inventory Database (Demo Testing)
        </h3>
        <button @click="showInventory = !showInventory" class="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white flex items-center gap-1 transition-colors">
          <span class="material-symbols-outlined text-sm">{{ showInventory ? 'expand_less' : 'expand_more' }}</span>
          {{ showInventory ? 'Collapse' : 'Manage' }}
        </button>
      </div>

      <div v-show="showInventory" class="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
        <p class="text-[10px] font-medium text-on-surface-variant/60 leading-relaxed">
          This local database is simulated to represent physical products in stock. When agents are set to <strong>Mock Demo Store</strong>, they will query this inventory and deduct quantities automatically when orders are placed.
        </p>

        <!-- Inventory Table -->
        <div class="overflow-x-auto border border-white/5 rounded-2xl bg-black/20">
          <table class="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr class="border-b border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-wider text-white/55">
                <th class="p-4">Product Name</th>
                <th class="p-4">SKU Code</th>
                <th class="p-4">Size</th>
                <th class="p-4">Color</th>
                <th class="p-4 text-right">Price</th>
                <th class="p-4 text-center">In Stock</th>
                <th class="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in mockInventory" :key="item.sku" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="p-4 font-bold text-on-surface">{{ item.name }}</td>
                <td class="p-4 font-mono font-medium text-emerald-400">{{ item.sku }}</td>
                <td class="p-4 font-medium text-white/60">{{ item.size }}</td>
                <td class="p-4 font-medium text-white/60">{{ item.color }}</td>
                <td class="p-4 text-right font-black text-on-surface">৳{{ item.price }}</td>
                <td class="p-4 text-center">
                  <span :class="[
                    'px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                    item.stock_quantity > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  ]">
                    {{ item.stock_quantity > 0 ? `${item.stock_quantity} available` : 'OUT OF STOCK' }}
                  </span>
                </td>
                <td class="p-4 text-center">
                  <button @click="$emit('remove-product', item.sku)" class="text-red-400/80 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-all" title="Remove Product">
                    <span class="material-symbols-outlined text-xs">delete</span>
                  </button>
                </td>
              </tr>
              <tr v-if="mockInventory.length === 0">
                <td colspan="7" class="p-8 text-center text-[9px] font-black uppercase tracking-widest text-on-surface-variant/30">
                  No Mock Products Configured
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Add Product Form -->
        <div class="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
          <div class="text-[9px] font-black uppercase tracking-widest text-white/70 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm text-primary">add_box</span>
            Quick Add Mock Product
          </div>
          <div class="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div class="flex flex-col gap-1 md:col-span-2">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">Product Name</span>
              <input v-model="newProduct.name" placeholder="e.g. Silk Pajama" class="w-full bg-white/5 px-3 py-2.5 rounded-xl text-[10px] font-bold text-white border border-white/10 outline-none focus:border-primary/50 transition-colors placeholder:text-white/10" />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">SKU</span>
              <input v-model="newProduct.sku" placeholder="SKU-CODE" class="w-full bg-white/5 px-3 py-2.5 rounded-xl text-[10px] font-mono text-white border border-white/10 outline-none focus:border-primary/50 transition-colors placeholder:text-white/10" />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">Size</span>
              <input v-model="newProduct.size" placeholder="e.g. M / L / 42" class="w-full bg-white/5 px-3 py-2.5 rounded-xl text-[10px] font-bold text-white border border-white/10 outline-none focus:border-primary/50 transition-colors placeholder:text-white/10" />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">Color</span>
              <input v-model="newProduct.color" placeholder="e.g. Red" class="w-full bg-white/5 px-3 py-2.5 rounded-xl text-[10px] font-bold text-white border border-white/10 outline-none focus:border-primary/50 transition-colors placeholder:text-white/10" />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">Price (৳)</span>
              <input v-model.number="newProduct.price" type="number" class="w-full bg-white/5 px-3 py-2.5 rounded-xl text-[10px] font-bold text-white border border-white/10 outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">Stock Qty</span>
              <input v-model.number="newProduct.stock_quantity" type="number" class="w-full bg-white/5 px-3 py-2.5 rounded-xl text-[10px] font-bold text-white border border-white/10 outline-none focus:border-primary/50 transition-colors" />
            </div>
          </div>
          <div class="flex justify-end">
            <button @click="handleAddProduct" class="px-5 py-2.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95">
              + Add to List
            </button>
          </div>
        </div>

        <!-- Bottom Controls -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button @click="$emit('save-inventory')" :disabled="savingInventory" class="w-full py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">save</span>
            {{ savingInventory ? 'Saving...' : 'Save Inventory Changes' }}
          </button>
          <button @click="$emit('reset-inventory')" class="w-full py-4 bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">restart_alt</span>
            Reset to Default Demo Data
          </button>
        </div>

        <!-- Help Guideline / testing data -->
        <div class="p-5 bg-primary/5 border border-primary/10 rounded-[1.5rem] space-y-3">
          <div class="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">menu_book</span>
            Agent Inventory Demo Testing Guideline
          </div>
          <div class="space-y-2.5 text-[10px] text-white/70 leading-relaxed pl-1">
            <div>
              <strong class="text-white">1. Verify configuration:</strong>
              Ensure the <strong>Store Type</strong> in the Integration settings above is set to <strong>Mock Demo Store</strong> and saved.
            </div>
            <div>
              <strong class="text-white">2. Check stock:</strong>
              Ask your agent in chat (Facebook, WhatsApp, or Telegram) something like:
              <div class="font-mono bg-black/40 text-primary px-3 py-1.5 rounded-lg inline-block my-1 text-[9px]">
                "Is the Black Hoodie in stock?"
              </div>
              <br>
              The agent will read this live inventory list and reply with:
              <em class="text-white/50 font-medium">"Yes, Black Hoodie is in stock! We have 3 units available at ৳1,800."</em>
            </div>
            <div>
              <strong class="text-white">3. Place order & deduct stock:</strong>
              Ask the agent to buy it:
              <div class="font-mono bg-black/40 text-primary px-3 py-1.5 rounded-lg inline-block my-1 text-[9px]">
                "I want to order 1 Black Hoodie. My phone is 01712345678, address is Banani, Dhaka."
              </div>
              <br>
              The agent parses the order details, confirms it, decreases the quantity to <strong>2</strong> in this table in real-time, and inserts a new shipment record into the <strong>Customer Orders</strong> tab.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  integrations: { type: Object, required: true },
  savingIntegrations: { type: Boolean, required: true },
  mockInventory: { type: Array, required: true },
  loadingInventory: { type: Boolean, required: true },
  savingInventory: { type: Boolean, required: true },
  apiKeys: { type: Array, required: true },
  generatingApiKey: { type: Boolean, required: true }
})

const emit = defineEmits([
  'update:integration-field',
  'save-integrations',
  'generate-api-key',
  'delete-api-key',
  'save-inventory',
  'reset-inventory',
  'add-product',
  'remove-product',
  'copy-text'
])

const showIntegrations = ref(true)
const showInventory = ref(true)

const newProduct = reactive({
  name: '',
  sku: '',
  size: '',
  color: '',
  price: 1000,
  stock_quantity: 10
})

const handleAddProduct = () => {
  if (!newProduct.name || !newProduct.sku) {
    emit('add-product', null) // triggers validation toast in parent
    return
  }
  emit('add-product', { ...newProduct })
  // Reset local state fields
  newProduct.name = ''
  newProduct.sku = ''
  newProduct.size = ''
  newProduct.color = ''
  newProduct.price = 1000
  newProduct.stock_quantity = 10
}
</script>
