<template>
  <section class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/40">
      <div>
        <div class="flex items-center gap-2.5">
          
          <h2 class="text-xl font-bold tracking-tight text-on-surface">Connected AI Agents</h2>
        </div>
        <p class="text-xs text-on-surface-variant mt-1">
          Manage platform routing, training knowledge, and catalog automation for each channel.
        </p>
      </div>

      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
        <button 
          @click="$emit('switch-tab', 'catalog')"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-outline hover:bg-surface-hover text-on-surface transition-all shadow-xs cursor-pointer"
        >
          <span>Product Catalog</span>
        </button>

        <button 
          @click="$emit('open-connect-modal')" 
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent transition-all shadow-sm hover:shadow-md active:scale-98 cursor-pointer"
        >
          <span class="material-symbols-outlined text-base">add</span>
          <span>Connect Agent</span>
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-80 bg-surface/50 border border-outline/50 animate-pulse rounded-2xl"></div>
    </div>

    <!-- Agents Grid -->
    <div v-else-if="agents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="agent in agents" 
        :key="agent.id" 
        class="bg-surface border border-outline/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:border-primary/40 relative"
      >
        <!-- Top Agent Header -->
        <div>
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <div 
                class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                :class="getPlatformIconClass(agent.platform)"
              >
                <PlatformIcon :platform="agent.platform" custom-class="w-6 h-6" />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-bold text-on-surface truncate capitalize flex items-center gap-1.5" :title="agent.name || formatPlatformName(agent.platform)">
                  {{ agent.name || (formatPlatformName(agent.platform) + ' Agent') }}
                </h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[11px] text-on-surface-variant font-mono">
                    ID: ...{{ agent.id.slice(-6) }}
                  </span>
                  <button 
                    @click="$emit('copy-text', agent.id, 'Agent ID')" 
                    class="text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer"
                    title="Copy full Agent ID"
                  >
                    <span class="material-symbols-outlined text-[13px]">content_copy</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Platform Badge & Toggle -->
            <div class="flex flex-col items-end gap-1.5 shrink-0">
              <button 
                type="button"
                @click="$emit('toggle-agent-status', agent)"
                class="px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                :class="agent.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20'"
                :title="agent.is_active ? 'Click to Pause this Agent' : 'Click to Start / Resume this Agent'"
              >
                <span>{{ agent.is_active ? 'Active (Click to Pause)' : 'Paused (Click to Start)' }}</span>
              </button>
            </div>
          </div>

          <!-- Channel Specific Badge -->
          <div class="mb-4 flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span class="font-medium text-on-surface">Target Channel:</span>
            <span class="capitalize font-semibold text-primary">
              {{ formatPlatformName(agent.platform) }}
            </span>
            <span v-if="agent.external_id" class="text-[11px] font-mono text-on-surface-variant/70">
              ({{ agent.external_id }})
            </span>
          </div>

          <!-- Internal Card Tabs -->
          <div class="flex items-center gap-1 p-1 bg-surface-hover/50 rounded-xl mb-4 border border-outline/40">
            <button 
              type="button"
              @click="agent.activeCardTab = 'knowledge'" 
              class="flex-1 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer"
              :class="(!agent.activeCardTab || agent.activeCardTab === 'knowledge') ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
            >
              Knowledge
            </button>
            <button 
              type="button"
              @click="agent.activeCardTab = 'catalog'" 
              class="flex-1 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1"
              :class="agent.activeCardTab === 'catalog' ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
            >
              <span>Catalog</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
                {{ getAgentCatalogProducts(agent).length + (agent.product_images || []).length }}
              </span>
            </button>
            <button 
              type="button"
              @click="agent.activeCardTab = 'behavior'" 
              class="flex-1 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer"
              :class="agent.activeCardTab === 'behavior' ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
            >
              Settings
            </button>
          </div>

          <!-- Tab Content: Knowledge / Instructions -->
          <div v-show="!agent.activeCardTab || agent.activeCardTab === 'knowledge'" class="mb-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                Product Instructions &amp; Rules
              </span>
              <button 
                type="button" 
                @click="$emit('show-guide')" 
                class="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Blueprint Guide
              </button>
            </div>
            
            <textarea 
              v-model="agent.knowledge" 
              @input="agent.isDirty = true" 
              rows="6"
              placeholder="Enter product catalog, price, return policy, delivery fees..."
              class="w-full bg-surface-hover/50 border border-outline rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none leading-relaxed"
            ></textarea>

            <div class="text-right text-[11px] text-on-surface-variant font-mono">
              {{ (agent.knowledge || '').length }} characters
            </div>
          </div>

          <!-- Tab Content: Live Product Catalog & Photos (Synchronized with Catalog + Overrides) -->
          <div v-show="agent.activeCardTab === 'catalog'" class="mb-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-on-surface flex items-center gap-1.5">
                Connected Products ({{ getAgentCatalogProducts(agent).length }})
              </span>
            </div>

            <!-- List of Synchronized Catalog Products -->
            <div class="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden agent-scroll pr-1">
              
              <!-- 1. Products from Central Product Catalog -->
              <div 
                v-for="prod in getAgentCatalogProducts(agent)" 
                :key="prod.sku || prod.id"
                class="p-2.5 rounded-xl bg-surface-hover/60 border border-outline/70 space-y-1.5"
              >
                <div class="flex items-center gap-2.5">
                  <!-- Hero Image Thumbnail -->
                  <div class="w-11 h-11 rounded-lg bg-surface flex items-center justify-center overflow-hidden border border-outline shrink-0 relative">
                    <img 
                      v-if="getProductHero(prod)" 
                      :src="resolveImage(getProductHero(prod))" 
                      class="w-full h-full object-cover" 
                      @error="prod.image = ''" 
                    />
                    <span v-else class="material-symbols-outlined text-xs text-on-surface-variant/40">inventory_2</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-1">
                      <span class="font-bold text-xs text-on-surface truncate">{{ prod.name }}</span>
                      <span class="text-xs font-semibold text-primary shrink-0">৳{{ prod.price }}</span>
                    </div>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                        {{ prod.sku }}
                      </span>
                      <span class="text-[10px] text-on-surface-variant/70">
                        Stock: {{ prod.stock_quantity }}
                      </span>
                      <span v-if="(prod.images || []).length > 1" class="text-[10px] text-secondary font-semibold">
                        📷 {{ prod.images.length }} photos
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Mini Photo Gallery Preview if Multiple Images -->
                <div v-if="(prod.images || []).length > 1" class="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  <div 
                    v-for="(gImg, gIdx) in prod.images" 
                    :key="gIdx"
                    class="w-6 h-6 rounded-md bg-surface border border-outline/60 overflow-hidden shrink-0"
                    :title="gImg.role"
                  >
                    <img :src="resolveImage(gImg.url)" class="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <!-- 2. Direct Agent Photo Overrides -->
              <div 
                v-for="(img, idx) in agent.product_images" 
                :key="'custom-' + idx" 
                class="p-2.5 rounded-xl bg-surface-hover/60 border border-outline/60 space-y-2"
              >
                <div class="flex items-center gap-2.5">
                  <div class="w-11 h-11 rounded-lg bg-surface flex items-center justify-center overflow-hidden border border-outline shrink-0 relative">
                    <img 
                      v-if="img.url" 
                      :src="resolveImage(img.url)" 
                      class="w-full h-full object-cover" 
                      @error="img.url = ''" 
                    />
                    <span v-else class="material-symbols-outlined text-xs text-on-surface-variant/40">image</span>
                  </div>

                  <div class="flex-1 min-w-0 space-y-1">
                    <div class="flex items-center gap-1.5">
                      <input 
                        v-model="img.id"
                        @input="agent.isDirty = true"
                        placeholder="SKU / ID (e.g. HOODIE-01)"
                        class="flex-1 min-w-0 bg-surface px-2.5 py-1 rounded-lg text-xs font-semibold text-primary outline-none border border-outline focus:border-primary/50 transition-colors uppercase font-mono"
                      />
                      <label class="p-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-colors cursor-pointer shrink-0" title="Upload from Device">
                        <input type="file" accept="image/*" class="hidden" @change="handleFileUpload($event, img, agent)" />
                        <span class="material-symbols-outlined text-xs">upload_file</span>
                      </label>
                      <button 
                        type="button" 
                        @click="removeAgentImage(agent, idx)"
                        class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        title="Remove"
                      >
                        <span class="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>

                    <input 
                      v-model="img.url"
                      @input="agent.isDirty = true"
                      placeholder="Image URL or upload..."
                      class="w-full bg-surface px-2 py-1 rounded-lg text-[11px] text-on-surface outline-none border border-outline/70 focus:border-primary/50 transition-colors truncate"
                    />
                  </div>
                </div>
              </div>

              <!-- Empty Notice if no products found -->
              <div v-if="getAgentCatalogProducts(agent).length === 0 && (agent.product_images || []).length === 0" class="py-6 text-center text-xs text-on-surface-variant/70 border border-dashed border-outline/60 rounded-xl space-y-1.5">
                <span class="material-symbols-outlined text-2xl text-on-surface-variant/40">add_shopping_cart</span>
                <p>No products assigned to this agent yet.</p>
                <button 
                  @click="$emit('switch-tab', 'catalog')" 
                  class="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  + Add Products in Product Catalog
                </button>
              </div>

              <!-- Quick Add Direct Image Button -->
              <button 
                type="button"
                @click="addAgentImage(agent)"
                class="w-full py-2 border border-dashed border-outline/80 rounded-xl flex items-center justify-center gap-1.5 text-xs text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
              >
                <span class="material-symbols-outlined text-sm">add_circle</span>
                <span>+ Add Direct Custom Image</span>
              </button>
            </div>
          </div>

          <!-- Tab Content: Behavior & Settings -->
          <div v-show="agent.activeCardTab === 'behavior'" class="mb-4 space-y-3.5">
            <!-- Facebook specific options -->
            <div v-if="agent.platform === 'fb_comment'" class="space-y-2.5 text-xs">
              <span class="font-semibold text-on-surface block pb-1 border-b border-outline/40">Comment Automations &amp; Post Targeting</span>
              
              <!-- Post Scope Selector -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between">
                  <span class="text-on-surface-variant font-medium">Post Targeting Scope</span>
                  <select 
                    v-model="agent.agent_behavior.fb_comment_scope" 
                    @change="agent.isDirty = true"
                    class="bg-surface-hover border border-outline rounded-lg px-2 py-1 text-[11px] text-on-surface outline-none cursor-pointer"
                  >
                    <option value="all_posts">All Page Posts (Auto-Detect)</option>
                    <option value="specific_posts">Specific Post IDs Only</option>
                    <option value="tagged_posts">Tagged Posts (Hashtag)</option>
                  </select>
                </div>

                <!-- Specific Post IDs Input -->
                <div v-if="agent.agent_behavior.fb_comment_scope === 'specific_posts'" class="pt-1">
                  <input 
                    type="text" 
                    v-model="agent.agent_behavior.fb_target_post_ids" 
                    @input="agent.isDirty = true"
                    placeholder="Enter Post IDs (e.g. 10293848_4958392)"
                    class="w-full bg-surface-hover border border-outline rounded-lg px-2.5 py-1.5 text-[11px] text-on-surface outline-none focus:border-primary/50"
                  />
                  <p class="text-[10px] text-on-surface-variant/70 mt-0.5">Separate multiple Post IDs with commas.</p>
                </div>

                <!-- Hashtag Trigger Input -->
                <div v-if="agent.agent_behavior.fb_comment_scope === 'tagged_posts'" class="pt-1">
                  <input 
                    type="text" 
                    v-model="agent.agent_behavior.fb_trigger_tag" 
                    @input="agent.isDirty = true"
                    placeholder="e.g. #order or #clickify"
                    class="w-full bg-surface-hover border border-outline rounded-lg px-2.5 py-1.5 text-[11px] text-on-surface outline-none focus:border-primary/50"
                  />
                  <p class="text-[10px] text-on-surface-variant/70 mt-0.5">Bot will only reply to posts containing this tag in caption.</p>
                </div>
              </div>

              <!-- Checkboxes -->
              <div class="space-y-2 pt-1 border-t border-outline/30">
                <label class="flex items-center gap-2.5 cursor-pointer text-on-surface-variant hover:text-on-surface">
                  <input type="checkbox" v-model="agent.agent_behavior.fb_private_reply_prices" @change="agent.isDirty = true" class="w-4 h-4 rounded text-primary border-outline focus:ring-primary/20" />
                  <span>Auto-DM prices &amp; product photos to comments</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer text-on-surface-variant hover:text-on-surface">
                  <input type="checkbox" v-model="agent.agent_behavior.fb_public_reply_enabled" @change="agent.isDirty = true" class="w-4 h-4 rounded text-primary border-outline focus:ring-primary/20" />
                  <span>Enable public replies on comments</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer text-on-surface-variant hover:text-on-surface">
                  <input type="checkbox" v-model="agent.agent_behavior.fb_delete_negatives" @change="agent.isDirty = true" class="w-4 h-4 rounded text-primary border-outline focus:ring-primary/20" />
                  <span>Auto-delete spam/negative comments</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer text-on-surface-variant hover:text-on-surface">
                  <input type="checkbox" v-model="agent.agent_behavior.fb_ignore_non_sales" @change="agent.isDirty = true" class="w-4 h-4 rounded text-primary border-outline focus:ring-primary/20" />
                  <span>Ignore non-sales posts (e.g. holiday greetings)</span>
                </label>
              </div>
            </div>

            <!-- General Options -->
            <div class="space-y-2 text-xs">
              <span class="font-semibold text-on-surface block pb-1 border-b border-outline/40">Response Settings</span>
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant">Conversation Tone</span>
                <select 
                  v-model="agent.agent_behavior.tone" 
                  @change="agent.isDirty = true"
                  class="bg-surface-hover border border-outline rounded-lg px-2.5 py-1 text-xs text-on-surface outline-none cursor-pointer"
                >
                  <option value="Friendly">Friendly &amp; Helpful</option>
                  <option value="Professional">Professional / Formal</option>
                  <option value="Bangla-English">Bangla-English (Casual)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="pt-3 border-t border-outline/50 flex flex-col gap-2">
          <!-- Sync Changes Button -->
          <button 
            v-if="agent.isDirty" 
            type="button"
            @click="$emit('update-knowledge', agent)" 
            class="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">cloud_sync</span>
            <span>Save &amp; Sync Agent</span>
          </button>

          <!-- Disconnect Agent Button -->
          <button 
            type="button"
            @click="$emit('disconnect-agent', agent.id)" 
            class="w-full py-2 text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-sm">delete</span>
            <span>Disconnect Agent</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-surface border border-outline border-dashed rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
      <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-3xl">
        <span class="material-symbols-outlined text-4xl">smart_toy</span>
      </div>
      <div>
        <h3 class="text-base font-bold text-on-surface">No Connected AI Agents</h3>
        <p class="text-xs text-on-surface-variant mt-1">
          Connect your WhatsApp, Telegram, or Facebook Messenger page to automate 24/7 sales.
        </p>
      </div>
      <button 
        @click="$emit('open-connect-modal')" 
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent transition-all shadow-sm cursor-pointer"
      >
        <span class="material-symbols-outlined text-base">add</span>
        Connect Your First Agent
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  agents: { type: Array, required: true },
  loading: { type: Boolean, required: true }
})

const emit = defineEmits([
  'open-connect-modal',
  'disconnect-agent',
  'update-knowledge',
  'show-guide',
  'copy-text',
  'switch-tab'
])

const inventoryProducts = ref([])

const fetchInventory = async () => {
  try {
    const res = await $fetch('/api/admin/inventory')
    if (Array.isArray(res)) {
      inventoryProducts.value = res
    }
  } catch (e) {
    console.error('Failed to load inventory for agents:', e)
  }
}

onMounted(() => {
  fetchInventory()
})

const getAgentCatalogProducts = (agent) => {
  return inventoryProducts.value.filter(p => {
    return !p.assigned_agent || p.assigned_agent === 'all' || p.assigned_agent === agent.id
  })
}

const getProductHero = (prod) => {
  if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
    const hero = prod.images.find(img => img.role === 'hero') || prod.images[0]
    return hero?.url || ''
  }
  return prod.image || ''
}

const resolveImage = (url) => {
  if (!url) return ''
  if (url.startsWith('/api/media')) return url
  if (url.includes('.backblazeb2.com/')) {
    const parts = url.split('.backblazeb2.com/')
    if (parts[1]) {
      return `/api/media/${parts[1]}`
    }
  }
  return url
}

const formatPlatformName = (platform) => {
  if (platform === 'whatsapp') return 'WhatsApp'
  if (platform === 'telegram') return 'Telegram'
  if (platform === 'messenger') return 'Messenger'
  if (platform === 'fb_comment') return 'Facebook Comments'
  if (platform === 'instagram') return 'Instagram DM'
  if (platform === 'ig_comment') return 'Instagram Comments'
  return platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Direct'
}

const getPlatformIcon = (platform) => {
  if (platform === 'whatsapp') return 'chat'
  if (platform === 'telegram') return 'send'
  if (platform === 'messenger') return 'forum'
  if (platform === 'instagram' || platform === 'ig_comment') return 'photo_camera'
  return 'chat_bubble'
}

const getPlatformIconClass = (platform) => {
  const p = (platform || '').toLowerCase()
  if (p === 'whatsapp') return 'bg-emerald-500/10 text-emerald-500'
  if (p === 'telegram') return 'bg-sky-500/10 text-sky-500'
  if (p === 'messenger') return 'bg-blue-500/10 text-blue-500'
  if (p === 'facebook' || p === 'fb_comment') return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
  if (p === 'instagram' || p === 'ig_comment') return 'bg-pink-500/10 text-pink-500'
  return 'bg-primary/10 text-primary'
}

const addAgentImage = (agent) => {
  if (!agent.product_images) agent.product_images = []
  agent.product_images.push({ id: '', url: '' })
  agent.isDirty = true
}

const removeAgentImage = (agent, index) => {
  agent.product_images.splice(index, 1)
  agent.isDirty = true
}

const handleFileUpload = async (event, img, agent) => {
  const file = event.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    if (res?.url) {
      img.url = res.url
      agent.isDirty = true
    }
  } catch (err) {
    alert('Upload failed: ' + err.message)
  }
}
</script>

<style scoped>
.agent-scroll {
  overflow-x: hidden !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(140, 140, 160, 0.3) transparent;
}
.agent-scroll::-webkit-scrollbar {
  width: 5px;
  height: 0px;
}
.agent-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.agent-scroll::-webkit-scrollbar-thumb {
  background: rgba(140, 140, 160, 0.25);
  border-radius: 9999px;
}
.agent-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(140, 140, 160, 0.5);
}
</style>
