<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
const closeMenu = () => {
  isMenuOpen.value = false
}

const openFaqIdx = ref<number | null>(0)
const toggleFaq = (idx: number) => {
  openFaqIdx.value = openFaqIdx.value === idx ? null : idx
}

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const faqs = [
  {
    q: 'How does Clickify Mate automate DM sales on WhatsApp and Instagram?',
    a: 'Clickify Mate listens to incoming DMs and post comments via official Meta Graph APIs. Autonomous AI swarms analyze buyer intent, query real-time product stock, answer inquiries, and generate instant 1-click checkout links or automated COD confirmation.'
  },
  {
    q: 'Does Clickify Mate sync with my Shopify or WooCommerce catalog?',
    a: 'Yes. Clickify Mate automatically ingests your entire product catalog, inventory variants, promotional discounts, and return policies using semantic vector embeddings for real-time accuracy.'
  },
  {
    q: 'Is Clickify Mate compliant with Meta\'s official API terms?',
    a: '100%. Clickify Mate routes all WhatsApp Business and Instagram Direct messages through official Meta Cloud API channels with certified BSP tier routing, ensuring zero account bans or template delivery issues.'
  },
  {
    q: 'How do multi-agent swarms handle custom customer inquiries?',
    a: 'Our swarm delegates specialized tasks: one agent recommends products, another calculates bundle discounts, and another verifies delivery addresses. If human escalation is needed, your team receives full chat context.'
  },
  {
    q: 'Can I test Clickify Mate before committing?',
    a: 'Yes, you can start a free trial with full access to the Command Console, simulated test chat channels, and pre-built sales swarms.'
  }
]
</script>

<template>
  <div class="mobile-landing-root">
    <!-- Clean Mobile Navigation Dropdown Modal -->
    <Transition name="mobile-menu-slide">
      <div v-if="isMenuOpen" class="mobile-nav-modal" @click.self="closeMenu">
        <div class="mobile-nav-card">
          <!-- Menu Header -->
          <div class="mobile-nav-header">
            <NuxtLink to="/" class="mobile-brand" @click="closeMenu">
              <span>Clickify Mate</span><span class="brand-dot">.</span>
            </NuxtLink>
            <button type="button" class="mobile-menu-close-btn" aria-label="Close Navigation Menu" @click="closeMenu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Clean Navigation Links -->
          <nav class="mobile-nav-links">
            <NuxtLink to="/features" class="mobile-nav-link" @click="closeMenu">
              <div class="nav-link-main">
                <span class="nav-link-title">Platform &amp; Features</span>
                <span class="nav-link-sub">Multi-agent swarms &amp; catalog sync</span>
              </div>
              <span class="nav-arrow">→</span>
            </NuxtLink>

            <NuxtLink to="/solutions" class="mobile-nav-link" @click="closeMenu">
              <div class="nav-link-main">
                <span class="nav-link-title">Solutions</span>
                <span class="nav-link-sub">Social sellers, creators &amp; enterprise</span>
              </div>
              <span class="nav-arrow">→</span>
            </NuxtLink>

            <NuxtLink to="/features#integrations" class="mobile-nav-link" @click="closeMenu">
              <div class="nav-link-main">
                <span class="nav-link-title">Integrations</span>
                <span class="nav-link-sub">WhatsApp, Instagram &amp; Shopify</span>
              </div>
              <span class="nav-arrow">→</span>
            </NuxtLink>

            <NuxtLink to="/contact" class="mobile-nav-link" @click="closeMenu">
              <div class="nav-link-main">
                <span class="nav-link-title">Contact Support</span>
                <span class="nav-link-sub">Sales inquiries &amp; live onboarding</span>
              </div>
              <span class="nav-arrow">→</span>
            </NuxtLink>
          </nav>

          <!-- Action Buttons -->
          <div class="mobile-nav-actions">
            <NuxtLink to="/dashboard" class="mobile-menu-btn-primary" @click="closeMenu">
              <span>Get Started Free</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </NuxtLink>
            <NuxtLink to="/login" class="mobile-menu-btn-secondary" @click="closeMenu">
              Sign In to Console
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Ambient Top Background Lighting -->
    <div class="mobile-ambient-glow" aria-hidden="true">
      <div class="mobile-orb orb-1"></div>
      <div class="mobile-orb orb-2"></div>
    </div>

    <!-- Mobile Header -->
    <header class="mobile-header">
      <NuxtLink to="/" class="mobile-brand">
        <span>Clickify Mate</span><span class="brand-dot">.</span>
      </NuxtLink>

      <button type="button" class="mobile-hamburger-btn" aria-label="Open Navigation Menu" @click="toggleMenu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </header>

    <main class="mobile-content">
      <!-- Hero Section with Animated Tree Background -->
      <section class="mobile-hero">
        <!-- Tree Video Background -->
        <div class="mobile-hero-bg-tree" aria-hidden="true">
          <video autoplay muted loop playsinline class="mobile-tree-video">
            <source src="/videos/cicada_tree.mov" type='video/mp4; codecs="hvc1"'>
            <source src="/videos/cicada_tree.webm" type="video/webm">
          </video>
          <div class="tree-bg-overlay"></div>
        </div>

        <!-- Hero Content Layer -->
        <div class="mobile-hero-content">
          <div class="mobile-badge">
            <span class="live-pulse"></span>
            <span>AUTONOMOUS SOCIAL COMMERCE AI</span>
          </div>

          <h1 class="mobile-hero-title">
            Autonomous selling for <span>social commerce.</span>
          </h1>

          <p class="mobile-hero-subtitle">
            Turn customer DMs and comments into automated checkouts 24/7 across WhatsApp, Instagram, and Facebook with real-time catalog sync.
          </p>

          <div class="mobile-hero-buttons">
            <NuxtLink to="/dashboard" class="mobile-btn-primary">
              <span>Start Free Trial</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </NuxtLink>
            <NuxtLink to="/login" class="mobile-btn-secondary">
              Request Demo
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Live Telemetry Section -->
      <section class="mobile-section">
        <div class="mobile-card mobile-telemetry-card">
          <div class="mobile-card-header">
            <span class="card-badge">LIVE TELEMETRY COCKPIT</span>
            <h2 class="card-title">Proven Velocity Across Millions of Conversations</h2>
            <p class="card-desc">Autonomous multi-agent swarms running 24/7 with zero human intervention required.</p>
          </div>

          <div class="mobile-stats-grid">
            <div class="stat-box">
              <div class="stat-val">99.99%</div>
              <div class="stat-label">Delivery SLA</div>
              <div class="stat-sub">Direct Tier-1 Meta Graph API routing</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">&lt;380ms</div>
              <div class="stat-label">Response Time</div>
              <div class="stat-sub">Zero shopper drop-off on high intent DMs</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">4.8x</div>
              <div class="stat-label">ROAS Lift</div>
              <div class="stat-sub">Measured across social ad campaigns</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">+42%</div>
              <div class="stat-label">In-Chat Checkout</div>
              <div class="stat-sub">Instant cart generation & COD verification</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Core Features Grid -->
      <section class="mobile-section">
        <div class="mobile-section-header">
          <span class="card-badge">SWARM ARCHITECTURE</span>
          <h2 class="card-title">Specialized AI Specialists for Every Commerce Step</h2>
        </div>

        <div class="mobile-feature-list">
          <div class="mobile-card feature-item">
            <div class="feature-icon">
              <!-- whatsapp icon svg  center-->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6.06-6.06 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.08 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-.85a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <h3 class="feature-title">WhatsApp &amp; Instagram Direct AI</h3>
            <p class="feature-desc">Official Meta BSP integration that monitors customer DMs, stories, and post comments with certified zero ban risk.</p>
          </div>

          <div class="mobile-card feature-item">
            <div class="feature-icon">
              <!-- cart icon svg -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </div>
            <h3 class="feature-title">Real-Time Vector Catalog Search</h3>
            <p class="feature-desc">Instantly ingests Shopify and WooCommerce SKUs, live stock levels, and promo codes for accurate 1-click recommendations.</p>
          </div>

          <div class="mobile-card feature-item">
            <div class="feature-icon">
              <!-- secure icon svg -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="13" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 class="feature-title">1-Click Checkout &amp; COD Verification</h3>
            <p class="feature-desc">Generates secure Stripe/payment links or performs automated phone confirmation for cash-on-delivery orders.</p>
          </div>
        </div>
      </section>

      <!-- 4-Step Workflow -->
      <section class="mobile-section">
        <div class="mobile-card mobile-workflow-card">
          <div class="mobile-card-header">
            <span class="card-badge">SEAMLESS ONBOARDING</span>
            <h2 class="card-title">From Connect to Full Autonomous Selling in 4 Steps</h2>
          </div>

          <div class="mobile-steps-list">
            <div class="step-row">
              <div class="step-num">01</div>
              <div class="step-info">
                <h4 class="step-heading">Connect Social Channels</h4>
                <p class="step-text">1-click official Meta authorization for WhatsApp, Instagram, and Facebook.</p>
              </div>
            </div>

            <div class="step-row">
              <div class="step-num">02</div>
              <div class="step-info">
                <h4 class="step-heading">Sync Product Knowledge</h4>
                <p class="step-text">Ingest Shopify or WooCommerce catalogs into real-time vector embeddings.</p>
              </div>
            </div>

            <div class="step-row">
              <div class="step-num">03</div>
              <div class="step-info">
                <h4 class="step-heading">Activate AI Sales Swarm</h4>
                <p class="step-text">Assign sub-agents to consultative sales, discount rules, and buyer inquiries.</p>
              </div>
            </div>

            <div class="step-row">
              <div class="step-num">04</div>
              <div class="step-info">
                <h4 class="step-heading">Automate Checkout &amp; Delivery</h4>
                <p class="step-text">Generate payment links or automated COD confirmation with courier dispatch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Integrations Ecosystem -->
      <section class="mobile-section">
        <div class="mobile-section-header">
          <span class="card-badge">OMNICHANNEL ECOSYSTEM</span>
          <h2 class="card-title">Natively Connected to Your Modern Stack</h2>
        </div>

        <div class="mobile-integrations-grid">
          <div class="integration-chip">
            <span class="chip-name">WhatsApp Cloud API</span>
            <span class="chip-sub">Official Meta BSP</span>
          </div>
          <div class="integration-chip">
            <span class="chip-name">Instagram Direct</span>
            <span class="chip-sub">Story &amp; Post AI</span>
          </div>
          <div class="integration-chip">
            <span class="chip-name">Facebook Messenger</span>
            <span class="chip-sub">Comment Auto-Reply</span>
          </div>
          <div class="integration-chip">
            <span class="chip-name">Shopify Store</span>
            <span class="chip-sub">Vector Sync</span>
          </div>
          <div class="integration-chip">
            <span class="chip-name">WooCommerce</span>
            <span class="chip-sub">Order Sync</span>
          </div>
          <div class="integration-chip">
            <span class="chip-name">Stripe &amp; In-Chat Pay</span>
            <span class="chip-sub">1-Click Checkout</span>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="mobile-section">
        <div class="mobile-section-header">
          <span class="card-badge">FREQUENTLY ASKED QUESTIONS</span>
          <h2 class="card-title">Clear Answers on Autonomous Social Commerce</h2>
        </div>

        <div class="mobile-faq-list">
          <div 
            v-for="(item, idx) in faqs" 
            :key="idx"
            class="mobile-faq-card"
            :class="{ active: openFaqIdx === idx }"
            @click="toggleFaq(idx)"
          >
            <div class="faq-row-title">
              <h3 class="faq-q-text">{{ item.q }}</h3>
              <span class="faq-icon">{{ openFaqIdx === idx ? '−' : '+' }}</span>
            </div>
            <div v-show="openFaqIdx === idx" class="faq-body-text">
              <p>{{ item.a }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer Section -->
      <footer class="mobile-footer">
        <!-- CTA Banner -->
        <div class="mobile-card footer-cta-box">
          <span class="card-badge">GET STARTED TODAY</span>
          <h2 class="footer-cta-head">Ready to unlock autonomous selling for your business?</h2>
          <p class="footer-cta-p">Deploy AI agents across WhatsApp, Instagram, and Facebook in minutes.</p>
          <div class="footer-cta-btns">
            <NuxtLink to="/dashboard" class="mobile-btn-primary">Start Free Trial</NuxtLink>
            <NuxtLink to="/login" class="mobile-btn-secondary">Request Demo</NuxtLink>
          </div>
        </div>

        <!-- Main Footer Links Grid -->
        <div class="mobile-card footer-links-box">
          <div class="footer-brand-block">
            <div class="footer-brand-title">Clickify Mate<span>.</span></div>
            <p class="footer-brand-p">Autonomous conversational AI infrastructure built for social sellers, creators, and modern omnichannel e-commerce brands.</p>
            <div class="footer-badges-row">
              <span class="f-badge">SOC2 Type II</span>
              <span class="f-badge">GDPR Compliant</span>
              <span class="f-badge">Meta Official API</span>
            </div>
          </div>

          <div class="footer-nav-grid">
            <div class="footer-nav-col">
              <h4 class="footer-col-title">Platform</h4>
              <ul class="footer-ul">
                <li><NuxtLink to="/features#overview">Overview</NuxtLink></li>
                <li><NuxtLink to="/features#swarms">AI Swarms</NuxtLink></li>
                <li><NuxtLink to="/features#whatsapp">WhatsApp Engine</NuxtLink></li>
                <li><NuxtLink to="/features#instagram">Instagram Direct</NuxtLink></li>
              </ul>
            </div>
            <div class="footer-nav-col">
              <h4 class="footer-col-title">Solutions</h4>
              <ul class="footer-ul">
                <li><NuxtLink to="/solutions#social-sellers">Social Sellers</NuxtLink></li>
                <li><NuxtLink to="/solutions#comment-to-dm">Comment to DM</NuxtLink></li>
                <li><NuxtLink to="/solutions#whatsapp-storefronts">Storefronts</NuxtLink></li>
                <li><NuxtLink to="/solutions#cod-verification">COD Verification</NuxtLink></li>
              </ul>
            </div>
            <div class="footer-nav-col">
              <h4 class="footer-col-title">Company</h4>
              <ul class="footer-ul">
                <li><NuxtLink to="/contact">Contact Support</NuxtLink></li>
                <li><NuxtLink to="/login">Sign In</NuxtLink></li>
                <li><NuxtLink to="/privacy">Privacy Policy</NuxtLink></li>
                <li><NuxtLink to="/terms">Terms of Service</NuxtLink></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom-bar">
            <span>&copy; {{ new Date().getFullYear() }} Clickify Mate Inc.</span>
            <button type="button" class="mobile-back-top" @click="scrollToTop">
              <span>Back to top ↑</span>
            </button>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700;800&display=swap');

.mobile-landing-root {
  width: 100%;
  min-height: 100vh;
  background: #E0D8EB;
  font-family: 'Work Sans', sans-serif;
  color: #341F37;
  position: relative;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Ambient glow */
.mobile-ambient-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 100vw;
  height: 450px;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.mobile-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
}

.orb-1 {
  top: -40px;
  left: 0;
  width: 220px;
  height: 220px;
  background: #D8CEE6;
}

.orb-2 {
  top: 100px;
  right: 0;
  width: 200px;
  height: 200px;
  background: #F9F5FF;
}

/* Mobile Navigation Dropdown Modal */
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
  flex-direction: column;
  padding: 14px;
  box-sizing: border-box;
  overflow-y: auto;
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
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(84, 51, 89, 0.08);
  padding-bottom: 14px;
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

/* Header */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 56px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  background: rgba(250, 248, 252, 0.95);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(123, 76, 133, 0.12);
  box-shadow: 0 4px 20px rgba(52, 31, 55, 0.06);
  box-sizing: border-box;
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

.mobile-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-cta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #341F37 0%, #543359 50%, #7B4C85 100%);
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(52, 31, 55, 0.2);
}

.mobile-hamburger-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(52, 31, 55, 0.12);
  color: #341F37;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

/* Content */
.mobile-content {
  position: relative;
  z-index: 1;
  padding: 16px;
  padding-top: 72px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  box-sizing: border-box;
}

/* Hero with Animated Tree Background */
.mobile-hero {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  min-height: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 16px 30px;
  box-sizing: border-box;
}

.mobile-hero-bg-tree {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-tree-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center bottom;
  opacity: 0.38;
  mix-blend-mode: multiply;
  filter: saturate(120%) contrast(105%);
}


.mobile-hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  width: 100%;
  max-width: 340px;
}

.mobile-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #7B4C85;
}

/* .live-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px #10B981;
} */

.mobile-hero-title {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: #341F37;
  margin: 0;
}

.mobile-hero-title span {
  color: #7B4C85;
}

.mobile-hero-subtitle {
  font-size: 15px;
  line-height: 1.5;
  color: #2b212d;
  font-weight: 400;
  margin: 0;
  max-width: 340px;
}

.mobile-hero-buttons {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
  margin-top: 4px;
}

.mobile-btn-primary {
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
}

.mobile-btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 13px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.85);
  color: #341F37;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(84, 51, 89, 0.15);
}

.video-overlay-badge {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(39, 22, 42, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 9999px;
  color: #FAF8FC;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.sub-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
}

/* Shared Cards */
.mobile-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-section-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.mobile-card {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.2);
  border-radius: 24px;
  padding: 22px 18px;
  box-shadow: 0 16px 40px -10px rgba(52, 31, 55, 0.08);
  box-sizing: border-box;
}

.card-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #7B4C85;
  text-transform: uppercase;
}

.card-title {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 4px 0 0 0;
}

.card-desc {
  font-size: 14px;
  line-height: 1.45;
  color: #5C4560;
  margin: 6px 0 0 0;
}

/* Telemetry Stats Grid */
.mobile-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 18px;
}

.stat-box {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-val {
  font-size: 24px;
  font-weight: 900;
  color: #7B4C85;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  font-weight: 700;
  color: #341F37;
}

.stat-sub {
  font-size: 11px;
  line-height: 1.35;
  color: #6E5373;
}

/* Feature Cards */
.mobile-feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature-icon {
  font-size: 24px;
  margin-bottom: 2px;
}

.feature-title {
  font-size: 17px;
  font-weight: 700;
  color: #341F37;
  margin: 0;
}

.feature-desc {
  font-size: 13.5px;
  line-height: 1.45;
  color: #5C4560;
  margin: 0;
}

/* Workflow Steps */
.mobile-steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.step-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.95);
  padding: 14px 12px;
  border-radius: 16px;
}

.step-num {
  font-size: 16px;
  font-weight: 900;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.1);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.step-heading {
  font-size: 15px;
  font-weight: 700;
  color: #341F37;
  margin: 0;
}

.step-text {
  font-size: 13px;
  line-height: 1.4;
  color: #5C4560;
  margin: 0;
}

/* Integrations Grid */
.mobile-integrations-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.integration-chip {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chip-name {
  font-size: 13px;
  font-weight: 700;
  color: #341F37;
}

.chip-sub {
  font-size: 11px;
  color: #6E5373;
}

/* FAQ */
.mobile-faq-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-faq-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 14px 16px;
  cursor: pointer;
}

.mobile-faq-card.active {
  background: #FFFFFF;
  border-color: rgba(123, 76, 133, 0.3);
  box-shadow: 0 6px 18px rgba(84, 51, 89, 0.06);
}

.faq-row-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.faq-q-text {
  font-size: 14.5px;
  font-weight: 700;
  color: #341F37;
  margin: 0;
  line-height: 1.3;
}

.faq-icon {
  font-size: 18px;
  font-weight: 600;
  color: #7B4C85;
}

.faq-body-text {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(84, 51, 89, 0.08);
}

.faq-body-text p {
  font-size: 13px;
  line-height: 1.5;
  color: #5C4560;
  margin: 0;
}

/* Footer */
.mobile-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.footer-cta-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  align-items: center;
}

.footer-cta-head {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.25;
  color: #341F37;
  margin: 0;
}

.footer-cta-p {
  font-size: 13.5px;
  line-height: 1.4;
  color: #5C4560;
  margin: 0;
}

.footer-cta-btns {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  margin-top: 4px;
}

.footer-links-box {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.footer-brand-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-bottom: 1px solid rgba(84, 51, 89, 0.08);
  padding-bottom: 14px;
}

.footer-brand-title {
  font-size: 20px;
  font-weight: 800;
  color: #341F37;
}

.footer-brand-p {
  font-size: 13px;
  line-height: 1.4;
  color: #5C4560;
  margin: 0;
}

.footer-badges-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.f-badge {
  font-size: 10.5px;
  font-weight: 600;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
}

.footer-nav-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 12px;
}

.footer-col-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #7B4C85;
  margin: 0 0 6px 0;
}

.footer-ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.footer-ul a {
  font-size: 13px;
  color: #4A334E;
  text-decoration: none;
}

.footer-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(84, 51, 89, 0.08);
  padding-top: 12px;
  font-size: 12px;
  color: #7A627E;
}

.mobile-back-top {
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #7B4C85;
  cursor: pointer;
  padding: 0;
}

/* ==========================================================================
   TABLET & FOLDABLE RESPONSIVE STYLES (640px - 1024px)
   ========================================================================== */
@media (min-width: 640px) {
  .mobile-content {
    max-width: 820px;
    margin: 0 auto;
    padding: 24px 20px;
    padding-top: 80px;
    gap: 32px;
  }

  .mobile-header {
    height: 60px;
    padding: 0 24px;
  }

  .mobile-nav-modal {
    padding: 24px;
  }

  .mobile-nav-card {
    max-width: 480px;
    margin: 0 auto;
  }

  .mobile-hero {
    min-height: 480px;
    padding: 48px 28px;
    border-radius: 32px;
  }

  .mobile-hero-content {
    max-width: 580px;
    gap: 18px;
  }

  .mobile-hero-title {
    font-size: 40px;
    line-height: 1.15;
  }

  .mobile-hero-subtitle {
    font-size: 16px;
    max-width: 500px;
    line-height: 1.55;
  }

  .mobile-hero-buttons {
    flex-direction: row;
    justify-content: center;
    width: auto;
    gap: 14px;
  }

  .mobile-btn-primary, .mobile-btn-secondary {
    padding: 13px 26px;
    font-size: 14.5px;
  }

  .mobile-card {
    padding: 28px 24px;
    border-radius: 28px;
  }

  .card-title {
    font-size: 25px;
  }

  .mobile-stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .stat-box {
    padding: 16px 12px;
  }

  .stat-val {
    font-size: 26px;
  }

  .mobile-feature-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .mobile-steps-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .step-row {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 14px;
  }

  .mobile-integrations-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .footer-nav-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}

@media (min-width: 768px) {
  .mobile-content {
    max-width: 920px;
    padding: 28px 24px;
    padding-top: 88px;
    gap: 36px;
  }

  .mobile-hero {
    min-height: 520px;
    padding: 56px 36px;
    border-radius: 36px;
  }

  .mobile-hero-content {
    max-width: 660px;
    gap: 22px;
  }

  .mobile-hero-title {
    font-size: 46px;
    line-height: 1.15;
  }

  .mobile-hero-subtitle {
    font-size: 17px;
    max-width: 560px;
  }

  .mobile-btn-primary, .mobile-btn-secondary {
    padding: 14px 30px;
    font-size: 15px;
  }

  .card-title {
    font-size: 27px;
  }

  .stat-val {
    font-size: 28px;
  }

  .mobile-card {
    padding: 32px 28px;
    border-radius: 32px;
  }
}
</style>
