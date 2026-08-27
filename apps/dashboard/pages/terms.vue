<script setup lang="ts">
useHead({ title: 'Terms of Use — Clickify Mate', meta: [{ name: 'robots', content: 'index, follow' }] })
</script>

<template>
  <main class="min-h-screen bg-background text-on-background px-6 py-16">
    <article class="mx-auto max-w-3xl rounded-3xl border border-outline bg-surface p-8 md:p-12">
      <NuxtLink to="/" class="text-primary font-semibold">← Back to Clickify Mate</NuxtLink>
      <h1 class="mt-8 text-4xl font-bold">Terms of Use</h1>
      <p class="mt-3 text-on-surface-variant">Last updated: 24 August 2026</p>
      <div class="mt-10 space-y-8 leading-7 text-on-surface-variant">
        <section><h2 class="text-xl font-bold text-on-background">Service</h2><p>Clickify Mate provides tools for merchants to connect supported messaging channels, answer customer questions and manage commerce workflows. Automated output can be incorrect and must be monitored by the merchant.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">Merchant obligations</h2><p>Merchants must supply accurate catalog, pricing, policy and gateway information; protect account credentials; comply with messaging-platform rules; and review orders, payments and customer escalations.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">Payments and orders</h2><p>Payment status is authoritative only after verification by the configured payment provider. Screenshots and customer-supplied transaction IDs are not proof of payment. Merchants remain responsible for fulfillment, refunds, taxes and customer disputes.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">Acceptable use</h2><p>The service must not be used for unlawful products, fraud, unsolicited messaging, credential theft, harassment or attempts to access another merchant’s data or internal systems.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">Availability and liability</h2><p>The service may depend on third-party messaging, AI, payment, storage and courier providers. Final commercial terms, warranties, liability limits, governing law and dispute procedures must be reviewed by qualified counsel before launch.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">Operator information</h2><p>Before public launch, add the operator’s legal entity, address, support contact, governing law and cancellation/refund terms here.</p></section>
      </div>
    </article>
  </main>
</template>
