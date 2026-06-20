<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <!-- Left Sidebar / Top Mobile Nav -->
    <aside class="w-full md:w-72 bg-surface/30 border-b md:border-b-0 md:border-r border-white/5 shrink-0 flex flex-col justify-between">
      <div class="flex flex-col">
        <!-- Logo / Brand Header -->
        <div class="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 class="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-2 text-white">
              Command Center
            </h1>
            <p class="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Elite Tier System</p>
          </div>
          <!-- Mobile logout -->
          <button @click="handleLogout" class="md:hidden flex items-center justify-center p-2 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl hover:bg-error hover:text-white transition-colors">
            <span class="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>

        <!-- Sidebar Navigation Menu -->
        <nav class="p-4 md:p-6 flex md:flex-col overflow-x-auto md:overflow-x-visible gap-2 md:gap-1 scrollbar-none">
          <button 
            v-for="item in menuItems" 
            :key="item.id" 
            @click="currentMenu = item.id"
            class="flex items-center gap-3 px-4 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all duration-300 text-left whitespace-nowrap shrink-0 w-auto md:w-full border"
            :class="currentMenu === item.id 
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-102' 
              : 'bg-transparent border-transparent text-on-surface-variant/60 hover:text-white hover:bg-white/5'"
          >
            <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </div>

      <!-- Footer Actions (Logout, etc.) - Desktop Only -->
      <div class="hidden md:block p-6 border-t border-white/5 space-y-3">
        <div class="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <div class="text-[9px] font-black uppercase tracking-widest text-white/80">System Secured</div>
        </div>
        <button 
          @click="handleLogout" 
          class="w-full h-11 text-red-300 bg-red-500/10 border border-red-500/20 hover:border-red-500/50 hover:bg-error hover:text-white transition-all duration-300 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-[16px]">logout</span>
          Logout System
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 p-4 md:p-8 space-y-8 md:space-y-12 overflow-y-auto min-w-0">


        <!-- Stats Overview -->
        <div v-if="currentMenu === 'overview'" class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div v-for="stat in stats" :key="stat.label" class="bg-surface/40  border border-white/10 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-primary/5 transition-all group overflow-hidden relative">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
                <div class="flex items-center justify-between mb-4">
                    <span class="material-symbols-outlined text-3xl" :class="stat.color">{{ stat.icon }}</span>
                    <span class="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">trending_up</span> {{ stat.growth }}
                    </span>
                </div>
                <div class="text-4xl font-black tracking-tighter mb-1 text-white">{{ stat.value }}</div>
                <div class="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/60">{{ stat.label }}</div>
            </div>
        </div>

        <!-- Active Agents Section -->
        <section v-if="currentMenu === 'agents'" class="space-y-8">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-black tracking-tight flex items-center gap-3">
                    <span class="w-2 h-8 bg-primary rounded-full"></span>
                    Connected AI Agents
                </h2>
                <NuxtLink to="/tools/ai-reply" class="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline">Deploy New Agent +</NuxtLink>
            </div>

            <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div v-for="i in 3" :key="i" class="h-64 bg-surface-container-low animate-pulse rounded-[3rem]"></div>
            </div>

            <div v-else-if="agents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div v-for="agent in agents" :key="agent.id" class="bg-surface/40  border border-white/10 p-5 md:p-8 rounded-[0.9rem] shadow-sm group hover:border-primary/30 transition-all relative overflow-hidden">
                    <div class="flex items-start justify-between mb-8">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center text-2xl"
                                     v-html="agent.platform === 'telegram' 
                                      ? '<span class=&quot;material-symbols-outlined&quot;>support_agent</span>' 
                                       : '<span class=&quot;material-symbols-outlined&quot;>support_agent</span>'">
                            </div>
                        <div>
                                <h3 class="font-black text-lg text-white">{{ formatPlatformName(agent.platform) }} Agent</h3>
                                <div class="flex items-center gap-2 group/id cursor-pointer" @click="copyText(agent.id); showToast('Agent ID Copied', 'success')" title="Click to copy full ID">
                                    <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">ID: ...{{ agent.id.slice(-6) }}</p>
                                    <span class="material-symbols-outlined text-[10px] opacity-0 group-hover/id:opacity-100 transition-opacity">content_copy</span>
                                </div>
                            </div>
                        </div>
                        <div :class="agent.is_active ? 'bg-success/10 text-success' : 'bg-outline-variant/20 text-on-surface-variant'" class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-current/10">
                            <span class="w-1.5 h-1.5 rounded-full bg-current" :class="agent.is_active ? 'animate-pulse' : ''"></span>
                            {{ agent.is_active ? 'Active' : 'Offline' }}
                        </div>
                    </div>

                    <!-- Editable Knowledge Base -->
                    <div class="mb-4 p-3 bg-surface-container-lowest border border-white/10 rounded-[0.9rem] relative group/kb">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary/60">
                                <span class="material-symbols-outlined text-sm">psychology</span>
                                Knowledge Base
                                <button @click="showGuideModal = true" class="text-[9px] text-primary/80 hover:text-primary underline ml-1 cursor-pointer transition-colors bg-transparent border-none p-0 normal-case tracking-normal">Help Guide</button>
                            </div>
                            <button v-if="agent.isDirty" @click="updateKnowledge(agent)" class="flex items-center gap-1 text-[9px] font-black text-primary hover:text-white hover:bg-primary/20 px-2 py-1 rounded-md transition-all active:scale-95">
                                <!-- <span class="material-symbols-outlined text-[14px]">save</span> -->
                                SYNC
                            </button>
                        </div>
                        <textarea 
                            v-model="agent.knowledge" 
                            @input="agent.isDirty = true"
                            placeholder="Type business details here..." 
                            class="w-full  bg-transparent text-[11px] font-medium text-on-surface-variant italic min-h-[160px] outline-none resize-none placeholder:opacity-30 border-none p-0"
                        ></textarea>
                    </div>

                    <!-- Advance Options (Facebook Comment Agent only) -->
                    <div v-if="agent.platform === 'fb_comment'" class="mb-4 p-3 bg-surface-container-lowest border border-white/10 rounded-[0.9rem] relative">
                        <div class="flex items-center justify-between">
                            <button @click="agent.showAdvance = !agent.showAdvance" class="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white flex items-center gap-1 cursor-pointer transition-colors bg-transparent border-none p-0">
                                <span class="material-symbols-outlined text-sm font-black">{{ agent.showAdvance ? 'expand_less' : 'expand_more' }}</span>
                                Advance Settings
                            </button>
                        </div>
                        
                        <div v-show="agent.showAdvance" class="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1">Private Reply Routing (Messenger)</div>
                            
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" v-model="agent.agent_behavior.fb_private_reply_prices" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer" />
                                <span class="text-[10px] font-semibold text-white/80 group-hover:text-white transition-colors">Private reply to Price inquiries</span>
                            </label>
                            
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" v-model="agent.agent_behavior.fb_private_reply_orders" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer" />
                                <span class="text-[10px] font-semibold text-white/80 group-hover:text-white transition-colors">Private reply to Intent/Orders</span>
                            </label>
                            
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" v-model="agent.agent_behavior.fb_private_reply_pii" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer" />
                                <span class="text-[10px] font-semibold text-white/80 group-hover:text-white transition-colors">Private reply to Phone/Address</span>
                            </label>

                            <label class="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" v-model="agent.agent_behavior.fb_private_reply_complaints" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer" />
                                <span class="text-[10px] font-semibold text-white/80 group-hover:text-white transition-colors">Private reply to Complaints</span>
                            </label>

                            <div class="h-px bg-white/5 my-2"></div>

                            <label class="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" v-model="agent.agent_behavior.fb_public_reply_enabled" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer" />
                                <span class="text-[10px] font-semibold text-white/80 group-hover:text-white transition-colors">Enable public replies on comments</span>
                            </label>

                            <label class="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" v-model="agent.agent_behavior.fb_delete_negatives" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer" />
                                <span class="text-[10px] font-semibold text-red-400 group-hover:text-red-300 transition-colors">Auto-delete negative/spam comments</span>
                            </label>
                        </div>
                    </div>

                    <!-- Product Gallery (Images) -->
                    <div class="mb-8 p-3 sm:p-5 bg-surface-container-lowest/50 border border-white/5 rounded-[0.9rem] relative group/images">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-secondary/60">
                                <span class="material-symbols-outlined text-sm">gallery_thumbnail</span>
                                Product Gallery (Max 3)
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div v-for="idx in agent.visibleImageCount" :key="idx-1" class="flex items-center gap-1.5 sm:gap-3 animate-in fade-in slide-in-from-top-1 duration-300 w-full min-w-0">
                                <div class="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
                                    <img v-if="agent.product_images[idx-1]?.url" :src="agent.product_images[idx-1].url" class="w-full h-full object-cover" @error="agent.product_images[idx-1].url = ''" />
                                    <span v-else class="material-symbols-outlined text-xs opacity-20">image</span>
                                </div>
                                <input 
                                    v-model="agent.product_images[idx-1].id"
                                    @input="agent.isDirty = true"
                                    :placeholder="isMobile ? 'Product-ID' : 'Product-ID(e.g:101)'"
                                    class="w-20 sm:w-28 bg-white/5 px-1.5 py-1.5 rounded-[0.4rem] text-[10px] font-bold text-secondary outline-none border border-white/5 focus-visible:border-secondary/40 transition-colors shrink-0 min-w-0 text-left"
                                />
                                <input 
                                    v-model="agent.product_images[idx-1].url"
                                    @input="agent.isDirty = true"
                                    placeholder="Paste Image URL..."
                                    class="flex-grow min-w-0 bg-white/5 px-2 py-1.5 rounded-[0.4rem] text-[10px] font-medium text-white/80 outline-none border border-white/5 focus-visible:border-secondary/40 transition-colors"
                                />
                            </div>

                            <!-- Add Button -->
                            <button 
                                v-if="agent.visibleImageCount < 3"
                                @click="agent.visibleImageCount++"
                                class="w-full py-2 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-on-surface-variant/40 hover:text-secondary hover:border-secondary/40 transition-all group/add"
                            >
                                <span class="material-symbols-outlined text-sm group-hover/add:scale-110 transition-transform">add_circle</span>
                                <span class="text-[9px] font-black uppercase tracking-widest">Add Product Image</span>
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-col gap-4">
                        <button 
                            @click="disconnectAgent(agent.id)"
                            class="w-full py-4 bg-red-500/5 text-red-400 border border-red-500/10 hover:border-red-500/40 hover:bg-red-500/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-102 transition-all duration-500 flex items-center justify-center gap-2"
                        >
                            <span class="material-symbols-outlined text-sm">delete</span>
                            Disconnect Agent
                        </button>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[4rem] p-16 text-center space-y-6">

                <div class="w-20 h-20 bg-primary/10 rounded-[2rem] mx-auto flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-4xl">robot_2</span>
                </div>
                <div class="max-w-md mx-auto space-y-2">
                    <h3 class="text-xl font-black">No Active Agents Found</h3>
                    <p class="text-sm font-medium text-on-surface-variant">Your command center is ready. Connect your first social media agent to start automating your customer intelligence.</p>
                </div>
                <NuxtLink to="/tools/ai-reply" class="inline-flex items-center gap-3 px-8 h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
                    Initialize First Agent
                </NuxtLink>
            </div>
        </section>

        <!-- VPS AI Backend Engine Panel -->
        <section v-if="currentMenu === 'overview'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-black tracking-tight flex items-center gap-3">
                    <span class="w-2 h-8 bg-secondary rounded-full"></span>
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
                <div class="bg-surface/40 border border-white/10 p-6 md:p-8 rounded-[2rem] relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors" :class="backendStatus === 'operational' ? 'bg-green-500/15' : 'bg-red-500/15'"></div>
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center" :class="backendStatus === 'operational' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'">
                                <span class="material-symbols-outlined text-2xl">{{ backendStatus === 'operational' ? 'cloud_done' : 'cloud_off' }}</span>
                            </div>
                            <div>
                                <h3 class="text-sm font-black uppercase tracking-widest text-white">VPS Backend</h3>
                                <p class="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-wider">Python Microservice</p>
                            </div>
                        </div>
                        <div :class="backendStatus === 'operational' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'" class="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border">
                            <span class="w-1.5 h-1.5 rounded-full bg-current" :class="backendStatus === 'operational' ? 'animate-pulse' : ''"></span>
                            {{ backendStatus === 'operational' ? 'Online' : 'Offline' }}
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/40 block mb-1">FFmpeg</span>
                            <span class="text-[10px] font-black" :class="backendFfmpeg ? 'text-green-500' : 'text-red-400'">{{ backendFfmpeg ? 'Ready' : 'N/A' }}</span>
                        </div>
                        <div class="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/40 block mb-1">Mode</span>
                            <span class="text-[10px] font-black text-secondary">{{ backendVpsMode ? 'VPS' : 'Local' }}</span>
                        </div>
                    </div>
                </div>

                <!-- AI Capabilities Card -->
                <div class="bg-surface/40 border border-white/10 p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg text-primary">auto_awesome</span>
                        AI Capabilities
                    </h3>
                    <div class="space-y-3">
                        <div v-for="cap in aiCapabilities" :key="cap.label" class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group/cap hover:border-primary/20 transition-colors">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-lg" :class="cap.color">{{ cap.icon }}</span>
                                <div>
                                    <span class="text-[10px] font-black uppercase tracking-widest text-white">{{ cap.label }}</span>
                                    <p class="text-[8px] font-bold text-on-surface-variant/40">{{ cap.engine }}</p>
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
                <h2 class="text-xl font-black tracking-tight flex items-center gap-3 text-white">
                    <span class="w-2 h-8 bg-secondary rounded-full"></span>
                    System Settings & Integrations
                </h2>
            </div>

            <!-- Integration Credentials -->
            <div class="bg-surface/40 border border-white/10 p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
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
                                    <div class="font-bold text-white">1. Real-Time Stock Check</div>
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
                                    <div class="font-bold text-white">2. Automatic Order Sync / Confirmation</div>
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
                                    <input type="checkbox" v-model="integrations.sslcommerz_sandbox" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer" />
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
            <div class="bg-surface/40 border border-white/10 p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
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
                                    <td class="p-4 font-bold text-white">{{ item.name }}</td>
                                    <td class="p-4 font-mono font-medium text-emerald-400">{{ item.sku }}</td>
                                    <td class="p-4 font-medium text-white/60">{{ item.size }}</td>
                                    <td class="p-4 font-medium text-white/60">{{ item.color }}</td>
                                    <td class="p-4 text-right font-black text-white">৳{{ item.price }}</td>
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

        <!-- Customer Intelligence (Orders) -->
        <section v-if="currentMenu === 'leads'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="flex flex-col lg:flex-col lg:items-left justify-left gap-6 pb-6">
                <div class="space-y-2">
                    <div class="flex items-left gap-3">
                        <span class="w-2 bg-primary rounded-full animate-pulse shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]"></span>
                        <h2 class="text-xl md:text-2xl font-black tracking-tight text-white">Customer Orders</h2>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3">
                    <!-- Search Input -->
                    <div class="relative group w-full lg:w-auto">
                        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg group-focus-within:text-primary transition-all">search</span>
                        <input 
                            v-model="searchQuery"
                            type="text" 
                            placeholder="Find leads, orders, info..."
                            class="w-full lg:min-w-[280px] h-10 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold text-white outline-none focus:border-primary/50 focus:bg-primary/10 transition-all placeholder:text-on-surface-variant/30"
                        >
                        <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <!-- Date Range -->
                    <div class="flex items-center h-10 px-3 bg-white/5 rounded-2xl border border-white/10 group focus-within:border-primary/30 transition-all w-full lg:w-auto overflow-hidden">
                        <span class="material-symbols-outlined text-sm text-on-surface-variant/40 mr-2 flex-shrink-0">calendar_today</span>
                        <input 
                            v-model="startDate"
                            type="date" 
                            class="bg-transparent text-[10px] font-black text-white outline-none [color-scheme:dark] w-full"
                        >
                        <span class="text-on-surface-variant/20 font-bold mx-1">-</span>
                        <input 
                            v-model="endDate"
                            type="date" 
                            class="bg-transparent text-[10px] font-black text-white outline-none [color-scheme:dark] w-full"
                        >
                    </div>

                    <!-- Platform Filters -->
                    <div class="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar w-full lg:w-auto">
                        <button 
                            v-for="tab in ['all', 'whatsapp', 'telegram', 'facebook']" 
                            :key="tab"
                            @click="activeTab = tab; currentPage = 1"
                            :class="activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-white/5'"
                            class="flex-1 lg:flex-none px-4 lg:px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
                        >
                            {{ tab }}
                        </button>
                    </div>

                    <button 
                        @click="exportToCSV"
                        class="w-full lg:w-auto h-10 px-6 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all shadow-xl shadow-primary/10"
                    >
                        <span class="material-symbols-outlined text-sm">download</span>
                        Export CSV
                    </button>
                    <button 
                        v-if="selectedLeads.length > 0"
                        @click="sendSelectedToSteadfast"
                        :disabled="sendingToSteadfast"
                        class="w-full lg:w-auto h-10 px-6 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-600/30 active:scale-95 transition-all shadow-xl shadow-orange-600/10 disabled:opacity-50 animate-in fade-in zoom-in-95 duration-200"
                    >
                        <span class="material-symbols-outlined text-sm" :class="sendingToSteadfast ? 'animate-spin' : ''">local_shipping</span>
                        Send {{ selectedLeads.length }} to Steadfast
                    </button>
                </div>
            </div>

            <div class="bg-surface/40 border border-white/10 rounded-[0.9rem]  overflow-hidden shadow-2xl backdrop-blur-xl relative min-h-[400px]">
                <!-- Loading Overlay -->
                <div v-if="loading" class="absolute inset-0 z-20 bg-surface/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                    <div class="flex flex-col items-center gap-6">
                        <div class="relative">
                            <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <div class="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-secondary rounded-full animate-spin [animation-duration:1.5s]"></div>
                        </div>
                        <div class="flex flex-col items-center gap-1">
                            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Syncing Order Data</span>
                            <span class="text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Updating Secure Database...</span>
                        </div>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left min-w-[800px]">
                        <thead>
                            <tr class="bg-primary/5 border-b border-white/5">
                                <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-primary/60 w-10"></th>
                                <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-primary/60 w-12">
                                    <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer" />
                                </th>
                                <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-primary/60 w-12">No.</th>
                                <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-primary/60 w-24">Platform</th>
                                <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/60">Customer Info</th>
                                <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/60">Order ID</th>
                                <th class="px-2 py-3.5 md:px-4 md:py-4 text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/60 w-28">Time</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            <template v-for="(lead, index) in leads" :key="lead.id">
                                <!-- Compact Row -->
                                <tr 
                                    @click="toggleLeadExpand(lead.id)"
                                    class="cursor-pointer hover:bg-primary/5 transition-all group border-b border-white/5"
                                    :class="{ 'bg-primary/5': expandedLeads.includes(lead.id) }"
                                >
                                    <!-- Caret Toggle -->
                                    <td class="px-2 py-3 md:px-4 md:py-4 text-center w-10">
                                        <span class="material-symbols-outlined text-sm text-on-surface-variant/40 group-hover:text-primary transition-colors inline-block" :class="{ 'rotate-180': expandedLeads.includes(lead.id) }">expand_more</span>
                                    </td>
                                    <!-- Checkbox -->
                                    <td class="px-2 py-3 md:px-4 md:py-4 w-12" @click.stop>
                                        <input type="checkbox" :value="lead.id" v-model="selectedLeads" class="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer" />
                                    </td>
                                    <!-- Number -->
                                    <td class="px-2 py-3 md:px-4 md:py-4 text-[10px] font-mono font-bold text-white/40">
                                        #{{ (currentPage - 1) * itemsPerPage + index + 1 }}
                                    </td>
                                    <!-- Platform -->
                                    <td class="px-2 py-3 md:px-4 md:py-4">
                                        <span class="text-[9px] font-black uppercase tracking-widest text-primary/80 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">{{ lead.data.platform }}</span>
                                    </td>
                                    <!-- Customer Info -->
                                    <td class="px-2 py-3 md:px-4 md:py-4">
                                        <div class="flex flex-col gap-0.5">
                                            <div class="flex items-center gap-1.5">
                                                <span class="text-xs font-black text-white capitalize">{{ lead.data.customer }}</span>
                                                <span class="px-1.5 py-0.2 bg-secondary/10 text-secondary text-[7px] font-black rounded uppercase">Lead</span>
                                                <span class="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border transition-all"
                                                    :class="{
                                                        'bg-green-500/10 text-green-400 border-green-500/20': lead.data?.status === 'complete',
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': lead.data?.status === 'hold',
                                                        'bg-red-500/10 text-red-400 border-red-500/20': lead.data?.status === 'cancelled',
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20': !lead.data?.status || lead.data?.status === 'pending'
                                                    }">
                                                    {{ lead.data?.status || 'pending' }}
                                                </span>
                                            </div>
                                            <span class="text-[8px] font-medium text-on-surface-variant/40 tracking-wider">{{ lead.email }}</span>
                                        </div>
                                    </td>
                                    <!-- Order ID -->
                                    <td class="px-2 py-3 md:px-4 md:py-4" @click.stop>
                                        <div class="inline-flex items-center gap-1 group/id cursor-pointer bg-white/5 border border-white/10 px-2 py-1 rounded-lg hover:border-primary/40 transition-colors" @click="copyText(lead.id); showToast('Order ID Copied', 'success')" title="Click to copy full Order ID">
                                            <span class="font-mono text-[9px] text-white/50 group-hover/id:text-primary transition-colors">#{{ lead.id.slice(0, 8) }}</span>
                                            <span class="material-symbols-outlined text-[10px] text-white/30 group-hover/id:text-primary transition-colors">content_copy</span>
                                        </div>
                                    </td>
                                    <!-- Time -->
                                    <td class="px-2 py-3 md:px-4 md:py-4">
                                        <div class="text-[9px] font-black text-white/70 uppercase tracking-widest flex flex-col whitespace-nowrap">
                                            <span class="whitespace-nowrap">{{ new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                                            <span class="text-[8px] opacity-40 whitespace-nowrap">{{ new Date(lead.created_at).toLocaleDateString() }}</span>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Expanded Row Details -->
                                <tr v-if="expandedLeads.includes(lead.id)" class="bg-primary/5/10 border-b border-white/5">
                                    <td colspan="7" class="px-4 py-4 md:px-8 md:py-6 bg-surface-container-lowest/30">
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                            
                                            <!-- Order Analysis column -->
                                            <div class="space-y-3">
                                                <h5 class="text-[9px] font-black uppercase tracking-wider text-primary/80 flex items-center gap-1.5">
                                                    <span class="w-1.5 h-1.5 bg-primary rounded-full"></span>Order Analysis
                                                </h5>
                                                <div v-if="lead.data.order && lead.data.order.includes(':')" class="flex flex-wrap gap-2 max-w-full">
                                                    <div v-for="(part, i) in lead.data.order.split('|')" :key="i" 
                                                        class="px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center">
                                                        <span class="text-[8px] font-black uppercase text-primary/40 mr-1.5">
                                                            {{ part.split(':')[0]?.trim() }}:
                                                        </span>
                                                        <span class="text-[9px] font-bold" 
                                                            :class="part.toLowerCase().includes('total') ? 'text-success' : 'text-white'">
                                                            {{ part.split(':')[1]?.trim() }}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span v-else class="text-[10px] font-bold text-success/80">{{ lead.data.order || 'No order details collected' }}</span>
                                            </div>

                                            <!-- Courier Status column -->
                                            <div class="space-y-3">
                                                <h5 class="text-[9px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                                                    <span class="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>Courier Status
                                                </h5>
                                                <div v-if="lead.data?.tracking_code" class="flex flex-col gap-1.5">
                                                    <span class="text-[9px] font-mono font-black text-orange-400 select-all flex items-center gap-1">
                                                        <span class="material-symbols-outlined text-xs">local_shipping</span>
                                                        {{ lead.data.tracking_code }}
                                                    </span>
                                                    <span class="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-black rounded uppercase border border-green-500/20 w-max">
                                                        {{ lead.data.delivery_status || 'Delivered to Courier' }}
                                                    </span>
                                                </div>
                                                <div v-else class="flex flex-col gap-2">
                                                    <span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">Not Booked</span>
                                                    <button @click.stop="sendSingleToSteadfast(lead.id)" :disabled="sendingToSteadfast" class="px-3 py-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.05em] transition-all w-max flex items-center gap-1 disabled:opacity-50">
                                                        <span class="material-symbols-outlined text-[11px]">local_shipping</span>
                                                        Send to Steadfast
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- Actions column -->
                                            <div class="space-y-3">
                                                <h5 class="text-[9px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                                                    <span class="w-1.5 h-1.5 bg-red-400 rounded-full"></span>Actions
                                                </h5>
                                                <div class="flex items-center gap-2">
                                                    <button @click.stop="openEditModal(lead)" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white">
                                                        <span class="material-symbols-outlined text-[11px]">edit</span>
                                                        Edit
                                                    </button>
                                                    <button @click.stop="deleteLead(lead.id)" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-red-400">
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
                
                <!-- Empty State for Filters -->
                <div v-if="leads.length === 0 && !loading" class="p-20 text-center space-y-4">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant/20">filter_list_off</span>
                    <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">No orders found for this platform</p>
                </div>

                <!-- Pagination Footer -->
                <div v-if="totalPages > 1" class="px-8 py-6 bg-white/5 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalLeads) }} of {{ totalLeads }} Records
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <button 
                            @click="currentPage > 1 && (currentPage--)"
                            :disabled="currentPage === 1"
                            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <span class="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        
                        <div class="flex items-center gap-1">
                            <button 
                                v-for="p in totalPages" 
                                :key="p"
                                @click="currentPage = p"
                                :class="currentPage === p ? 'bg-primary text-white border-primary' : 'bg-white/5 border-white/10 text-on-surface-variant/60'"
                                class="w-10 h-10 rounded-xl border font-black text-xs flex items-center justify-center transition-all"
                            >
                                {{ p }}
                            </button>
                        </div>

                        <button 
                            @click="currentPage < totalPages && (currentPage++)"
                            :disabled="currentPage === totalPages"
                            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <span class="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Global Notifications (Toast) -->
        <Transition
            enter-active-class="transform transition ease-out duration-300"
            enter-from-class="translate-y-10 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="toast.show" class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]">
                <div :class="toast.type === 'success' ? 'bg-primary/90 border-primary shadow-primary/20' : 'bg-red-500/90 border-red-500 shadow-red-500/20'" 
                     class="px-8 py-4 rounded-2xl border backdrop-blur-xl text-white shadow-2xl flex items-center gap-4">
                    <span class="material-symbols-outlined">{{ toast.type === 'success' ? 'check_circle' : 'error' }}</span>
                    <span class="text-[10px] font-black uppercase tracking-widest">{{ toast.message }}</span>
                </div>
            </div>
        </Transition>

        <!-- Modern Confirmation Modal -->
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div v-if="confirmModal.show" class="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div class="w-full max-w-md bg-surface border border-white/10 rounded-[1.5rem] p-8 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300 relative overflow-hidden text-center">
                    <!-- <div class="w-20 h-20 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mx-auto border border-primary/20">
                        <span class="material-symbols-outlined text-4xl">priority_high</span>
                    </div> -->
                    
                    <div class="space-y-2">
                        <h3 class="text-2xl font-black tracking-tight text-white uppercase">{{ confirmModal.title }}</h3>
                        <p class="text-on-surface-variant font-medium text-sm leading-relaxed">{{ confirmModal.message }}</p>
                    </div>

                    <div class="flex flex-row gap-3">
                        <button @click="confirmModal.onConfirm(); confirmModal.show = false" class="w-full py-5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                            Confirm
                        </button>
                        <button @click="confirmModal.show = false" class="w-full py-5 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Paid Orders Section -->
        <section v-if="currentMenu === 'orders'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="flex flex-col lg:flex-col lg:items-left justify-left gap-6 pb-6">
                <div class="space-y-2">
                    <div class="flex items-left gap-3">
                        <span class="w-2 bg-success rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.5)]"></span>
                        <h2 class="text-xl md:text-2xl font-black tracking-tight text-white">Paid Orders</h2>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3">
                    <!-- Search Input -->
                    <div class="relative group w-full lg:w-auto">
                        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg group-focus-within:text-primary transition-all">search</span>
                        <input 
                            v-model="ordersSearchQuery"
                            type="text" 
                            placeholder="Find orders by name, phone, or transaction ID..."
                            class="w-full lg:min-w-[280px] h-10 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold text-white outline-none focus:border-primary/50 focus:bg-primary/10 transition-all placeholder:text-on-surface-variant/30"
                        >
                        <button v-if="ordersSearchQuery" @click="ordersSearchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <!-- Date Range -->
                    <div class="flex items-center h-10 px-3 bg-white/5 rounded-2xl border border-white/10 group focus-within:border-primary/30 transition-all w-full lg:w-auto overflow-hidden">
                        <span class="material-symbols-outlined text-sm text-on-surface-variant/40 mr-2 flex-shrink-0">calendar_today</span>
                        <input 
                            v-model="ordersStartDate"
                            type="date" 
                            class="bg-transparent text-[10px] font-black text-white outline-none [color-scheme:dark] w-full"
                        >
                        <span class="text-on-surface-variant/20 font-bold mx-1">-</span>
                        <input 
                            v-model="ordersEndDate"
                            type="date" 
                            class="bg-transparent text-[10px] font-black text-white outline-none [color-scheme:dark] w-full"
                        >
                    </div>

                    <!-- Platform Filters -->
                    <div class="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar w-full lg:w-auto">
                        <button 
                            v-for="tab in ['all', 'whatsapp', 'telegram', 'facebook']" 
                            :key="tab"
                            @click="ordersActiveTab = tab; ordersCurrentPage = 1"
                            :class="ordersActiveTab === tab ? 'bg-success text-white shadow-lg shadow-success/20 scale-105' : 'text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-white/5'"
                            class="flex-1 lg:flex-none px-4 lg:px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
                        >
                            {{ tab }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-surface/40 border border-white/10 rounded-[0.9rem] overflow-hidden shadow-2xl backdrop-blur-xl relative min-h-[400px]">
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
                                        #{{ (ordersCurrentPage - 1) * ordersItemsPerPage + index + 1 }}
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
                                        <div class="inline-flex items-center gap-1 group/id cursor-pointer bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg hover:border-success/40 transition-colors" @click="copyText(order.data?.payment_transaction_id); showToast('Transaction ID copied', 'success')" title="Click to copy Transaction ID">
                                            <span class="font-mono text-[9px] text-success/80 group-hover/id:text-success transition-colors font-bold">{{ order.data?.payment_transaction_id }}</span>
                                            <span class="material-symbols-outlined text-[10px] text-white/30 group-hover/id:text-success transition-colors">content_copy</span>
                                        </div>
                                    </td>
                                    <!-- Order ID -->
                                    <td class="px-2 py-3 md:px-4 md:py-4" @click.stop>
                                        <div class="inline-flex items-center gap-1 group/id cursor-pointer bg-white/5 border border-white/10 px-2 py-1 rounded-lg hover:border-primary/40 transition-colors" @click="copyText(order.id); showToast('Order ID copied', 'success')" title="Click to copy full Order ID">
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
                                                    <button @click.stop="sendSingleToSteadfast(order.id)" :disabled="sendingToSteadfast" class="px-3 py-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.05em] transition-all w-max flex items-center gap-1 disabled:opacity-50">
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
                                                    <button @click.stop="openEditModal(order)" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white">
                                                        <span class="material-symbols-outlined text-[11px]">edit</span>
                                                        Edit
                                                    </button>
                                                    
                                                    <button @click.stop="deleteLead(order.id)" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-red-400">
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
                <div v-if="ordersTotalPages > 1" class="px-8 py-6 bg-white/5 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                        Showing {{ (ordersCurrentPage - 1) * ordersItemsPerPage + 1 }} to {{ Math.min(ordersCurrentPage * ordersItemsPerPage, totalOrders) }} of {{ totalOrders }} Orders
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <button 
                            @click="ordersCurrentPage > 1 && (ordersCurrentPage--)"
                            :disabled="ordersCurrentPage === 1"
                            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <span class="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        
                        <div class="flex items-center gap-1">
                            <button 
                                v-for="p in ordersTotalPages" 
                                :key="p"
                                @click="ordersCurrentPage = p"
                                :class="ordersCurrentPage === p ? 'bg-success text-white border-success' : 'bg-white/5 border-white/10 text-on-surface-variant/60'"
                                class="w-10 h-10 rounded-xl border font-black text-xs flex items-center justify-center transition-all"
                            >
                                {{ p }}
                            </button>
                        </div>

                        <button 
                            @click="ordersCurrentPage < ordersTotalPages && (ordersCurrentPage++)"
                            :disabled="ordersCurrentPage === ordersTotalPages"
                            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <span class="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Intelligence Feed (Logging) -->
        <section v-if="currentMenu === 'logs'" class="space-y-8">
            <h2 class="text-xl font-black tracking-tight flex items-center gap-3 text-white">
                <span class="w-2 h-8 bg-rose-500 rounded-full"></span>
                Auto-Moderation Logs
            </h2>
            <div class="bg-surface/40  border border-white/10 rounded-[0.9rem] overflow-hidden shadow-sm">
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
                            @click="logsCurrentPage > 1 && (logsCurrentPage--)"
                            :disabled="logsCurrentPage === 1"
                            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <span class="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        
                        <div class="flex items-center gap-1">
                            <button 
                                v-for="p in logsTotalPages" 
                                :key="p"
                                @click="logsCurrentPage = p"
                                :class="logsCurrentPage === p ? 'bg-primary text-white border-primary' : 'bg-white/5 border-white/10 text-on-surface-variant/60'"
                                class="w-10 h-10 rounded-xl border font-black text-xs flex items-center justify-center transition-all"
                            >
                                {{ p }}
                            </button>
                        </div>

                        <button 
                            @click="logsCurrentPage < logsTotalPages && (logsCurrentPage++)"
                            :disabled="logsCurrentPage === logsTotalPages"
                            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <span class="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
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

    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showGuideModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div class="bg-surface-container-high border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
                    <!-- Modal Header -->
                    <div class="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary text-2xl">menu_book</span>
                            <div>
                                <h3 class="text-base font-black text-white uppercase tracking-wider">AI Agent Setup Guide & Templates</h3>
                                <p class="text-[10px] text-on-surface-variant/60 font-medium">Choose a template matching your store structure to copy & paste into your Knowledge Base.</p>
                            </div>
                        </div>
                        <button @click="showGuideModal = false" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">
                        <!-- Mobile Tabs -->
                        <div class="flex sm:hidden border-b border-white/5 p-3 gap-2 overflow-x-auto bg-surface-container-low/30 shrink-0">
                            <button 
                                @click="guideTab = 'single'"
                                :class="guideTab === 'single' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-white/50'"
                                class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                            >
                                Single Product
                            </button>
                            <button 
                                @click="guideTab = 'multi'"
                                :class="guideTab === 'multi' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-white/50'"
                                class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                            >
                                Multi-Product
                            </button>
                            <button 
                                @click="guideTab = 'category'"
                                :class="guideTab === 'category' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-white/50'"
                                class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                            >
                                Multi-Category
                            </button>
                        </div>

                        <!-- Sidebar tabs (Desktop only) -->
                        <div class="hidden sm:block w-48 border-r border-white/5 p-4 space-y-2 shrink-0 bg-surface-container-low/30">
                            <button 
                                @click="guideTab = 'single'"
                                :class="guideTab === 'single' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-white/50 hover:text-white hover:bg-white/5'"
                                class="w-full text-left px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Single Product
                            </button>
                            <button 
                                @click="guideTab = 'multi'"
                                :class="guideTab === 'multi' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-white/50 hover:text-white hover:bg-white/5'"
                                class="w-full text-left px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Multi-Product
                            </button>
                            <button 
                                @click="guideTab = 'category'"
                                :class="guideTab === 'category' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-white/50 hover:text-white hover:bg-white/5'"
                                class="w-full text-left px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Multi-Category
                            </button>
                        </div>

                        <!-- Content area -->
                        <div class="flex-1 p-6 overflow-y-auto flex flex-col min-h-0 space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-black uppercase tracking-wider text-white/90">
                                    {{ guideTab === 'single' ? 'Single Product Store Template' : guideTab === 'multi' ? 'Multi-Product Store Template' : 'Multi-Category Store Template' }}
                                </span>
                                <button 
                                    @click="copyTemplateText" 
                                    class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                                >
                                    <span class="material-symbols-outlined text-xs">content_copy</span>
                                    Copy Template
                                </button>
                            </div>

                            <pre class="flex-1 bg-white/5 border border-white/5 p-4 rounded-2xl text-[10px] font-mono text-white/80 overflow-auto select-text whitespace-pre-wrap leading-relaxed max-h-[50vh]">{{ getActiveTemplateText() }}</pre>

                            <div class="bg-surface-container-low border border-white/5 p-4 rounded-2xl space-y-2">
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
const supabase = useSupabase()
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

const showGuideModal = ref(false)
const guideTab = ref('single')
const isMobile = ref(false)

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

const singleProductTemplate = `# 🛍️ Fabrilife AI Sales Agent Knowledge Base (Single Product Store)

## 🌟 COMPANY INFORMATION
You are Mofij, sales assistant for Fabrilife — trusted BD online fashion store.
🌐 Website: https://fabrilife.com
📞 Hotline / Support: 01733887749
- Tone Guideline: Friendly and informal — like a helpful friend. Use "apni/আপনি". Switch instantly between Bengali, Banglish, or English if customer switches. Max 2 sentences per reply (except sizing/delivery/policy explanations).
- Emoji Usage: Do NOT use any emojis (like 😊, 🙏, etc.). Keep responses completely plain text.

---

## 👕 PRODUCT DETAILS & PRODUCT IDs
- Product Name: Premium T-Shirt
- Base Price: ৳490
- Material & Quality: 100% combed cotton, reactive dye (no fading), double-stitched for durability.
- Colors:
  * Color: Black | Product ID: bt-123 | Price: ৳490
  * Color: White | Product ID: wt-124 | Price: ৳490
  * Color: Navy Blue | Product ID: nb-125 | Price: ৳490

- Size Chart (Chest / Length):
  * S: 36" / 26"
  * M: 38" / 27"
  * L: 40" / 28"
  * XL: 42" / 29"
  * XXL: 44" / 30"
- Size Rule: Ask Apnar T-Shirt Size -> "Apnar height/weight koto? Perfect size bolte parbo". If between sizes, always recommend the larger one.

---

## 🚚 DELIVERY SYSTEM
- Delivery Charge:
  * Inside Dhaka: ৳70 | 1–2 days | Cash on Delivery (COD) supported.
  * Outside Dhaka: ৳150 | 2–4 days | Advance payment of delivery charge is required.
- Payment Methods: Cash on Delivery (COD - Dhaka only), bKash, Nagad, Rocket, Bank Transfer.
- Outside Dhaka Advance Charge Rule:
  * "Delivery charge ৳150 age pathate hobe amader bKash/Nagad-e: [FILL: NUMBER]. Transaction ID share korun, order book kore nebo"
  * Once the transaction ID is received, save the order to "Pre-paid Orders".

---

## 📦 ORDER (collect all 6 before confirming)
📌 Name:
📌 Full Address: (thana + district)
📌 Mobile:
📌 Color: (Black/White/Navy Blue)
📌 Size: (S/M/L/XL/XXL)
📌 Quantity:

- Confirmation Message Format:
  "[Name]-er [Qty]x [Color] [Size] T-Shirt confirm! [X–X] dine deliver hobe. Dhonnobad!"

---

## ❓ FREQUENTLY ASKED QUESTIONS
- Q: Color fade?
  - A: No, reactive dye — stays after washing ✅
- Q: Physical shop?
  - A: Online-only, that's why prices are low.
- Q: Check before paying?
  - A: Yes! Open-box delivery supported 😊
- Q: Out of stock?
  - A: Suggest alternative or offer to notify on restock.

---

## 🔄 RETURN & PRODUCT PROBLEM REPLACEMENT CRITERIA
- Notification: Report within 24 hours of delivery + photo proof required.
- Wrong/damaged product → free exchange, we cover delivery.
- Size doesn't fit (customer's choice) → exchange ok, customer pays delivery.
- No returns after delivery is accepted.

---

## ⏱️ HANDLING DELAYED ORDERS
1. Ask: mobile number or order ID.
2. Remind timeline: Dhaka 1-2d | Outside 2-4d.
3. After 3 days (outside Dhaka) → "Parcel pother modhhe ache, kal-ei pouchabe inshallah"
4. After 4+ days → Escalate: "Hotline-e call korun: 01733887749"

---

## 🚨 ESCALATION
- Angry/abusive → "Sorry. Amader team 5 minute-e callback korbe."
- Refund/payment dispute → Don't promise anything. Escalate immediately.
- Order not found → Escalate. Never guess.
- Unresolved after 2 tries → Hotline: 01733887749
- Never argue. Never offer discount without manager approval.`

const multiProductTemplate = `# 🛍️ PaperSnapPro AI Sales Agent Knowledge Base (Multi-Product Store)

## 🌟 COMPANY INFORMATION
Welcome to PaperSnapPro
We are a trusted online shopping platform in Bangladesh.
🌐 Website: https://www.papersnappro.com
📞 Customer Support: 017XXXXXXXX
- Tone Guideline: Keep responses under 2 sentences. Use friendly, informal Bengali/Banglish.
- Emoji Usage: Do NOT use any emojis. Keep responses completely plain text.

---

## 🛒 PRODUCT CATALOG WITH PRODUCT IDs & PRICES

1. Premium T-Shirt
   - Price: ৳490
   - Product ID: ts-premium
   - Description: Soft combed cotton, comfortable daily wear.
   - Colors: Black, White, Navy Blue
   - Sizes & Size Chart: S, M, L, XL, XXL (M: Chest 38" | L: 40" | XL: 42" | XXL: 44")
   - Stock Alert: Navy Blue XXL is currently out of stock.

2. Smart Watch
   - Price: ৳2490
   - Product ID: wt-smart
   - Description: Heart-rate tracker, sleep monitor, notification alerts.
   - Colors: Black, Orange

3. Wireless Earbuds
   - Price: ৳1690
   - Product ID: eb-wireless
   - Description: Deep bass, active noise cancelling, 20 hours battery life.
   - Colors: Black, White

4. Leather Wallet
   - Price: ৳790
   - Product ID: wl-leather
   - Description: 100% genuine leather, slim design with card slots.
   - Colors: Black, Brown

---

## 🚚 DELIVERY SYSTEM
- Delivery Charge:
  * Inside Dhaka City: ৳70
  * Outside Dhaka: ৳130
- Estimated Delivery Time:
  * Inside Dhaka: 1-2 Days
  * Outside Dhaka: 2-4 Days
- Payment Methods: Cash on Delivery (COD), bKash, Nagad, Rocket.

---

## 📦 ORDER CONFIRMATION FORM
To confirm an order, the customer must provide the following:
📌 Name:
📌 Complete Address:
📌 Mobile Number:
📌 Product Name:
📌 Color / Size (if applicable):
📌 Quantity:

---

## ❓ FREQUENTLY ASKED QUESTIONS
- Q: Can I check the product before paying the delivery rider?
  - A: Yes! We support open-box delivery. You can check the fabric and quality before paying.
- Q: Is the color guaranteed not to fade?
  - A: Yes, our Premium T-shirts are made from 100% combed cotton with reactive dye, meaning the color will not fade after washing.

---

## 🔄 RETURN & PRODUCT PROBLEM REPLACEMENT CRITERIA
- Notification: Customer must contact us within 24 hours of delivery.
- Size/Product Exchange: Supported within 3 days (customer pays shipping fee).
- Defective/Wrong Product: Free replacement or full refund if checked and found damaged or wrong.

---

## ⏱️ HANDLING DELAYED ORDERS (2-3+ DAYS)
If a customer complains they haven't received their package after 2-3 days, follow these rules:
1. **Ask for Tracking Info**: Politely ask the customer for their Mobile Number or Order ID to locate their package.
2. **Explain Delivery Timeline**: 
   - Remind them that Inside Dhaka is 1-2 days, and Outside Dhaka is 2-4 days.
   - If it has been 3 days and they are outside Dhaka, reassure them that it is on its way and should arrive by tomorrow.
3. **Escalate (For Delays > 4 Days)**: If it has been more than 4 days, immediately provide our support hotline 📞 017XXXXXXXX or let them know a human representative will check the courier transit immediately.`

const multiCategoryTemplate = `# 🛍️ PaperSnapPro AI Sales Agent Knowledge Base (Multi-Category Store)

## 🌟 COMPANY INFORMATION
Welcome to PaperSnapPro
We are a trusted online shopping platform in Bangladesh.
🌐 Website: https://www.papersnappro.com
📞 Customer Support: 017XXXXXXXX
- Tone Guideline: Keep responses under 2 sentences. Use friendly, informal Bengali/Banglish.
- Emoji Usage: Do NOT use any emojis. Keep responses completely plain text.

---

## 🛒 PRODUCT CATALOG BY CATEGORIES

### 👕 Category: Fashion Products
- Premium T-Shirt | Price: ৳490 | Product ID: ts-premium
  * Size Chart: S (Chest 36"), M (38"), L (40"), XL (42"), XXL (44")
  * Stock Alert: Navy Blue XXL is out of stock.
- Oversized T-Shirt | Price: ৳650 | Product ID: ts-oversized
- Polo Shirt | Price: ৳790 | Product ID: sh-polo
- Casual Shirt | Price: ৳990 | Product ID: sh-casual
- Hoodie | Price: ৳1450 | Product ID: hd-hoodie
- Panjabi | Price: ৳1250 | Product ID: pj-panjabi
- Denim Jeans | Price: ৳1590 | Product ID: jn-denim
- Cargo Pant | Price: ৳1390 | Product ID: pt-cargo
- Sneakers | Price: ৳1890 | Product ID: sk-sneakers
- Sandals | Price: ৳890 | Product ID: sd-sandals

### ⌚ Category: Accessories
- Smart Watch | Price: ৳2490 | Product ID: wt-smart
- Analog Watch | Price: ৳1390 | Product ID: wt-analog
- Sunglasses | Price: ৳690 | Product ID: sg-sunglasses
- Leather Wallet | Price: ৳790 | Product ID: wl-leather
- Backpack | Price: ৳1590 | Product ID: bp-backpack

### 📱 Category: Gadgets & Electronics
- Wireless Earbuds | Price: ৳1690 | Product ID: eb-wireless
- Bluetooth Speaker | Price: ৳2190 | Product ID: sp-bluetooth
- Phone Holder | Price: ৳390 | Product ID: ph-holder
- Fast Charger | Price: ৳590 | Product ID: ch-fast
- Power Bank | Price: ৳1490 | Product ID: pb-powerbank

### 🏠 Category: Home & Kitchen
- LED Lamp | Price: ৳790 | Product ID: lp-led
- Mini Blender | Price: ৳1590 | Product ID: bl-mini
- Water Bottle | Price: ৳490 | Product ID: bt-water
- Kitchen Organizer | Price: ৳990 | Product ID: org-kitchen

---

## 🚚 DELIVERY SYSTEM
- Delivery Charge:
  * Inside Dhaka City: ৳70
  * Outside Dhaka (All over Bangladesh): ৳130
- Delivery Time:
  * Inside Dhaka: 1-2 Days
  * Outside Dhaka: 2-4 Days
- Payment Methods: Cash on Delivery (COD), bKash, Nagad, Rocket, Bank Transfer.

---

## 📦 ORDER CONFIRMATION FORM
To place an order, the customer must provide the following:
📌 Name:
📌 Complete Address:
📌 Mobile Number:
📌 Product Name & Product ID:
📌 Color / Size (if applicable):
📌 Quantity:

---

## ❓ FREQUENTLY ASKED QUESTIONS
- Q: Can I check the product before paying the delivery rider?
  - A: Yes! We support open-box delivery. You can check the fabric and quality before paying.

---

## 🔄 RETURN & PRODUCT PROBLEM REPLACEMENT CRITERIA
- Size Exchange: Supported if informed within 24 hours (delivery charge borne by customer).
- Defective/Wrong Product replacement: 100% free swap within 24 hours of delivery.

---

## ⏱️ HANDLING DELAYED ORDERS (2-3+ DAYS)
If a customer complains they haven't received their package after 2-3 days, follow these rules:
1. **Ask for Tracking Info**: Politely ask the customer for their Mobile Number or Order ID to locate their package.
2. **Explain Delivery Timeline**: 
   - Remind them that Inside Dhaka is 1-2 days, and Outside Dhaka is 2-4 days.
   - If it has been 3 days and they are outside Dhaka, reassure them that it is on its way and should arrive by tomorrow.
3. **Escalate (For Delays > 4 Days)**: If it has been more than 4 days, immediately provide our support hotline 📞 017XXXXXXXX or let them know a human representative will check the courier transit immediately.`

const getActiveTemplateText = () => {
    if (guideTab.value === 'single') return singleProductTemplate
    if (guideTab.value === 'multi') return multiProductTemplate
    return multiCategoryTemplate
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
            const { data, error } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('user_id', user.id)
            
            if (data) {
                console.log(`[DASHBOARD DEBUG]: Found ${data.length} agents.`)
                agents.value = data.map(a => {
                    // Ensure product_images is an array of objects { id, url } for the UI
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

                    return { 
                        ...a, 
                        isDirty: false,
                        showAdvance: false,
                        agent_behavior: behavior,
                        product_images: images,
                        visibleImageCount: Math.max(1, images.filter(img => img.url && img.url.trim() !== '').length)
                    }
                })
                stats[1].value = data.length.toString()
            }

            // Fetch Real Stats & Logs (Combined Intelligence)
            const { data: agentIds } = await supabase.from('agent_configs').select('id').eq('user_id', user.id)
            const ids = agentIds?.map(a => a.id) || []

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
    layout: 'default'
})

useHead({
    title: 'Dashboard - PaperSnapPro Command Center'
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
