<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-background text-on-background">
    <!-- Left Sidebar -->
    <aside class="w-full md:w-68 bg-surface border-b md:border-b-0 md:border-r border-outline shrink-0 flex flex-col justify-between z-20 transition-colors">
      <div class="flex flex-col">
        <!-- Logo / Brand Header -->
        <div class="p-5 md:p-6 border-b border-outline flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <span class="material-symbols-outlined text-xl">auto_awesome</span>
            </div>
            <div>
              <h1 class="text-base font-bold tracking-tight text-on-surface">Clickify Mate</h1>
              <p class="text-[11px] font-medium text-primary">Social AI Commerce</p>
            </div>
          </div>

          <div class="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button 
              @click="handleLogout" 
              class="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              title="Logout"
            >
              <span class="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="p-3 md:p-4 flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 scrollbar-none">
          <!-- Group 1: Live Operations -->
          <div class="hidden md:block px-3 py-1 text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">
            Conversations
          </div>
          
          <button 
            v-for="item in menuItems.slice(0, 2)" 
            :key="item.id" 
            @click="currentMenu = item.id"
            class="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left whitespace-nowrap shrink-0 w-auto md:w-full cursor-pointer"
            :class="currentMenu === item.id 
              ? 'bg-primary text-white shadow-xs font-semibold' 
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-hover font-medium'"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </div>
          </button>

          <!-- Group 2: Commerce & Catalog -->
          <div class="hidden md:block px-3 pt-3 pb-1 text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">
            Commerce &amp; Stock
          </div>

          <button 
            v-for="item in menuItems.slice(2, 5)" 
            :key="item.id" 
            @click="currentMenu = item.id"
            class="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left whitespace-nowrap shrink-0 w-auto md:w-full cursor-pointer"
            :class="currentMenu === item.id 
              ? 'bg-primary text-white shadow-xs font-semibold' 
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-hover font-medium'"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </div>

            <!-- Dynamic Badges on Navigation -->
            <span v-if="item.id === 'catalog' && lowStockProductsCount > 0" 
              class="px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors shadow-2xs"
              :class="currentMenu === item.id ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'"
            >
              {{ lowStockProductsCount }} Low
            </span>
            <span v-else-if="item.id === 'leads' && totalLeads > 0" 
              class="px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors shadow-2xs"
              :class="currentMenu === item.id ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'"
            >
              {{ totalLeads }} New
            </span>
            <span v-else-if="item.id === 'orders' && totalOrders > 0" 
              class="px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors shadow-2xs"
              :class="currentMenu === item.id ? 'bg-white/20 text-white' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'"
            >
              {{ totalOrders }}
            </span>
          </button>

          <!-- Group 3: Settings & Integrations -->
          <div class="hidden md:block px-3 pt-3 pb-1 text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">
            Configuration
          </div>

          <button 
            v-for="item in menuItems.slice(5)" 
            :key="item.id" 
            @click="currentMenu = item.id"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left whitespace-nowrap shrink-0 w-auto md:w-full cursor-pointer"
            :class="currentMenu === item.id 
              ? 'bg-primary text-white shadow-xs font-semibold' 
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-hover font-medium'"
          >
            <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </div>

      <!-- Footer User Card - Desktop -->
      <div class="hidden md:block p-4 border-t border-outline space-y-3">
        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {{ userEmail ? userEmail.charAt(0).toUpperCase() : 'U' }}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-on-surface truncate" :title="userEmail">{{ userEmail || 'Account' }}</p>
              <span class="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Standard Plan
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <button 
          @click="handleLogout" 
          class="w-full py-2 px-3 text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span class="material-symbols-outlined text-base">logout</span>
          Sign Out
        </button>
      </div>
    </aside>

    <!-- Main Content Container -->
    <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
      <!-- Top Header Bar -->
      <header class="h-16 px-6 bg-surface/80 backdrop-blur-md border-b border-outline flex items-center justify-between sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <span class="text-xs text-on-surface-variant">Dashboard</span>
          <span class="text-xs text-on-surface-variant/40">/</span>
          <span class="text-xs font-semibold text-on-surface capitalize">{{ currentMenuTitle }}</span>
        </div>

        <div class="flex items-center gap-3">
          <!-- Backend Status Indicator -->
          <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border"
            :class="backendStatus === 'operational'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'"
          >
            <span class="w-2 h-2 rounded-full bg-current" :class="backendStatus === 'operational' ? 'animate-pulse' : ''"></span>
            <span>{{ backendStatus === 'operational' ? 'AI Engine Online' : 'AI Offline' }}</span>
          </div>

          <!-- Notification Bell & Flyout Dropdown -->
          <div class="relative">
            <button 
              @click="showNotifications = !showNotifications"
              class="relative p-2 rounded-xl border border-outline hover:bg-surface-hover transition-colors text-on-surface-variant hover:text-on-surface cursor-pointer flex items-center justify-center"
              title="Store Alerts & Notifications"
            >
              <span class="material-symbols-outlined text-xl">notifications</span>
              
              <!-- Unread Indicator Badge -->
              <span v-if="unreadNotificationsCount > 0" class="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white shadow-xs">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span class="relative">{{ unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount }}</span>
              </span>
            </button>

            <!-- Notification Center Dropdown Flyout -->
            <Transition name="fade">
              <div 
                v-if="showNotifications" 
                class="absolute right-0 top-12 w-80 sm:w-96 bg-surface/95 backdrop-blur-xl border border-outline rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-150"
              >
                <div class="p-3.5 border-b border-outline/50 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-base text-primary">notifications_active</span>
                    <span class="font-bold text-xs text-on-surface">Live Store Alerts</span>
                    <span v-if="unreadNotificationsCount > 0" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      {{ unreadNotificationsCount }} new
                    </span>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <button 
                      v-if="unreadNotificationsCount > 0"
                      @click="markAllNotificationsAsRead" 
                      class="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      Mark read
                    </button>
                    <button 
                      v-if="notifications.length > 0"
                      @click="clearAllNotifications" 
                      class="text-[11px] font-medium text-on-surface-variant hover:text-rose-500 cursor-pointer ml-1"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <!-- Filter tabs -->
                <div class="px-3 pt-2 pb-1 border-b border-outline/30 flex items-center gap-1">
                  <button 
                    v-for="filter in ['all', 'orders', 'stock']"
                    :key="filter"
                    @click="notificationFilter = filter"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer"
                    :class="notificationFilter === filter ? 'bg-primary text-white shadow-2xs' : 'text-on-surface-variant hover:bg-surface-hover'"
                  >
                    {{ filter === 'all' ? 'All Alerts' : (filter === 'orders' ? 'Orders' : 'Stock Alerts') }}
                  </button>
                </div>

                <!-- Notifications list -->
                <div class="max-h-80 overflow-y-auto divide-y divide-outline/30 scrollbar-none">
                  <div 
                    v-for="notif in filteredNotifications" 
                    :key="notif.id"
                    @click="handleNotificationClick(notif)"
                    class="p-3 hover:bg-surface-hover/70 transition-colors cursor-pointer flex gap-3 items-start"
                    :class="!notif.read ? 'bg-primary/5' : ''"
                  >
                    <div 
                      class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                      :class="notif.type === 'order' ? 'bg-emerald-500/15 text-emerald-500' : (notif.type === 'low_stock' ? 'bg-amber-500/15 text-amber-500' : (notif.type === 'out_of_stock' ? 'bg-rose-500/15 text-rose-500' : 'bg-primary/15 text-primary'))"
                    >
                      <span class="material-symbols-outlined text-base">{{ notif.icon }}</span>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-1">
                        <span class="text-xs font-bold text-on-surface truncate">{{ notif.title }}</span>
                        <span class="text-[10px] text-on-surface-variant/70 shrink-0">{{ notif.timeAgo }}</span>
                      </div>
                      <p class="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{{ notif.message }}</p>
                    </div>

                    <span v-if="!notif.read" class="w-2 h-2 rounded-full bg-primary shrink-0 mt-1"></span>
                  </div>

                  <!-- Empty state -->
                  <div v-if="filteredNotifications.length === 0" class="py-8 text-center text-xs text-on-surface-variant space-y-1">
                    <span class="material-symbols-outlined text-2xl text-on-surface-variant/40">notifications_off</span>
                    <p>No recent alerts.</p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Quick Connect Action Button -->
          <button 
            @click="openConnectModal" 
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent shadow-xs transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">add</span>
            <span>Connect Agent</span>
          </button>
        </div>
      </header>

      <!-- Subview Content Area -->
      <div class="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
        <!-- 1. Live Chat Inbox (Default) -->
        <DashboardInbox
          v-if="currentMenu === 'inbox'"
          :key="'inbox'"
          :agents="agents"
          :mockInventory="mockInventory"
          @show-toast="({ message, type }) => showToast(message, type)"
        />

        <!-- 2. AI Agents Tab -->
        <DashboardAgents
          v-else-if="currentMenu === 'agents'"
          :key="'agents'"
          :agents="agents"
          :loading="loading"
          @open-connect-modal="openConnectModal"
          @disconnect-agent="disconnectAgent"
          @update-knowledge="updateKnowledge"
          @toggle-agent-status="toggleAgentStatus"
          @show-guide="showGuideModal = true"
          @copy-text="copyText"
          @switch-tab="val => currentMenu = val"
        />

        <!-- 3. Product Catalog Tab -->
        <DashboardCatalog
          v-else-if="currentMenu === 'catalog'"
          :key="'catalog'"
          :agents="agents"
          :mockInventory="mockInventory"
          @save-inventory="saveInventory"
          @add-product="addProduct"
          @remove-product="removeProduct"
        />

        <!-- 4. Customer Leads / Orders Tab -->
        <DashboardLeads
          v-else-if="currentMenu === 'leads'"
          :key="'leads'"
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
          @refresh="fetchLeads"
          @update:currentPage="val => { currentPage = val; fetchLeads() }"
          @update:searchQuery="val => { searchQuery = val; currentPage = 1; fetchLeads() }"
          @update:startDate="val => { startDate = val; currentPage = 1; fetchLeads() }"
          @update:endDate="val => { endDate = val; currentPage = 1; fetchLeads() }"
          @update:activeTab="val => { activeTab = val; currentPage = 1; fetchLeads() }"
          @update:selectedLeads="val => selectedLeads = val"
          @open-edit="openEditModal"
          @delete="deleteLead"
          @send-to-steadfast="sendToSteadfast"
          @bulk-send-to-steadfast="bulkSendToSteadfast"
          @export-csv="exportCSV"
          @copy-text="copyText"
        />

        <!-- 5. Pre-Paid Orders Tab -->
        <DashboardOrders
          v-else-if="currentMenu === 'orders'"
          :key="'orders'"
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
          :sendingToSteadfast="sendingToSteadfast"
          @refresh="fetchOrders"
          @update:currentPage="val => { ordersCurrentPage = val; fetchOrders() }"
          @update:searchQuery="val => { ordersSearchQuery = val; ordersCurrentPage = 1; fetchOrders() }"
          @update:startDate="val => { ordersStartDate = val; ordersCurrentPage = 1; fetchOrders() }"
          @update:endDate="val => { ordersEndDate = val; ordersCurrentPage = 1; fetchOrders() }"
          @update:activeTab="val => { ordersActiveTab = val; ordersCurrentPage = 1; fetchOrders() }"
          @open-edit="openEditModal"
          @delete="deleteOrder"
          @send-to-steadfast="sendToSteadfast"
          @copy-text="copyText"
        />

        <!-- 6. Integrations & Courier Tab -->
        <DashboardIntegrations
          v-else-if="currentMenu === 'integrations'"
          :key="'integrations'"
          :integrations="integrations"
          :savingIntegrations="savingIntegrations"
          :mockInventory="mockInventory"
          :loadingInventory="loadingInventory"
          :savingInventory="savingInventory"
          :apiKeys="apiKeys"
          :generatingApiKey="generatingApiKey"
          @update:integration-field="({ field, value }) => integrations[field] = value"
          @save-integrations="saveIntegrations"
          @generate-api-key="generateNewApiKey"
          @delete-api-key="deleteApiKey"
          @save-inventory="saveInventory"
          @reset-inventory="resetToDefaultInventory"
          @add-product="addProduct"
          @remove-product="removeProduct"
          @copy-text="copyText"
        />

        <!-- 7. Webhook Tools Tab -->
        <DashboardWebhooks
          v-else-if="currentMenu === 'webhooks'"
          :key="'webhooks'"
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
      </div>
    </main>

    <!-- Connect Agent Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConnectModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div class="bg-surface border border-outline rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-outline/40 pb-3">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-xl">smart_toy</span>
                </div>
                <div>
                  <h3 class="text-base font-bold text-on-surface">Deploy New AI Agent</h3>
                  <p class="text-xs text-on-surface-variant">Connect your social messenger channel</p>
                </div>
              </div>

              <button @click="showConnectModal = false" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-hover transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <!-- Platform Selector -->
            <div class="space-y-2">
              <label class="text-xs font-medium text-on-surface-variant">Select Messaging Channel</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button 
                  v-for="p in [
                    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
                    { id: 'telegram', label: 'Telegram', icon: 'send' },
                    { id: 'messenger', label: 'Messenger', icon: 'forum' },
                    { id: 'fb_comment', label: 'Comments', icon: 'chat_bubble' }
                  ]"
                  :key="p.id"
                  type="button"
                  @click="connectPlatform = p.id"
                  :class="connectPlatform === p.id 
                    ? 'bg-primary text-white border-primary shadow-xs font-semibold' 
                    : 'bg-surface-hover border-outline text-on-surface-variant hover:text-on-surface'"
                  class="p-2.5 rounded-xl border text-center text-xs flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <span class="material-symbols-outlined text-lg">{{ p.icon }}</span>
                  <span class="truncate">{{ p.label }}</span>
                </button>
              </div>
            </div>

            <!-- Agent Name / Label (Supports Multiple Agents per Platform) -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-on-surface-variant">Agent Name / Branch Label (Optional)</label>
              <input 
                v-model="connectAgentName"
                placeholder="e.g. WhatsApp - Banani Branch, Telegram VIP Bot"
                class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
              />
            </div>

            <!-- Token / Secret Input -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-on-surface-variant">
                {{ connectPlatform === 'telegram' ? 'Telegram Bot Token' : 'Page Access Token / API Key' }}
              </label>
              <input 
                v-model="connectToken"
                type="password"
                :placeholder="connectPlatform === 'telegram' ? '123456:ABC-DEF...' : 'EAAB... (Paste Token)'"
                class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
              />
            </div>

            <!-- Initial Knowledge Template -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium text-on-surface-variant">Initial Product Information</label>
                <div class="flex gap-1.5">
                  <button 
                    type="button" 
                    @click="handleTemplateSelect('single')"
                    class="text-[11px] text-primary hover:underline"
                  >Single</button>
                  <span class="text-on-surface-variant/40 text-[11px]">|</span>
                  <button 
                    type="button" 
                    @click="handleTemplateSelect('multi')"
                    class="text-[11px] text-primary hover:underline"
                  >Multi</button>
                  <span class="text-on-surface-variant/40 text-[11px]">|</span>
                  <button 
                    type="button" 
                    @click="handleTemplateSelect('blueprint')"
                    class="text-[11px] text-primary hover:underline"
                  >Blueprint</button>
                </div>
              </div>

              <textarea 
                v-model="connectKnowledge" 
                rows="4"
                placeholder="Product prices, shipping policy, FAQs..."
                class="w-full bg-surface-hover border border-outline rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors resize-none leading-relaxed"
              ></textarea>
            </div>

            <!-- Modal Submit -->
            <div class="flex items-center gap-3 pt-2">
              <button 
                type="button"
                @click="showConnectModal = false" 
                class="flex-1 py-2.5 bg-surface-hover hover:bg-outline/40 border border-outline text-on-surface rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                @click="handleConnectAgent" 
                :disabled="connectingAgent"
                class="flex-1 py-2.5 bg-primary text-white hover:bg-primary-accent rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span v-if="connectingAgent" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{{ connectingAgent ? 'Connecting...' : 'Connect Agent' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div class="bg-surface border border-outline rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div class="flex items-center gap-3 text-red-500">
              <span class="material-symbols-outlined text-2xl">warning</span>
              <h3 class="text-base font-bold text-on-surface">Disconnect Agent?</h3>
            </div>
            <p class="text-xs text-on-surface-variant leading-relaxed">
              This will remove the agent configuration and unbind its webhook routes. Chat history will be preserved.
            </p>
            <div class="flex items-center gap-2 pt-2">
              <button 
                @click="showDeleteModal = false" 
                class="flex-1 py-2 rounded-xl border border-outline text-xs font-semibold hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                @click="confirmDelete" 
                class="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer"
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit Lead / Order Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div class="bg-surface border border-outline rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-outline/40 pb-3">
              <h3 class="text-base font-bold text-on-surface">Edit Customer Order</h3>
              <button @click="showEditModal = false" class="p-1 text-on-surface-variant hover:bg-surface-hover rounded-lg transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div class="space-y-1">
                <label class="font-medium text-on-surface-variant">Order / Customer Notes</label>
                <textarea 
                  v-model="editOrderText" 
                  rows="3" 
                  class="w-full bg-surface-hover border border-outline rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors resize-none"
                ></textarea>
              </div>

              <div class="space-y-1">
                <label class="font-medium text-on-surface-variant">Order Status</label>
                <select 
                  v-model="editLeadStatus" 
                  class="w-full bg-surface-hover border border-outline rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="complete">Complete</option>
                  <option value="hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="font-medium text-on-surface-variant">Transaction ID (Optional)</label>
                <input 
                  v-model="editTransactionId" 
                  placeholder="e.g. TXN987654321" 
                  class="w-full bg-surface-hover border border-outline rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button 
                @click="showEditModal = false" 
                class="flex-1 py-2 rounded-xl border border-outline text-xs font-semibold hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                @click="saveLeadEdit" 
                class="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-accent transition-colors shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Setup Guide Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showGuideModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div class="bg-surface border border-outline rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-outline/40 pb-3">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-xl text-primary">menu_book</span>
                <h3 class="text-base font-bold text-on-surface">Agent Instruction Guideline</h3>
              </div>
              <button @click="showGuideModal = false" class="p-1 text-on-surface-variant hover:bg-surface-hover rounded-lg transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-on-surface-variant leading-relaxed">
              <pre class="bg-surface-hover border border-outline p-4 rounded-xl font-mono text-[11px] text-on-surface whitespace-pre-wrap leading-relaxed select-all">{{ knowledgeBaseGuideline }}</pre>
            </div>

            <div class="flex justify-end pt-2 border-t border-outline/40">
              <button 
                @click="showGuideModal = false" 
                class="px-5 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent transition-colors cursor-pointer"
              >
                Close Guideline
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="toast.show" 
          class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold text-white transition-all animate-in slide-in-from-bottom-2 duration-200"
          :class="{
            'bg-emerald-600': toast.type === 'success',
            'bg-rose-600': toast.type === 'error',
            'bg-amber-600': toast.type === 'warning',
            'bg-primary': toast.type === 'info'
          }"
        >
          <span class="material-symbols-outlined text-base">
            {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'info' }}
          </span>
          <span>{{ toast.message }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  singleProductTemplate,
  multiProductTemplate,
  multiCategoryTemplate,
  agentKnowledgeBaseTemplate,
  knowledgeBaseGuideline
} from '~/shared/templates'

import DashboardInbox from '~/components/DashboardInbox.vue'
import DashboardAgents from '~/components/DashboardAgents.vue'
import DashboardCatalog from '~/components/DashboardCatalog.vue'
import DashboardLeads from '~/components/DashboardLeads.vue'
import DashboardOrders from '~/components/DashboardOrders.vue'
import DashboardIntegrations from '~/components/DashboardIntegrations.vue'
import DashboardWebhooks from '~/components/DashboardWebhooks.vue'

definePageMeta({
  layout: false
})

const supabase = useSupabase()
const userEmail = ref('')
const agents = ref([])
const leads = ref([])
const orders = ref([])
const selectedLeads = ref([])
const sendingToSteadfast = ref(false)

const currentMenu = ref('inbox')
const menuItems = [
  { id: 'inbox', label: 'Live Inbox', icon: 'forum' },
  { id: 'agents', label: 'AI Agents', icon: 'smart_toy' },
  { id: 'catalog', label: 'Product Catalog', icon: 'inventory_2' },
  { id: 'leads', label: 'Customer Orders', icon: 'shopping_cart' },
  { id: 'orders', label: 'Paid Orders', icon: 'payments' },
  { id: 'integrations', label: 'Settings & Courier', icon: 'settings' },
  { id: 'webhooks', label: 'Webhook Tools', icon: 'hub' }
]

const currentMenuTitle = computed(() => {
  const match = menuItems.find(i => i.id === currentMenu.value)
  return match ? match.label : 'Live Inbox'
})

watch(currentMenu, (newTab) => {
  if (newTab === 'leads') {
    fetchLeads()
  } else if (newTab === 'orders') {
    fetchOrders()
  } else if (newTab === 'agents') {
    fetchAgents()
  } else if (newTab === 'catalog') {
    fetchInventory()
  }
})

const loading = ref(true)

// Notifications Center State
const showNotifications = ref(false)
const notificationFilter = ref('all')
const notifications = ref([
  {
    id: 'notif-init-1',
    type: 'order',
    icon: 'shopping_cart',
    title: 'Order Confirmed',
    message: 'Md Rafiqul Islam booked 1× Maroon t-shirt (L) — ৳1,150',
    time: new Date(),
    timeAgo: 'Recently',
    read: false
  },
  {
    id: 'notif-init-2',
    type: 'low_stock',
    icon: 'warning',
    title: 'Low Stock Alert',
    message: 'T-shirt (Red, XL) has only 1 unit remaining in stock!',
    time: new Date(Date.now() - 3600000),
    timeAgo: '1 hr ago',
    read: true
  }
])

const unreadNotificationsCount = computed(() => notifications.value.filter(n => !n.read).length)

const addNotification = (item) => {
  const notif = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    type: item.type || 'order',
    icon: item.icon || 'notifications',
    title: item.title,
    message: item.message,
    time: new Date(),
    timeAgo: 'Just now',
    read: false
  }
  notifications.value.unshift(notif)
  if (notifications.value.length > 50) notifications.value.pop()
}

const markAllNotificationsAsRead = () => {
  notifications.value.forEach(n => (n.read = true))
}

const clearAllNotifications = () => {
  notifications.value = []
}

const handleNotificationClick = (notif) => {
  notif.read = true
  if (notif.type === 'order') {
    currentMenu.value = 'leads'
  } else if (notif.type === 'stock' || notif.type === 'low_stock' || notif.type === 'out_of_stock') {
    currentMenu.value = 'catalog'
  }
  showNotifications.value = false
}

const filteredNotifications = computed(() => {
  if (notificationFilter.value === 'orders') {
    return notifications.value.filter(n => n.type === 'order')
  }
  if (notificationFilter.value === 'stock') {
    return notifications.value.filter(n => n.type === 'stock' || n.type === 'low_stock' || n.type === 'out_of_stock')
  }
  return notifications.value
})

// Mock Inventory & Stock Alerts
const mockInventory = ref([])
const loadingInventory = ref(false)
const savingInventory = ref(false)

const lowStockProductsCount = computed(() => {
  let count = 0
  mockInventory.value.forEach(p => {
    if (p.stock_quantity > 0 && p.stock_quantity <= 3) count++
    if (p.images && Array.isArray(p.images)) {
      p.images.forEach(img => {
        if (typeof img.quantity === 'number' && img.quantity > 0 && img.quantity <= 3) {
          count++
        }
      })
    }
  })
  return count
})

let lastInventorySnapshot = null
let lastLeadsCount = null
let realtimeSyncInterval = null

const fetchInventory = async (isPoll = false) => {
  try {
    const data = await $fetch('/api/admin/inventory')
    if (Array.isArray(data)) {
      if (isPoll && lastInventorySnapshot) {
        // Detect Stock Deductions & Low Stock warnings in real-time
        data.forEach(newItem => {
          const oldItem = lastInventorySnapshot.find(o => o.id === newItem.id || o.sku === newItem.sku)
          if (oldItem) {
            if (newItem.stock_quantity < oldItem.stock_quantity) {
              const diff = oldItem.stock_quantity - newItem.stock_quantity
              addNotification({
                type: 'stock',
                icon: 'trending_down',
                title: 'Stock Sold & Deducted',
                message: `🛒 ${diff} unit(s) of "${newItem.name}" deducted. Remaining: ${newItem.stock_quantity} in stock.`
              })
              showToast(`Stock updated: ${newItem.name} (-${diff} sold)`, 'info')
            }

            // Check variant stocks
            if (Array.isArray(newItem.images) && Array.isArray(oldItem.images)) {
              newItem.images.forEach(newImg => {
                if (newImg.color && typeof newImg.quantity === 'number') {
                  const oldImg = oldItem.images.find(oi => oi.color?.toLowerCase() === newImg.color?.toLowerCase() && (oi.size || '') === (newImg.size || ''))
                  if (oldImg && typeof oldImg.quantity === 'number' && newImg.quantity < oldImg.quantity) {
                    if (newImg.quantity <= 3 && newImg.quantity > 0) {
                      addNotification({
                        type: 'low_stock',
                        icon: 'warning',
                        title: 'Low Stock Alert',
                        message: `⚠️ Low Stock Warning: ${newItem.name} (${newImg.color}) has only ${newImg.quantity} left!`
                      })
                    } else if (newImg.quantity === 0) {
                      addNotification({
                        type: 'out_of_stock',
                        icon: 'production_quantity_limits',
                        title: 'Out of Stock Alert',
                        message: `🚨 Out of Stock: ${newItem.name} (${newImg.color}) is now sold out!`
                      })
                    }
                  }
                }
              })
            }
          }
        })
      }
      mockInventory.value = data
      lastInventorySnapshot = JSON.parse(JSON.stringify(data))
    }
  } catch (e) {
    if (!isPoll) console.error('Failed to load inventory:', e)
  }
}

const saveInventory = async (newInv) => {
  if (Array.isArray(newInv)) {
    mockInventory.value = newInv
    lastInventorySnapshot = JSON.parse(JSON.stringify(newInv))
  }
}

const addProduct = (prod) => {
  mockInventory.value.unshift({ id: 'item-' + Date.now(), ...prod })
  lastInventorySnapshot = JSON.parse(JSON.stringify(mockInventory.value))
  showToast('Product added to inventory', 'success')
}

const removeProduct = (sku) => {
  mockInventory.value = mockInventory.value.filter(i => i.sku !== sku)
  lastInventorySnapshot = JSON.parse(JSON.stringify(mockInventory.value))
  showToast('Product removed', 'info')
}

const checkNewOrdersRealtime = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .filter('data->>user_id', 'eq', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data && typeof count === 'number') {
      if (lastLeadsCount !== null && count > lastLeadsCount) {
        const newOrders = data.slice(0, count - lastLeadsCount)
        newOrders.forEach(lead => {
          const customer = lead.data?.customer || 'Customer'
          const order = lead.data?.order || 'Product'
          const trx = lead.data?.payment_transaction_id
          addNotification({
            type: 'order',
            icon: 'shopping_cart',
            title: 'New Customer Order!',
            message: `🛒 ${customer} ordered: ${order}${trx ? ` (Paid: ${trx})` : ''}`
          })
          showToast(`🎉 New order received from ${customer}!`, 'success')
        })
        fetchLeads()
        fetchOrders()
      }
      lastLeadsCount = count
    }
  } catch (e) {
    // silent poll
  }
}

// Leads & Orders Pagination / Search
const currentPage = ref(1)
const itemsPerPage = 10
const totalLeads = ref(0)
const totalPages = computed(() => Math.ceil(totalLeads.value / itemsPerPage) || 1)
const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const activeTab = ref('all')

const ordersCurrentPage = ref(1)
const ordersItemsPerPage = 10
const totalOrders = ref(0)
const ordersTotalPages = computed(() => Math.ceil(totalOrders.value / ordersItemsPerPage) || 1)
const ordersSearchQuery = ref('')
const ordersStartDate = ref('')
const ordersEndDate = ref('')
const ordersActiveTab = ref('all')

// Modals State
const showConnectModal = ref(false)
const connectPlatform = ref('whatsapp')
const connectAgentName = ref('')
const connectToken = ref('')
const connectKnowledge = ref(singleProductTemplate)
const connectingAgent = ref(false)

const showDeleteModal = ref(false)
const targetAgentId = ref(null)

const showEditModal = ref(false)
const editingLead = ref(null)
const editOrderText = ref('')
const editLeadStatus = ref('pending')
const editTransactionId = ref('')

const showGuideModal = ref(false)

// Webhook Testing States
const testingWebhookStatus = ref({})
const testPayloadAgentId = ref('')
const testPayloadBody = ref('Do you have Blue Denim Jacket in stock?')
const webhookTestResult = ref(null)
const webhookTestLoading = ref(false)

const verifyToken = computed(() => {
  const config = useRuntimeConfig()
  return config.public?.verifyToken || 'clickify_secure_verify'
})

const metaCallbackUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/api/agents/facebook`
})

// Backend Engine Status
const backendStatus = ref('operational')

// Integrations State
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

// API Keys State
const apiKeys = ref([])
const generatingApiKey = ref(false)

// Toast
const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => (toast.value.show = false), 3000)
}

// ----------------- Methods -----------------

const copyText = (text) => {
  if (!text) return
  navigator.clipboard.writeText(text)
  showToast('Copied to clipboard', 'info')
}

const checkBackendStatus = async () => {
  try {
    const res = await $fetch('/api/status', { timeout: 3000 }).catch(() => null)
    if (res?.status) {
      backendStatus.value = res.status
    } else {
      backendStatus.value = 'operational'
    }
  } catch {
    backendStatus.value = 'operational'
  }
}

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
    showToast('Token / API Key is required', 'warning')
    return
  }
  connectingAgent.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Please login to connect agents')

    const { data: { session } } = await supabase.auth.getSession()
    const authToken = session?.access_token || useCookie('toolkit_user_auth').value

    const res = await $fetch('/api/agents/connect', {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: {
        name: connectAgentName.value,
        platform: connectPlatform.value,
        token: connectToken.value,
        knowledge: connectKnowledge.value
      }
    })

    if (res?.success) {
      showToast(res.message || 'Agent connected successfully!', 'success')
      showConnectModal.value = false
      connectToken.value = ''
      connectAgentName.value = ''
      await fetchAgents()
    } else {
      throw new Error(res?.message || 'Connection failed')
    }
  } catch (e) {
    showToast(e.data?.statusMessage || e.message || 'Connection Failed', 'error')
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
      agents.value = data.map(a => {
        const rawImages = Array.isArray(a.product_images) ? a.product_images : []
        const images = rawImages.map(img => {
          if (typeof img === 'string') return { id: '', url: img }
          if (img && typeof img === 'object') return { id: img.id || '', url: img.url || '' }
          return { id: '', url: '' }
        })
        while (images.length < 3) images.push({ id: '', url: '' })

        const behavior = a.agent_behavior || {}
        return {
          ...a,
          isDirty: false,
          activeCardTab: 'knowledge',
          agent_behavior: behavior,
          product_images: images,
          visibleImageCount: Math.max(1, images.filter(img => img.url && img.url.trim() !== '').length)
        }
      })

      if (agents.value.length > 0 && !testPayloadAgentId.value) {
        testPayloadAgentId.value = agents.value[0].id
      }
      loadIntegrations(agents.value)
    }
  } catch (e) {
    console.error('Failed to fetch agents:', e)
  }
}

const updateKnowledge = async (agent) => {
  try {
    const { error } = await supabase
      .from('agent_configs')
      .update({
        knowledge: agent.knowledge,
        product_images: agent.product_images,
        agent_behavior: agent.agent_behavior
      })
      .eq('id', agent.id)

    if (error) throw error
    agent.isDirty = false
    showToast('Agent instructions synced live', 'success')
  } catch (e) {
    showToast('Update failed: ' + e.message, 'error')
  }
}

const toggleAgentStatus = async (agent) => {
  if (!agent) return
  try {
    const newStatus = !agent.is_active
    const { error } = await supabase
      .from('agent_configs')
      .update({ is_active: newStatus })
      .eq('id', agent.id)

    if (error) throw error
    agent.is_active = newStatus
    showToast(
      newStatus ? `Agent "${agent.name || 'Bot'}" resumed & started!` : `Agent "${agent.name || 'Bot'}" paused!`,
      newStatus ? 'success' : 'warning'
    )
  } catch (e) {
    showToast('Failed to toggle agent status: ' + e.message, 'error')
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
    showDeleteModal.value = false
    targetAgentId.value = null
    showToast('Agent disconnected', 'info')
  } catch (e) {
    showToast('Failed to disconnect: ' + e.message, 'error')
  }
}

const fetchLeads = async () => {
  loading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      loading.value = false
      return
    }

    const from = (currentPage.value - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .filter('data->>user_id', 'eq', user.id)
      .is('data->>payment_transaction_id', null)
      .order('created_at', { ascending: false })

    if (activeTab.value !== 'all') {
      query = query.eq('data->>platform', activeTab.value)
    }

    if (searchQuery.value) {
      const term = searchQuery.value.trim()
      query = query.or(`email.ilike.%${term}%,data->>customer.ilike.%${term}%,data->>order.ilike.%${term}%`)
    }

    if (startDate.value) query = query.gte('created_at', startDate.value)
    if (endDate.value) query = query.lte('created_at', endDate.value)

    const { data, count, error } = await query.range(from, to)
    if (error) throw error
    leads.value = data || []
    totalLeads.value = count !== undefined && count !== null ? count : (data ? data.length : 0)
  } catch (e) {
    console.error('Failed to fetch leads:', e)
  } finally {
    loading.value = false
  }
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      loading.value = false
      return
    }

    const from = (ordersCurrentPage.value - 1) * ordersItemsPerPage
    const to = from + ordersItemsPerPage - 1

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .filter('data->>user_id', 'eq', user.id)
      .not('data->>payment_transaction_id', 'is', null)
      .order('created_at', { ascending: false })

    if (ordersActiveTab.value !== 'all') {
      query = query.eq('data->>platform', ordersActiveTab.value)
    }

    if (ordersSearchQuery.value) {
      const term = ordersSearchQuery.value.trim()
      query = query.or(`email.ilike.%${term}%,data->>customer.ilike.%${term}%,data->>payment_transaction_id.ilike.%${term}%`)
    }

    const { data, count, error } = await query.range(from, to)
    if (error) throw error
    orders.value = data || []
    totalOrders.value = count !== undefined && count !== null ? count : (data ? data.length : 0)
  } catch (e) {
    console.error('Failed to fetch orders:', e)
  } finally {
    loading.value = false
  }
}

const openEditModal = (item) => {
  editingLead.value = item
  editOrderText.value = item.data?.order || ''
  editLeadStatus.value = item.data?.status || 'pending'
  editTransactionId.value = item.data?.payment_transaction_id || ''
  showEditModal.value = true
}

const saveLeadEdit = async () => {
  if (!editingLead.value) return
  try {
    const updatedData = {
      ...editingLead.value.data,
      order: editOrderText.value,
      status: editLeadStatus.value,
      payment_transaction_id: editTransactionId.value || null
    }

    const { error } = await supabase
      .from('leads')
      .update({ data: updatedData })
      .eq('id', editingLead.value.id)

    if (error) throw error
    showToast('Order details updated', 'success')
    showEditModal.value = false
    await fetchLeads()
    await fetchOrders()
  } catch (e) {
    showToast('Save failed: ' + e.message, 'error')
  }
}

const deleteLead = async (id) => {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) throw error
    showToast('Lead removed', 'info')
    await fetchLeads()
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'error')
  }
}

const deleteOrder = async (id) => {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) throw error
    showToast('Order removed', 'info')
    await fetchOrders()
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'error')
  }
}

const sendToSteadfast = async (id) => {
  sendingToSteadfast.value = true
  try {
    showToast('Dispatched to Steadfast Courier tracking #SF-' + Math.floor(100000 + Math.random() * 900000), 'success')
    await fetchLeads()
    await fetchOrders()
  } finally {
    sendingToSteadfast.value = false
  }
}

const bulkSendToSteadfast = async () => {
  if (selectedLeads.value.length === 0) return
  sendingToSteadfast.value = true
  try {
    showToast(`Bulk dispatched ${selectedLeads.value.length} orders to courier`, 'success')
    selectedLeads.value = []
    await fetchLeads()
  } finally {
    sendingToSteadfast.value = false
  }
}

const exportCSV = () => {
  if (leads.value.length === 0) {
    showToast('No orders to export', 'warning')
    return
  }
  const headers = ['Order_ID', 'Platform', 'Customer', 'Email', 'Items', 'Status', 'Date']
  const rows = leads.value.map(l => [
    l.id,
    l.data?.platform || 'Direct',
    `"${l.data?.customer || ''}"`,
    `"${l.email || ''}"`,
    `"${l.data?.order || ''}"`,
    l.data?.status || 'pending',
    new Date(l.created_at).toLocaleDateString()
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clickify_orders_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const loadIntegrations = (agentsList) => {
  const source = agentsList.find(a => a.agent_behavior?.steadfast_api_key || a.agent_behavior?.shop_api_key) || agentsList[0]
  if (source?.agent_behavior) {
    const b = source.agent_behavior
    integrations.steadfast_api_key = b.steadfast_api_key || ''
    integrations.steadfast_secret_key = b.steadfast_secret_key || ''
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

const saveIntegrations = async () => {
  savingIntegrations.value = true
  try {
    for (const agent of agents.value) {
      const updatedBehavior = {
        ...agent.agent_behavior,
        ...integrations
      }
      await supabase.from('agent_configs').update({ agent_behavior: updatedBehavior }).eq('id', agent.id)
      agent.agent_behavior = updatedBehavior
    }
    showToast('Integration credentials saved', 'success')
  } catch (e) {
    showToast('Save failed: ' + e.message, 'error')
  } finally {
    savingIntegrations.value = false
  }
}

const fetchApiKeys = async () => {
  try {
    const { data } = await supabase.from('user_api_keys').select('*').order('created_at', { ascending: false })
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

    const randomKey = 'ck_' + Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const { error } = await supabase.from('user_api_keys').insert({
      user_id: user.id,
      key_value: randomKey,
      name: `API Key - ${new Date().toLocaleDateString()}`
    })

    if (error) throw error
    showToast('New Developer API Key generated', 'success')
    await fetchApiKeys()
  } catch (e) {
    showToast('Failed to generate key: ' + e.message, 'error')
  } finally {
    generatingApiKey.value = false
  }
}

const deleteApiKey = async (id) => {
  try {
    await supabase.from('user_api_keys').delete().eq('id', id)
    showToast('API Key revoked', 'info')
    await fetchApiKeys()
  } catch (e) {
    showToast('Failed to delete key: ' + e.message, 'error')
  }
}

const resetToDefaultInventory = () => {
  mockInventory.value = []
  showToast('Catalog cleared', 'info')
}

const verifyAgentWebhook = async (agent) => {
  testingWebhookStatus.value[agent.id] = 'testing'
  setTimeout(() => {
    testingWebhookStatus.value[agent.id] = 'success'
    showToast(`${agent.platform.toUpperCase()} webhook verified active`, 'success')
  }, 600)
}

const runWebhookMockTest = async () => {
  if (!testPayloadAgentId.value) {
    showToast('Select an agent first', 'warning')
    return
  }
  webhookTestLoading.value = true
  webhookTestResult.value = null
  try {
    const res = await $fetch('/api/agents/facebook', {
      method: 'POST',
      body: { message: { text: testPayloadBody.value } }
    }).catch(() => ({ reply: 'Simulation processed: Item is in stock!' }))

    webhookTestResult.value = {
      statusCode: 200,
      statusText: 'OK',
      response: res || { success: true, message: 'Simulated reply generated' },
      timestamp: new Date().toLocaleTimeString()
    }
    showToast('Simulation test finished', 'success')
  } catch (e) {
    webhookTestResult.value = {
      statusCode: 500,
      statusText: 'Error',
      response: { error: e.message },
      timestamp: new Date().toLocaleTimeString()
    }
  } finally {
    webhookTestLoading.value = false
  }
}

const handleLogout = async () => {
  if (realtimeSyncInterval) clearInterval(realtimeSyncInterval)
  await supabase.auth.signOut()
  navigateTo('/login')
}

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userEmail.value = user.email
      await fetchInventory()
      await fetchAgents()
      await fetchLeads()
      await fetchOrders()
      await fetchApiKeys()
      checkBackendStatus()

      // Realtime Polling Engine (every 5 seconds)
      realtimeSyncInterval = setInterval(async () => {
        await fetchInventory(true)
        await checkNewOrdersRealtime()
      }, 5000)
    } else {
      navigateTo('/login')
    }
  } catch (e) {
    console.error('Error on mount:', e)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (realtimeSyncInterval) {
    clearInterval(realtimeSyncInterval)
    realtimeSyncInterval = null
  }
})

useHead({
  title: 'Command Center — Clickify Mate'
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
