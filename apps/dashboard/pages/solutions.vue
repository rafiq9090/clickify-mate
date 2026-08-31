<template>
  <div class="cicada-page-wrapper">
    <!-- Mobile Navigation Drawer -->
    <CicadaDrawerMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <!-- Navbar -->
    <CicadaNavbar @toggle-menu="isMenuOpen = !isMenuOpen" />

    <!-- Solutions Main Content -->
    <main class="page-main-content">
      <!-- Hero Header -->
      <section class="page-hero-section">
       
        <h1 class="page-hero-title">
          Engineered to Drive Revenue Across <span>Every Social Channel.</span>
        </h1>
        <p class="page-hero-subtitle">
          Whether you are an emerging Instagram brand or an enterprise retailer processing 100,000+ monthly DMs, Clickify Mate scales your customer interactions into automated checkouts.
        </p>
        <div class="hero-actions">
          <NuxtLink to="/dashboard" class="btn-primary-glow">
            <span>Start Free Trial</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </NuxtLink>
          <NuxtLink to="/contact" class="btn-secondary-glass">
            Talk to an Enterprise Architect
          </NuxtLink>
        </div>
      </section>

      <!-- Solutions In-Depth Grid -->
      <section class="solutions-grid-section">
        <!-- Solution 1: Social Sellers & Comment to DM -->
        <div id="social-sellers" class="solution-card">
          <div class="solution-meta">
            <span class="sol-badge">FOR SOCIAL SELLERS &amp; CREATORS</span>
            <h2 id="comment-to-dm" class="sol-title">Comment-to-DM Automated Selling</h2>
            <p class="sol-desc">
              Transform viral social posts into automated checkout funnels. Whenever a customer comments "PRICE", "BUY", or custom keywords, Clickify Mate instantly sends a tailored DM with product details, personal discounts, and an in-chat checkout link.
            </p>
            <ul class="sol-features">
              <li>Instant trigger response within 1.2 seconds of comment publication</li>
              <li>Story mention auto-reply with personalized welcome vouchers</li>
              <li>Automated follow-ups on abandoned in-chat carts</li>
            </ul>
            <div class="sol-metric">
              <span class="m-val">4.8x</span>
              <span class="m-lbl">Higher DM Engagement</span>
            </div>
          </div>
          <div class="solution-preview-box">
            <div class="chat-simulation-card">
              <div class="chat-sim-header">
                <span>Instagram Direct Automation</span>
              </div>
              <div class="chat-bubble user">"How much is the silk lavender jacket?"</div>
              <div class="chat-bubble bot">
                <span>"Hey Sarah! The Lavender Silk Jacket is $89 (in stock in S, M, L). Here's a 10% instant VIP voucher!"</span>
                <div class="chat-cta-chip">Tap to Purchase ($80.10)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Solution 2: WhatsApp Storefronts & COD Verification -->
        <div id="whatsapp-storefronts" class="solution-card reverse">
          <div class="solution-meta">
            <span class="sol-badge">FOR DIRECT-TO-CONSUMER E-COMMERCE</span>
            <h2 id="cod-verification" class="sol-title">WhatsApp Storefronts &amp; Cash-on-Delivery Engine</h2>
            <p class="sol-desc">
              Power your entire store inside WhatsApp with official Meta Cloud API templates, native interactive product catalogs, address collection, and automated OTP phone confirmation for zero fraudulent COD returns.
            </p>
            <ul class="sol-features">
              <li>Direct sync with Shopify &amp; WooCommerce warehouse catalogs</li>
              <li>Automated COD phone number verification &amp; address standardization</li>
              <li>Instant courier booking &amp; real-time tracking updates via WhatsApp</li>
            </ul>
            <div class="sol-metric">
              <span class="m-val">-64%</span>
              <span class="m-lbl">Reduction in Return-to-Origin (RTO)</span>
            </div>
          </div>
          <div class="solution-preview-box">
            <div class="chat-simulation-card">
              <div class="chat-sim-header">
                <span>WhatsApp Cloud API Storefront</span>
              </div>
              <div class="chat-bubble user">"I'd like to order 2 pairs in size 42."</div>
              <div class="chat-bubble bot">
                <span>"Order draft created! Total: $140 with Free Delivery. Please confirm your delivery address below."</span>
                <div class="chat-cta-chip">Confirm Order &amp; Dispatch</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Solution 3: Enterprise Retail Swarms -->
        <div id="enterprise" class="solution-card">
          <div class="solution-meta">
            <span class="sol-badge">FOR ENTERPRISE RETAIL BRANDS</span>
            <h2 class="sol-title">Autonomous Multi-Agent Customer Care Swarms</h2>
            <p class="sol-desc">
              Replace rigid chatbots with intelligent swarms that understand customer sentiment, cross-sell relevant accessories, handle return policies gracefully, and escalate high-value VIP inquiries to human agents seamlessly.
            </p>
            <ul class="sol-features">
              <li>Zero-latency sub-agent delegation with specialized memory context</li>
              <li>Enterprise SOC2 Type II security and GDPR customer data isolation</li>
              <li>Custom enterprise SLA with dedicated account manager and 99.99% uptime</li>
            </ul>
            <div class="sol-metric">
              <span class="m-val">&lt; 400ms</span>
              <span class="m-lbl">Median Swarm Response Time</span>
            </div>
          </div>
          <div class="solution-preview-box">
            <div class="chat-simulation-card">
              <div class="chat-sim-header">
                <span>Enterprise Swarm Orchestration</span>
              </div>
              <div class="chat-bubble bot">
                <span>"Agent [Sales-Specialist-04] matched user preference for premium leather boots. Order attributed to Campaign #SummerPromo."</span>
              </div>
              <div class="chat-bubble bot alt">
                <span>"Status: Cart settled via Stripe. Courier tracking generated #TRK-98214."</span>
              </div>
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
  title: 'Solutions & Use Cases - Clickify Mate | Social Commerce AI',
  meta: [
    {
      name: 'description',
      content: 'Tailored AI workflows for social sellers, DTC e-commerce brands, WhatsApp storefronts, and enterprise multi-agent customer care swarms.'
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

/* Solutions Grid Section */
.solutions-grid-section {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.solution-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 36px;
  align-items: center;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 36px;
  box-shadow: 0 16px 36px 0 rgba(84, 51, 89, 0.05),
              inset 0 1px 2px 0 rgba(255, 255, 255, 1);
}

.solution-card.reverse {
  grid-template-columns: 1fr 1.2fr;
}
.solution-card.reverse .solution-meta {
  order: 2;
}
.solution-card.reverse .solution-preview-box {
  order: 1;
}

.solution-meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sol-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #7B4C85;
  text-transform: uppercase;
}

.sol-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: #341F37;
  margin: 0;
  line-height: 1.25;
}

.sol-desc {
  font-size: 15px;
  line-height: 1.6;
  color: #5C4560;
  margin: 0;
}

.sol-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sol-features li {
  font-size: 14px;
  color: #4A334E;
  position: relative;
  padding-left: 24px;
  line-height: 1.45;
}


.sol-metric {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(123, 76, 133, 0.06);
  border: 1px solid rgba(123, 76, 133, 0.15);
  border-radius: 10px;
  width: fit-content;
  margin-top: 6px;
}

.m-val {
  font-size: 18px;
  font-weight: 900;
  color: #7B4C85;
}

.m-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #5C4560;
}

/* Chat simulation mockup */
.solution-preview-box {
  width: 100%;
}

.chat-simulation-card {
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.15);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 12px 28px 0 rgba(84, 51, 89, 0.06);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-sim-header {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #7B4C85;
  border-bottom: 1px solid rgba(84, 51, 89, 0.08);
  padding-bottom: 10px;
}

.sim-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7B4C85;
}
.sim-dot.green { background: #10B981; }
.sim-dot.purple { background: #935B9E; }

.chat-bubble {
  padding: 14px 18px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.5;
  max-width: 88%;
}

.chat-bubble.user {
  align-self: flex-end;
  background: #341F37;
  color: #FFFFFF;
  border-bottom-right-radius: 4px;
}

.chat-bubble.bot {
  align-self: flex-start;
  background: #FAF8FC;
  border: 1px solid rgba(84, 51, 89, 0.12);
  color: #341F37;
  border-bottom-left-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-bubble.bot.alt {
  background: rgba(123, 76, 133, 0.06);
  border-color: rgba(123, 76, 133, 0.2);
  color: #582C62;
  font-weight: 600;
}

.chat-cta-chip {
  align-self: flex-start;
  background: linear-gradient(135deg, #7B4C85 0%, #341F37 100%);
  color: #FFFFFF;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .solution-card, .solution-card.reverse {
    grid-template-columns: 1fr;
  }
  .solution-card.reverse .solution-meta {
    order: 1;
  }
  .solution-card.reverse .solution-preview-box {
    order: 2;
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
  .solution-card,
  .solution-card.reverse {
    padding: 16px 12px;
    border-radius: 18px;
    gap: 16px;
  }
  .sol-title {
    font-size: 22px;
    line-height: 1.25;
  }
  .sol-desc {
    font-size: 13.5px;
    line-height: 1.45;
  }
  .sol-features li {
    font-size: 13px;
  }
  .chat-simulation-card {
    padding: 14px 10px;
    border-radius: 14px;
    gap: 10px;
  }
  .chat-bubble {
    font-size: 13px;
    padding: 8px 12px;
  }
}
</style>
