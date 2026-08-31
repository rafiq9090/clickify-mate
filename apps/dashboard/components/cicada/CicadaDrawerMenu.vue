<template>
  <Transition name="mobile-menu-slide">
    <div v-if="isOpen" class="mobile-nav-modal" @click.self="emit('close')">
      <div class="mobile-nav-card">
        <!-- Menu Header -->
        <div class="mobile-nav-header">
          <NuxtLink to="/" class="mobile-brand" @click="emit('close')">
            <span>Clickify Mate</span><span class="brand-dot">.</span>
          </NuxtLink>
          <button type="button" class="mobile-menu-close-btn" aria-label="Close Navigation Menu" @click="emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Navigation Links -->
        <nav class="mobile-nav-links">
          <NuxtLink to="/features" class="mobile-nav-link" @click="emit('close')">
            <div class="nav-link-main">
              <span class="nav-link-title">Platform &amp; Features</span>
              <span class="nav-link-sub">Multi-agent swarms &amp; catalog sync</span>
            </div>
            <span class="nav-arrow">→</span>
          </NuxtLink>

          <NuxtLink to="/solutions" class="mobile-nav-link" @click="emit('close')">
            <div class="nav-link-main">
              <span class="nav-link-title">Solutions</span>
              <span class="nav-link-sub">Social sellers, creators &amp; enterprise</span>
            </div>
            <span class="nav-arrow">→</span>
          </NuxtLink>

          <NuxtLink to="/features#integrations" class="mobile-nav-link" @click="emit('close')">
            <div class="nav-link-main">
              <span class="nav-link-title">Integrations</span>
              <span class="nav-link-sub">WhatsApp, Instagram &amp; Shopify</span>
            </div>
            <span class="nav-arrow">→</span>
          </NuxtLink>

          <NuxtLink to="/blog" class="mobile-nav-link" @click="emit('close')">
            <div class="nav-link-main">
              <span class="nav-link-title">Blog &amp; Playbooks</span>
              <span class="nav-link-sub">Social commerce guides &amp; AI research</span>
            </div>
            <span class="nav-arrow">→</span>
          </NuxtLink>

          <NuxtLink to="/contact" class="mobile-nav-link" @click="emit('close')">
            <div class="nav-link-main">
              <span class="nav-link-title">Contact Support</span>
              <span class="nav-link-sub">Sales inquiries &amp; live onboarding</span>
            </div>
            <span class="nav-arrow">→</span>
          </NuxtLink>
        </nav>

        <!-- Action Buttons -->
        <div class="mobile-nav-actions">
          <NuxtLink to="/dashboard" class="mobile-menu-btn-primary" @click="emit('close')">
            <span>Get Started Free</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </NuxtLink>
          <NuxtLink to="/login" class="mobile-menu-btn-secondary" @click="emit('close')">
            Sign In to Console
          </NuxtLink>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.mobile-nav-modal {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: rgba(52, 31, 55, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 14px;
  box-sizing: border-box;
  overflow-y: auto;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
}

.mobile-nav-card {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.25);
  border-radius: 24px;
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 24px 56px rgba(52, 31, 55, 0.25);
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(84, 51, 89, 0.08);
  padding-bottom: 14px;
}

.mobile-brand {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #341F37;
  text-decoration: none;
}

.brand-dot {
  color: #7B4C85;
}

.mobile-menu-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(123, 76, 133, 0.1);
  border: none;
  color: #341F37;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

.mobile-menu-close-btn:active {
  transform: scale(0.95);
  background: rgba(123, 76, 133, 0.2);
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 14px;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.95);
  transition: all 0.2s ease;
}

.mobile-nav-link:hover,
.mobile-nav-link:active {
  background: #FFFFFF;
  border-color: rgba(123, 76, 133, 0.3);
  transform: scale(0.99);
}

.nav-link-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-link-title {
  font-size: 15px;
  font-weight: 700;
  color: #341F37;
  line-height: 1.25;
}

.nav-link-sub {
  font-size: 12px;
  color: #6E5373;
  line-height: 1.35;
}

.nav-arrow {
  font-size: 16px;
  font-weight: 700;
  color: #7B4C85;
}

.mobile-nav-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.mobile-menu-btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #341F37 0%, #543359 50%, #7B4C85 100%);
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(52, 31, 55, 0.25);
  transition: all 0.2s ease;
}

.mobile-menu-btn-primary:hover {
  filter: brightness(1.08);
}

.mobile-menu-btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.85);
  color: #341F37;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(84, 51, 89, 0.15);
  transition: all 0.2s ease;
}

.mobile-menu-btn-secondary:hover {
  background: #FFFFFF;
  border-color: #7B4C85;
  color: #7B4C85;
}

.mobile-menu-slide-enter-active,
.mobile-menu-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-menu-slide-enter-from,
.mobile-menu-slide-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
}
</style>
