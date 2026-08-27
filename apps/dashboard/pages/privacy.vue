<script setup lang="ts">
useHead({ title: 'Privacy Policy — Clickify Mate', meta: [{ name: 'robots', content: 'index, follow' }] })
</script>

<template>
  <main class="min-h-screen bg-background text-on-background px-6 py-16">
    <article class="mx-auto max-w-3xl rounded-3xl border border-outline bg-surface p-8 md:p-12">
      <NuxtLink to="/" class="text-primary font-semibold">← Back to Clickify Mate</NuxtLink>
      <h1 class="mt-8 text-4xl font-bold">Privacy Policy</h1>
      <p class="mt-3 text-on-surface-variant">Last updated: 24 August 2026</p>
      <div class="mt-10 space-y-8 leading-7 text-on-surface-variant">
        <section><h2 class="text-xl font-bold text-on-background">Information we process</h2><p>We process merchant account information, connected-channel identifiers, product catalog data, customer messages, order details, delivery information and payment-status references required to operate the service. We do not store customer card credentials.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">How information is used</h2><p>Information is used to deliver automated support, maintain conversation context, create merchant-authorized orders, verify hosted-payment status, prevent abuse and improve service reliability.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">Merchant responsibility</h2><p>Each merchant is responsible for having a lawful basis to connect messaging accounts and process its customers’ information. Merchants must provide any notices and choices required in the countries where they operate.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">Retention and deletion</h2><p>Retention periods depend on the merchant’s configuration and legal obligations. Merchants may request export or deletion of account data. Some transaction records may be retained where legally required.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">Security and subprocessors</h2><p>We use access controls, encryption for supported credentials, audit logging and infrastructure safeguards. Messaging, AI, storage, payment and delivery providers process limited data as necessary to provide their services.</p></section>
        <section><h2 class="text-xl font-bold text-on-background">Contact</h2><p>Before public launch, the operator must add its legal business name, physical address, privacy email and applicable data-protection contact here.</p></section>
      </div>
    </article>
  </main>
</template>
