<template>
  <section class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black tracking-tight text-on-surface flex items-center gap-3">
          <span class="w-2 h-8 bg-primary rounded-full"></span>
          Webhook Control Center
        </h2>
        <p class="text-[11px] text-on-surface-variant/60 mt-1 font-medium pl-5">
          Configure custom forwarding destinations, test routing pipelines, and verify incoming channels.
        </p>
      </div>
      <!-- Quick status pills -->
      <div class="flex items-center gap-2 shrink-0">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">
          <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          {{ agents.length }} Agent{{ agents.length !== 1 ? 's' : '' }} Connected
        </div>
      </div>
    </div>

    <!-- Webhook Config Panel -->
    <div class="bg-surface/40 border border-outline/60 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-md">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl text-primary font-black">settings_input_component</span>
          <h3 class="text-sm font-black uppercase tracking-widest text-on-surface">Agent Pipeline Configuration</h3>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60">Configure Agent:</span>
          <select 
            :value="testPayloadAgentId"
            @change="$emit('update:testPayloadAgentId', $event.target.value)"
            class="bg-surface-hover border border-outline rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary outline-none focus:border-primary/40 transition-colors"
          >
            <option value="" class="bg-surface">Select Connected Agent...</option>
            <option v-for="a in agents" :key="a.id" :value="a.id" class="bg-surface">
              {{ a.platform.toUpperCase() }} (...{{ a.id.slice(-6) }})
            </option>
          </select>
        </div>
      </div>

      <!-- Selected Agent settings -->
      <div v-if="selectedAgentForConfig" class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-outline/30 animate-in fade-in duration-300">
        <!-- Webhook Details & Custom Forwarding -->
        <div class="space-y-6">
          <h4 class="text-xs font-black uppercase tracking-widest text-primary">1. Pipeline Configuration</h4>
          
          <!-- Connection details -->
          <div class="p-4 bg-surface-hover border border-outline/50 rounded-2xl space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[8px] font-black uppercase">Active</span>
                <span class="text-[10px] font-mono text-on-surface-variant/50">ID: {{ selectedAgentForConfig.id }}</span>
              </div>
              <button
                @click="$emit('verify-webhook', selectedAgentForConfig)"
                :disabled="testingWebhookStatus[selectedAgentForConfig.id] === 'testing'"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all disabled:opacity-50"
                :class="testingWebhookStatus[selectedAgentForConfig.id] === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-surface-hover border-outline hover:border-primary/40 hover:bg-primary/10 text-on-surface-variant hover:text-primary'"
              >
                <span v-if="testingWebhookStatus[selectedAgentForConfig.id] === 'testing'" class="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                <span v-else class="material-symbols-outlined text-xs">
                  {{ testingWebhookStatus[selectedAgentForConfig.id] === 'success' ? 'check_circle' : 'sync' }}
                </span>
                {{ testingWebhookStatus[selectedAgentForConfig.id] === 'testing' ? 'Verifying...' : testingWebhookStatus[selectedAgentForConfig.id] === 'success' ? 'Verified ✓' : 'Verify Route' }}
              </button>
            </div>

            <!-- Callback URL -->
            <div class="space-y-1.5">
              <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/50 pl-1">Callback URL</span>
              <div class="flex items-center gap-2 bg-surface/50 border border-outline px-4 py-2.5 rounded-xl">
                <span class="font-mono text-[10px] text-on-surface-variant select-all truncate flex-1">{{ getWebhookUrl(selectedAgentForConfig.platform, selectedAgentForConfig.id) }}</span>
                <button
                  @click="$emit('copy-text', getWebhookUrl(selectedAgentForConfig.platform, selectedAgentForConfig.id))"
                  class="text-on-surface-variant/40 hover:text-primary transition-colors shrink-0" title="Copy URL">
                  <span class="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Custom Forwarding -->
          <div class="p-4 bg-surface-hover border border-outline/50 rounded-2xl space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-widest text-secondary">Custom Webhook Forwarding</span>
              <span class="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-[8px] font-black uppercase">Enterprise Pipeline</span>
            </div>
            <p class="text-[9px] text-on-surface-variant/60 leading-relaxed">
              Forward raw messaging events received by this agent to your external systems (CRM, Slack, database, etc.) for deeper integration.
            </p>

            <div class="space-y-3">
              <div class="flex flex-col gap-1.5">
                <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/50 pl-1 font-mono">Forward Destination URL</span>
                <input 
                  v-model="selectedAgentForConfig.agent_behavior.webhook_forward_url"
                  @input="selectedAgentForConfig.isDirty = true"
                  placeholder="e.g. https://your-server.com/api/webhook"
                  class="w-full bg-surface/50 border border-outline rounded-xl px-4 py-2.5 text-[11px] font-medium text-on-surface outline-none focus:border-secondary/40 transition-colors"
                />
              </div>

              <div class="space-y-2">
                <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/50 pl-1 font-mono">Events to Forward</span>
                <div class="flex flex-wrap gap-4">
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      v-model="selectedAgentForConfig.agent_behavior.webhook_events.messages" 
                      @change="selectedAgentForConfig.isDirty = true"
                      class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-secondary focus:ring-secondary/20 cursor-pointer" 
                    />
                    <span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">Messages</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      v-model="selectedAgentForConfig.agent_behavior.webhook_events.comments" 
                      @change="selectedAgentForConfig.isDirty = true"
                      class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-secondary focus:ring-secondary/20 cursor-pointer" 
                    />
                    <span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">Comments</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      v-model="selectedAgentForConfig.agent_behavior.webhook_events.orders" 
                      @change="selectedAgentForConfig.isDirty = true"
                      class="w-3.5 h-3.5 rounded border-outline bg-surface-hover text-secondary focus:ring-secondary/20 cursor-pointer" 
                    />
                    <span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">Orders</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Sync Changes button -->
          <button 
            v-if="selectedAgentForConfig.isDirty"
            @click="$emit('update-knowledge', selectedAgentForConfig)"
            class="w-full py-3.5 bg-secondary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-sm">cloud_sync</span>
            Save Webhook Settings
          </button>
        </div>

        <!-- Webhook Simulator -->
        <div class="space-y-6 lg:border-l lg:border-outline/30 lg:pl-8">
          <h4 class="text-xs font-black uppercase tracking-widest text-secondary">2. Real-time Simulator</h4>
          <p class="text-[11px] text-on-surface-variant/70 leading-relaxed">
            Simulate incoming user queries to test NLP routing, template responses, and inventory synchronization rules instantly.
          </p>

          <div class="space-y-4 bg-surface-hover/30 p-4 border border-outline/50 rounded-2xl">
            <div class="flex flex-col gap-1.5">
              <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/60 pl-1 font-mono">Simulated Message Body</span>
              <textarea 
                :value="testPayloadBody"
                @input="$emit('update:testPayloadBody', $event.target.value)"
                placeholder="e.g. Do you have Blue Denim Jacket in stock?"
                class="w-full h-24 bg-surface/50 border border-outline rounded-xl p-4 text-xs font-medium text-on-surface outline-none focus:border-secondary/40 transition-all resize-none leading-relaxed">
              </textarea>
            </div>
            <!-- Fire button -->
            <button
              @click="$emit('run-test')"
              :disabled="webhookTestLoading"
              class="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              <span v-if="webhookTestLoading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ webhookTestLoading ? 'Sending...' : 'Trigger Simulation' }}
            </button>
          </div>

          <!-- Terminal display -->
          <div class="dash-terminal border rounded-2xl p-4 flex flex-col min-h-[220px] bg-black/40">
            <div class="flex items-center justify-between mb-3 border-b border-outline/30 pb-2">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-red-500/60"></span>
                <span class="w-2 h-2 rounded-full bg-yellow-500/60"></span>
                <span class="w-2 h-2 rounded-full bg-green-500/60"></span>
                <span class="font-mono text-[9px] text-on-surface-variant/60 ml-2">simulator_response.log</span>
              </div>
              <span v-if="webhookTestResult" class="font-mono text-[9px] text-on-surface-variant/50">{{ webhookTestResult.timestamp }}</span>
            </div>
            <div class="flex-1 font-mono text-[9px] leading-relaxed">
              <div v-if="webhookTestResult" class="space-y-3">
                <div class="flex items-center gap-2">
                  <span class="text-on-surface-variant/50 font-black uppercase tracking-widest">STATUS:</span>
                  <span class="px-1.5 py-0.5 rounded text-[8px] font-bold border"
                    :class="webhookTestResult.statusCode === 200
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'">
                    {{ webhookTestResult.statusCode }} {{ webhookTestResult.statusText }}
                  </span>
                </div>
                <div>
                  <span class="text-on-surface-variant/50 font-black uppercase tracking-widest block mb-1">RESPONSE:</span>
                  <pre class="bg-black/5 dark:bg-white/3 border border-outline p-3 rounded-lg text-emerald-700 dark:text-emerald-300 overflow-x-auto max-h-40 whitespace-pre-wrap">{{ JSON.stringify(webhookTestResult.response, null, 2) }}</pre>
                </div>
              </div>
              <div v-else class="flex flex-col items-center justify-center h-full py-10 text-center text-on-surface-variant/30">
                <span class="material-symbols-outlined text-4xl mb-2">code_blocks</span>
                <span class="text-[9px] uppercase tracking-widest">Awaiting Simulation Trigger...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state when no agent selected -->
      <div v-else class="flex flex-col items-center justify-center py-16 border border-dashed border-outline rounded-3xl text-center space-y-4 bg-surface-hover/20">
        <span class="material-symbols-outlined text-4xl text-primary animate-pulse">settings_input_component</span>
        <div>
          <h4 class="text-xs font-black uppercase tracking-widest text-on-surface">Select an Agent to Configure</h4>
          <p class="text-[10px] text-on-surface-variant/50 mt-1 max-w-xs mx-auto">Choose a deployed agent from the dropdown menu to manage custom webhook routes and simulation logs.</p>
        </div>
      </div>
    </div>

    <!-- Meta Token & Integration Playbook Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Meta Verify Token -->
      <div class="bg-surface/40 border border-outline/60 rounded-[2rem] p-6 md:p-8 shadow-md flex flex-col gap-6 relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl text-secondary">security</span>
          <h3 class="text-sm font-black uppercase tracking-widest text-on-surface">Meta Webhook Config</h3>
        </div>
        <p class="text-[11px] font-medium text-on-surface-variant/70 leading-relaxed">
          Copy these values into the <strong class="text-on-surface">Meta Developer Console</strong> under Webhooks to connect your Facebook / Messenger / Instagram agent.
        </p>

        <!-- Callback URL -->
        <div class="space-y-1.5">
          <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/50 pl-1">Callback URL</span>
          <div class="flex items-center gap-2 bg-surface-hover border border-outline px-4 py-3 rounded-xl">
            <span class="font-mono text-[10px] font-bold flex-1 text-on-surface-variant/90 break-all select-all">
              {{ metaCallbackUrl }}
            </span>
            <button
              @click="$emit('copy-text', metaCallbackUrl)"
              class="text-on-surface-variant/50 hover:text-primary transition-colors shrink-0"
              title="Copy Callback URL"
            >
              <span class="material-symbols-outlined text-sm">content_copy</span>
            </button>
          </div>
        </div>

        <!-- Verify Token -->
        <div class="space-y-1.5">
          <span class="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/50 pl-1">Verify Token</span>
          <div class="flex items-center gap-2 bg-surface-hover border border-outline px-4 py-3 rounded-xl">
            <span class="font-mono text-xs font-bold flex-1 text-on-surface-variant/90 truncate">
              {{ showWebhookToken ? verifyToken : '•'.repeat(Math.min(20, verifyToken.length)) }}
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
              <button @click="showWebhookToken = !showWebhookToken" class="text-on-surface-variant/50 hover:text-on-surface transition-colors">
                <span class="material-symbols-outlined text-sm">{{ showWebhookToken ? 'visibility_off' : 'visibility' }}</span>
              </button>
              <button @click="$emit('copy-text', verifyToken)" class="text-on-surface-variant/50 hover:text-on-surface transition-colors">
                <span class="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Integration Playbook -->
      <div class="lg:col-span-2 bg-surface/40 border border-outline/60 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-md relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl text-primary">menu_book</span>
          <h3 class="text-sm font-black uppercase tracking-widest text-on-surface">Integration Playbook</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Telegram -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-black text-primary">1</span>
              <h4 class="text-[11px] font-black uppercase tracking-widest text-primary">Telegram Bot Setup</h4>
            </div>
            <ol class="space-y-3 pl-2">
              <li v-for="(step, i) in [
                'Message @BotFather on Telegram and create a new bot to get your API Token.',
                'Go to AI Agents → Deploy New Agent → select Telegram → paste your Bot Token.',
                'Clickify Mate auto-registers the webhook URL with Telegram\'s servers immediately.',
                'Done! Any user messaging your bot now gets instant AI responses.'
              ]" :key="i" class="flex items-start gap-3 text-[11px] text-on-surface-variant/70 leading-relaxed">
                <span class="w-4 h-4 rounded-full bg-surface-hover border border-outline text-[8px] font-black text-on-surface-variant/70 flex items-center justify-center shrink-0 mt-0.5">{{ i+1 }}</span>
                {{ step }}
              </li>
            </ol>
          </div>
          <!-- Meta (WhatsApp / Messenger) -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center text-[10px] font-black text-secondary">2</span>
              <h4 class="text-[11px] font-black uppercase tracking-widest text-secondary">WhatsApp &amp; Messenger</h4>
            </div>
            <ol class="space-y-3 pl-2">
              <li v-for="(step, i) in [
                'Open your Meta Developer App at developers.facebook.com.',
                'Add the WhatsApp or Messenger product and go to Webhooks settings.',
                'Paste the Callback URL from the Active Endpoints card above.',
                'Enter the Verify Token from the Meta Token panel. Subscribe to messages.'
              ]" :key="i" class="flex items-start gap-3 text-[11px] text-on-surface-variant/70 leading-relaxed">
                <span class="w-4 h-4 rounded-full bg-surface-hover border border-outline text-[8px] font-black text-on-surface-variant/70 flex items-center justify-center shrink-0 mt-0.5">{{ i+1 }}</span>
                {{ step }}
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  agents: { type: Array, required: true },
  testingWebhookStatus: { type: Object, required: true },
  testPayloadAgentId: { type: String, required: true },
  testPayloadBody: { type: String, required: true },
  webhookTestResult: { type: Object, default: null },
  webhookTestLoading: { type: Boolean, default: false },
  metaCallbackUrl: { type: String, required: true },
  verifyToken: { type: String, required: true }
})

const emit = defineEmits([
  'update:testPayloadAgentId',
  'update:testPayloadBody',
  'verify-webhook',
  'run-test',
  'update-knowledge',
  'copy-text'
])

const showWebhookToken = ref(false)

const selectedAgentForConfig = computed(() => {
  return props.agents.find(a => a.id === props.testPayloadAgentId)
})

const getWebhookUrl = (platform, agentId) => {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  const isRust = window.location.port === '5004' || window.location.hostname.includes('ngrok')
  // We match the getWebhookUrl logic from main page
  if (platform === 'telegram') {
    return `${origin}/webhook/telegram?agent_id=${agentId}`
  } else if (platform === 'whatsapp') {
    return `${origin}/api/agents/whatsapp?agent_id=${agentId}`
  } else {
    return `${origin}/api/agents/facebook?agent_id=${agentId}`
  }
}
</script>
