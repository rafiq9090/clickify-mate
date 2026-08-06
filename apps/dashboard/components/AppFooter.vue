<script setup>
defineProps({
  settings: {
    type: Object,
    default: () => ({ site_name: 'Clickify Mate' })
  }
})

const scrollToTop = (e) => {
  if (process.client) {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <footer class="bg-surface border-t border-outline py-12 relative z-10 text-left">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <!-- Logo and Slogan -->
        <div class="space-y-4 text-left">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-black text-lg font-leckerli-one">
              C
            </div>
            <span class="font-bold text-lg tracking-tight">Clickify Mate</span>
          </div>
          <p class="text-xs text-on-surface-variant max-w-xs leading-relaxed">
            The ultimate conversational commerce & social selling automation platform. Connect your messaging channels, sync your catalogs, and let AI close sales 24/7.
          </p>
        </div>

        <!-- Product/Company column -->
        <div class="text-left">
          <h4 class="text-xs font-black uppercase tracking-wider text-on-surface mb-4">Company</h4>
          <ul class="space-y-2 text-xs text-on-surface-variant">
            <li><a href="#features" class="hover:text-primary transition-colors">Our Products</a></li>
            <li><a href="#about" class="hover:text-primary transition-colors">About Clickify Mate</a></li>
            <li><NuxtLink to="/login" class="hover:text-primary transition-colors">Request a Demo</NuxtLink></li>
          </ul>
        </div>

        <!-- Use Cases column -->
        <div class="text-left">
          <h4 class="text-xs font-black uppercase tracking-wider text-on-surface mb-4">Use Cases</h4>
          <ul class="space-y-2 text-xs text-on-surface-variant max-w-sm">
            <li><a href="#use-cases" class="hover:text-primary transition-colors leading-relaxed block">How e-commerce brands drive 35% higher DM conversions</a></li>
            <li><a href="#use-cases" class="hover:text-primary transition-colors leading-relaxed block">How stores automate checkout via WhatsApp Product Catalogs</a></li>
            <li><a href="#use-cases" class="hover:text-primary transition-colors leading-relaxed block">How social sellers auto-reply to Facebook and Instagram comments</a></li>
          </ul>
        </div>

        <!-- Legal & Support column -->
        <div class="text-left">
          <h4 class="text-xs font-black uppercase tracking-wider text-on-surface mb-4">Legal &amp; Support</h4>
          <ul class="space-y-2 text-xs text-on-surface-variant">
            <li><NuxtLink to="/privacy" class="hover:text-primary transition-colors">Privacy Policy</NuxtLink></li>
            <li><NuxtLink to="/terms" class="hover:text-primary transition-colors">Terms of use</NuxtLink></li>
            <li><a href="#cta" class="hover:text-primary transition-colors">Contact Support</a></li>
            <li><a href="#faq" class="hover:text-primary transition-colors">FAQ and Help Center</a></li>
          </ul>
        </div>
      </div>

      <div class="border-t border-outline pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-[11px] text-on-surface-variant/75">
          &copy; {{ new Date().getFullYear() }} Clickify Mate. All rights reserved.
        </p>
        <a href="#" @click="scrollToTop" class="text-[11px] text-primary font-bold hover:underline flex items-center gap-1">
          Back to Top <span class="material-symbols-outlined text-xs">arrow_upward</span>
        </a>
      </div>
    </div>
  </footer>
</template>
