<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-bold text-on-surface">Payment Gateways</h2>
        </div>
        <p class="mt-1 text-xs leading-relaxed text-on-surface-variant">
          Connect your shop's own bKash, Nagad, and Stripe merchant accounts. Each account is private to the signed-in shop owner.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-xl border border-outline bg-surface px-3.5 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
        @click="loadGateways"
      >
        <span class="material-symbols-outlined text-base" :class="loading ? 'animate-spin' : ''">refresh</span>
        Refresh
      </button>
    </div>


    <div v-if="loadError" class="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400">
      {{ loadError }}
    </div>

    <div v-if="loading && !hasLoaded" class="grid gap-5 lg:grid-cols-2">
      <div v-for="provider in providers" :key="provider.id" class="h-96 animate-pulse rounded-3xl border border-outline bg-surface-hover/60"></div>
    </div>

    <div v-else class="grid items-start gap-5 lg:grid-cols-2">
      <form
        v-for="provider in providers"
        :key="provider.id"
        class="overflow-hidden rounded-3xl border border-outline bg-surface shadow-xs"
        @submit.prevent="saveGateway(provider.id)"
      >
        <div class="flex items-center justify-between border-b border-outline bg-surface-hover/45 p-5">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white shadow-xs" :class="provider.logoClass">
              {{ provider.shortName }}
            </div>
            <div>
              <h3 class="text-sm font-bold text-on-surface">{{ provider.name }} Merchant</h3>
              <p class="text-[11px] text-on-surface-variant">{{ provider.description }}</p>
            </div>
          </div>

          <span
            class="rounded-full border px-2.5 py-1 text-[10px] font-bold"
            :class="drafts[provider.id].configured
              ? (drafts[provider.id].isActive ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400')
              : 'border-outline bg-surface text-on-surface-variant'"
          >
            {{ drafts[provider.id].configured ? (drafts[provider.id].isActive ? 'Active' : 'Inactive') : 'Not configured' }}
          </span>
        </div>

        <div class="space-y-5 p-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-1.5 text-xs">
              <span class="font-semibold text-on-surface-variant">Merchant / Shop name</span>
              <input
                v-model="drafts[provider.id].merchantName"
                required
                maxlength="120"
                autocomplete="organization"
                placeholder="Your shop name"
                class="w-full rounded-xl border border-outline bg-background px-3.5 py-2.5 text-xs text-on-surface outline-none transition-colors focus:border-primary/60"
              />
            </label>

            <label class="space-y-1.5 text-xs">
              <span class="font-semibold text-on-surface-variant">{{ provider.numberLabel }}</span>
              <input
                v-model="drafts[provider.id].merchantNumber"
                required
                maxlength="40"
                :inputmode="provider.id === 'stripe' ? 'text' : 'numeric'"
                autocomplete="off"
                :placeholder="provider.numberPlaceholder"
                class="w-full rounded-xl border border-outline bg-background px-3.5 py-2.5 text-xs text-on-surface outline-none transition-colors focus:border-primary/60"
              />
            </label>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-1.5 text-xs">
              <span class="font-semibold text-on-surface-variant">Environment</span>
              <select
                v-model="drafts[provider.id].environment"
                class="w-full rounded-xl border border-outline bg-background px-3.5 py-2.5 text-xs text-on-surface outline-none transition-colors focus:border-primary/60"
              >
                <option value="sandbox">Sandbox / Test</option>
                <option value="production">Production / Live</option>
              </select>
            </label>

            <label class="space-y-1.5 text-xs">
              <span class="font-semibold text-on-surface-variant">Public application URL (optional)</span>
              <input
                v-model="drafts[provider.id].callbackUrl"
                maxlength="500"
                type="url"
                autocomplete="url"
                placeholder="https://pay.example.com"
                class="w-full rounded-xl border border-outline bg-background px-3.5 py-2.5 text-xs text-on-surface outline-none transition-colors focus:border-primary/60"
              />
            </label>
          </div>

          <div class="rounded-2xl border border-outline bg-background/60 p-4">
            <div class="mb-3 flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold text-on-surface">API credentials</p>
                <p class="mt-0.5 text-[10px] leading-relaxed text-on-surface-variant">Required for hosted checkout. Production also requires PAYMENT_PUBLIC_BASE_URL on the server.</p>
              </div>
              <span class="material-symbols-outlined text-base text-on-surface-variant/60">key</span>
            </div>

            <div v-if="provider.id === 'stripe'" class="mb-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-[10px] leading-relaxed text-on-surface-variant">
              Register <strong class="text-on-surface">/api/payments/webhook/stripe</strong> as a Stripe webhook endpoint and subscribe to Checkout Session completed, async succeeded/failed, and expired events.
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <label v-for="field in provider.credentialFields" :key="field.key" class="space-y-1.5 text-xs">
                <span class="flex items-center justify-between gap-2 font-semibold text-on-surface-variant">
                  {{ field.label }}
                  <span v-if="drafts[provider.id].configuredCredentials[field.key]" class="text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Saved</span>
                </span>
                <textarea
                  v-if="field.multiline"
                  v-model="drafts[provider.id].credentials[field.key]"
                  rows="3"
                  autocomplete="off"
                  :placeholder="drafts[provider.id].configuredCredentials[field.key] ? 'Saved - leave blank to keep' : field.placeholder"
                  class="w-full resize-y rounded-xl border border-outline bg-surface px-3.5 py-2.5 font-mono text-[11px] text-on-surface outline-none transition-colors focus:border-primary/60"
                ></textarea>
                <input
                  v-else
                  v-model="drafts[provider.id].credentials[field.key]"
                  type="password"
                  autocomplete="new-password"
                  :placeholder="drafts[provider.id].configuredCredentials[field.key] ? 'Saved - leave blank to keep' : field.placeholder"
                  class="w-full rounded-xl border border-outline bg-surface px-3.5 py-2.5 text-xs text-on-surface outline-none transition-colors focus:border-primary/60"
                />
              </label>
            </div>
          </div>

          <label class="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-outline bg-surface-hover/40 p-3.5">
            <div>
              <p class="text-xs font-bold text-on-surface">Enable for this shop</p>
              <p class="mt-0.5 text-[10px] text-on-surface-variant">Marks this merchant account as ready for the shop's payment flow.</p>
            </div>
            <input v-model="drafts[provider.id].isActive" type="checkbox" class="h-4 w-4 accent-primary" />
          </label>

          <div class="flex items-center justify-between gap-3 border-t border-outline pt-4">
            <button
              v-if="drafts[provider.id].configured"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
              :disabled="savingProvider === provider.id || deletingProvider === provider.id"
              @click="removeGateway(provider.id)"
            >
              <span class="material-symbols-outlined text-base">delete</span>
              Remove
            </button>
            <span v-else></span>

            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary-accent disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="savingProvider === provider.id || deletingProvider === provider.id"
            >
              <span v-if="savingProvider === provider.id" class="material-symbols-outlined animate-spin text-base">progress_activity</span>
              {{ savingProvider === provider.id ? 'Saving...' : 'Save merchant account' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'

const emit = defineEmits(['show-toast'])

const providers = [
  {
    id: 'bkash',
    name: 'bKash',
    shortName: 'bK',
    logoClass: 'bg-[#e2136e]',
    description: 'Merchant wallet and tokenized checkout credentials',
    numberLabel: 'bKash merchant number',
    numberPlaceholder: '01XXXXXXXXX',
    credentialFields: [
      { key: 'username', label: 'Username', placeholder: 'Merchant API username' },
      { key: 'password', label: 'Password', placeholder: 'Merchant API password' },
      { key: 'appKey', label: 'App key', placeholder: 'Application key' },
      { key: 'appSecret', label: 'App secret', placeholder: 'Application secret' }
    ]
  },
  {
    id: 'nagad',
    name: 'Nagad',
    shortName: 'N',
    logoClass: 'bg-[#ed1c24]',
    description: 'Merchant account and signed checkout credentials',
    numberLabel: 'Nagad merchant ID / number',
    numberPlaceholder: 'Merchant ID or 01XXXXXXXXX',
    credentialFields: [
      { key: 'accountNumber', label: 'Merchant account number', placeholder: '01XXXXXXXXX' },
      { key: 'privateKey', label: 'Merchant private key', placeholder: 'Paste private key', multiline: true },
      { key: 'publicKey', label: 'Nagad public key', placeholder: 'Paste public key', multiline: true }
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    shortName: 'S',
    logoClass: 'bg-[#635bff]',
    description: 'Worldwide hosted Checkout and signed webhook verification',
    numberLabel: 'Stripe account ID',
    numberPlaceholder: 'acct_XXXXXXXXXXXX',
    credentialFields: [
      { key: 'secretKey', label: 'Secret API key', placeholder: 'sk_test_... or sk_live_...' },
      { key: 'webhookSecret', label: 'Webhook signing secret', placeholder: 'whsec_...' }
    ]
  }
]

function emptyDraft(providerId) {
  const credentialFields = providers.find(item => item.id === providerId)?.credentialFields || []
  return {
    configured: false,
    merchantName: '',
    merchantNumber: '',
    environment: 'sandbox',
    callbackUrl: '',
    isActive: false,
    credentials: Object.fromEntries(credentialFields.map(field => [field.key, ''])),
    configuredCredentials: Object.fromEntries(credentialFields.map(field => [field.key, false]))
  }
}

const drafts = reactive({
  bkash: emptyDraft('bkash'),
  nagad: emptyDraft('nagad'),
  stripe: emptyDraft('stripe')
})

const loading = ref(false)
const hasLoaded = ref(false)
const loadError = ref('')
const savingProvider = ref('')
const deletingProvider = ref('')

function errorMessage(error, fallback) {
  return error?.data?.statusMessage || error?.statusMessage || error?.message || fallback
}

function applyGateway(gateway) {
  const draft = drafts[gateway.provider]
  if (!draft) return

  draft.configured = true
  draft.merchantName = gateway.merchantName || ''
  draft.merchantNumber = gateway.merchantNumber || ''
  draft.environment = gateway.environment || 'sandbox'
  draft.callbackUrl = gateway.callbackUrl || ''
  draft.isActive = gateway.isActive === true
  draft.configuredCredentials = { ...draft.configuredCredentials, ...(gateway.configuredCredentials || {}) }
  Object.keys(draft.credentials).forEach(key => { draft.credentials[key] = '' })
}

async function loadGateways() {
  loading.value = true
  loadError.value = ''
  try {
    const response = await $fetch('/api/payment-gateways')
    drafts.bkash = emptyDraft('bkash')
    drafts.nagad = emptyDraft('nagad')
    drafts.stripe = emptyDraft('stripe')
    for (const gateway of response.gateways || []) applyGateway(gateway)
    hasLoaded.value = true
  } catch (error) {
    loadError.value = errorMessage(error, 'Unable to load payment gateway settings.')
  } finally {
    loading.value = false
  }
}

async function saveGateway(providerId) {
  const draft = drafts[providerId]
  savingProvider.value = providerId
  try {
    const response = await $fetch('/api/payment-gateways', {
      method: 'POST',
      body: {
        provider: providerId,
        merchantName: draft.merchantName,
        merchantNumber: draft.merchantNumber,
        environment: draft.environment,
        callbackUrl: draft.callbackUrl,
        isActive: draft.isActive,
        credentials: draft.credentials
      }
    })
    applyGateway(response.gateway)
    emit('show-toast', { message: `${providers.find(item => item.id === providerId)?.name} merchant account saved.`, type: 'success' })
  } catch (error) {
    emit('show-toast', { message: errorMessage(error, 'Unable to save merchant account.'), type: 'error' })
  } finally {
    savingProvider.value = ''
  }
}

async function removeGateway(providerId) {
  const providerName = providers.find(item => item.id === providerId)?.name || providerId
  if (!window.confirm(`Remove the saved ${providerName} merchant account and encrypted credentials?`)) return

  deletingProvider.value = providerId
  try {
    await $fetch(`/api/payment-gateways/${providerId}`, { method: 'DELETE' })
    drafts[providerId] = emptyDraft(providerId)
    emit('show-toast', { message: `${providerName} merchant account removed.`, type: 'success' })
  } catch (error) {
    emit('show-toast', { message: errorMessage(error, 'Unable to remove merchant account.'), type: 'error' })
  } finally {
    deletingProvider.value = ''
  }
}

onMounted(loadGateways)
</script>
