<template>
  <section class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-black tracking-tight flex items-center gap-3 text-on-surface">
        <span class="w-2 h-8 bg-primary rounded-full"></span>
        Connected AI Agents
      </h2>
      <button @click="$emit('open-connect-modal')" class="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline cursor-pointer bg-transparent border-none p-0">Deploy New Agent +</button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="i in 3" :key="i" class="h-64 bg-surface-container-low animate-pulse rounded-[3rem]"></div>
    </div>

    <div v-else-if="agents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="agent in agents" :key="agent.id" class="bg-surface/40 border border-outline/70 p-5 md:p-8 rounded-[0.9rem] shadow-sm group hover:border-primary/30 transition-all relative overflow-hidden">
        <div class="flex items-start justify-between mb-8">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-surface-hover rounded-2xl flex items-center justify-center text-2xl border border-outline">
              <span class="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <h3 class="font-black text-lg text-on-surface">{{ formatPlatformName(agent.platform) }} Agent</h3>
              <div class="flex items-center gap-2 group/id cursor-pointer" @click="$emit('copy-text', agent.id)" title="Click to copy full ID">
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

        <!-- Card Tabs -->
        <div class="flex border-b border-outline mb-4 overflow-x-auto bg-surface-hover/30 p-1 rounded-xl gap-1 shrink-0">
          <button 
            type="button"
            @click="agent.activeCardTab = 'knowledge'"
            :class="agent.activeCardTab === 'knowledge' ? 'bg-primary/10 text-primary border-primary/20' : 'text-on-surface-variant hover:text-on-surface border-transparent'"
            class="flex-1 py-1.5 px-2.5 text-[9px] font-black uppercase tracking-wider rounded-lg border text-center transition-all whitespace-nowrap"
          >
            Knowledge
          </button>
          <button 
            type="button"
            @click="agent.activeCardTab = 'catalog'"
            :class="agent.activeCardTab === 'catalog' ? 'bg-primary/10 text-primary border-primary/20' : 'text-on-surface-variant hover:text-on-surface border-transparent'"
            class="flex-1 py-1.5 px-2.5 text-[9px] font-black uppercase tracking-wider rounded-lg border text-center transition-all whitespace-nowrap"
          >
            Catalog
          </button>
          <button 
            type="button"
            @click="agent.activeCardTab = 'behavior'"
            :class="agent.activeCardTab === 'behavior' ? 'bg-primary/10 text-primary border-primary/20' : 'text-on-surface-variant hover:text-on-surface border-transparent'"
            class="flex-1 py-1.5 px-2.5 text-[9px] font-black uppercase tracking-wider rounded-lg border text-center transition-all whitespace-nowrap"
          >
            Routing & Webhook
          </button>
        </div>

        <!-- Tab Content: Knowledge -->
        <div v-show="agent.activeCardTab === 'knowledge'" class="mb-4 p-4 bg-surface-hover border border-outline rounded-[0.9rem] relative animate-in fade-in duration-200">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary/60">
              <span class="material-symbols-outlined text-sm">psychology</span>
              Agent Rules & Info
              <button @click="$emit('show-guide')" class="text-[9px] text-primary/80 hover:text-primary underline ml-1 cursor-pointer transition-colors bg-transparent border-none p-0 normal-case tracking-normal">Help Guide</button>
            </div>
            <span class="text-[8px] font-mono text-on-surface-variant/40">{{ (agent.knowledge || '').length }} chars</span>
          </div>
          
          <!-- Inline Template Loaders -->
          <div class="flex flex-wrap gap-1.5 mb-3 border-b border-outline/30 pb-2">
            <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/50 flex items-center">Pre-populate:</span>
            <button 
              type="button"
              @click="agent.knowledge = singleProductTemplate; agent.isDirty = true"
              class="px-2 py-0.5 bg-surface/50 border border-outline hover:border-primary/30 text-on-surface-variant hover:text-primary rounded text-[8px] font-black uppercase transition-colors"
            >
              Single
            </button>
            <button 
              type="button"
              @click="agent.knowledge = multiProductTemplate; agent.isDirty = true"
              class="px-2 py-0.5 bg-surface/50 border border-outline hover:border-primary/30 text-on-surface-variant hover:text-primary rounded text-[8px] font-black uppercase transition-colors"
            >
              Multi
            </button>
            <button 
              type="button"
              @click="agent.knowledge = multiCategoryTemplate; agent.isDirty = true"
              class="px-2 py-0.5 bg-surface/50 border border-outline hover:border-primary/30 text-on-surface-variant hover:text-primary rounded text-[8px] font-black uppercase transition-colors"
            >
              Category
            </button>
            <button 
              type="button"
              @click="agent.knowledge = agentKnowledgeBaseTemplate; agent.isDirty = true"
              class="px-2 py-0.5 bg-surface/50 border border-outline hover:border-primary/30 text-on-surface-variant hover:text-primary rounded text-[8px] font-black uppercase transition-colors"
            >
              Blueprint
            </button>
          </div>

          <textarea 
            v-model="agent.knowledge" 
            @input="agent.isDirty = true"
            placeholder="Type business details here..." 
            class="w-full bg-transparent text-[11px] font-medium text-on-surface-variant italic min-h-[160px] outline-none resize-none placeholder:opacity-30 border-none p-0 leading-relaxed"
          ></textarea>
        </div>

        <!-- Tab Content: Catalog -->
        <div v-show="agent.activeCardTab === 'catalog'" class="mb-4 p-4 bg-surface-hover/60 border border-outline rounded-[0.9rem] relative animate-in fade-in duration-200">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-secondary/60">
              <span class="material-symbols-outlined text-sm">gallery_thumbnail</span>
              Product Gallery (Max 3)
            </div>
          </div>
          <div class="space-y-3">
            <div v-for="idx in agent.visibleImageCount" :key="idx-1" class="flex items-center gap-1.5 sm:gap-3 animate-in fade-in slide-in-from-top-1 duration-300 w-full min-w-0">
              <div class="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center overflow-hidden border border-outline shrink-0">
                <img v-if="agent.product_images[idx-1]?.url" :src="agent.product_images[idx-1].url" class="w-full h-full object-cover" @error="agent.product_images[idx-1].url = ''" />
                <span v-else class="material-symbols-outlined text-xs opacity-20">image</span>
              </div>
              <input 
                v-model="agent.product_images[idx-1].id"
                @input="agent.isDirty = true"
                placeholder="Product-ID(e.g:101)"
                class="w-20 sm:w-28 bg-surface-hover px-1.5 py-1.5 rounded-[0.4rem] text-[10px] font-bold text-secondary outline-none border border-outline focus-visible:border-secondary/40 transition-colors shrink-0 min-w-0 text-left"
              />
              <input 
                v-model="agent.product_images[idx-1].url"
                @input="agent.isDirty = true"
                placeholder="Paste Image URL..."
                class="flex-grow min-w-0 bg-surface-hover px-2 py-1.5 rounded-[0.4rem] text-[10px] font-medium text-on-surface outline-none border border-outline focus-visible:border-secondary/40 transition-colors"
              />
            </div>

            <!-- Add Button -->
            <button 
              type="button"
              v-if="agent.visibleImageCount < 3"
              @click="agent.visibleImageCount++"
              class="w-full py-2 border border-dashed border-outline rounded-xl flex items-center justify-center gap-2 text-on-surface-variant/50 hover:text-secondary hover:border-secondary/40 transition-all group/add"
            >
              <span class="material-symbols-outlined text-sm group-hover/add:scale-110 transition-transform">add_circle</span>
              <span class="text-[9px] font-black uppercase tracking-widest">Add Product Image</span>
            </button>
          </div>
        </div>

        <!-- Tab Content: Behavior, Routing, Webhooks -->
        <div v-show="agent.activeCardTab === 'behavior'" class="mb-4 p-4 bg-surface-hover border border-outline rounded-[0.9rem] relative animate-in fade-in duration-200 space-y-4">
          <!-- Facebook specific settings -->
          <div v-if="agent.platform === 'fb_comment'" class="space-y-3">
            <div class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1 border-b border-outline/30 pb-1">Facebook Comments Routing</div>
            
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" v-model="agent.agent_behavior.fb_private_reply_prices" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-primary focus:ring-primary/20 cursor-pointer" />
              <span class="text-[10px] font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">Private reply to Price inquiries</span>
            </label>
            
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" v-model="agent.agent_behavior.fb_private_reply_orders" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-primary focus:ring-primary/20 cursor-pointer" />
              <span class="text-[10px] font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">Private reply to Intent/Orders</span>
            </label>
            
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" v-model="agent.agent_behavior.fb_private_reply_pii" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-primary focus:ring-primary/20 cursor-pointer" />
              <span class="text-[10px] font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">Private reply to Phone/Address</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" v-model="agent.agent_behavior.fb_private_reply_complaints" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-primary focus:ring-primary/20 cursor-pointer" />
              <span class="text-[10px] font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">Private reply to Complaints</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" v-model="agent.agent_behavior.fb_public_reply_enabled" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-primary focus:ring-primary/20 cursor-pointer" />
              <span class="text-[10px] font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">Enable public replies on comments</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" v-model="agent.agent_behavior.fb_delete_negatives" @change="agent.isDirty = true" class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-primary focus:ring-primary/20 cursor-pointer" />
              <span class="text-[10px] font-semibold text-red-400 group-hover:text-red-300 transition-colors">Auto-delete negative/spam comments</span>
            </label>
          </div>

          <!-- Webhook forwarding settings -->
          <div class="space-y-3">
            <div class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1 border-b border-outline/30 pb-1">Webhook Pipeline</div>
            <div class="flex flex-col gap-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/50">Custom Forwarding URL</span>
              <input 
                v-model="agent.agent_behavior.webhook_forward_url"
                @input="agent.isDirty = true"
                placeholder="e.g. https://crm.my-shop.com/webhook"
                class="w-full bg-surface-hover border border-outline rounded-lg px-3 py-1.5 text-[10px] text-on-surface outline-none focus:border-secondary/40 transition-colors"
              />
            </div>
            <div class="space-y-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/50">Forward Events</span>
              <div class="flex gap-3">
                <label class="flex items-center gap-1.5 cursor-pointer group">
                  <input type="checkbox" v-model="agent.agent_behavior.webhook_events.messages" @change="agent.isDirty = true" class="w-3 h-3 rounded border-outline bg-surface-hover text-secondary focus:ring-secondary/20 cursor-pointer" />
                  <span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">Messages</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer group">
                  <input type="checkbox" v-model="agent.agent_behavior.webhook_events.comments" @change="agent.isDirty = true" class="w-3 h-3 rounded border-outline bg-surface-hover text-secondary focus:ring-secondary/20 cursor-pointer" />
                  <span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">Comments</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer group">
                  <input type="checkbox" v-model="agent.agent_behavior.webhook_events.orders" @change="agent.isDirty = true" class="w-3 h-3 rounded border-outline bg-surface-hover text-secondary focus:ring-secondary/20 cursor-pointer" />
                  <span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">Orders</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Sync Changes floating indicator inside card -->
        <div class="mb-4 animate-in fade-in zoom-in-95 duration-200" v-if="agent.isDirty">
          <button 
            type="button"
            @click="$emit('update-knowledge', agent)"
            class="w-full py-3 bg-secondary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-xs">cloud_sync</span>
            Save & Sync Changes
          </button>
        </div>

        <div class="flex flex-col gap-4">
          <button 
            @click="$emit('disconnect-agent', agent.id)"
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
      <button @click="$emit('open-connect-modal')" class="inline-flex items-center gap-3 px-8 h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all cursor-pointer">
        Initialize First Agent
      </button>
    </div>
  </section>
</template>

<script setup>
import {
  singleProductTemplate,
  multiProductTemplate,
  multiCategoryTemplate,
  agentKnowledgeBaseTemplate
} from '~/shared/templates'

defineProps({
  agents: { type: Array, required: true },
  loading: { type: Boolean, required: true }
})

defineEmits([
  'open-connect-modal',
  'disconnect-agent',
  'update-knowledge',
  'show-guide',
  'copy-text'
])

const formatPlatformName = (platform) => {
  if (platform === 'fb_comment') return 'FB comment'
  if (platform === 'messenger') return 'Messenger'
  if (platform === 'whatsapp') return 'WhatsApp'
  if (platform === 'telegram') return 'Telegram'
  return platform || ''
}
</script>
