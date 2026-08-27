<template>
  <main class="flex min-h-screen items-center justify-center bg-background p-5 text-on-surface">
    <section class="w-full max-w-md rounded-3xl border border-outline bg-surface p-7 text-center shadow-lg">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full" :class="iconClass">
        <span class="material-symbols-outlined text-3xl">{{ icon }}</span>
      </div>
      <h1 class="mt-5 text-xl font-bold">{{ title }}</h1>
      <p class="mt-2 text-sm leading-relaxed text-on-surface-variant">{{ message }}</p>

      <dl v-if="payment" class="mt-6 space-y-3 rounded-2xl bg-background p-4 text-left text-xs">
        <div class="flex justify-between gap-3"><dt>Invoice</dt><dd class="font-semibold">{{ payment.invoiceNumber || '—' }}</dd></div>
        <div class="flex justify-between gap-3"><dt>Provider</dt><dd class="font-semibold capitalize">{{ payment.provider }}</dd></div>
        <div class="flex justify-between gap-3"><dt>Amount</dt><dd class="font-semibold">{{ payment.currency }} {{ payment.amount.toFixed(2) }}</dd></div>
        <div class="flex justify-between gap-3"><dt>Status</dt><dd class="font-semibold capitalize">{{ payment.status }}</dd></div>
      </dl>

      <p v-if="polling" class="mt-5 text-[11px] text-on-surface-variant">Securely checking the merchant provider…</p>
    </section>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const payment = ref<any>(null)
const polling = ref(false)
const loadError = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let attempts = 0

const status = computed(() => payment.value?.status || (loadError.value ? 'failed' : 'pending'))
const title = computed(() => status.value === 'completed'
  ? 'Payment confirmed'
  : ['failed', 'cancelled', 'expired'].includes(status.value)
    ? 'Payment not completed'
    : 'Confirming payment')
const message = computed(() => status.value === 'completed'
  ? 'The provider verified your payment. Your order is now confirmed.'
  : ['failed', 'cancelled', 'expired'].includes(status.value)
    ? 'No successful charge was confirmed. Please return to the conversation and request a new payment link.'
    : 'Please wait while the payment provider confirms the transaction. You may safely close this page.')
const icon = computed(() => status.value === 'completed' ? 'check_circle' : status.value === 'pending' ? 'progress_activity' : 'cancel')
const iconClass = computed(() => status.value === 'completed'
  ? 'bg-emerald-500/10 text-emerald-600'
  : status.value === 'pending'
    ? 'bg-primary/10 text-primary'
    : 'bg-rose-500/10 text-rose-600')

async function loadStatus() {
  const token = String(route.query.token || '')
  if (!token) {
    loadError.value = true
    return
  }
  polling.value = true
  try {
    const response = await $fetch<any>(`/api/payments/status/${encodeURIComponent(token)}`)
    payment.value = response.payment
    if (payment.value.status === 'pending' && attempts++ < 20) timer = setTimeout(loadStatus, 3000)
  } catch {
    loadError.value = true
  } finally {
    polling.value = payment.value?.status === 'pending'
  }
}

onMounted(loadStatus)
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>
