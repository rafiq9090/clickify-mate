<template>
  <div class="cicada-page-wrapper">
    <!-- Mobile Navigation Drawer -->
    <CicadaDrawerMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <!-- Navbar -->
    <CicadaNavbar @toggle-menu="isMenuOpen = !isMenuOpen" />

    <!-- Main Contact Content -->
    <main class="page-main-content">
      <!-- Hero Header -->
      <section class="page-hero-section">
        <h1 class="page-hero-title">
          Let's Scale Your Social Selling <span>Together.</span>
        </h1>
        <p class="page-hero-subtitle">
          Have questions about multi-agent swarms, WhatsApp catalog integrations, or enterprise volume pricing? Our social commerce engineers are here to assist.
        </p>
      </section>

      <!-- Contact Grid: Form & Info -->
      <section class="contact-grid-section">
        <!-- Interactive Liquid Glass Contact Form -->
        <div class="contact-form-card">
          <div class="form-header">
            <h2 class="form-title">Send us a message</h2>
            <p class="form-sub">We typically respond within 15 minutes during business hours.</p>
          </div>

          <form @submit.prevent="submitForm" class="contact-form">
            <div v-if="submitted" class="success-banner">
              <span class="success-icon">✓</span>
              <div>
                <strong>Thank you! Your inquiry has been received.</strong>
                <p>Our solutions engineer will reach out to {{ form.email }} shortly.</p>
              </div>
            </div>

            <div v-else class="form-fields">
              <div class="form-row">
                <div class="form-group">
                  <label for="name">Your Name</label>
                  <input id="name" v-model="form.name" type="text" placeholder="Sarah Jenkins" required class="glass-input" />
                </div>
                <div class="form-group">
                  <label for="email">Work Email</label>
                  <input id="email" v-model="form.email" type="email" placeholder="sarah@yourbrand.com" required class="glass-input" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="platform">Primary Store Platform</label>
                  <select id="platform" v-model="form.platform" class="glass-input">
                    <option value="shopify">Shopify</option>
                    <option value="woocommerce">WooCommerce</option>
                    <option value="custom">Custom ERP / Webhook</option>
                    <option value="direct">Instagram & WhatsApp Direct Selling</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="volume">Estimated Monthly DM Volume</label>
                  <select id="volume" v-model="form.volume" class="glass-input">
                    <option value="5k">&lt; 5,000 conversations / mo</option>
                    <option value="25k">5,000 - 25,000 conversations / mo</option>
                    <option value="100k">25,000 - 100,000 conversations / mo</option>
                    <option value="enterprise">100,000+ conversations / mo</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="message">How can we help your business?</label>
                <textarea id="message" v-model="form.message" rows="4" placeholder="Tell us about your channels, current bottlenecks, or desired integrations..." required class="glass-input textarea"></textarea>
              </div>

              <button type="submit" class="btn-submit-glow" :disabled="loading">
                <span v-if="!loading">Send Message →</span>
                <span v-else>Sending Inquiry...</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Contact Channels & Office Sidebar -->
        <div class="contact-info-column">
          <!-- WhatsApp Card -->
          <div class="info-card">
            <!-- <div class="info-icon whatsapp">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div> -->
            <div class="info-details">
              <h3 class="info-head">WhatsApp Direct Connect</h3>
              <p class="info-desc">Chat directly with an AI Commerce architect in real time.</p>
              <!-- <a href="https://wa.me/15551234567" target="_blank" class="info-link">Open WhatsApp Chat ↗</a> -->
            </div>
          </div>

          <!-- Email Support -->
          <div class="info-card">
            <!-- <div class="info-icon email">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div> -->
            <div class="info-details">
              <h3 class="info-head">Enterprise Support</h3>
              <p class="info-desc">For high-volume SLA inquiries and custom API integrations.</p>
              <!-- <a href="mailto:support@clickifymate.com" class="info-link">support@clickifymate.com ↗</a> -->
            </div>
          </div>

          <!-- Enterprise SLA -->
          <div class="info-card">
            <!-- <div class="info-icon sla">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div> -->
            <div class="info-details">
              <h3 class="info-head">Enterprise SLA Guarantee</h3>
              <p class="info-desc">Dedicated account managers, 99.99% uptime SLA, and SOC2 certified data handling.</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Unified Footer -->
    <CicadaFooter @scroll-top="scrollToTop" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CicadaNavbar from '~/components/cicada/CicadaNavbar.vue'
import CicadaDrawerMenu from '~/components/cicada/CicadaDrawerMenu.vue'
import CicadaFooter from '~/components/cicada/CicadaFooter.vue'

const isMenuOpen = ref(false)

useHead({
  title: 'Contact Us - Clickify Mate | Enterprise Social Commerce',
  meta: [
    {
      name: 'description',
      content: 'Get in touch with Clickify Mate team for custom demos, enterprise multi-agent integrations, and WhatsApp commerce scaling.'
    }
  ]
})

const loading = ref(false)
const submitted = ref(false)
const form = ref({
  name: '',
  email: '',
  platform: 'shopify',
  volume: '25k',
  message: ''
})

const submitForm = async () => {
  loading.value = true
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: form.value
    })
    submitted.value = true
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Failed to submit message. Please try again.')
  } finally {
    loading.value = false
  }
}

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<style scoped>
.cicada-page-wrapper {
  min-height: 100vh;
  background-color: #FAF8FC;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: #341F37;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

.page-main-content {
  flex: 1;
  padding: 110px 24px 70px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 64px;
  box-sizing: border-box;
}

/* Page Hero Section */
.page-hero-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding-top: 20px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(123, 76, 133, 0.08);
  border: 1px solid rgba(123, 76, 133, 0.2);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #7B4C85;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7B4C85;
}

.page-hero-title {
  font-size: 46px;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -0.025em;
  color: #341F37;
  max-width: 900px;
  margin: 0;
}

.page-hero-title span {
  color: #7B4C85;
}

.page-hero-subtitle {
  font-size: 16px;
  line-height: 1.6;
  color: #5C4560;
  max-width: 720px;
  margin: 0;
}

/* Contact Grid Section */
.contact-grid-section {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 36px;
  align-items: start;
}

.contact-form-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 36px;
  box-shadow: 0 16px 36px 0 rgba(84, 51, 89, 0.06),
              inset 0 1px 2px 0 rgba(255, 255, 255, 1);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: #341F37;
  margin: 0;
}

.form-sub {
  font-size: 14px;
  color: #5C4560;
  margin: 0;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #341F37;
}

.glass-input {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(84, 51, 89, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  color: #341F37;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  width: 100%;
}

.glass-input:focus {
  background: #FFFFFF;
  border-color: #7B4C85;
  box-shadow: 0 0 0 3px rgba(123, 76, 133, 0.12);
}

.glass-input.textarea {
  resize: vertical;
  min-height: 120px;
}

.btn-submit-glow {
  padding: 14px 28px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #341F37 0%, #543359 50%, #7B4C85 100%);
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 10px 24px rgba(52, 31, 55, 0.22);
  cursor: pointer;
  transition: all 0.25s ease;
  align-self: flex-start;
}

.btn-submit-glow:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(52, 31, 55, 0.32);
}

.btn-submit-glow:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 20px;
  border-radius: 16px;
  color: #065F46;
}

.success-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #10B981;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  flex-shrink: 0;
}

/* Info Column */
.contact-info-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 16px 36px 0 rgba(84, 51, 89, 0.05);
  display: flex;
  gap: 16px;
}

.info-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon.whatsapp {
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
}

.info-icon.email {
  background: rgba(123, 76, 133, 0.12);
  color: #7B4C85;
}

.info-icon.sla {
  background: rgba(52, 31, 55, 0.1);
  color: #341F37;
}

.info-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-head {
  font-size: 16px;
  font-weight: 700;
  color: #341F37;
  margin: 0;
}

.info-desc {
  font-size: 13.5px;
  line-height: 1.5;
  color: #5C4560;
  margin: 0;
}

.info-link {
  font-size: 13px;
  font-weight: 700;
  color: #7B4C85;
  text-decoration: none;
  margin-top: 4px;
  display: inline-block;
}

.info-link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .contact-grid-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-main-content {
    padding: 72px 10px 36px;
    gap: 28px;
    width: 100%;
    max-width: 100vw;
  }
  .page-hero-section {
    padding-top: 10px;
    gap: 14px;
  }
  .page-hero-title {
    font-size: 28px;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .page-hero-subtitle {
    font-size: 14.5px;
    line-height: 1.5;
  }
  .contact-form-card {
    padding: 18px 14px;
    border-radius: 18px;
    gap: 16px;
  }
  .form-title {
    font-size: 20px;
  }
  .form-sub {
    font-size: 13.5px;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .form-group label {
    font-size: 13px;
  }
  .glass-input {
    font-size: 15px;
    padding: 10px 12px;
    border-radius: 10px;
  }
  .btn-submit-glow {
    width: 100%;
    font-size: 15px;
    padding: 12px 18px;
    text-align: center;
    box-sizing: border-box;
  }
  .info-card {
    padding: 16px 14px;
    border-radius: 16px;
    gap: 14px;
  }
  .info-head {
    font-size: 15.5px;
  }
  .info-desc {
    font-size: 13px;
  }
}
</style>
