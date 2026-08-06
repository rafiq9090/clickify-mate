<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-background text-on-background">
    <!-- Left Sidebar / Top Mobile Nav -->
    <aside class="w-full md:w-72 shadow-xl bg-surface/60 backdrop-blur-md border-b md:border-b-0 md:border-r border-outline shrink-0 flex flex-col justify-between z-20">
      <div class="flex flex-col">
        <!-- Logo / Brand Header -->
        <div class="p-6 md:p-8 border-b border-outline flex items-center justify-between">
          <div>
            <h1 class="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-2 text-on-background">
              Command Center
            </h1>
            <p class="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Elite Tier System</p>
          </div>
          <div class="flex items-center gap-3">
            <ThemeToggle />
            <!-- Mobile logout -->
            <button @click="handleLogout" class="md:hidden flex items-center justify-center p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
              <span class="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>

        <!-- Sidebar Navigation Menu -->
        <nav class="p-4 md:p-6 flex md:flex-col overflow-x-auto md:overflow-x-visible gap-2 md:gap-1.5 scrollbar-none">
          <button 
            v-for="item in menuItems" 
            :key="item.id" 
            @click="currentMenu = item.id"
            class="flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all duration-300 text-left whitespace-nowrap shrink-0 w-auto md:w-full border"
            :class="currentMenu === item.id 
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
              : 'bg-transparent border-transparent text-on-surface-variant hover:text-primary hover:bg-primary/5'"
          >
            <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </div>

      <!-- Footer Actions (Logout, etc.) - Desktop Only -->
      <div class="hidden md:block p-6 border-t border-outline space-y-4">
        <div v-if="userEmail" class="flex flex-col gap-1 px-1">
          <span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60">Logged in as</span>
          <span class="text-xs font-bold text-on-surface truncate" :title="userEmail">{{ userEmail }}</span>
        </div>
        <button 
          @click="handleLogout" 
          class="w-full h-11 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-300 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-500/20"
        >
          <span class="material-symbols-outlined text-[16px]">logout</span>
          Logout System
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="dash-page flex-1 p-4 md:p-8 space-y-8 md:space-y-12 overflow-y-auto min-w-0">


        <!-- Stats Overview -->
        <DashboardStats v-if="currentMenu === 'overview'" :stats="stats" />

        <DashboardAgents
          v-if="currentMenu === 'agents'"
          :agents="agents"
          :loading="loading"
          @open-connect-modal="openConnectModal"
          @disconnect-agent="disconnectAgent"
          @update-knowledge="updateKnowledge"
          @show-guide="showGuideModal = true"
          @copy-text="copyText"
        />

        <DashboardWebhooks
          v-if="currentMenu === 'webhooks'"
          :agents="agents"
          :testingWebhookStatus="testingWebhookStatus"
          :testPayloadAgentId="testPayloadAgentId"
          :testPayloadBody="testPayloadBody"
          :webhookTestResult="webhookTestResult"
          :webhookTestLoading="webhookTestLoading"
          :metaCallbackUrl="metaCallbackUrl"
          :verifyToken="verifyToken"
          @update:testPayloadAgentId="val => testPayloadAgentId = val"
          @update:testPayloadBody="val => testPayloadBody = val"
          @verify-webhook="verifyAgentWebhook"
          @run-test="runWebhookMockTest"
          @update-knowledge="updateKnowledge"
          @copy-text="copyText"
        />

        <!-- VPS AI Backend Engine Panel -->
        <section v-if="currentMenu === 'overview'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="flex items-center justify-between">
                <h2 class="text-xl pl-2 font-black tracking-tight flex items-center gap-3">
                   
                    AI Backend Engine
                </h2>
                <button @click="checkBackendStatus" class="text-[10px] font-black uppercase tracking-[0.2em] text-secondary hover:text-white transition-colors flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm" :class="backendChecking ? 'animate-spin' : ''">sync</span>
                    {{ backendChecking ? 'Checking...' : 'Refresh Status' }}
                </button>
            </div>

            <!-- Status + Capabilities Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Backend Health Card -->
                <div class="bg-surface/40 border border-outline/60 shadow-md shadow-black/8 p-6 md:p-8 rounded-4xl relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors" :class="backendStatus === 'operational' ? 'bg-green-500/15' : 'bg-red-500/15'"></div>
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center" :class="backendStatus === 'operational' ? 'bg-green-500/10 text-green-500' : ' text-red-500'">
                                <span class="material-symbols-outlined text-2xl">{{ backendStatus === 'operational' ? 'cloud_done' : 'cloud_off' }}</span>
                            </div>
                            <div>
                                <h3 class="text-sm font-black uppercase tracking-widest text-on-surface">VPS Backend</h3>
                                <p class="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Python Microservice</p>
                            </div>
                        </div>
                        <div :class="backendStatus === 'operational' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'" class="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-current" :class="backendStatus === 'operational' ? 'animate-pulse' : ''"></span>
                            {{ backendStatus === 'operational' ? 'Online' : 'Offline' }}
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">FFmpeg</span>
                            <span class="text-[10px] font-black" :class="backendFfmpeg ? 'text-green-500' : 'text-red-400'">{{ backendFfmpeg ? 'Ready' : 'N/A' }}</span>
                        </div>
                        <div class="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Mode</span>
                            <span class="text-[10px] font-black text-secondary">{{ backendVpsMode ? 'VPS' : 'Local' }}</span>
                        </div>
                    </div>
                </div>

                <!-- AI Capabilities Card -->
                <div class="bg-surface/40 border border-outline/60 shadow-md p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg text-primary">auto_awesome</span>
                        AI Capabilities
                    </h3>
                    <div class="space-y-3">
                        <div v-for="cap in aiCapabilities" :key="cap.label" class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group/cap hover:border-primary/20 shadow-md shadow-green-500/10 transition-colors">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-lg" :class="cap.color">{{ cap.icon }}</span>
                                <div>
                                    <span class="text-[10px] font-black uppercase tracking-widest text-dark-900">{{ cap.label }}</span>
                                    <p class="text-[8px] font-bold text-on-surface-variant">{{ cap.engine }}</p>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-black uppercase rounded border border-green-500/20">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Integration Credentials Section -->
        <section v-if="currentMenu === 'integrations'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-black tracking-tight flex items-center gap-3 text-on-surface">
                    <span class="w-2 h-8 bg-secondary rounded-full"></span>
                    System Settings & Integrations
                </h2>
            </div>

            <!-- Integration Credentials -->
            <div class="bg-surface/40 border border-outline/60 p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
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
                                <select v-model="integrations.shop_type" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-emerald-400/50 transition-colors">
                                    <option value="mock" class="bg-surface text-white">Mock Demo Store</option>
                                    <option value="shopify" class="bg-surface text-white">Shopify Store</option>
                                    <option value="woocommerce" class="bg-surface text-white">WooCommerce Store</option>
                                    <option value="custom" class="bg-surface text-white">Custom REST API</option>
                                </select>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">Store URL / Domain</span>
                                <input v-model="integrations.shop_api_url" placeholder="e.g. https://api.mycustomshop.com" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-emerald-400/50 transition-colors placeholder:text-white/15" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">API Access Token / Client Key</span>
                                <input v-model="integrations.shop_api_key" type="password" placeholder="Bearer Token / API Key" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-emerald-400/50 transition-colors placeholder:text-white/15" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-[8px] font-black uppercase tracking-widest text-white/40 pl-1">API Secret / Consumer Secret</span>
                                <input v-model="integrations.shop_api_secret" type="password" placeholder="Secret Key (Optional)" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-emerald-400/50 transition-colors placeholder:text-white/15" />
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
                            <input v-model="integrations.steadfast_api_key" type="password" placeholder="API Key" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/15" />
                            <input v-model="integrations.steadfast_secret_key" type="password" placeholder="Secret Key" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/15" />
                            <input v-model="integrations.steadfast_webhook_url" placeholder="Webhook URL (optional)" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/15" />
                        </div>
                    </div>

                    <!-- Twilio -->
                    <div class="space-y-3">
                        <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-400">
                            <span class="material-symbols-outlined text-sm">call</span>
                            Twilio (IVR Calls)
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input v-model="integrations.twilio_account_sid" type="password" placeholder="Account SID" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-red-400/50 transition-colors placeholder:text-white/15" />
                            <input v-model="integrations.twilio_auth_token" type="password" placeholder="Auth Token" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-red-400/50 transition-colors placeholder:text-white/15" />
                            <input v-model="integrations.twilio_phone_number" placeholder="Phone Number (+880...)" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-red-400/50 transition-colors placeholder:text-white/15" />
                        </div>
                    </div>

                    <!-- SSLCommerz -->
                    <div class="space-y-3">
                        <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-400">
                            <span class="material-symbols-outlined text-sm">payment</span>
                            SSLCommerz / bKash
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input v-model="integrations.sslcommerz_store_id" placeholder="Store ID" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-blue-400/50 transition-colors placeholder:text-white/15" />
                            <input v-model="integrations.sslcommerz_store_password" type="password" placeholder="Store Password" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[11px] font-medium text-white border border-white/10 outline-none focus:border-blue-400/50 transition-colors placeholder:text-white/15" />
                            <div class="flex items-center gap-3">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="integrations.sslcommerz_sandbox" class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-primary focus:ring-primary/20 cursor-pointer" />
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
                            <button @click="generateNewApiKey" :disabled="generatingApiKey" class="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50">
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
                                        <button @click.stop="copyText(key.key_value); showToast('API Access Token copied to clipboard', 'success')" class="text-on-surface-variant/60 hover:text-white transition-colors cursor-pointer" title="Copy Key">
                                            <span class="material-symbols-outlined text-[10px]">content_copy</span>
                                        </button>
                                    </div>
                                    <button @click="deleteApiKey(key.id)" class="text-red-400/80 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors" title="Revoke Key">
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

                    <button @click="saveIntegrations" :disabled="savingIntegrations" class="w-full py-4 bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-sm">save</span>
                        {{ savingIntegrations ? 'Saving...' : 'Save Integration Credentials' }}
                    </button>
                </div>
            </div>

            <!-- Mock Inventory Database (Demo Testing) -->
            <div class="bg-surface/40 border border-outline/60 p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
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
                                        <button @click="removeProduct(item.sku)" class="text-red-400/80 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-all" title="Remove Product">
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
                            <button @click="addProduct" class="px-5 py-2.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95">
                                + Add to List
                            </button>
                        </div>
                    </div>

                    <!-- Bottom Controls -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button @click="saveInventory" :disabled="savingInventory" class="w-full py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-sm">save</span>
                            {{ savingInventory ? 'Saving...' : 'Save Inventory Changes' }}
                        </button>
                        <button @click="resetToDefaultInventory" class="w-full py-4 bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
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

        <DashboardLeads
          v-if="currentMenu === 'leads'"
          :leads="leads"
          :loading="loading"
          :currentPage="currentPage"
          :itemsPerPage="itemsPerPage"
          :totalPages="totalPages"
          :totalLeads="totalLeads"
          :searchQuery="searchQuery"
          :startDate="startDate"
          :endDate="endDate"
          :activeTab="activeTab"
          :selectedLeads="selectedLeads"
          :sendingToSteadfast="sendingToSteadfast"
          @update:currentPage="val => currentPage = val"
          @update:searchQuery="val => searchQuery = val"
          @update:startDate="val => startDate = val"
          @update:endDate="val => endDate = val"
          @update:activeTab="val => activeTab = val"
          @update:selectedLeads="val => selectedLeads = val"
          @open-edit="openEditModal"
          @delete="deleteLead"
          @send-to-steadfast="sendSingleToSteadfast"
          @bulk-send-to-steadfast="sendSelectedToSteadfast"
          @export-csv="exportToCSV"
          @copy-text="copyText"
        />

        <DashboardOrders
          v-if="currentMenu === 'orders'"
          :orders="orders"
          :loading="loading"
          :currentPage="ordersCurrentPage"
          :itemsPerPage="ordersItemsPerPage"
          :totalPages="ordersTotalPages"
          :totalOrders="totalOrders"
          :searchQuery="ordersSearchQuery"
          :startDate="ordersStartDate"
          :endDate="ordersEndDate"
          :activeTab="ordersActiveTab"
          @update:currentPage="val => ordersCurrentPage = val"
          @update:searchQuery="val => ordersSearchQuery = val"
          @update:startDate="val => ordersStartDate = val"
          @update:endDate="val => ordersEndDate = val"
          @update:activeTab="val => ordersActiveTab = val"
          @open-edit="openEditModal"
          @delete="deleteLead"
          @send-to-steadfast="sendSingleToSteadfast"
          @copy-text="copyText"
        />

        <DashboardLogs
          v-if="currentMenu === 'logs'"
          :logs="logs"
          :logsCurrentPage="logsCurrentPage"
          :logsItemsPerPage="logsItemsPerPage"
          :logsTotalPages="logsTotalPages"
          :totalLogs="totalLogs"
          @update:logsCurrentPage="val => logsCurrentPage = val"
          @copy-text="copyText"
        />
    </main>



    <!-- Modern Confirmation Modal -->
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div v-if="showDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface/20 ">
                <div class="w-full max-w-md bg-surface border border-white/10 rounded-[3rem] p-10 shadow-lg space-y-8 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
                    <div class="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 blur-3xl pointer-events-none"></div>
                    <!-- <div class="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20 relative z-10">
                        <span class="material-symbols-outlined text-4xl">warning</span>
                    </div> -->
                    
                    <div class="text-center space-y-2">
                        <h3 class="text-2xl font-black tracking-tight">Disconnect Agent?</h3>
                        <p class="text-on-surface-variant font-medium text-sm leading-relaxed px-4">All AI automation for this platform will stop immediately. This action cannot be undone.</p>
                    </div>

                    <div class="flex flex-col gap-3 relative z-10">
                        <button @click="confirmDelete" class="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_15px_35px_rgba(220,38,38,0.3)] hover:bg-red-500 transition-all">
                            Confirm Disconnect
                        </button>
                        <button @click="showDeleteModal = false" class="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Intelligence Edit Modal -->
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <div class="w-full max-w-2xl bg-surface border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300">
                    <div class="flex items-center justify-between">
                        <h3 class="text-2xl font-black tracking-tight flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary">edit_note</span>
                            Update Order Details
                        </h3>
                        <button @click="showEditModal = false" class="text-on-surface-variant hover:text-white transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div class="space-y-4">
                        <!-- Order Status Selection -->
                        <div class="space-y-3">
                            <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                Order Status
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <button 
                                    v-for="status in ['pending', 'hold', 'complete', 'cancelled']" 
                                    :key="status"
                                    type="button"
                                    @click="editLeadStatus = status"
                                    class="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-1.5"
                                    :class="{
                                        'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/10': editLeadStatus === status && status === 'pending',
                                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 shadow-lg shadow-yellow-500/10': editLeadStatus === status && status === 'hold',
                                        'bg-green-500/20 text-green-400 border-green-500/40 shadow-lg shadow-green-500/10': editLeadStatus === status && status === 'complete',
                                        'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/10': editLeadStatus === status && status === 'cancelled',
                                        'bg-white/5 text-on-surface-variant/60 border-white/5 hover:bg-white/10 hover:text-white': editLeadStatus !== status
                                    }"
                                >
                                    <span class="w-1.5 h-1.5 rounded-full" :class="{
                                        'bg-blue-400': status === 'pending',
                                        'bg-yellow-400': status === 'hold',
                                        'bg-green-400': status === 'complete',
                                        'bg-red-400': status === 'cancelled'
                                    }"></span>
                                    {{ status }}
                                </button>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                Payment Transaction ID (Pre-paid Orders)
                            </div>
                            <input 
                                v-model="editTransactionId"
                                type="text"
                                class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all"
                                placeholder="Enter bKash/Nagad/Rocket transaction ID to make this a pre-paid order"
                            />
                        </div>

                        <div class="space-y-2">
                            <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                Raw Order Data (Pipe Separated)
                            </div>
                            <textarea 
                                v-model="editOrderText"
                                class="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all resize-none"
                                placeholder="Key: Value | Key: Value ..."
                            ></textarea>
                            <p class="text-[9px] text-on-surface-variant/40 italic">Tip: Use "Label: Value | Label: Value" format for best results.</p>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <button @click="saveLeadUpdate" class="flex-1 py-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
                            Save Changes
                        </button>
                        <button @click="showEditModal = false" class="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                            Discard
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>

    <!-- Deploy/Connect New Agent Modal -->
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div v-if="showConnectModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <div class="w-full max-w-2xl bg-surface border border-outline rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                    <div class="flex items-center justify-between">
                        <h3 class="text-2xl font-black tracking-tight flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary">robot_2</span>
                            Deploy New AI Agent
                        </h3>
                        <button @click="showConnectModal = false" class="text-on-surface-variant hover:text-on-surface transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div class="space-y-6">
                        <!-- Select Platform -->
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                Target Platform
                            </label>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <button 
                                    v-for="platform in [
                                        { id: 'whatsapp', name: 'WhatsApp', icon: 'chat' },
                                        { id: 'telegram', name: 'Telegram', icon: 'send' },
                                        { id: 'fb_comment', name: 'FB Comments', icon: 'comment' },
                                        { id: 'messenger', name: 'Messenger', icon: 'forum' }
                                    ]" 
                                    :key="platform.id"
                                    type="button"
                                    @click="connectPlatform = platform.id"
                                    class="p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all"
                                    :class="connectPlatform === platform.id ? 'bg-primary/15 text-primary border-primary shadow-lg shadow-primary/10' : 'bg-surface-hover border-outline text-on-surface-variant hover:bg-primary/5 hover:text-primary hover:border-primary/40'"
                                >
                                    <span class="material-symbols-outlined text-xl">{{ platform.icon }}</span>
                                    <span class="text-[10px] font-black uppercase tracking-wider">{{ platform.name }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- API Key / Token -->
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                {{ connectPlatform === 'telegram' ? 'Telegram Bot Token' : 'Meta Page Access Token' }}
                            </label>
                            <input 
                                v-model="connectToken"
                                type="text"
                                class="w-full bg-surface-hover border border-outline rounded-2xl p-4 text-sm font-medium text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-on-surface-variant/40"
                                :placeholder="connectPlatform === 'telegram' ? 'e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ' : 'e.g. EAAGz...'"
                            />
                            <p class="text-[9px] text-on-surface-variant/40 italic">
                                {{ connectPlatform === 'telegram' 
                                    ? 'Get this token by messaging @BotFather on Telegram.' 
                                    : 'Page Access Token from your Meta Developer App settings.' }}
                            </p>
                        </div>

                        <!-- Select Template -->
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                Pre-populate Knowledge Base
                            </label>
                            <div class="flex flex-wrap gap-2">
                                <button 
                                    v-for="tpl in [
                                        { id: 'single', name: 'Single Product' },
                                        { id: 'multi', name: 'Multi-Product' },
                                        { id: 'category', name: 'Multi-Category' },
                                        { id: 'blueprint', name: 'Rules Blueprint' }
                                    ]" 
                                    :key="tpl.id"
                                    type="button"
                                    @click="handleTemplateSelect(tpl.id)"
                                    class="px-4 py-2 bg-surface-hover border border-outline hover:bg-primary/8 hover:border-primary/40 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition-all active:scale-95"
                                >
                                    {{ tpl.name }}
                                </button>
                            </div>
                        </div>

                        <!-- Knowledge Base Input -->
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                Agent Knowledge Base (Rules, Catalog & Info)
                            </label>
                            <textarea 
                                v-model="connectKnowledge"
                                class="w-full h-48 bg-surface-hover border border-outline rounded-2xl p-6 text-xs font-medium text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none leading-relaxed placeholder:text-on-surface-variant/40"
                                placeholder="Write rules or catalog details for your AI agent..."
                            ></textarea>
                            <p class="text-[9px] text-on-surface-variant/40 italic">Tip: You can customize this anytime from the agents section later.</p>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <button 
                            @click="handleConnectAgent" 
                            :disabled="connectingAgent"
                            class="flex-1 py-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:transform-none flex items-center justify-center gap-2"
                        >
                            <span v-if="connectingAgent" class="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                            {{ connectingAgent ? 'Establishing Connection...' : 'Deploy & Connect Agent' }}
                        </button>
                        <button @click="showConnectModal = false" class="flex-1 py-4 bg-surface-hover border border-outline text-on-surface-variant rounded-xl font-black text-xs uppercase tracking-widest hover:border-outline hover:bg-surface transition-all">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>

    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showGuideModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div class="bg-surface border border-outline rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
                    <!-- Modal Header -->
                    <div class="px-6 py-5 border-b border-outline flex items-center justify-between shrink-0">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary text-2xl">menu_book</span>
                            <div>
                                <h3 class="text-base font-black text-on-surface uppercase tracking-wider">AI Agent Setup Guide & Templates</h3>
                                <p class="text-[10px] text-on-surface-variant/60 font-medium">Choose a template matching your store structure to copy & paste into your Knowledge Base.</p>
                            </div>
                        </div>
                        <button @click="showGuideModal = false" class="w-8 h-8 rounded-full bg-surface-variant/10 hover:bg-surface-variant/20 text-on-surface-variant flex items-center justify-center transition-colors">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">
                        <!-- Mobile Tabs -->
                        <div class="flex sm:hidden border-b border-outline p-3 gap-2 overflow-x-auto bg-surface-hover/50 shrink-0">
                            <button 
                                @click="guideTab = 'single'"
                                :class="guideTab === 'single' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-on-surface-variant/60 hover:text-on-surface'"
                                class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                            >
                                Single Product
                            </button>
                            <button 
                                @click="guideTab = 'multi'"
                                :class="guideTab === 'multi' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-on-surface-variant/60 hover:text-on-surface'"
                                class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                            >
                                Multi-Product
                            </button>
                            <button 
                                @click="guideTab = 'category'"
                                :class="guideTab === 'category' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-on-surface-variant/60 hover:text-on-surface'"
                                class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                            >
                                Multi-Category
                            </button>
                            <button 
                                @click="guideTab = 'blueprint'"
                                :class="guideTab === 'blueprint' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-on-surface-variant/60 hover:text-on-surface'"
                                class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                            >
                                KB Blueprint
                            </button>
                        </div>

                        <!-- Sidebar tabs (Desktop only) -->
                        <div class="hidden sm:block w-48 border-r border-outline p-4 space-y-2 shrink-0 bg-surface-hover/30">
                            <button 
                                @click="guideTab = 'single'"
                                :class="guideTab === 'single' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-hover'"
                                class="w-full text-left px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Single Product
                            </button>
                            <button 
                                @click="guideTab = 'multi'"
                                :class="guideTab === 'multi' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-hover'"
                                class="w-full text-left px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Multi-Product
                            </button>
                            <button 
                                @click="guideTab = 'category'"
                                :class="guideTab === 'category' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-hover'"
                                class="w-full text-left px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Multi-Category
                            </button>
                            <button 
                                @click="guideTab = 'blueprint'"
                                :class="guideTab === 'blueprint' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-hover'"
                                class="w-full text-left px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                KB Blueprint
                            </button>
                        </div>

                        <!-- Content area -->
                        <div class="flex-1 p-6 overflow-y-auto flex flex-col min-h-0 space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-black uppercase tracking-wider text-on-surface">
                                    {{ guideTab === 'single' ? 'Single Product Store Template' : guideTab === 'multi' ? 'Multi-Product Store Template' : guideTab === 'category' ? 'Multi-Category Store Template' : 'Agent KB Blueprint (Rules, Catalog & Info)' }}
                                </span>
                                <button 
                                    @click="copyTemplateText" 
                                    class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                                >
                                    <span class="material-symbols-outlined text-xs">content_copy</span>
                                    Copy Template
                                </button>
                            </div>

                            <pre class="flex-1 bg-surface-hover border border-outline p-4 rounded-2xl text-[10px] font-mono text-on-surface-variant overflow-auto select-text whitespace-pre-wrap leading-relaxed max-h-[50vh]">{{ getActiveTemplateText() }}</pre>

                            <div class="bg-surface-hover border border-outline p-4 rounded-2xl space-y-2">
                                <h4 class="text-[10px] font-black uppercase tracking-wider text-primary/80 flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-xs">info</span>
                                    Rule & ID Configuration Tips
                                </h4>
                                <ul class="text-[10px] text-on-surface-variant/70 space-y-1 list-disc list-inside leading-relaxed font-medium">
                                    <li>Make sure your custom <strong>Product ID</strong> in the template matches your Dashboard <strong>Product Gallery ID</strong> exactly.</li>
                                    <li>Leave the placeholder variables like <code>[PRODUCT_NAME]</code> and <code>[PRICE]</code> as is—the AI replaces them automatically.</li>
                                    <li>Provide clear color and size guides so the agent can suggest accurate options.</li>
                                    <li>To boost sales conversion and accuracy, add a detailed size chart (e.g., S: Chest 36", M: 38") and an FAQ section (answering questions about fabric quality or open-box check rules) to your Knowledge Base.</li>
                                    <li>The handling logic for <strong>delayed orders (2-3 days vs 4+ days)</strong> is pre-baked into these templates!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import {
    singleProductTemplate,
    multiProductTemplate,
    multiCategoryTemplate,
    agentKnowledgeBaseTemplate,
    knowledgeBaseGuideline
} from '~/shared/templates'

const supabase = useSupabase()
const userEmail = ref('')
const agents = ref([])
const logs = ref([])
const leads = ref([])
const orders = ref([])
const expandedOrders = ref([]) // Track expanded order IDs
const expandedLeads = ref([]) // Track expanded customer lead IDs
const activeTab = ref('all')
const ordersActiveTab = ref('all')
const currentMenu = ref('overview')
const menuItems = [
    { id: 'overview', label: 'System Overview', icon: 'dashboard' },
    { id: 'agents', label: 'AI Agents', icon: 'robot_2' },
    { id: 'webhooks', label: 'Webhook Config', icon: 'link' },
    { id: 'leads', label: 'Customer Leads', icon: 'shopping_cart' },
    { id: 'orders', label: 'Pre Paid Orders', icon: 'credit_card' },
    { id: 'integrations', label: 'System Settings', icon: 'settings' },
    { id: 'logs', label: 'Activity Logs', icon: 'list_alt' }
]
const loading = ref(true)
const showEditModal = ref(false)
const editingLead = ref(null)
const editOrderText = ref('')
const editLeadStatus = ref('pending')
const editTransactionId = ref('')

// Webhook & Agent Configuration states
const showWebhookToken = ref(false)
const testingWebhookStatus = ref({})
const testPayloadAgentId = ref('')
const selectedAgentForConfig = computed(() => {
    return agents.value.find(a => a.id === testPayloadAgentId.value) || null
})
const testPayloadBody = ref('Do you have Blue Denim Jacket in stock?')
const webhookTestResult = ref(null)
const webhookTestLoading = ref(false)

const verifyToken = computed(() => {
    const config = useRuntimeConfig()
    return config.public?.verifyToken || 'clickify_secure_verify'
})

// Detect if the current origin serves the Rust webhook service
// (i.e. ngrok/production points directly to port 5004)
// We check by trying to resolve the /health endpoint of rust service.
// For simplicity, we use a reactive ref populated on mount.
const isRustMode = ref(false)

onMounted(async () => {
    try {
        const res = await $fetch('/health', { method: 'GET' })
        if (res && res.engine === 'rust') {
            isRustMode.value = true
        }
    } catch {
        isRustMode.value = false
    }
})

const getWebhookUrl = (platform, agentId) => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    if (isRustMode.value) {
        // Rust service routes
        if (platform === 'telegram') {
            return `${origin}/webhook/telegram?agent_id=${agentId}`
        } else if (platform === 'whatsapp') {
            return `${origin}/webhook/whatsapp?agent_id=${agentId}`
        } else {
            return `${origin}/webhook/facebook?agent_id=${agentId}`
        }
    } else {
        // TypeScript (Nuxt) routes
        if (platform === 'telegram') {
            return `${origin}/api/agents/telegram?agent_id=${agentId}`
        } else if (platform === 'whatsapp') {
            return `${origin}/api/agents/whatsapp?agent_id=${agentId}`
        } else {
            return `${origin}/api/agents/facebook?agent_id=${agentId}`
        }
    }
}

// Callback URL for Meta (Facebook/Messenger/WhatsApp) — no agent_id needed at verification step
const metaCallbackUrl = computed(() => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    return isRustMode.value
        ? `${origin}/webhook/facebook`
        : `${origin}/api/agents/facebook`
})

const verifyAgentWebhook = async (agent) => {
    testingWebhookStatus.value[agent.id] = 'testing'
    try {
        const url = getWebhookUrl(agent.platform, agent.id)
        const res = await $fetch(url, { method: 'GET' })
        if (res && (res.status?.includes('Active') || res.status?.includes('ACTIVE') || res.platform)) {
            testingWebhookStatus.value[agent.id] = 'success'
            showToast(`${agent.platform.toUpperCase()} webhook path is active and verified!`, 'success')
        } else {
            testingWebhookStatus.value[agent.id] = 'error'
            showToast(`Webhook path returned unexpected response. Check server logs.`, 'warning')
        }
    } catch (e) {
        testingWebhookStatus.value[agent.id] = 'error'
        showToast(`Verification Failed: ${e.message}`, 'error')
    }
}

const runWebhookMockTest = async () => {
    if (!testPayloadAgentId.value) {
        showToast('Please select an agent to test', 'warning')
        return
    }
    webhookTestLoading.value = true
    webhookTestResult.value = null
    try {
        const agent = agents.value.find(a => a.id === testPayloadAgentId.value)
        if (!agent) throw new Error('Agent not found')
        
        let endpoint = ''
        let body = {}
        
        if (agent.platform === 'telegram') {
            endpoint = '/api/agents/telegram'
            body = {
                message: {
                    message_id: 12345,
                    from: { id: 987654321, first_name: 'TestUser', username: 'testuser' },
                    chat: { id: 987654321, first_name: 'TestUser', type: 'private' },
                    date: Math.floor(Date.now() / 1000),
                    text: testPayloadBody.value
                }
            }
        } else if (agent.platform === 'whatsapp') {
            endpoint = '/api/agents/whatsapp'
            body = {
                object: 'whatsapp_business_account',
                entry: [{
                    id: '1234567890',
                    changes: [{
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: { display_phone_number: '15550000000', phone_number_id: agent.external_id || 'mock_phone_id' },
                            contacts: [{ profile: { name: 'Test User' }, wa_id: '8801700000000' }],
                            messages: [{
                                from: '8801700000000',
                                id: 'wamid.HBgMODgwMTcwMDAwMDAwFQIAERgSRjQ1NjY1NDMyM0FCQ0RFRgA=',
                                timestamp: Math.floor(Date.now() / 1000).toString(),
                                text: { body: testPayloadBody.value },
                                type: 'text'
                            }]
                        },
                        field: 'messages'
                    }]
                }]
            }
        } else {
            endpoint = '/api/agents/facebook'
            body = {
                object: 'page',
                entry: [{
                    id: agent.external_id || 'mock_page_id',
                    time: Date.now(),
                    messaging: [{
                        sender: { id: '9876543210' },
                        recipient: { id: agent.external_id || 'mock_page_id' },
                        timestamp: Date.now(),
                        message: {
                            mid: 'm_1234567890abcdef',
                            text: testPayloadBody.value
                        }
                    }]
                }]
            }
        }
        
        const response = await $fetch(`${endpoint}?agent_id=${agent.id}`, {
            method: 'POST',
            body: body
        })
        
        webhookTestResult.value = {
            statusCode: 200,
            statusText: 'OK',
            response: response,
            timestamp: new Date().toLocaleTimeString()
        }
        
        showToast('Mock Webhook event processed successfully!', 'success')
        await fetchLeads()
        await fetchOrders()
    } catch (e) {
        webhookTestResult.value = {
            statusCode: e.status || 500,
            statusText: e.message || 'Internal Server Error',
            response: e.data || null,
            timestamp: new Date().toLocaleTimeString()
        }
        showToast(`Webhook simulation failed: ${e.message}`, 'error')
    } finally {
        webhookTestLoading.value = false
    }
}

const showGuideModal = ref(false)
const guideTab = ref('single')
const isMobile = ref(false)

// Agent Connection Modal State
const showConnectModal = ref(false)
const connectPlatform = ref('whatsapp')
const connectToken = ref('')
const connectKnowledge = ref('')
const connectingAgent = ref(false)

const openConnectModal = () => {
    connectPlatform.value = 'whatsapp'
    connectToken.value = ''
    connectKnowledge.value = singleProductTemplate
    showConnectModal.value = true
}

const handleTemplateSelect = (type) => {
    if (type === 'single') connectKnowledge.value = singleProductTemplate
    else if (type === 'multi') connectKnowledge.value = multiProductTemplate
    else if (type === 'category') connectKnowledge.value = multiCategoryTemplate
    else if (type === 'blueprint') connectKnowledge.value = agentKnowledgeBaseTemplate
}

const handleConnectAgent = async () => {
    if (!connectToken.value) {
        showToast('API Key / Bot Token is required', 'warning')
        return
    }
    connectingAgent.value = true
    try {
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token
        
        const res = await $fetch('/api/agents/connect', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            body: {
                platform: connectPlatform.value,
                token: connectToken.value,
                knowledge: connectKnowledge.value
            }
        })
        
        if (res.success) {
            showToast(res.message || 'Agent connected successfully!', 'success')
            showConnectModal.value = false
            connectToken.value = ''
            connectKnowledge.value = ''
            await fetchAgents()
        }
    } catch (e) {
        showToast('Connection Failed: ' + (e.data?.statusMessage || e.message), 'error')
    } finally {
        connectingAgent.value = false
    }
}

const fetchAgents = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data, error } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('user_id', user.id)
        
        if (error) throw error
        if (data) {
            console.log(`[DASHBOARD DEBUG]: Found ${data.length} agents.`)
            agents.value = data.map(a => {
                const rawImages = Array.isArray(a.product_images) ? a.product_images : []
                const images = rawImages.map((img) => {
                    if (typeof img === 'string') {
                        return { id: '', url: img }
                    } else if (img && typeof img === 'object') {
                        return { id: img.id || '', url: img.url || '' }
                    }
                    return { id: '', url: '' }
                })
                while (images.length < 3) images.push({ id: '', url: '' })
                
                const behavior = a.agent_behavior || {}
                if (behavior.fb_private_reply_prices === undefined) behavior.fb_private_reply_prices = true
                if (behavior.fb_private_reply_orders === undefined) behavior.fb_private_reply_orders = true
                if (behavior.fb_private_reply_pii === undefined) behavior.fb_private_reply_pii = true
                if (behavior.fb_private_reply_complaints === undefined) behavior.fb_private_reply_complaints = true
                if (behavior.fb_public_reply_enabled === undefined) behavior.fb_public_reply_enabled = true
                if (behavior.fb_delete_negatives === undefined) behavior.fb_delete_negatives = true
                if (behavior.webhook_forward_url === undefined) behavior.webhook_forward_url = ''
                if (behavior.webhook_events === undefined) {
                    behavior.webhook_events = { messages: true, comments: true, orders: true }
                }

                return { 
                    ...a, 
                    isDirty: false,
                    showAdvance: false,
                    activeCardTab: 'knowledge',
                    agent_behavior: behavior,
                    product_images: images,
                    visibleImageCount: Math.max(1, images.filter(img => img.url && img.url.trim() !== '').length)
                }
            })
            stats[1].value = data.length.toString()
            loadIntegrations(agents.value)
        }
    } catch (e) {
        console.error('Failed to fetch agents:', e)
    }
}

// VPS Backend Engine State
const backendStatus = ref('offline')
const backendFfmpeg = ref(false)
const backendVpsMode = ref(false)
const backendChecking = ref(false)
const showIntegrations = ref(false)
const savingIntegrations = ref(false)

const integrations = reactive({
    steadfast_api_key: '',
    steadfast_secret_key: '',
    steadfast_sender_id: '',
    steadfast_webhook_url: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    sslcommerz_store_id: '',
    sslcommerz_store_password: '',
    sslcommerz_sandbox: true,
    shop_type: 'mock',
    shop_api_url: '',
    shop_api_key: '',
    shop_api_secret: ''
})

const aiCapabilities = [
    { label: 'Voice STT', engine: 'Groq Whisper', icon: 'mic', color: 'text-purple-400' },
    { label: 'Image Vision', engine: 'Groq Llava', icon: 'image_search', color: 'text-blue-400' },
    { label: 'Content Guard', engine: 'Llama-3 Moderation', icon: 'shield', color: 'text-red-400' },
    { label: 'Text-to-Speech', engine: 'gTTS (Free)', icon: 'record_voice_over', color: 'text-green-400' },
]

const VPS_BACKEND_URL = 'http://103.174.51.212:8000'

const checkBackendStatus = async () => {
    backendChecking.value = true
    try {
        const res = await $fetch(`${VPS_BACKEND_URL}/api/status`, { timeout: 5000 })
        backendStatus.value = res.status || 'offline'
        backendFfmpeg.value = res.ffmpeg_ready || false
        backendVpsMode.value = res.vps_mode || false
    } catch (e) {
        backendStatus.value = 'offline'
        backendFfmpeg.value = false
        backendVpsMode.value = false
    } finally {
        backendChecking.value = false
    }
}

const saveIntegrations = async () => {
    savingIntegrations.value = true
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Save to each agent's agent_behavior JSONB
        for (const agent of agents.value) {
    const updatedBehavior = {
        ...agent.agent_behavior,
        // Steadfast Courier Settings
        steadfast_api_key: integrations.steadfast_api_key,
        steadfast_secret_key: integrations.steadfast_secret_key,
        steadfast_sender_id: integrations.steadfast_sender_id, //  FIXED: maps correctly to sender id input field
        steadfast_webhook_url: integrations.steadfast_webhook_url,
        
        // Twilio Settings
        twilio_account_sid: integrations.twilio_account_sid,
        twilio_auth_token: integrations.twilio_auth_token,
        twilio_phone_number: integrations.twilio_phone_number,
        
        // SSLCommerz Settings
        sslcommerz_store_id: integrations.sslcommerz_store_id,
        sslcommerz_store_password: integrations.sslcommerz_store_password,
        sslcommerz_sandbox: integrations.sslcommerz_sandbox,
        
        // Inventory/Shop Connection
        shop_type: integrations.shop_type || 'mock',
        shop_api_url: integrations.shop_api_url || '',
        shop_api_key: integrations.shop_api_key || '',
        shop_api_secret: integrations.shop_api_secret || ''
    }
    
    // Push clean payload metadata block to Supabase
    await supabase.from('agent_configs').update({ agent_behavior: updatedBehavior }).eq('id', agent.id)
    agent.agent_behavior = updatedBehavior
}
        showToast('Integration credentials saved to all agents', 'success')
    } catch (e) {
        showToast('Save Failed: ' + e.message, 'error')
    } finally {
        savingIntegrations.value = false
    }
}

const loadIntegrations = (agentsList) => {
    // Load from the first agent that has integration data
    const source = agentsList.find(a => a.agent_behavior?.steadfast_api_key || a.agent_behavior?.shop_api_key) || agentsList[0]
    if (source?.agent_behavior) {
        const b = source.agent_behavior
        integrations.steadfast_api_key = b.steadfast_api_key || ''
        
        //  FIXED HERE: Clean isolation so your Secret Key doesn't get overwritten by the Sender ID
        integrations.steadfast_secret_key = b.steadfast_secret_key || ''
        integrations.steadfast_sender_id = b.steadfast_sender_id || ''
        
        integrations.steadfast_webhook_url = b.steadfast_webhook_url || ''
        integrations.twilio_account_sid = b.twilio_account_sid || ''
        integrations.twilio_auth_token = b.twilio_auth_token || ''
        integrations.twilio_phone_number = b.twilio_phone_number || ''
        integrations.sslcommerz_store_id = b.sslcommerz_store_id || ''
        integrations.sslcommerz_store_password = b.sslcommerz_store_password || ''
        integrations.sslcommerz_sandbox = b.sslcommerz_sandbox !== undefined ? b.sslcommerz_sandbox : true
        integrations.shop_type = b.shop_type || 'mock'
        integrations.shop_api_url = b.shop_api_url || ''
        integrations.shop_api_key = b.shop_api_key || ''
        integrations.shop_api_secret = b.shop_api_secret || ''
    }
}

const apiKeys = ref([])
const generatingApiKey = ref(false)

const fetchApiKeys = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data, error } = await supabase
            .from('user_api_keys')
            .select('*')
            .order('created_at', { ascending: false })
            
        if (error) throw error
        apiKeys.value = data || []
    } catch (e) {
        console.error('Failed to fetch API keys:', e)
    }
}

const generateNewApiKey = async () => {
    generatingApiKey.value = true
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        // Generate a random token with secure bytes
        const randomString = Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        const newKey = `as_${randomString}`
        
        const { error } = await supabase
            .from('user_api_keys')
            .insert({
                user_id: user.id,
                key_value: newKey,
                name: `API Key - ${new Date().toLocaleDateString()}`
            })
            
        if (error) throw error
        showToast('New API Key generated successfully!', 'success')
        await fetchApiKeys()
    } catch (e) {
        showToast('Generation Failed: ' + e.message, 'error')
    } finally {
        generatingApiKey.value = false
    }
}

const deleteApiKey = async (id) => {
    askConfirm(
        'Revoke API Key?',
        'Any external application using this API Key will lose connection immediately.',
        async () => {
            try {
                const { error } = await supabase
                    .from('user_api_keys')
                    .delete()
                    .eq('id', id)
                    
                if (error) throw error
                showToast('API Key revoked successfully', 'success')
                await fetchApiKeys()
            } catch (e) {
                showToast('Revocation Failed: ' + e.message, 'error')
            }
        }
    )
}

const mockInventory = ref([])
const loadingInventory = ref(false)
const savingInventory = ref(false)
const showInventory = ref(true)

const newProduct = reactive({
    name: '',
    sku: '',
    size: '',
    color: '',
    price: 1000,
    stock_quantity: 10
})

const fetchInventory = async () => {
    loadingInventory.value = true
    try {
        const data = await $fetch('/api/admin/inventory')
        mockInventory.value = data || []
    } catch (e) {
        showToast('Failed to load mock inventory: ' + e.message, 'error')
    } finally {
        loadingInventory.value = false
    }
}

const saveInventory = async () => {
    savingInventory.value = true
    try {
        await $fetch('/api/admin/inventory', {
            method: 'POST',
            body: mockInventory.value
        })
        showToast('Mock inventory saved successfully!', 'success')
    } catch (e) {
        showToast('Failed to save mock inventory: ' + e.message, 'error')
    } finally {
        savingInventory.value = false
    }
}

const addProduct = () => {
    if (!newProduct.name || !newProduct.sku) {
        showToast('Product Name and SKU are required', 'warning')
        return
    }
    
    // Check if SKU already exists
    const exists = mockInventory.value.some(item => item.sku.toLowerCase() === newProduct.sku.toLowerCase())
    if (exists) {
        showToast(`Product with SKU "${newProduct.sku}" already exists!`, 'warning')
        return
    }

    mockInventory.value.push({
        id: `item-${Date.now()}`,
        name: newProduct.name,
        sku: newProduct.sku.toUpperCase(),
        size: newProduct.size || 'N/A',
        color: newProduct.color || 'N/A',
        price: Number(newProduct.price) || 0,
        stock_quantity: Number(newProduct.stock_quantity) || 0
    })

    // Reset fields
    newProduct.name = ''
    newProduct.sku = ''
    newProduct.size = ''
    newProduct.color = ''
    newProduct.price = 1000
    newProduct.stock_quantity = 10

    showToast('Product added to local list. Click "Save Changes" to write to disk.', 'success')
}

const removeProduct = (sku) => {
    mockInventory.value = mockInventory.value.filter(item => item.sku !== sku)
    showToast('Product removed from local list. Click "Save Changes" to write to disk.', 'info')
}

const resetToDefaultInventory = () => {
    askConfirm(
        'Reset Mock Inventory?',
        'This will reset your mock inventory database to the default four demo products.',
        async () => {
            const defaults = [
                {
                    id: "item-001",
                    name: "Blue T-Shirt",
                    sku: "BLUE-SHIRT-M",
                    size: "M",
                    color: "Blue",
                    price: 1200,
                    stock_quantity: 5
                },
                {
                    id: "item-002",
                    name: "Blue T-Shirt",
                    sku: "BLUE-SHIRT-L",
                    size: "L",
                    color: "Blue",
                    price: 1200,
                    stock_quantity: 0
                },
                {
                    id: "item-003",
                    name: "Black Hoodie",
                    sku: "BLACK-HOODIE-L",
                    size: "L",
                    color: "Black",
                    price: 1800,
                    stock_quantity: 3
                },
                {
                    id: "item-004",
                    name: "White Sneakers",
                    sku: "WHITE-SNEAKERS-42",
                    size: "42",
                    color: "White",
                    price: 2500,
                    stock_quantity: 10
                }
            ]
            mockInventory.value = defaults
            try {
                await $fetch('/api/admin/inventory', {
                    method: 'POST',
                    body: defaults
                })
                showToast('Mock inventory reset to default demo data', 'success')
            } catch (e) {
                showToast('Failed to reset: ' + e.message, 'error')
            }
        }
    )
}

const formatPlatformName = (platform) => {
    if (platform === 'fb_comment') return 'FB comment'
    if (platform === 'messenger') return 'Messenger'
    if (platform === 'whatsapp') return 'WhatsApp'
    if (platform === 'telegram') return 'Telegram'
    return platform
}

// Toggle order expansion
const toggleOrderExpand = (orderId) => {
    const index = expandedOrders.value.indexOf(orderId)
    if (index > -1) {
        expandedOrders.value.splice(index, 1)
    } else {
        expandedOrders.value.push(orderId)
    }
}

// Toggle customer lead row expansion
const toggleLeadExpand = (leadId) => {
    const index = expandedLeads.value.indexOf(leadId)
    if (index > -1) {
        expandedLeads.value.splice(index, 1)
    } else {
        expandedLeads.value.push(leadId)
    }
}

// Parse pipe-separated order data
const parseOrderData = (order) => {
    const data = {}
    const orderString = order.data?.order || ''
    if (!orderString) return data
    
    const pairs = orderString.split('|')
    for (const pair of pairs) {
        const [key, value] = pair.split(':').map(s => s.trim())
        if (key && value) {
            data[key.toLowerCase()] = value
        }
    }
    return data
}

const getActiveTemplateText = () => {
    if (guideTab.value === 'single') return singleProductTemplate
    if (guideTab.value === 'multi') return multiProductTemplate
    if (guideTab.value === 'category') return multiCategoryTemplate
    return agentKnowledgeBaseTemplate
}

const copyTemplateText = () => {
    const text = getActiveTemplateText()
    navigator.clipboard.writeText(text)
    showToast('Template copied successfully', 'success')
}

// Toast System
const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
    toast.value = { show: true, message, type }
    setTimeout(() => toast.value.show = false, 3000)
}

// Custom Confirm Modal
const confirmModal = ref({ show: false, title: '', message: '', onConfirm: null })
const askConfirm = (title, message, callback) => {
    confirmModal.value = { show: true, title, message, onConfirm: callback }
}

// Filter State
const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')

// Pagination State - Leads
const currentPage = ref(1)
const itemsPerPage = 10
const totalLeads = ref(0)
const totalPages = computed(() => Math.ceil(totalLeads.value / itemsPerPage))

// Pagination State - Orders
const ordersCurrentPage = ref(1)
const ordersItemsPerPage = 10
const totalOrders = ref(0)
const ordersTotalPages = computed(() => Math.ceil(totalOrders.value / ordersItemsPerPage))
const ordersSearchQuery = ref('')
const ordersStartDate = ref('')
const ordersEndDate = ref('')

const fetchLeads = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    loading.value = true
    expandedLeads.value = []
    try {
        const from = (currentPage.value - 1) * itemsPerPage
        const to = from + itemsPerPage - 1

        let query = supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('source', 'ai_agent')
            .filter('data->>user_id', 'eq', user.id)
            .is('data->>payment_transaction_id', null)
            .order('created_at', { ascending: false })

        // Apply Platform Filter
        if (activeTab.value !== 'all') {
            if (activeTab.value === 'facebook') {
                query = query.or('data->>platform.eq.messenger,data->>platform.eq.fb_comment')
            } else {
                query = query.eq('data->>platform', activeTab.value)
            }
        }

        // Apply Search Filter (Supports searching by full UUID, short Order ID, email, name, or order details)
        if (searchQuery.value) {
            const term = searchQuery.value.trim()
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)
            if (isUuid) {
                query = query.eq('id', term)
            } else {
                query = query.or(`email.ilike.%${term}%,data->>customer.ilike.%${term}%,data->>order.ilike.%${term}%,short_id.ilike.%${term}%`)
            }
        }

        // Apply Date Range Filter
        if (startDate.value) {
            query = query.gte('created_at', startDate.value)
        }
        if (endDate.value) {
            // Add one day to end date to include the whole day
            const end = new Date(endDate.value)
            end.setDate(end.getDate() + 1)
            query = query.lt('created_at', end.toISOString())
        }

        // Final Range and Execution
        const { data, count, error } = await query.range(from, to)
        
        if (error) throw error
        leads.value = data || []
        totalLeads.value = count || 0
    } catch (e) {
        console.error('Failed to fetch leads:', e)
    } finally {
        loading.value = false
    }
}

// Pagination State for Auto-Moderation Logs
const logsCurrentPage = ref(1)
const logsItemsPerPage = 5
const totalLogs = ref(0)
const logsTotalPages = computed(() => Math.ceil(totalLogs.value / logsItemsPerPage))

const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    loading.value = true
    expandedOrders.value = [] // Clear expanded orders when fetching
    try {
        const from = (ordersCurrentPage.value - 1) * ordersItemsPerPage
        const to = from + ordersItemsPerPage - 1

        let query = supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('source', 'ai_agent')
            .filter('data->>user_id', 'eq', user.id)
            .not('data->>payment_transaction_id', 'is', null)
            .order('created_at', { ascending: false })

        // Apply Platform Filter
        if (ordersActiveTab.value !== 'all') {
            if (ordersActiveTab.value === 'facebook') {
                query = query.or('data->>platform.eq.messenger,data->>platform.eq.fb_comment')
            } else {
                query = query.eq('data->>platform', ordersActiveTab.value)
            }
        }

        // Apply Search Filter
        if (ordersSearchQuery.value) {
            const term = ordersSearchQuery.value.trim()
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)
            if (isUuid) {
                query = query.eq('id', term)
            } else {
                query = query.or(`email.ilike.%${term}%,data->>customer.ilike.%${term}%,data->>order.ilike.%${term}%,data->>payment_transaction_id.ilike.%${term}%`)
            }
        }

        // Apply Date Range Filter
        if (ordersStartDate.value) {
            query = query.gte('created_at', ordersStartDate.value)
        }
        if (ordersEndDate.value) {
            const end = new Date(ordersEndDate.value)
            end.setDate(end.getDate() + 1)
            query = query.lt('created_at', end.toISOString())
        }

        const { data, count, error } = await query.range(from, to)
        
        if (error) throw error
        orders.value = data || []
        totalOrders.value = count || 0
    } catch (e) {
        console.error('Failed to fetch orders:', e)
    } finally {
        loading.value = false
    }
}

const fetchLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
        const from = (logsCurrentPage.value - 1) * logsItemsPerPage
        const to = from + logsItemsPerPage - 1

        const { data, count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('source', 'ai_moderation')
            .filter('data->>user_id', 'eq', user.id)
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) throw error

        totalLogs.value = count || 0
        
        const mergedLogs = []
        if (data) {
            data.forEach(m => {
                const cleanComment = m.data?.order ? m.data.order.replace('🔴 DELETED COMMENT: ', '').replace(/^"|"$/g, '') : ''
                mergedLogs.push({
                    id: m.id,
                    created_at: m.created_at,
                    event: `Auto-deleted: "${cleanComment}"`,
                    profile: m.data?.customer || 'Unknown User',
                    platform: 'FB Comment',
                    rate: 100,
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })
            })
        }
        logs.value = mergedLogs
    } catch (e) {
        console.error('Failed to fetch logs:', e)
    }
}

// Watchers for reactive fetching
watch([currentPage, activeTab, startDate, endDate], () => {
    fetchLeads()
})

watch([ordersCurrentPage, ordersActiveTab, ordersStartDate, ordersEndDate], () => {
    fetchOrders()
})

watch(logsCurrentPage, () => {
    fetchLogs()
})

// Debounced Search
let searchTimeout
watch(searchQuery, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        currentPage.value = 1
        fetchLeads()
    }, 500)
})

// Debounced Orders Search
let ordersSearchTimeout
watch(ordersSearchQuery, () => {
    clearTimeout(ordersSearchTimeout)
    ordersSearchTimeout = setTimeout(() => {
        ordersCurrentPage.value = 1
        fetchOrders()
    }, 500)
})

const deleteLead = async (id) => {
    askConfirm(
        'Delete Order?',
        'This record will be permanently purged from the neural database.',
        async () => {
            try {
                const { error } = await supabase.from('leads').delete().eq('id', id)
                if (error) throw error
                leads.value = leads.value.filter(l => l.id !== id)
                showToast('Order Deleted Successfully', 'success')
            } catch (e) {
                showToast('Delete Failed: ' + e.message, 'error')
            }
        }
    )
}

const openEditModal = (lead) => {
    editingLead.value = lead
    editOrderText.value = lead.data.order || ''
    editLeadStatus.value = lead.data.status || 'pending'
    editTransactionId.value = lead.data.payment_transaction_id || ''
    showEditModal.value = true
}

const saveLeadUpdate = async () => {
    if (!editingLead.value) return
    try {
        const txId = editTransactionId.value.trim() || null
        const updatedData = { 
            ...editingLead.value.data, 
            order: editOrderText.value,
            status: editLeadStatus.value,
            payment_transaction_id: txId
        }
        const { error } = await supabase
            .from('leads')
            .update({ data: updatedData })
            .eq('id', editingLead.value.id)
        
        if (error) throw error
        
        // Re-fetch to update tables cleanly
        await Promise.all([
            fetchLeads(),
            fetchOrders()
        ])
        
        showEditModal.value = false
        editingLead.value = null
        showToast('Order Updated Successfully', 'success')
    } catch (e) {
        showToast('Update Failed: ' + e.message, 'error')
    }
}

const updateKnowledge = async (agent) => {
    try {
        const { error } = await supabase
            .from('agent_configs')
            .update({ 
                knowledge: agent.knowledge,
                product_images: agent.product_images.filter(img => img && img.url && img.url.trim() !== ''),
                agent_behavior: agent.agent_behavior
            })
            .eq('id', agent.id)
        
        if (error) throw error
        agent.isDirty = false
        showToast('Knowledge Base & Product Gallery Synchronized', 'success')
    } catch (e) {
        showToast('Sync Failed: ' + e.message, 'error')
    }
}

// Checkbox Selection & Steadfast Courier Integration State
const selectedLeads = ref([])
const sendingToSteadfast = ref(false)

const isAllSelected = computed(() => {
    if (leads.value.length === 0) return false
    return leads.value.every(lead => selectedLeads.value.includes(lead.id))
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedLeads.value = []
    } else {
        selectedLeads.value = leads.value.map(lead => lead.id)
    }
}

// 1. Bulk send selected orders/leads to Steadfast
const sendSelectedToSteadfast = async () => {
    if (selectedLeads.value.length === 0) return
    sendingToSteadfast.value = true
    try {
        const payload = {
            lead_ids: selectedLeads.value,
            // Pass the local settings state as a reliable proxy fallback
            api_key: integrations.steadfast_api_key || null,
            secret_key: integrations.steadfast_secret_key || null
        }
        
        const res = await $fetch('/api/steadfast-proxy', {
            method: 'POST',
            body: payload
        })
        
        let successCount = 0
        let failCount = 0
        
        if (res.results) {
            for (const r of res.results) {
                if (r.success) {
                    successCount++
                    const localLead = leads.value.find(l => l.id === r.lead_id)
                    if (localLead) {
                        if (!localLead.data) localLead.data = {}
                        localLead.data.tracking_code = r.tracking_code
                        localLead.data.delivery_status = r.status
                        localLead.data.consignment_id = r.consignment_id
                    }
                } else {
                    failCount++
                }
            }
        }
        
        if (failCount === 0) {
            showToast(`Successfully booked ${successCount} shipments on Steadfast`, 'success')
        } else {
            showToast(`Booked ${successCount} shipments. ${failCount} failed.`, 'warning')
        }
        
        selectedLeads.value = []
    } catch (e) {
        showToast('Courier Booking Failed: ' + e.message, 'error')
    } finally {
        sendingToSteadfast.value = false
    }
}

// 2. Send a single order/lead to Steadfast
const sendSingleToSteadfast = async (leadId) => {
    sendingToSteadfast.value = true
    try {
        const payload = {
            lead_ids: [leadId],
            // Pass the local settings state as a reliable proxy fallback
            api_key: integrations.steadfast_api_key || null,
            secret_key: integrations.steadfast_secret_key || null
        }
        
        const res = await $fetch('/api/steadfast-proxy', {
            method: 'POST',
            body: payload
        })
        
        if (res.results && res.results[0]) {
            const r = res.results[0]
            if (r.success) {
                const localLead = leads.value.find(l => l.id === leadId)
                if (localLead) {
                    if (!localLead.data) localLead.data = {}
                    localLead.data.tracking_code = r.tracking_code
                    localLead.data.delivery_status = r.status
                    localLead.data.consignment_id = r.consignment_id
                }
                showToast(`Shipment booked successfully: ${r.tracking_code}`, 'success')
            } else {
                showToast(`Steadfast Error: ${r.message || 'Unknown error'}`, 'error')
            }
        }
    } catch (e) {
        showToast('Steadfast Courier Booking Failed: ' + e.message, 'error')
    } finally {
        sendingToSteadfast.value = false
    }
}

const exportToCSV = () => {
    if (leads.value.length === 0) return

    // 1. Define base headers
    const baseHeaders = ['Platform', 'Customer', 'Email', 'Time', 'Date']
    
    // 2. Dynamically find all unique keys in the order data
    const orderKeys = new Set()
    filteredLeads.value.forEach(l => {
        const orderStr = l.data.order || ''
        if (orderStr.includes(':')) {
            orderStr.split('|').forEach(part => {
                const key = part.split(':')[0]?.trim()
                // Prevent duplicates with baseHeaders
                if (key && !baseHeaders.some(h => h.toLowerCase() === key.toLowerCase())) {
                    orderKeys.add(key)
                }
            })
        }
    })
    
    const allHeaders = [...baseHeaders, ...Array.from(orderKeys)]
    
    // 3. Create CSV rows
    const rows = filteredLeads.value.map(l => {
        const rowData = {
            Platform: l.data.platform,
            Customer: l.data.customer,
            Email: l.email,
            Time: new Date(l.created_at).toLocaleTimeString(),
            Date: new Date(l.created_at).toLocaleDateString()
        }
        
        // Extract order parts
        const orderStr = l.data.order || ''
        if (orderStr.includes(':')) {
            orderStr.split('|').forEach(part => {
                const [key, val] = part.split(':').map(s => s.trim())
                if (key) rowData[key] = val
            })
        } else {
            rowData['Details'] = orderStr
        }
        
        return allHeaders.map(header => `"${rowData[header] || ''}"`).join(',')
    })
    
    const csvContent = [allHeaders.join(','), ...rows].join('\n')
    
    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `order_export_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const filteredLeads = computed(() => {
    return leads.value // Already filtered server-side now
})

const showDeleteModal = ref(false)
const targetAgentId = ref(null)

const stats = reactive([
    { label: 'Tokens Used', value: '0', growth: '+12%', icon: 'token', color: 'text-primary' },
    { label: 'Agents Online', value: '0', growth: '+0%', icon: 'robot_2', color: 'text-primary' },
    { label: 'Response Accuracy', value: '98.4%', growth: '+2.1%', icon: 'verified', color: 'text-primary' },
])

const handleLogout = async () => {
    await supabase.auth.signOut()
    navigateTo('/login')
}

const handleUpgrade = () => {
    const popup = document.getElementById("myPopup")
    if (popup) {
        popup.classList.toggle("show")
        setTimeout(() => popup.classList.remove("show"), 3000)
    }
}

const disconnectAgent = (id) => {
    targetAgentId.value = id
    showDeleteModal.value = true
}

const confirmDelete = async () => {
    if (!targetAgentId.value) return
    try {
        const { error } = await supabase.from('agent_configs').delete().eq('id', targetAgentId.value)
        if (error) throw error
        agents.value = agents.value.filter(a => a.id !== targetAgentId.value)
        stats[1].value = agents.value.length.toString()
        showDeleteModal.value = false
        targetAgentId.value = null
    } catch (e) {
        alert('Failed: ' + e.message)
    }
}

const copyText = (text) => {
    navigator.clipboard.writeText(text)
}


onMounted(async () => {
    if (typeof window !== 'undefined') {
        isMobile.value = window.innerWidth <= 640
        const handleResize = () => {
            isMobile.value = window.innerWidth <= 640
        }
        window.addEventListener('resize', handleResize)
        onUnmounted(() => {
            window.removeEventListener('resize', handleResize)
        })
    }
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            userEmail.value = user.email
            await fetchAgents()

            // Fetch Real Stats & Logs (Combined Intelligence)
            const ids = agents.value.map(a => a.id)

            const [genRes, chatRes] = await Promise.all([
                supabase.from('generations').select('id', { count: 'exact' }).eq('user_id', user.id),
                supabase.from('chat_history').select('tokens_used').in('agent_id', ids).eq('role', 'assistant')
            ])
            
            const chatTokens = (chatRes.data || []).reduce((sum, row) => sum + (row.tokens_used || 0), 0)
            const genTokens = (genRes.count || 0) * 450
            const totalTokensNum = chatTokens + genTokens
            
            // Show exact token count formatted with commas
            stats[0].value = totalTokensNum.toLocaleString()
            stats[0].label = 'Tokens Used'

            await fetchLogs()

            // Fetch AI Leads (Orders) - Removed old logic for server-side
            await fetchLeads()
            
            // Fetch Paid Orders
            await fetchOrders()

            // Load Integration Credentials from agents
            loadIntegrations(agents.value)

            // Fetch Developer API Keys
            await fetchApiKeys()

            // Fetch Mock Inventory
            await fetchInventory()

            // Check VPS Backend Status
            checkBackendStatus()
        }
    } catch (e) {
        console.error('Failed to fetch dashboard data:', e)
    } finally {
        // loading.value = false // Controlled by fetchLeads now
    }
})

definePageMeta({
    layout: 'dashboard'
})

useHead({
    title: 'Dashboard - Clickify Mate Command Center'
})
</script>

<style scoped>
.text-success { color: #38b000; }

.popup-bubble {
    position: absolute;
    bottom: calc(100% + 1rem);
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: #1a1a1a;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 100;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.popup-bubble.show {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
}

@media (max-width: 768px) {
    .popup-bubble {
        left: auto;
        right: 0;
        transform: translateY(10px);
        white-space: normal;
        width: 200px;
    }
    .popup-bubble.show {
        transform: translateY(0);
    }
    .popup-arrow {
        left: auto;
        right: 24px;
    }
}

.popup-arrow {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #1a1a1a;
}
</style>
