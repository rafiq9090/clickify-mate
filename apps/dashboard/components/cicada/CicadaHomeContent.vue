<script setup lang="ts">
import { ref, computed } from 'vue'
import CicadaPlaybookSection from './CicadaPlaybookSection.vue'


// --- Swarm Capabilities Tab / Filter & Scrolling Marquee ---
const activeAgentTab = ref(0)
const isMarqueePaused = ref(false)
const toggleMarqueePause = () => {
  isMarqueePaused.value = !isMarqueePaused.value
}
const swarmCapabilities = [
  {
    id: 'router',
    name: '01. Intent Router',
    role: 'Traffic & Intent Classifier',
    badge: '28ms Latency',
    desc: 'Identifies buyer intent and routes to specialist agents with zero context loss.',
    metrics: '99.4% Intent Accuracy',
    features: ['Multi-lingual & Banglish NLP', 'Sentiment & VIP routing', 'Sub-second dispatch']
  },
  {
    id: 'discovery',
    name: '02. Catalog Specialist',
    role: 'Semantic Search & Match',
    badge: 'Vector Search',
    desc: 'Understands natural inquiries and suggests in-stock SKUs tailored to preferences.',
    metrics: '3.4x Faster Discovery',
    features: ['Live inventory sync', 'In-chat image carousels', 'Size & fit guidance']
  },
  {
    id: 'sales',
    name: '03. Consultative Closer',
    role: 'Conversion & Upselling',
    badge: '+42% AOV',
    desc: 'Recommends matching accessories and bundles to maximize order value.',
    metrics: '38% Cart Recovery Rate',
    features: ['Discount guardrails', 'Smart bundle suggestions', 'Cart recovery triggers']
  },
  {
    id: 'payment',
    name: '04. In-Chat Checkout',
    role: 'Frictionless Payment',
    badge: 'Instant Checkout',
    desc: 'Generates payment links and locks in COD orders directly inside social chats.',
    metrics: '94% Completion Rate',
    features: ['bKash, Nagad, Stripe & COD', 'Instant OTP verification', 'Digital invoice generation']
  },
  {
    id: 'logistics',
    name: '05. Logistics & Dispatch',
    role: 'Courier Automation',
    badge: 'Direct API Sync',
    desc: 'Standardizes addresses and books couriers via Pathao, Steadfast, and RedX.',
    metrics: '-78% Return Rate',
    features: ['Live courier tracking', 'Automated parcel booking', 'Zone fee calculator']
  },
  {
    id: 'returns',
    name: '06. Returns & Exchanges',
    role: 'Self-Service Aftercare',
    badge: 'Policy Enforced',
    desc: 'Handles size exchanges and return requests according to your store policy.',
    metrics: '91% Auto-Resolved',
    features: ['Photo condition check', 'Reverse pickup booking', 'Store credit vouchers']
  },
  {
    id: 'support',
    name: '07. Human-in-the-Loop',
    role: 'Supervisor & Escalation',
    badge: 'Seamless Handoff',
    desc: 'Hands off VIP or edge-case inquiries to human staff with instant conversation summaries.',
    metrics: '< 10s Handoff',
    features: ['One-click live takeover', 'Instant conversation summary', 'Real-time staff alerts']
  }
]

const currentAgent = computed(() => swarmCapabilities[activeAgentTab.value] ?? swarmCapabilities[0]!)

// --- FAQ Accordion State ---
const openFaq = ref<number | null>(0)
const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index
}

const faqs = [
  {
    q: 'How long does it take to connect Clickify Mate to our store and channels?',
    a: 'Most merchants go live in under 5 minutes. You connect your official WhatsApp Cloud API, Instagram Professional account, or Facebook page via 1-click OAuth, link your Shopify or WooCommerce catalog, and the swarm is ready to take orders immediately.'
  },
  {
    q: 'Can Clickify Mate understand informal regional languages and mixed dialects (e.g. Banglish)?',
    a: 'Yes! Clickify Mate models are specifically fine-tuned for conversational social commerce. They seamlessly parse informal phrasing, typos, regional dialects, romanized Banglish, and mixed English-Bengali without getting confused.'
  },
  {
    q: 'How does automated Cash-on-Delivery (COD) verification work to stop fake orders?',
    a: 'When a customer requests COD checkout, the Payment & Logistics agent confirms the recipient mobile number and exact delivery address in-chat with an automated OTP or interactive one-tap confirmation card. This verified confirmation drops parcel returns (RTO) by up to 78%.'
  },
  {
    q: 'Does Clickify Mate sync stock inventory in real time with our e-commerce store?',
    a: 'Yes. Every time an agent recommends an item or prepares a cart, it queries your active catalog in real time. If a size or color is out of stock, the agent will proactively suggest alternatives rather than letting the sale drop.'
  },
  {
    q: 'What happens when a customer has a unique request that the AI cannot answer?',
    a: 'The Swarm Router agent detects when an inquiry exceeds predefined business boundaries and immediately alerts your human team in the unified inbox. The human agent receives a bulleted summary of the conversation and can take over seamlessly in one click.'
  }
]
</script>

<template>
  <div class="home-sections-flow">
    <!-- Ambient Backdrop Light Orbs -->
    <div class="flow-ambient-glow orb-1"></div>
    <div class="flow-ambient-glow orb-2"></div>

    <!-- ========================================================
         SECTION 1: TELEMETRY & COMMERCE IMPACT METRICS
         ======================================================== -->
    <section class="section-container section-metrics" id="metrics">
      <div class="metrics-glass-panel">
        <div class="metrics-header">
          <h2 class="metrics-main-title">Proven Velocity Across Millions of Social Conversations</h2>
          <p class="metrics-subtitle">
            Autonomous commerce agents processing real-time discovery, cart building, and checkout 24/7 with zero human delay.
          </p>
        </div>

        <div class="metrics-stat-grid">
          <div class="stat-card">
            <div class="stat-value">$18.4M+</div>
            <div class="stat-label">In-Chat GMV Driven</div>
            <div class="stat-desc">Direct orders finalized through social DMs</div>
          </div>

          <div class="stat-card">
            <div class="stat-value">210ms</div>
            <div class="stat-label">Median Response Latency</div>
            <div class="stat-desc">Zero queueing, instant customer gratification</div>
          </div>

          <div class="stat-card">
            <div class="stat-value">+41.8%</div>
            <div class="stat-label">DM-to-Checkout Lift</div>
            <div class="stat-desc">Versus sending users to generic external links</div>
          </div>

          <div class="stat-card">
            <div class="stat-value">94.2%</div>
            <div class="stat-label">Automated COD Verification</div>
            <div class="stat-desc">78% reduction in courier parcel return rates</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========================================================
         SECTION 2: CORE SWARM ARCHITECTURE DEEP DIVE
         ======================================================== -->
    <section class="section-container section-capabilities" id="capabilities">
      <div class="section-header text-center">
        <h2 class="section-title">Seven Specialized Agents. One Unified Commerce Brain.</h2>
        <p class="section-desc">
          Dedicated micro-agents orchestrating social commerce with deterministic guardrails.
        </p>
      </div>

      

      <!-- Left to Right Scrolling Marquee -->
      <div 
        class="capabilities-marquee-wrapper"
        @mouseenter="isMarqueePaused = true"
        @mouseleave="isMarqueePaused = false"
      >
        <div class="marquee-fade-edge left"></div>
        <div class="marquee-fade-edge right"></div>

        <div 
          class="capabilities-marquee-track scroll-left-to-right"
          :class="{ 'is-paused': isMarqueePaused }"
        >
          <!-- Set 1 of 7 Agents -->
          <div 
            v-for="(agent, idx) in swarmCapabilities" 
            :key="'agent-1-' + agent.id"
            class="agent-stream-card"
            :class="{ 'is-active': activeAgentTab === idx }"
            @click="activeAgentTab = idx"
          >
            <div class="stream-card-top">
              <span class="agent-num-badge">0{{ idx + 1 }}</span>
              <span class="stream-card-badge">{{ agent.badge }}</span>
            </div>
            
            <div class="stream-card-body">
              <span class="stream-agent-role">{{ agent.role }}</span>
              <h3 class="stream-agent-title">{{ agent.name.replace(/^\d+\.\s*/, '') }}</h3>
              <p class="stream-agent-desc">{{ agent.desc }}</p>
            </div>

            <div class="stream-card-features">
              <div 
                v-for="(feature, fIdx) in agent.features.slice(0, 2)" 
                :key="fIdx"
                class="stream-feature-pill"
              >
                <span>{{ feature }}</span>
              </div>
            </div>

            <div class="stream-card-footer">
              <span class="stream-metric-tag">{{ agent.metrics }}</span>
              <span class="stream-click-hint">Details &rarr;</span>
            </div>
          </div>

          <!-- Set 2 of 7 Agents (Seamless Duplication for Infinite Loop) -->
          <div 
            v-for="(agent, idx) in swarmCapabilities" 
            :key="'agent-2-' + agent.id"
            class="agent-stream-card"
            :class="{ 'is-active': activeAgentTab === idx }"
            @click="activeAgentTab = idx"
          >
            <div class="stream-card-top">
              <span class="agent-num-badge">0{{ idx + 1 }}</span>
              <span class="stream-card-badge">{{ agent.badge }}</span>
            </div>
            
            <div class="stream-card-body">
              <span class="stream-agent-role">{{ agent.role }}</span>
              <h3 class="stream-agent-title">{{ agent.name.replace(/^\d+\.\s*/, '') }}</h3>
              <p class="stream-agent-desc">{{ agent.desc }}</p>
            </div>

            <div class="stream-card-features">
              <div 
                v-for="(feature, fIdx) in agent.features.slice(0, 2)" 
                :key="fIdx"
                class="stream-feature-pill"
              >
                <span>{{ feature }}</span>
              </div>
            </div>

            <div class="stream-card-footer">
              <span class="stream-metric-tag">{{ agent.metrics }}</span>
              <span class="stream-click-hint">Details &rarr;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Agent Detailed Cockpit -->
      <div class="capability-display-card">
        <div class="display-card-content">
          <div class="card-badge-row">
            <span class="agent-role-pill">{{ currentAgent.role }}</span>
            <span class="agent-metric-pill">{{ currentAgent.metrics }}</span>
          </div>

          <h3 class="display-card-title">{{ currentAgent.name }}</h3>
          <p class="display-card-desc">{{ currentAgent.desc }}</p>

          <div class="feature-bullets">
            <div 
              v-for="(bullet, bIdx) in currentAgent.features" 
              :key="bIdx"
              class="bullet-item"
            >
              <span>{{ bullet }}</span>
            </div>
          </div>

          <div class="display-card-cta">
            <NuxtLink to="/dashboard" class="action-link-btn">
              <span>Test in live sandbox</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </NuxtLink>
          </div>
        </div>

        <!-- Decorative Swarm Node Graphic -->
        <div class="display-card-visual">
          <div class="swarm-node-mockup">
            <div class="mockup-header">
              <span class="node-name">Agent Subsystem 0{{ activeAgentTab + 1 }} / 07</span>
            </div>
            <div class="mockup-code-block">
              <div class="code-line"><span class="c-key">status:</span> <span class="c-val">"autonomous_ready"</span></div>
              <div class="code-line"><span class="c-key">latency:</span> <span class="c-val">"&lt;250ms"</span></div>
              <div class="code-line"><span class="c-key">guardrail:</span> <span class="c-val">"zero_hallucination"</span></div>
              <div class="code-line"><span class="c-key">memory_sync:</span> <span class="c-val">"vector_redis"</span></div>
            </div>
            <div class="mockup-flow-pill">
              <span>Active channel: WhatsApp Cloud &bull; IG Direct</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========================================================
         SECTION 3: 4-STEP ONBOARDING WORKFLOW
         ======================================================== -->
    <section class="section-container section-workflow" id="workflow">
      <div class="section-header text-center">
        <h2 class="section-title">From Connect to Full Autonomous Selling in 4 Steps</h2>
        <p class="section-desc">
          Zero engineering resources needed. Get your social storefront active and capturing revenue in under five minutes.
        </p>
      </div>

      <div class="workflow-steps-grid">
        <!-- Step 1 -->
        <div class="workflow-step-card">
          <div class="step-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
          <h3 class="step-card-title">Connect Channels</h3>
          <p class="step-card-desc">
            Link WhatsApp Business Cloud API, Instagram DM, and Facebook Messenger via official 1-click OAuth authentication.
          </p>
          <div class="step-meta-tag">1-Click Meta Approved</div>
        </div>

        <!-- Step 2 -->
        <div class="workflow-step-card">
          <div class="step-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <h3 class="step-card-title">Ingest Live Catalog</h3>
          <p class="step-card-desc">
            2-way real-time synchronization with Shopify, WooCommerce, or custom inventory APIs to keep pricing and stock 100% accurate.
          </p>
          <div class="step-meta-tag">Real-Time Inventory</div>
        </div>

        <!-- Step 3 -->
        <div class="workflow-step-card">
          <div class="step-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <h3 class="step-card-title">Set Guardrails &amp; Tone</h3>
          <p class="step-card-desc">
            Define your exact brand personality, allowable discount ranges, return policies, and courier dispatch preferences.
          </p>
          <div class="step-meta-tag">Custom Persona</div>
        </div>

        <!-- Step 4 -->
        <div class="workflow-step-card">
          <div class="step-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <h3 class="step-card-title">Autopilot Revenue</h3>
          <p class="step-card-desc">
            The swarm handles thousands of customer inquiries simultaneously, creates checkout links, and sends verified orders directly to couriers.
          </p>
          <div class="step-meta-tag">24/7 Autonomous</div>
        </div>
      </div>
    </section>


    <!-- ========================================================
         SECTION 5: OMNICHANNEL PLAYBOOK (SCROLL SCALING & REVEAL)
         ======================================================== -->
    <CicadaPlaybookSection />


    <!-- ========================================================
         SECTION 6: ENTERPRISE SECURITY & COMPLIANCE
         ======================================================== -->
    <section class="section-container section-security" id="security">
      <div class="security-wrap">
        <!-- Section Header -->
        <div class="section-header text-center">
          <h2 class="section-title">Bank-Grade Compliance. Complete Sovereignty.</h2>
          <p class="section-desc">
            Your customer conversations, catalog vectors, and transaction logs remain strictly private. Built exclusively on official enterprise Cloud APIs with zero unofficial scrapers.
          </p>
        </div>

        <!-- 4-Pillar Security Bento Grid -->
        <div class="security-grid" style="align-items: start;">
          <!-- Card 1: Official Meta BSP -->
          <div class="security-card" style="align-self: start; height: auto; min-height: 0; justify-content: flex-start;">
            <div class="sec-card-header">
              <div class="sec-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <span class="sec-chip">Tier-1 Route</span>
            </div>
            <h3 class="sec-card-title">Official Meta BSP API</h3>
            <p class="sec-card-desc" style="margin-bottom: 5px; flex-grow: 0;">Direct Cloud API connectivity authorized by Meta. No third-party scrapers, unofficial browser extensions, or reverse-engineered protocols.</p>
            <div class="sec-card-footer" style="margin-top: 0; padding-top: 5px; flex-grow: 0; flex-shrink: 0; height: auto; min-height: 0;">
              <span class="sec-metric-text" style="display: block; margin: 0; padding: 0; line-height: 1.2;">100% Official Meta Cloud API</span>
            </div>
          </div>

          <!-- Card 2: Zero Account Ban Risk -->
          <div class="security-card" style="align-self: start; height: auto; min-height: 0; justify-content: flex-start;">
            <div class="sec-card-header">
              <div class="sec-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span class="sec-chip">Spam Protection</span>
            </div>
            <h3 class="sec-card-title">Zero Account Ban Risk</h3>
            <p class="sec-card-desc" style="margin-bottom: 5px; flex-grow: 0;">Algorithmic token pacing and rate-limit throttling protect your WhatsApp Business phone numbers and Instagram handles from spam flags.</p>
            <div class="sec-card-footer" style="margin-top: 0; padding-top: 5px; flex-grow: 0; flex-shrink: 0; height: auto; min-height: 0;">
              <span class="sec-metric-text" style="display: block; margin: 0; padding: 0; line-height: 1.2;">0 Bans Across 10M+ Messages</span>
            </div>
          </div>

          <!-- Card 3: SOC 2 Type II Audited -->
          <div class="security-card" style="align-self: start; height: auto; min-height: 0; justify-content: flex-start;">
            <div class="sec-card-header">
              <div class="sec-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <span class="sec-chip">Third-Party Audit</span>
            </div>
            <h3 class="sec-card-title">SOC 2 Type II Certified</h3>
            <p class="sec-card-desc" style="margin-bottom: 5px; flex-grow: 0;">Rigorously tested by independent auditors for data isolation, access governance, operational resilience, and zero-trust perimeter control.</p>
            <div class="sec-card-footer" style="margin-top: 0; padding-top: 5px; flex-grow: 0; flex-shrink: 0; height: auto; min-height: 0;">
              <span class="sec-metric-text" style="display: block; margin: 0; padding: 0; line-height: 1.2;">Annual Penetration Testing</span>
            </div>
          </div>

          <!-- Card 4: End-to-End Encryption & GDPR -->
          <div class="security-card" style="align-self: start; height: auto; min-height: 0; justify-content: flex-start;">
            <div class="sec-card-header">
              <div class="sec-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 2l-2 2m-1.5 1.5L16 7m-1.5 1.5L13 10m-1.5 1.5L10 13m-1.5 1.5L7 16m-1.5 1.5L4 19m-1.5 1.5L1 22" />
                  <circle cx="15.5" cy="8.5" r="5.5" />
                </svg>
              </div>
              <span class="sec-chip">AES-256</span>
            </div>
            <h3 class="sec-card-title">Dedicated Tenant Isolation</h3>
            <p class="sec-card-desc" style="margin-bottom: 5px; flex-grow: 0;">Every merchant's catalog embeddings and customer chats reside in dedicated tenant partitions with AES-256 encryption at rest and TLS 1.3 in transit.</p>
            <div class="sec-card-footer" style="margin-top: 0; padding-top: 5px; flex-grow: 0; flex-shrink: 0; height: auto; min-height: 0;">
              <span class="sec-metric-text" style="display: block; margin: 0; padding: 0; line-height: 1.2;">Zero Data Pooling or Resale</span>
            </div>
          </div>
        </div>

        <!-- Bottom Trust Guarantees Bar -->
        <div class="security-trust-strip">
          <div class="trust-strip-item">
            <span>Official Meta Cloud API</span>
          </div>
          <div class="trust-strip-divider"></div>
          <div class="trust-strip-item">
            <span>Automated PII Masking</span>
          </div>
          <div class="trust-strip-divider"></div>
          <div class="trust-strip-item">
            <span>GDPR & DPA Compliant</span>
          </div>
          <div class="trust-strip-divider"></div>
          <div class="trust-strip-item">
            <span>99.99% High-Availability SLA</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ========================================================
         SECTION 8: FREQUENTLY ASKED QUESTIONS (ACCORDION)
         ======================================================== -->
    <section class="section-container section-faq" id="faq">
      <div class="section-header text-center">
        <h2 class="section-title">Frequently Asked Questions</h2>
        <p class="section-desc">
          Everything you need to know about setting up and scaling your autonomous commerce swarm.
        </p>
      </div>

      <div class="faq-accordion-wrap">
        <div 
          v-for="(faq, fIdx) in faqs" 
          :key="fIdx"
          class="faq-item"
          :class="{ 'is-open': openFaq === fIdx }"
        >
          <button 
            type="button" 
            class="faq-question-btn"
            @click="toggleFaq(fIdx)"
          >
            <span class="faq-question-text">{{ faq.q }}</span>
            <div class="faq-toggle-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
          </button>
          
          <div v-show="openFaq === fIdx" class="faq-answer-pane">
            <p class="faq-answer-text">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Main Flow Container */
.home-sections-flow {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  background: #FAF8FC;
  overflow-x: clip;
  padding: 40px 0 60px;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: #341F37;
}

/* Ambient Backdrops */
.flow-ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
}
.flow-ambient-glow.orb-1 {
  top: 15%;
  left: -100px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(123, 76, 133, 0.08) 0%, transparent 70%);
}
.flow-ambient-glow.orb-2 {
  top: 60%;
  right: -100px;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(147, 91, 158, 0.07) 0%, transparent 70%);
}

/* Reusable Section Container */
.section-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 90px;
  padding: 0 24px;
  box-sizing: border-box;
  scroll-margin-top: 100px;
}

.section-workflow {
  margin-bottom: 36px;
}

.section-header {
  margin-bottom: 48px;
}
.text-center {
  text-align: center;
}


.section-title {
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0 0 14px;
}

.section-desc {
  font-size: 16px;
  line-height: 1.6;
  color: #5C4560;
  max-width: 680px;
  margin: 0 auto;
}

/* ========================================================
   SECTION 1: TELEMETRY METRICS
   ======================================================== */
.metrics-glass-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 44px 48px;
  box-shadow: 0 16px 40px rgba(52, 31, 55, 0.06), inset 0 1px 2px rgba(255, 255, 255, 1);
}

.metrics-header {
  text-align: center;
  margin-bottom: 38px;
}

.live-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: #341F37;
  padding: 5px 14px;
  border-radius: 9999px;
  margin-bottom: 16px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.metrics-main-title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0 0 10px;
}

.metrics-subtitle {
  font-size: 15.5px;
  line-height: 1.55;
  color: #5C4560;
  max-width: 640px;
  margin: 0 auto;
}

.metrics-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  padding-top: 10px;
}

.stat-card {
  background: rgba(250, 248, 252, 0.7);
  border: 1px solid rgba(123, 76, 133, 0.12);
  border-radius: 18px;
  padding: 24px 20px;
  text-align: center;
  min-width: 0;
  overflow: hidden;
  transition: transform 0.25s ease, border-color 0.25s ease;
}
.stat-card:hover {
  transform: translateY(-3px);
  border-color: #7B4C85;
}

.stat-value {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #341F37;
  line-height: 1.1;
  margin-bottom: 6px;
  white-space: nowrap;
}

.stat-label {
  font-size: 14.5px;
  font-weight: 700;
  color: #7B4C85;
  margin-bottom: 4px;
}

.stat-desc {
  font-size: 12.5px;
  line-height: 1.4;
  color: #7A627E;
}

/* Tablet Layout */
@media (max-width: 1024px) {
  .metrics-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .stat-card {
    padding: 18px 14px;
  }
  .stat-value {
    font-size: 26px;
  }
  .stat-label {
    font-size: 13px;
  }
  .stat-desc {
    font-size: 11.5px;
  }
}

/* Small Tablet / Mobile */
@media (max-width: 768px) {
  .metrics-glass-panel {
    padding: 20px 14px;
  }
  .metrics-main-title {
    font-size: 22px;
  }
  .metrics-subtitle {
    font-size: 13.5px;
  }
  .metrics-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .stat-card {
    padding: 14px 8px;
    border-radius: 14px;
  }
  .stat-value {
    font-size: 19px;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }
  .stat-label {
    font-size: 11px;
    margin-bottom: 3px;
    line-height: 1.25;
  }
  .stat-desc {
    font-size: 9.5px;
    line-height: 1.35;
  }
}

/* Compact Mobile Screens */
@media (max-width: 480px) {
  .metrics-glass-panel {
    padding: 16px 10px;
  }
  .metrics-main-title {
    font-size: 20px;
  }
  .metrics-subtitle {
    font-size: 12.5px;
  }
  .metrics-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .stat-card {
    padding: 12px 6px;
    border-radius: 12px;
  }
  .stat-value {
    font-size: 16.5px;
    margin-bottom: 3px;
  }
  .stat-label {
    font-size: 10px;
    line-height: 1.2;
    margin-bottom: 3px;
  }
  .stat-desc {
    font-size: 9px;
    line-height: 1.25;
  }
}

/* ========================================================
   SECTION 2: CAPABILITIES SHOWCASE
   ======================================================== */
/* Stream Control Bar */



.stream-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7B4C85;
  box-shadow: 0 0 0 3px rgba(123, 76, 133, 0.2);
}

.stream-ctrl-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(123, 76, 133, 0.18);
  font-size: 12px;
  font-weight: 700;
  color: #7B4C85;
  cursor: pointer;
  transition: all 0.2s ease;
}
.stream-ctrl-btn:hover {
  background: #FFFFFF;
  border-color: #7B4C85;
  box-shadow: 0 4px 12px rgba(123, 76, 133, 0.12);
}
.stream-ctrl-btn.is-active {
  background: #341F37;
  color: #FFFFFF;
  border-color: #341F37;
}

/* Marquee Viewport */
.capabilities-marquee-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-bottom: 36px;
  border-radius: 22px;
  padding: 8px 0;
}

.marquee-fade-edge {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 70px;
  z-index: 3;
  pointer-events: none;
}
.marquee-fade-edge.left {
  left: 0;
  background: linear-gradient(to right, #FAF8FC 0%, transparent 100%);
}
.marquee-fade-edge.right {
  right: 0;
  background: linear-gradient(to left, #FAF8FC 0%, transparent 100%);
}

/* Track Scrolling Left to Right */
.capabilities-marquee-track.scroll-left-to-right {
  display: flex;
  gap: 20px;
  width: max-content;
  animation: scrollLeftToRight 38s linear infinite;
  will-change: transform;
}

.capabilities-marquee-track.is-paused {
  animation-play-state: paused !important;
}

@keyframes scrollLeftToRight {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0%);
  }
}

/* Agent Card in Marquee */
.agent-stream-card {
  width: 320px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 28px rgba(52, 31, 55, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease;
  user-select: none;
}

.agent-stream-card:hover {
  transform: translateY(-4px);
  border-color: #7B4C85;
  box-shadow: 0 16px 36px rgba(123, 76, 133, 0.16);
}

.agent-stream-card.is-active {
  border-color: #7B4C85;
  background: linear-gradient(145deg, #FFFFFF 0%, #FAF6FC 100%);
  box-shadow: 0 14px 34px rgba(123, 76, 133, 0.14);
}

.stream-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-num-badge {
  font-size: 12px;
  font-weight: 800;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
}

.stream-card-badge {
  font-size: 11px;
  font-weight: 700;
  color: #341F37;
  
  padding: 3px 8px;
  border-radius: 9999px;
}

.stream-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stream-agent-role {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7B4C85;
}

.stream-agent-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: #341F37;
  margin: 0;
}

.stream-agent-desc {
  font-size: 13.5px;
  line-height: 1.5;
  color: #5C4560;
  margin: 4px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stream-card-features {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.stream-feature-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4A334E;
}


.stream-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid rgba(123, 76, 133, 0.1);
  margin-top: auto;
}

.stream-metric-tag {
  font-size: 11.5px;
  font-weight: 800;
  color: #7B4C85;
}

.stream-click-hint {
  font-size: 11.5px;
  font-weight: 700;
  color: #7B4C85;
}

.capability-display-card {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  background: rgba(250, 248, 252, 0.65);
  border: 1px solid rgba(123, 76, 133, 0.1);
  border-radius: 20px;
  padding: 20px 24px;
  align-items: start;
}

.display-card-content {
  display: flex;
  flex-direction: column;
}

.card-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.agent-role-pill {
  font-size: 11.5px;
  font-weight: 700;
  color: #7B4C85;
  padding: 3px 9px;
  border-radius: 6px;
}

.agent-metric-pill {
  font-size: 11.5px;
  font-weight: 700;
  color: #7B4C85;
  padding: 3px 9px;
  border-radius: 6px;
}

.display-card-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0 0 6px;
}

.display-card-desc {
  font-size: 14px;
  line-height: 1.45;
  color: #5C4560;
  margin: 0 0 10px;
}

.feature-bullets {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.bullet-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: #341F37;
}

.display-card-cta {
  display: flex;
  margin-top: 2px;
  padding: 0;
}

.action-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 700;
  color: #7B4C85;
  text-decoration: none;
  transition: all 0.2s ease;
}
.action-link-btn:hover {
  color: #341F37;
  transform: translateX(3px);
}

.display-card-visual {
  display: flex;
  justify-content: center;
}

.swarm-node-mockup {
  width: 100%;
  max-width: 340px;
  background: #251627;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 28px rgba(37, 22, 39, 0.35);
  font-family: monospace;
}

.mockup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 12px;
}

.node-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
}

.node-name {
  font-size: 12px;
  color: #E0D8EB;
  font-weight: 600;
}

.mockup-code-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  margin-bottom: 16px;
}

.c-key {
  color: #B584BE;
}
.c-val {
  color: #70E2B8;
}

.mockup-flow-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #D8CCE3;
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 10px;
  border-radius: 9999px;
}

.flow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7B4C85;
}

/* ========================================================
   SECTION 3: WORKFLOW 4 STEPS
   ======================================================== */
.workflow-steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}

.workflow-step-card {
  position: relative;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px 24px;
  box-shadow: 0 12px 30px rgba(52, 31, 55, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.workflow-step-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(52, 31, 55, 0.09);
}


.step-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: #7B4C85;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-card-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: #341F37;
  margin: 0;
}

.step-card-desc {
  font-size: 14px;
  line-height: 1.55;
  color: #5C4560;
  margin: 0;
  flex-grow: 1;
}

.step-meta-tag {
  font-size: 11.5px;
  font-weight: 700;
  color: #7B4C85;
  padding: 3px 8px;
  border-radius: 6px;
  align-self: flex-start;
}


/* ========================================================
   SECTION 5: INTEGRATIONS
   ======================================================== */
.integrations-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.integration-cluster-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 26px rgba(52, 31, 55, 0.05);
}

.cluster-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}

.cluster-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot-social { background: #25D366; }
.dot-store { background: #96BF48; }
.dot-courier { background: #EF4444; }
.dot-payment { background: #E2136E; }

.cluster-title {
  font-size: 15px;
  font-weight: 800;
  color: #341F37;
  margin: 0;
}

.integration-badges-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.integration-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(250, 248, 252, 0.7);
  border: 1px solid rgba(123, 76, 133, 0.1);
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: #341F37;
  transition: all 0.2s ease;
}
.integration-badge:hover {
  background: #FFFFFF;
  border-color: #7B4C85;
  transform: translateX(2px);
}

.badge-icon {
  font-size: 15px;
}

/* ========================================================
   SECTION 6: TESTIMONIALS
   ======================================================== */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.testimonial-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 12px 28px rgba(52, 31, 55, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.testimonial-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.merchant-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.merchant-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #341F37 0%, #7B4C85 100%);
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.merchant-name {
  font-size: 15px;
  font-weight: 800;
  color: #341F37;
}

.merchant-role {
  font-size: 12.5px;
  color: #7A627E;
}

.highlight-metric-tag {
  font-size: 11.5px;
  font-weight: 800;
  color: #10B981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 3px 8px;
  border-radius: 9999px;
  white-space: nowrap;
}

.testimonial-quote {
  font-size: 14.5px;
  line-height: 1.6;
  color: #4A334E;
  margin: 0;
  flex-grow: 1;
  font-style: italic;
}

.merchant-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.store-badge,
.channel-badge {
  font-size: 11px;
  font-weight: 700;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
}

/* ========================================================
   SECTION 7: ENTERPRISE SECURITY & COMPLIANCE (REDESIGNED)
   ======================================================== */
.section-security {
  position: relative;
  padding: 16px 0 28px;
}

.security-wrap {
  max-width: 1200px;
  margin: 0 auto;
}

.security-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  align-items: start;
  margin-bottom: 20px;
}

.security-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1.5px solid rgba(123, 76, 133, 0.12);
  border-radius: 14px;
  padding: 12px 14px 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-self: start;
  height: auto;
  min-height: 0;
  box-shadow: 0 4px 14px rgba(52, 31, 55, 0.04);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.security-card:hover {
  transform: translateY(-3px);
  border-color: #7B4C85;
  box-shadow: 0 12px 24px rgba(123, 76, 133, 0.12);
}

.sec-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.sec-icon-box {
  width: 24px;
  height: 24px;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7B4C85;
}

.sec-chip {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 9999px;
  color: #7B4C85;
}

.sec-card-title {
  font-size: 15px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 3px;
  line-height: 1.25;
}

.sec-card-desc {
  font-size: 12px;
  line-height: 1.4;
  color: #5C4560;
  margin: 0 0 5px;
  flex-grow: 0;
}

.sec-card-footer {
  border-top: 1px solid rgba(123, 76, 133, 0.08);
  padding-top: 5px;
  margin-top: 0;
  flex-shrink: 0;
}

.sec-metric-text {  
  font-size: 10.5px;
  font-weight: 700;
  color: #7B4C85;
  letter-spacing: 0.02em;
}

.security-trust-strip {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 14px;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  box-shadow: 0 4px 14px rgba(52, 31, 55, 0.03);
}

.trust-strip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #341F37;
}

.trust-strip-divider {
  width: 1px;
  height: 20px;
  background: rgba(123, 76, 133, 0.2);
}

@media (max-width: 1024px) {
  .security-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    align-items: start;
  }
  .security-card {
    padding: 12px 12px 10px;
    align-self: start;
    height: auto;
  }
}

@media (max-width: 768px) {
  .section-security {
    padding: 10px 0 20px;
  }
  .security-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 14px;
    align-items: start;
  }
  .security-card {
    padding: 11px 12px 9px;
    align-self: start;
    height: auto;
  }
  .sec-card-header {
    margin-bottom: 4px;
  }
  .sec-card-title {
    font-size: 14.5px;
    margin-bottom: 2px;
  }
  .sec-card-desc {
    font-size: 11.5px;
    line-height: 1.35;
    margin-bottom: 4px;
  }
  .sec-card-footer {
    padding-top: 4px;
    margin-top: 0;
  }
  .security-trust-strip {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 18px;
    gap: 12px;
  }
  .trust-strip-divider {
    display: none;
  }
}

/* ========================================================
   SECTION 8: FAQ ACCORDION
   ======================================================== */
.faq-accordion-wrap {
  max-width: 840px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(123, 76, 133, 0.12);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.faq-item.is-open {
  border-color: #7B4C85;
  box-shadow: 0 8px 24px rgba(52, 31, 55, 0.06);
}

.faq-question-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
}

.faq-question-text {
  font-size: 16px;
  font-weight: 700;
  color: #341F37;
  line-height: 1.4;
}

.faq-toggle-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(123, 76, 133, 0.08);
  color: #7B4C85;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.faq-item.is-open .faq-toggle-icon {
  transform: rotate(45deg);
  background: #7B4C85;
  color: #FFFFFF;
}

.faq-answer-pane {
  padding: 0 24px 20px;
}

.faq-answer-text {
  font-size: 14.5px;
  line-height: 1.6;
  color: #5C4560;
  margin: 0;
  border-top: 1px solid rgba(123, 76, 133, 0.08);
  padding-top: 14px;
}

/* ========================================================
   RESPONSIVE DESIGN
   ======================================================== */
@media (max-width: 1024px) {
  .metrics-stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .workflow-steps-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .integrations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .testimonials-grid {
    grid-template-columns: 1fr;
  }
  .capabilities-marquee-wrapper {
    margin-bottom: 20px;
  }
  .capability-display-card {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 20px 18px;
  }
  .roi-grid {
    grid-template-columns: 1fr;
  }
  .section-workflow {
    margin-bottom: 24px;
  }
}

@media (max-width: 768px) {
  .home-sections-flow {
    padding: 20px 0 40px;
  }
  .section-container {
    padding: 0 16px;
    margin-bottom: 60px;
  }
  .section-workflow {
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 26px;
  }
  .workflow-steps-grid {
    grid-template-columns: 1fr;
  }
  .integrations-grid {
    grid-template-columns: 1fr;
  }
  .capabilities-showcase {
    padding: 20px 16px;
  }
  .capabilities-marquee-wrapper {
    margin-bottom: 14px;
  }
  .capability-display-card {
    padding: 16px 14px;
    gap: 12px;
  }
  .display-card-title {
    font-size: 20px;
  }
  .display-card-desc {
    font-size: 13.5px;
    margin-bottom: 8px;
  }
  .feature-bullets {
    margin-bottom: 8px;
    gap: 5px;
  }
  .bullet-item {
    font-size: 12.5px;
  }
}
</style>
