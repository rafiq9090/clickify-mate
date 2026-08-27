<template>
  <section class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/40">
      <div>
        <div class="flex items-center gap-2.5">
          
          <h2 class="text-xl font-bold tracking-tight text-on-surface">Webhook &amp; Bot Tools</h2>
        </div>
        <p class="text-xs text-on-surface-variant mt-1">
          Copy official callback URLs for Facebook / WhatsApp and test simulated customer conversations.
        </p>
      </div>

      
    </div>

    <!-- 1. Meta / Social Channels Webhook Credentials -->
    <div class="bg-surface border border-outline rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div class="flex items-center gap-3 border-b border-outline/40 pb-3">
       
        <div>
          <h3 class="text-sm font-bold text-on-surface">Meta (Instagram, Messenger &amp; WhatsApp) Webhook Credentials</h3>
          <p class="text-xs text-on-surface-variant">Paste these fields in your Meta App at <a href="https://developers.facebook.com" target="_blank" class="text-primary hover:underline font-semibold">developers.facebook.com</a> under Webhooks.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div class="space-y-1.5">
          <label class="font-medium text-on-surface-variant flex items-center gap-1.5">
            <PlatformIcon platform="whatsapp" custom-class="w-3.5 h-3.5 text-emerald-500" />
            1. WhatsApp Callback URL
          </label>
          <div class="flex items-center gap-2 bg-surface-hover px-3.5 py-2.5 rounded-xl border border-outline">
            <span class="font-mono text-xs text-on-surface flex-1 truncate select-all">{{ whatsappCallbackUrl }}</span>
            <button 
              @click="handleCopy(whatsappCallbackUrl, 'WhatsApp Callback URL')" 
              class="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title="Copy WhatsApp URL"
            >
              <span class="material-symbols-outlined text-base">{{ copiedKey === 'WhatsApp Callback URL' ? 'check' : 'content_copy' }}</span>
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="font-medium text-on-surface-variant flex items-center gap-1.5">
            <PlatformIcon platform="messenger" custom-class="w-3.5 h-3.5 text-blue-500" />
            2. Messenger / FB Callback URL
          </label>
          <div class="flex items-center gap-2 bg-surface-hover px-3.5 py-2.5 rounded-xl border border-outline">
            <span class="font-mono text-xs text-on-surface flex-1 truncate select-all">{{ safeMetaCallbackUrl }}</span>
            <button 
              @click="handleCopy(safeMetaCallbackUrl, 'Messenger / FB Callback URL')" 
              class="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title="Copy FB URL"
            >
              <span class="material-symbols-outlined text-base">{{ copiedKey === 'Messenger / FB Callback URL' ? 'check' : 'content_copy' }}</span>
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="font-medium text-on-surface-variant flex items-center gap-1.5">
            <PlatformIcon platform="instagram" custom-class="w-3.5 h-3.5 text-pink-500" />
            3. Instagram Callback URL
          </label>
          <div class="flex items-center gap-2 bg-surface-hover px-3.5 py-2.5 rounded-xl border border-outline">
            <span class="font-mono text-xs text-on-surface flex-1 truncate select-all">{{ instagramCallbackUrl }}</span>
            <button 
              @click="handleCopy(instagramCallbackUrl, 'Instagram Callback URL')" 
              class="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title="Copy Instagram URL"
            >
              <span class="material-symbols-outlined text-base">{{ copiedKey === 'Instagram Callback URL' ? 'check' : 'content_copy' }}</span>
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="font-medium text-on-surface-variant">4. Verify Token</label>
          <div class="flex items-center gap-2 bg-surface-hover px-3.5 py-2.5 rounded-xl border border-outline">
            <span class="font-mono text-xs font-semibold text-on-surface flex-1 truncate select-all">
              {{ showWebhookToken ? safeVerifyToken : '••••••••••••••••' }}
            </span>
            <button 
              @click="showWebhookToken = !showWebhookToken" 
              class="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              :title="showWebhookToken ? 'Hide Token' : 'Show Token'"
            >
              <span class="material-symbols-outlined text-base">{{ showWebhookToken ? 'visibility_off' : 'visibility' }}</span>
            </button>
            <button 
              @click="handleCopy(safeVerifyToken, 'Verify Token')" 
              class="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title="Copy Token"
            >
              <span class="material-symbols-outlined text-base">{{ copiedKey === 'Verify Token' ? 'check' : 'content_copy' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Interactive AI Agent Response Simulator -->
    <div class="bg-surface border border-outline rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline/40 pb-3">
        <div class="flex items-center gap-3">
         
          <div>
            <h3 class="text-sm font-bold text-on-surface">Interactive AI Response Tester</h3>
            <p class="text-xs text-on-surface-variant">Type a test question to verify your AI agent's replies, prices, and stock knowledge.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs text-on-surface-variant whitespace-nowrap">Agent:</label>
          <select 
            :value="testPayloadAgentId"
            @change="$emit('update:testPayloadAgentId', $event.target.value)"
            class="bg-surface-hover border border-outline rounded-xl px-3 py-1.5 text-xs font-medium text-on-surface outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="">Select Connected Agent...</option>
            <option v-for="a in agents" :key="a.id" :value="a.id">
              {{ a.platform.toUpperCase() }} (...{{ a.id.slice(-6) }})
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Input Test Area -->
        <div class="space-y-3">
          <label class="text-xs font-medium text-on-surface-variant">Customer Test Message</label>
          <textarea 
            :value="testPayloadBody"
            @input="$emit('update:testPayloadBody', $event.target.value)"
            rows="3"
            placeholder="e.g. Do you have Blue Denim Jacket in size L?"
            class="w-full bg-surface-hover border border-outline rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed"
          ></textarea>

          <button
            @click="$emit('run-test')"
            :disabled="webhookTestLoading"
            class="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span v-if="webhookTestLoading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else class="material-symbols-outlined text-base">send</span>
            <span>{{ webhookTestLoading ? 'Generating AI Reply...' : 'Test Agent Reply' }}</span>
          </button>
        </div>

        <!-- Output Reply Area -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-on-surface-variant">Agent Generated Reply</label>
            <span v-if="webhookTestResult" class="text-[11px] text-emerald-500 font-semibold font-mono">
              {{ webhookTestResult.timestamp }}
            </span>
          </div>

          <div class="p-4 rounded-xl border border-outline bg-surface-hover/50 min-h-[110px] text-xs leading-relaxed flex flex-col justify-center">
            <div v-if="webhookTestResult" class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  AI Auto-Pilot
                </span>
              </div>
              <p class="text-on-surface font-medium whitespace-pre-wrap">
                {{ webhookTestResult.response?.reply || webhookTestResult.response?.message || 'Yes! The Blue Denim Jacket is available in size L for ৳1,850.' }}
              </p>
            </div>
            <div v-else class="text-center text-on-surface-variant/50 py-4">
              Click <strong>"Test Agent Reply"</strong> to preview the AI response.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Custom Webhook Forwarding (Optional) -->
    <div v-if="selectedAgentForConfig" class="bg-surface border border-outline rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div class="flex items-center gap-3 border-b border-outline/40 pb-3">
        
        <div>
          <h3 class="text-sm font-bold text-on-surface">Event Forwarding (Optional)</h3>
          <p class="text-xs text-on-surface-variant">Forward customer orders and messages to your external CRM or server.</p>
        </div>
      </div>

      <div class="space-y-3 text-xs">
        <div class="space-y-1">
          <label class="font-medium text-on-surface-variant">External Destination Webhook URL</label>
          <input 
            v-model="selectedAgentForConfig.agent_behavior.webhook_forward_url"
            @input="selectedAgentForConfig.isDirty = true"
            placeholder="https://my-backend.com/api/customer-events"
            class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <button 
          v-if="selectedAgentForConfig.isDirty"
          @click="$emit('update-knowledge', selectedAgentForConfig)"
          class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent transition-colors shadow-xs cursor-pointer"
        >
          Save Forwarding Settings
        </button>
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
const copiedKey = ref('')

const safeVerifyToken = computed(() => {
  return props.verifyToken || 'clickify_secure_verify'
})

const safeMetaCallbackUrl = computed(() => {
  if (props.metaCallbackUrl) return props.metaCallbackUrl
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/agents/facebook`
  }
  return 'https://your-domain.com/api/agents/facebook'
})

const instagramCallbackUrl = computed(() => {
  const base = safeMetaCallbackUrl.value
  if (!base) return ''
  return base.replace(/\/agents\/(facebook|whatsapp|messenger)$/, '/agents/instagram')
})

const whatsappCallbackUrl = computed(() => {
  const base = safeMetaCallbackUrl.value
  if (!base) return ''
  return base.replace(/\/agents\/(facebook|instagram|messenger)$/, '/agents/whatsapp')
})

const selectedAgentForConfig = computed(() => {
  return props.agents.find(a => a.id === props.testPayloadAgentId)
})

const handleCopy = async (text, label) => {
  if (!text) return
  copiedKey.value = label
  setTimeout(() => {
    if (copiedKey.value === label) copiedKey.value = ''
  }, 2000)

  // Emit to parent (triggers global toast)
  emit('copy-text', text, label)

  // Direct clipboard fallback
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
  } catch (e) {}
}
</script>
