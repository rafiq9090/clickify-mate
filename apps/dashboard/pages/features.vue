<template>
  <div class="cicada-page-wrapper">
    <!-- Mobile Navigation Drawer -->
    <CicadaDrawerMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <!-- Navbar -->
    <CicadaNavbar @toggle-menu="isMenuOpen = !isMenuOpen" />

    <!-- Features Content Container -->
    <main class="page-main-content">
      <!-- Hero Header Section -->
      <section id="overview" class="page-hero-section">
      
        <h1 class="page-hero-title">
          Autonomous AI Infrastructure Built for <span>Omnichannel Scale.</span>
        </h1>
        <p class="page-hero-subtitle">
          Discover the complete suite of conversational AI engines, real-time catalog embeddings, and multi-channel checkout agents designed to turn every customer message into verified revenue.
        </p>
        <div class="hero-actions">
          <NuxtLink to="/dashboard" class="btn-primary-glow">
            <span>Explore Command Console</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </NuxtLink>
          <NuxtLink to="/contact" class="btn-secondary-glass">
            Schedule Enterprise Demo
          </NuxtLink>
        </div>
      </section>

      <!-- Core Capabilities Grid -->
      <section class="features-grid-section">
        <div class="section-title-wrap">
          <h2 class="section-heading">Core Platform Capabilities</h2>
          <p class="section-subheading">Every layer engineered for low-latency response times, high conversion accuracy, and zero downtime.</p>
        </div>

        <div class="cards-grid">
          <!-- Card 1 -->
          <div id="swarms" class="liquid-card">
            <div class="card-icon-bubble">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </div>
            <span class="card-tag">Multi-Agent Swarm</span>
            <h3 class="card-title">Autonomous Delegation Swarm</h3>
            <p class="card-desc">
              Dedicated sub-agents specialized in consultative selling, price negotiation, stock reservation, and courier logistics work in concert with 0ms handover latency.
            </p>
            <div class="card-metric-pill">
              <span class="metric-num">&lt; 380ms</span>
              <span class="metric-text">Average Swarm Execution</span>
            </div>
          </div>

          <!-- Card 2 -->
          <div id="whatsapp" class="liquid-card">
            <div class="card-icon-bubble">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span class="card-tag">Meta Cloud API</span>
            <h3 class="card-title">Official WhatsApp &amp; IG Engine</h3>
            <p class="card-desc">
              Direct Tier-1 enterprise routing for WhatsApp Business Platform, Instagram Direct Messaging, and Facebook Comments with 100% template delivery compliance.
            </p>
            <div class="card-metric-pill">
              <span class="metric-num">99.99%</span>
              <span class="metric-text">Meta API Delivery Rate</span>
            </div>
          </div>

          <!-- Card 3 -->
          <div id="catalog-sync" class="liquid-card">
            <div class="card-icon-bubble">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <span class="card-tag">Vector Search</span>
            <h3 class="card-title">Live Dynamic Catalog Sync</h3>
            <p class="card-desc">
              Continuous 2-way sync with Shopify, WooCommerce, and custom warehouse ERPs. Semantic vector search matches fuzzy customer queries with exact inventory variants.
            </p>
            <div class="card-metric-pill">
              <span class="metric-num">Real-Time</span>
              <span class="metric-text">Inventory Availability Sync</span>
            </div>
          </div>

          <!-- Card 4 -->
          <div id="in-chat-payments" class="liquid-card">
            <div class="card-icon-bubble">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <span class="card-tag">Conversational Checkout</span>
            <h3 class="card-title">In-Chat One-Click Payments</h3>
            <p class="card-desc">
              Generate native payment links and instant checkout invoices directly inside WhatsApp or Instagram DMs with automated COD phone verification.
            </p>
            <div class="card-metric-pill">
              <span class="metric-num">+42%</span>
              <span class="metric-text">Higher Cart Completion</span>
            </div>
          </div>

          <!-- Card 5 -->
          <div id="instagram" class="liquid-card">
            <div class="card-icon-bubble">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
            </div>
            <span class="card-tag">Social Growth</span>
            <h3 class="card-title">Comment-to-DM Growth Engine</h3>
            <p class="card-desc">
              Instantly detect trigger keywords on reels, posts, and live streams to automatically DM product links, discount codes, and initiate private shopping assistants.
            </p>
            <div class="card-metric-pill">
              <span class="metric-num">3.4x</span>
              <span class="metric-text">DM Lead Generation Rate</span>
            </div>
          </div>

          <!-- Card 6 -->
          <div id="attribution" class="liquid-card">
            <div class="card-icon-bubble">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <span class="card-tag">Intelligence</span>
            <h3 class="card-title">Revenue &amp; Attribution Analytics</h3>
            <p class="card-desc">
              Granular attribution tracking measuring exact revenue generated per agent, channel conversation ROI, customer lifetime value, and automated re-engagement triggers.
            </p>
            <div class="card-metric-pill">
              <span class="metric-num">100%</span>
              <span class="metric-text">Deterministic Attribution</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Architecture Breakdown Section -->
      <section class="architecture-section">
        <div class="arch-card">
          <div class="arch-header">
            <span class="arch-badge">SYSTEM ARCHITECTURE</span>
            <h2 class="arch-title">How Clickify Mate Swarms Work</h2>
            <p class="arch-desc">From initial social comment or DM inquiry to verified payment and warehouse fulfillment.</p>
          </div>

          <div class="arch-steps-grid">
            <div class="arch-step">
              <div class="step-num">01</div>
              <h4 class="step-head">Omnichannel Ingestion</h4>
              <p class="step-body">Messages from WhatsApp Cloud API, Instagram Graph API, or Webhooks are received in sub-millisecond webhooks.</p>
            </div>
            <div class="arch-step">
              <div class="step-num">02</div>
              <h4 class="step-head">Vector RAG Routing</h4>
              <p class="step-body">The intent router categorizes queries, retrieves product embeddings, and assigns the best-suited AI specialist.</p>
            </div>
            <div class="arch-step">
              <div class="step-num">03</div>
              <h4 class="step-head">Autonomous Dialogue</h4>
              <p class="step-body">AI answers questions, matches preferences, applies promotional discounts, and prepares cart items.</p>
            </div>
            <div class="arch-step">
              <div class="step-num">04</div>
              <h4 class="step-head">Instant Settlement</h4>
              <p class="step-body">Orders are confirmed via secure payment links or validated COD dispatch with automated courier tracking.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Ecosystem & Integrations Section -->
      <section id="integrations" class="integrations-section">
        <div class="section-title-wrap">
          <span class="hero-badge">CONNECTED ECOSYSTEM</span>
          <h2 class="section-heading">Native Integrations &amp; Connectors</h2>
          <p class="section-subheading">Sync with the tools, channels, and commerce platforms you already use every day.</p>
        </div>

        <div class="integrations-grid">
          <div class="integration-item">
            <div class="integration-icon-wrap meta">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <div class="integration-info">
              <h3 class="integration-name">WhatsApp Cloud API</h3>
              <p class="integration-desc">Official BSP Tier-1 messaging routing, interactive product catalogs &amp; OTP verification.</p>
            </div>
          </div>

          <div class="integration-item">
            <div class="integration-icon-wrap ig">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
            <div class="integration-info">
              <h3 class="integration-name">Instagram Direct &amp; Reels</h3>
              <p class="integration-desc">Automated DM replies, comment-to-DM triggers, story mention rewards &amp; live sales.</p>
            </div>
          </div>

          <div class="integration-item">
            <div class="integration-icon-wrap shopify">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div class="integration-info">
              <h3 class="integration-name">Shopify &amp; WooCommerce</h3>
              <p class="integration-desc">Real-time 2-way product catalog ingestion, inventory variant sync &amp; discount rule matching.</p>
            </div>
          </div>

          <div class="integration-item">
            <div class="integration-icon-wrap stripe">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            </div>
            <div class="integration-info">
              <h3 class="integration-name">Stripe &amp; In-Chat Checkout</h3>
              <p class="integration-desc">Instant 1-click checkout payment links, multi-currency settlement &amp; COD confirmation.</p>
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
  title: 'Product & Features - Clickify Mate | Autonomous Social Commerce',
  meta: [
    {
      name: 'description',
      content: 'Explore Clickify Mate platform features: Multi-Agent AI Swarms, WhatsApp Catalog Automation, Instagram Direct Sales, and Real-Time Vector Catalog Sync.'
    }
  ]
})

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
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
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
  position: relative;
}

.page-hero-subtitle {
  font-size: 16px;
  line-height: 1.6;
  color: #5C4560;
  max-width: 720px;
  margin: 0;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
}

.btn-primary-glow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #341F37 0%, #543359 50%, #7B4C85 100%);
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 10px 24px rgba(52, 31, 55, 0.22);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.btn-primary-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(52, 31, 55, 0.32);
  filter: brightness(1.08);
}

.btn-secondary-glass {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 26px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  color: #341F37;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(84, 51, 89, 0.16);
  transition: all 0.25s ease;
  cursor: pointer;
}

.btn-secondary-glass:hover {
  background: #FFFFFF;
  border-color: #7B4C85;
  color: #7B4C85;
  transform: translateY(-2px);
}

/* Features Grid Section */
.features-grid-section {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.section-title-wrap {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.section-heading {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0;
}

.section-subheading {
  font-size: 15px;
  color: #6A536F;
  max-width: 600px;
  margin: 0;
  line-height: 1.5;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.liquid-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 28px 24px 22px;
  box-shadow: 0 16px 36px 0 rgba(84, 51, 89, 0.05),
              inset 0 1px 2px 0 rgba(255, 255, 255, 1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;
}

.liquid-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(123, 76, 133, 0.3);
  box-shadow: 0 20px 40px 0 rgba(84, 51, 89, 0.1);
}

.card-icon-bubble {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(123, 76, 133, 0.12) 0%, rgba(52, 31, 55, 0.06) 100%);
  border: 1px solid rgba(123, 76, 133, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7B4C85;
}

.card-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #7B4C85;
}

.card-title {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #341F37;
  margin: 0;
  line-height: 1.3;
}

.card-desc {
  font-size: 14px;
  line-height: 1.55;
  color: #5C4560;
  margin: 0;
  flex: 1;
}

.card-metric-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: rgba(123, 76, 133, 0.06);
  border-radius: 10px;
  border: 1px solid rgba(123, 76, 133, 0.12);
  margin-top: 6px;
}

.metric-num {
  font-size: 14px;
  font-weight: 800;
  color: #7B4C85;
}

.metric-text {
  font-size: 12px;
  font-weight: 600;
  color: #5C4560;
}

/* Architecture Section */
.architecture-section {
  width: 100%;
}

.arch-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(245, 240, 250, 0.75) 100%);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 42px 40px;
  box-shadow: 0 20px 48px 0 rgba(84, 51, 89, 0.06);
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.arch-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.arch-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #7B4C85;
  text-transform: uppercase;
}

.arch-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0;
}

.arch-desc {
  font-size: 15px;
  color: #5C4560;
  margin: 0;
}

.arch-steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.arch-step {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 16px;
}

.step-num {
  font-size: 22px;
  font-weight: 900;
  color: #7B4C85;
  opacity: 0.5;
  line-height: 1;
}

.step-head {
  font-size: 16px;
  font-weight: 700;
  color: #341F37;
  margin: 0;
}

.step-body {
  font-size: 13.5px;
  line-height: 1.5;
  color: #5C4560;
  margin: 0;
}

/* Integrations Section */
.integrations-section {
  display: flex;
  flex-direction: column;
  gap: 36px;
  width: 100%;
}

.integrations-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.integration-item {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  box-shadow: 0 16px 36px 0 rgba(84, 51, 89, 0.05);
  transition: all 0.3s ease;
}

.integration-item:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(123, 76, 133, 0.3);
}

.integration-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.integration-icon-wrap.meta {
  background: linear-gradient(135deg, rgba(123, 76, 133, 0.12) 0%, rgba(52, 31, 55, 0.06) 100%);
  border: 1px solid rgba(123, 76, 133, 0.15);
  color: #7B4C85;
}

.integration-icon-wrap.ig {
  background: linear-gradient(135deg, rgba(123, 76, 133, 0.12) 0%, rgba(52, 31, 55, 0.06) 100%);
  border: 1px solid rgba(123, 76, 133, 0.15);
  color: #7B4C85;
}

.integration-icon-wrap.shopify {
  background: linear-gradient(135deg, rgba(123, 76, 133, 0.12) 0%, rgba(52, 31, 55, 0.06) 100%);
  border: 1px solid rgba(123, 76, 133, 0.15);
  color: #7B4C85;
}

.integration-icon-wrap.stripe {
  background: linear-gradient(135deg, rgba(123, 76, 133, 0.12) 0%, rgba(52, 31, 55, 0.06) 100%);
  border: 1px solid rgba(123, 76, 133, 0.15);
  color: #7B4C85;
}

.integration-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.integration-name {
  font-size: 17px;
  font-weight: 700;
  color: #341F37;
  margin: 0;
}

.integration-desc {
  font-size: 13.5px;
  line-height: 1.5;
  color: #5C4560;
  margin: 0;
}

@media (max-width: 1024px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .arch-steps-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .integrations-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-main-content {
    padding: 72px 10px 36px;
    gap: 32px;
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
  .hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }
  .btn-primary-glow,
  .btn-secondary-glass {
    width: 100%;
    font-size: 15px;
    padding: 12px 18px;
    box-sizing: border-box;
  }
  .section-heading {
    font-size: 24px;
    line-height: 1.25;
  }
  .section-subheading {
    font-size: 14px;
    line-height: 1.45;
  }
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .liquid-card {
    padding: 16px 12px;
    border-radius: 16px;
    gap: 10px;
  }
  .card-icon-bubble {
    width: 40px;
    height: 40px;
  }
  .card-title {
    font-size: 16.5px;
  }
  .card-desc {
    font-size: 13.5px;
  }
  .arch-card {
    padding: 18px 12px;
    border-radius: 18px;
    gap: 16px;
  }
  .arch-title {
    font-size: 22px;
  }
  .arch-desc {
    font-size: 13.5px;
  }
  .arch-steps-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .arch-step {
    padding: 12px 10px;
    border-radius: 12px;
  }
  .step-head {
    font-size: 14.5px;
  }
  .step-body {
    font-size: 13px;
  }
  .integrations-section {
    gap: 18px;
  }
  .integrations-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .integration-item {
    padding: 14px 12px;
    border-radius: 16px;
    gap: 12px;
  }
  .integration-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }
  .integration-name {
    font-size: 15.5px;
  }
  .integration-desc {
    font-size: 13px;
  }
}
</style>
