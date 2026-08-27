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
  <footer class="site-footer border-t py-14 relative z-10 text-left">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <!-- Logo and Slogan -->
        <div class="space-y-4 text-left">
          <div class="flex items-center gap-3">
            <span class="font-bold text-lg tracking-tight text-white">Clickify <b>Mate</b></span>
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
            <li><a href="#use-cases" class="hover:text-primary transition-colors leading-relaxed block">How e-commerce brands automate DM commerce</a></li>
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
        <button type="button" @click="scrollToTop" class="text-[11px] text-primary font-bold hover:underline flex items-center gap-1">
          Back to Top <span class="material-symbols-outlined text-xs">arrow_upward</span>
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-color: rgba(255,255,255,0.09);
  color: #f1f7fa;
  background: #07131d;
}
.site-footer :deep(h4) { color: #dfecef; }
.site-footer :deep(p),
.site-footer :deep(li),
.site-footer :deep(.text-on-surface-variant) { color: #849ba8; }
.site-footer :deep(a:hover),
.site-footer :deep(button:hover) { color: #78dfd2; }
.site-footer :deep(.border-outline) { border-color: rgba(255,255,255,0.09); }
.footer-orb {
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  border: 1px solid rgba(120,223,210,0.24);
  border-radius: 50%;
  background: rgba(120,223,210,0.07);
}
.footer-orb i {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  background: #78dfd2;
  box-shadow: 0 0 13px rgba(120,223,210,0.65);
}
.site-footer b { color: #78dfd2; }
</style>
