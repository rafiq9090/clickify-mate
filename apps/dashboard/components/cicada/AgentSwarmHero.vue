<template>
  <div ref="wrapperRef" class="asw-root">
    <!-- Ambient Luminous Glow matching Cicada aesthetic -->
    <div class="asw-ambient-glow" aria-hidden="true" />
    <div class="asw-ambient-glow-secondary" aria-hidden="true" />

    <div class="asw-stage-grid" :style="heroExitStyle">
      <!-- Left Column: Dynamic Narrative -->
      <div class="asw-stage-col left-narrative">
        <Transition name="asw-stage-crossfade" mode="out-in">
          <div :key="displayedStageIndex" class="asw-stage-anim">
            <div class="asw-eyebrow-wrap">
              <p class="asw-eyebrow">{{ currentStage.eyebrow }}</p>
            </div>

            <h1 :class="['asw-title', currentStage.isHero ? 'hero' : 'sub']">
              <span class="title-line">
                <span>{{ stageTitleLines[0] }}</span>
              </span>
              <span v-if="stageTitleLines[1]" class="title-line">
                <span :class="{ 'asw-gradient-text': currentStage.isHero }">
                  {{ stageTitleLines[1] }}
                </span>
              </span>
            </h1>

            <p class="asw-body">{{ currentStage.body }}</p>

            <div v-if="currentStage.isHero" class="asw-cta-row">
              <button class="asw-btn primary" @click="scrollNext">
                <span>See the swarm work</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </button>
              <NuxtLink to="/login" class="asw-btn ghost">
                <span>Talk to sales</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </Transition>

        <!-- Interactive Stage progress dots (Persistent across stages) -->
        <div class="asw-dots" role="tablist" aria-label="Swarm demonstration stages">
          <button
            v-for="(s, i) in STAGES"
            :key="s.agent"
            :class="['asw-dot', { active: i === displayedStageIndex }]"
            :aria-label="`Stage ${i + 1}: ${s.eyebrow}`"
            @click="goToStage(i)"
          >
            <span class="asw-dot-fill" />
          </button>
        </div>
      </div>

      <!-- Right Column: Crystal-Clear Phone + Swarm Fleet Rail (Zero Overlap, Pure Scroll-Driven) -->
      <div class="asw-stage-col right-stage">
        <div ref="sceneContainerRef" class="asw-scene">
          <!-- Ambient 3D Depth Canvas (Three.js WebGL Particle Depth - Responds ONLY to scroll) -->
          <canvas ref="canvasRef" class="asw-three-canvas" />

          <!-- Swarm Showcase Area: Agent Rail + Clear Phone -->
          <div class="asw-showcase-wrap">
            <!-- Dedicated Swarm Agent Fleet Rail (Docked neatly beside the phone - Never covers screen) -->
            <div class="asw-fleet-rail">
              <div class="asw-fleet-header">
                <span class="fleet-title">SWARM FLEET</span>
                <span class="fleet-badge">7 AGENTS</span>
              </div>

              <div ref="fleetListRef" class="asw-fleet-list">
                <button
                  v-for="(agent, idx) in AGENTS"
                  :key="agent.id"
                  class="asw-fleet-row"
                  :class="{ active: currentStage.agent === agent.id }"
                  :title="agent.desc"
                  @click="goToStage(idx)"
                >
                  <div class="fleet-row-icon">
                    <!-- Router Icon -->
                    <svg v-if="agent.id === 'router'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                    </svg>
                    <!-- Discovery Icon -->
                    <svg v-else-if="agent.id === 'discovery'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <!-- Sales Icon -->
                    <svg v-else-if="agent.id === 'sales'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <!-- Payment Icon -->
                    <svg v-else-if="agent.id === 'payment'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                    <!-- Logistics Icon -->
                    <svg v-else-if="agent.id === 'logistics'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18.5" r="2.5" /><circle cx="7" cy="18.5" r="2.5" />
                    </svg>
                    <!-- Returns Icon -->
                    <svg v-else-if="agent.id === 'returns'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
                    </svg>
                    <!-- Support Icon -->
                    <svg v-else-if="agent.id === 'support'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                    </svg>
                  </div>
                  <div class="fleet-row-info">
                    <span class="fleet-row-name">{{ agent.label }}</span>
                    <span class="fleet-row-status">{{ currentStage.agent === agent.id ? 'Live' : 'Standby' }}</span>
                  </div>
                  <div v-if="currentStage.agent === agent.id"/>
                </button>
              </div>
            </div>

            <!-- Crystal-Clear 3D Smartphone (Pure Scroll-Driven, 100% Unobstructed) -->
            <div
              class="asw-phone-3d-stage"
              :style="{ transform: `rotateY(${phoneRotateY}deg) rotateX(${phoneRotateX}deg)` }"
            >
              <div class="asw-phone-chassis">
                <!-- Outer Metallic Edge Trim -->
                <div class="asw-phone-rim" />

                <!-- Ultra-Crisp Screen Container -->
                <div class="asw-phone-screen">
                  <!-- Phone Status Bar -->
                  <div class="asw-phone-status">
                    <span class="asw-status-time">09:41</span>
                    <div class="asw-dynamic-island">
                      <span class="camera-lens" />
                    </div>
                    <div class="asw-status-icons">
                      <!-- 5G / Signal Bars -->
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 17h3v3H2zm5-4h3v7H7zm5-4h3v11h-3zm5-4h3v15h-3z"/>
                      </svg>
                      <!-- Battery Icon -->
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2" y="7" width="16" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                        <rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor"/>
                        <path d="M20 10v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </div>
                  </div>

                  <!-- Chat Header Bar -->
                  <div class="asw-chat-header">
                    <div class="asw-chat-avatar">
                    <svg data-v-26e32be0="" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path data-v-26e32be0="" d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></svg>
                    </div>
                    <div class="asw-chat-meta">
                      <div class="asw-chat-name">Clickify Swarm AI</div>
                      <div class="asw-chat-status">
                        <span>Active: {{ activeAgentLabel }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Live Chat Conversation Stage -->
                  <div class="asw-chat-scroll-viewport">
                    <Transition name="asw-chat-crossfade">
                      <div :key="displayedStageIndex" class="asw-chat-body">
                        <!-- Chat Messages -->
                        <div
                          v-for="(l, idx) in currentStage.screen.lines"
                          :key="idx"
                          :class="['asw-chat-msg', l.from]"
                        >
                          <div class="msg-bubble">
                            <p class="msg-text">{{ l.text }}</p>
                            <span v-if="l.source" class="msg-source">{{ l.source }}</span>
                          </div>
                        </div>

                        <!-- Stage 0: Swarm Router Card -->
                        <div v-if="currentStage.screen.kind === 'router'" class="asw-action-card router">
                          <div class="card-badge router">
                            <span>Intent Analyzed</span>
                          </div>
                          <p class="card-sub">Inquiry categorized as Product Availability & Pricing. Delegating to Discovery Specialist.</p>
                        </div>

                        <!-- Stage 1: Live Catalog Item Card -->
                        <div v-if="currentStage.screen.kind === 'product' && currentStage.screen.product" class="asw-action-card product">
                          <div class="product-thumb-row">
                            <div class="product-icon-wrap">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                              </svg>
                            </div>
                            <div class="product-details">
                              <span class="product-title">{{ currentStage.screen.product.name }}</span>
                              <span class="product-meta">Color: {{ currentStage.screen.product.color }} • Size: {{ currentStage.screen.product.size }}</span>
                            </div>
                          </div>
                          <div class="card-divider" />
                          <div class="product-footer-row">
                            <div class="stock-pill">
                              <span>{{ currentStage.screen.product.stock }} in stock</span>
                            </div>
                            <span class="product-price">{{ currentStage.screen.product.price }}</span>
                          </div>
                        </div>

                        <!-- Stage 2: Sales Order Summary Card -->
                        <div v-if="currentStage.screen.kind === 'order' && currentStage.screen.order" class="asw-action-card order">
                          <div class="card-header">
                            <span class="card-tag">Automated Cart Summary</span>
                          </div>
                          <div class="card-item-title">{{ currentStage.screen.order.items }}</div>
                          <div class="card-divider" />
                          <div class="card-total-row">
                            <span>Total Payable</span>
                            <span class="total-price">{{ currentStage.screen.order.total }}</span>
                          </div>
                        </div>

                        <!-- Stage 3: Instant Payment Verification Card -->
                        <div v-if="currentStage.screen.kind === 'payment' && currentStage.screen.confirm" class="asw-action-card payment">
                          <div class="card-badge payment">
                            <span>bKash Verified Instantly</span>
                          </div>
                          <p class="card-sub">{{ currentStage.screen.confirm }}</p>
                        </div>

                        <!-- Stage 4: Real-Time Delivery Tracking Card -->
                        <div v-if="currentStage.screen.kind === 'tracking' && currentStage.screen.tracking" class="asw-action-card tracking">
                          <div class="card-badge tracking">
                            <span>Steadfast Live Dispatch</span>
                          </div>
                          <p class="card-sub">{{ currentStage.screen.tracking }}</p>
                        </div>

                        <!-- Stage 5: Automated Returns & Exchanges Card -->
                        <div v-if="currentStage.screen.kind === 'return' && currentStage.screen.exchange" class="asw-action-card returns">
                          <div class="card-badge returns">
                            <span>Automated Size Exchange</span>
                          </div>
                          <p class="card-sub">{{ currentStage.screen.exchange }}</p>
                        </div>

                        <!-- Stage 6: Human Escalation & Support Desk Card -->
                        <div v-if="currentStage.screen.kind === 'support' && currentStage.screen.supportDesk" class="asw-action-card support">
                          <div class="card-badge support">
                            <span>Enterprise Human Escalation</span>
                          </div>
                          <p class="card-sub">{{ currentStage.screen.supportDesk }}</p>
                        </div>
                      </div>
                    </Transition>
                  </div>

                  <!-- Authentic Mobile Chat Input Bar -->
                  <div class="asw-chat-input-bar">
                    <div class="input-placeholder">
                      <span>Type a message…</span>
                    </div>
                    <button class="send-btn" aria-label="Send message">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Platform Badges (Revealed Sequentially on Scroll) -->
          <div
            v-for="p in PLATFORMS"
            :key="p.id"
            :class="['asw-pill', p.corner, { visible: progress >= p.threshold }]"
          >
            <!-- WhatsApp Icon -->
            <svg v-if="p.id === 'whatsapp'" viewBox="0 0 24 24" width="15" height="15" :fill="p.color">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.32C9.37 7.32 9.11 7.38 8.89 7.62C8.67 7.86 8.05 8.44 8.05 9.63C8.05 10.81 8.91 11.96 9.03 12.11C9.15 12.27 10.72 14.7 13.13 15.74C13.7 15.98 14.15 16.14 14.5 16.25C15.08 16.43 15.61 16.41 16.03 16.34C16.5 16.27 17.47 15.75 17.67 15.18C17.87 14.61 17.87 14.12 17.81 14.02C17.75 13.92 17.59 13.86 17.35 13.74C17.11 13.62 15.94 13.04 15.72 12.96C15.5 12.88 15.34 12.84 15.18 13.08C15.02 13.32 14.56 13.86 14.42 14.02C14.28 14.18 14.14 14.2 13.9 14.08C13.66 13.96 12.88 13.71 11.96 12.89C11.24 12.25 10.75 11.46 10.61 11.22C10.47 10.98 10.6 10.85 10.72 10.73C10.83 10.62 10.97 10.44 11.09 10.3C11.21 10.16 11.25 10.06 11.33 9.9C11.41 9.74 11.37 9.6 11.31 9.48C11.25 9.36 10.79 8.23 10.6 7.76C10.41 7.31 10.22 7.37 10.07 7.36C9.93 7.36 9.77 7.36 9.53 7.32Z"/>
            </svg>
            <!-- Instagram Icon -->
            <svg v-else-if="p.id === 'instagram'" viewBox="0 0 24 24" width="15" height="15" fill="none" :stroke="p.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
            <!-- Messenger Icon -->
            <svg v-else-if="p.id === 'messenger'" viewBox="0 0 24 24" width="15" height="15" :fill="p.color">
              <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.517 3.736 7.185v3.557l3.41-1.872c.905.251 1.868.388 2.854.388 5.523 0 10-4.145 10-9.258S17.523 2 12 2zm1.042 12.443l-2.585-2.758-5.047 2.758 5.552-5.894 2.65 2.758 4.982-2.758-5.552 5.894z"/>
            </svg>
            <!-- Telegram Icon -->
            <svg v-else-if="p.id === 'telegram'" viewBox="0 0 24 24" width="15" height="15" :fill="p.color">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            <span :style="{ color: p.color }">{{ p.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const emit = defineEmits<{
  (e: 'hero-ready'): void
}>()

const AGENTS = [
  { id: 'router', label: 'Router', desc: 'Reads customer intent, delegates instantly' },
  { id: 'discovery', label: 'Discovery', desc: 'Finds the exact product from live catalog' },
  { id: 'sales', label: 'Sales', desc: 'Negotiates bundles and closes the cart' },
  { id: 'payment', label: 'Payment', desc: 'Verifies bKash, Nagad, Cards in 380ms' },
  { id: 'logistics', label: 'Logistics', desc: 'Generates courier dispatch & tracks live' },
  { id: 'returns', label: 'Returns', desc: 'Automates customer exchanges and refunds' },
  { id: 'support', label: 'Support', desc: 'Seamless human escalation when required' },
]

interface ScreenLine {
  from: string
  text: string
  source?: string | null
}

interface ProductCardData {
  name: string
  color: string
  size: string
  stock: number
  price: string
}

interface ScreenData {
  kind: string
  lines: ScreenLine[]
  product?: ProductCardData
  order?: { items: string; total: string }
  confirm?: string
  tracking?: string
  exchange?: string
  supportDesk?: string
}

interface Stage {
  agent: string
  eyebrow: string
  title: string
  titleLines: [string, string]
  body: string
  isHero: boolean
  screen: ScreenData
}

// FULL 7-AGENT DEMONSTRATION SUITE
const STAGES: Stage[] = [
  {
    agent: 'router',
    eyebrow: 'AI Commerce Swarm',
    title: 'One AI swarm. Every channel. Zero missed sales.',
    titleLines: ['One AI swarm. Every channel.', 'Zero missed sales.'],
    body: 'Clickify Mate connects to your product catalog, then a coordinated team of autonomous agents handles discovery, cart building, payment verification, and courier dispatch — across WhatsApp, Instagram, and Facebook.',
    isHero: true,
    screen: {
      kind: 'router',
      lines: [
        { from: 'user', text: 'Hi, do you sell the oversized lavender hoodie?' },
        { from: 'system', text: ' Swarm Router analyzing customer message…' },
      ],
    },
  },
  {
    agent: 'discovery',
    eyebrow: 'Discovery Specialist',
    title: 'It knows your catalog by heart',
    titleLines: ['It knows your catalog', 'by heart'],
    body: 'Every recommendation is drawn directly from your live inventory — sizes, color variants, and stock counts. Zero hallucinations, and no more "let me check with the warehouse."',
    isHero: false,
    screen: {
      kind: 'product',
      lines: [
        { from: 'user', text: 'Is it available in Lavender, size M?' },
        { from: 'agent', text: 'Yes! Lavender in Size M is in stock.'},
      ],
      product: {
        name: 'Oversized Lavender Hoodie',
        color: 'Pastel Lavender',
        size: 'Medium (M)',
        stock: 8,
        price: '$650',
      },
    },
  },
  {
    agent: 'sales',
    eyebrow: 'Sales Specialist',
    title: 'It closes the deal, not just the chat',
    titleLines: ['It closes the deal,', 'not just the chat'],
    body: 'The sales agent negotiates volume discounts within your pre-set profit margins and creates a 1-click in-chat checkout summary so chats convert directly into paid orders.',
    isHero: false,
    screen: {
      kind: 'order',
      lines: [
        { from: 'user', text: 'Can you give me 10% discount if I order 2?' },
        { from: 'agent', text: 'Deal! Applied bundle discount: total $2,610.' },
      ],
      order: { items: '2 × Lavender Hoodie (Size M)', total: '$650' },
    },
  },
  {
    agent: 'payment',
    eyebrow: 'Payment Specialist',
    title: 'It verifies the money, in 380 milliseconds',
    titleLines: ['It verifies the money,', 'in 380 milliseconds'],
    body: 'bKash, Nagad, SSLCommerz, Stripe, or Cash on Delivery — the agent verifies transaction IDs instantly against your payment gateway with zero manual screenshot checking.',
    isHero: false,
    screen: {
      kind: 'payment',
      lines: [{ from: 'user', text: 'Paid ৳2,610 via bKash! TrxID: 9XQ482LK' }],
      confirm: 'TrxID #9XQ482LK confirmed with bKash gateway. Payment verified in 380ms.',
    },
  },
  {
    agent: 'logistics',
    eyebrow: 'Logistics Specialist',
    title: 'It never goes quiet after the checkout',
    titleLines: ['It never goes quiet', 'after the checkout'],
    body: 'Automated consignment generation on Steadfast, Pathao, and RedX. Real-time delivery status updates sent proactively to WhatsApp and Instagram DMs.',
    isHero: false,
    screen: {
      kind: 'tracking',
      lines: [{ from: 'user', text: 'When will my package arrive?' }],
      tracking: 'Steadfast Consignment #SF-88412 — Out for delivery today with Rider (01711-XXXXXX).',
    },
  },
  {
    agent: 'returns',
    eyebrow: 'Returns Specialist',
    title: 'It resolves returns before they turn into chargebacks',
    titleLines: ['It resolves returns', 'before chargebacks'],
    body: 'Automated reverse logistics, exchange size matching, and instant store credit or gateway refunds. Zero support friction, and your stock counts stay accurate.',
    isHero: false,
    screen: {
      kind: 'return',
      lines: [
        { from: 'user', text: 'The size M hoodie is too small for me. Can I exchange for L?' },
        { from: 'agent', text: 'Found Size L in stock! I scheduled a Steadfast pickup for your Size M.' },
      ],
      exchange: 'Size M ➔ Size L Exchange Approved. Steadfast reverse consignment #RP-4921 scheduled for tomorrow.',
    },
  },
  {
    agent: 'support',
    eyebrow: 'Support Specialist',
    title: 'Autonomous by default. Human when it matters.',
    titleLines: ['Autonomous by default.', 'Human when it matters.'],
    body: 'Complex custom inquiries, wholesale queries, or sensitive negotiations are escalated to your human team with complete conversation history, buyer profile, and AI suggested replies.',
    isHero: false,
    screen: {
      kind: 'support',
      lines: [
        { from: 'user', text: '100 units with our logo — possible?' },
        { from: 'system', text: 'Wholesale detected. Routing to Enterprise…' },
        { from: 'agent', text: 'On it! What gear are you customizing?' },
      ],
      supportDesk: 'Escalated to Enterprise VIP Desk (Sarah K.). Full chat context, order value & account history synced.',
    },
  },
]

const PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp Commerce', color: '#059669', corner: 'tl', threshold: 0.04 },
  { id: 'instagram', label: 'Instagram DM AI', color: '#DB2777', corner: 'tr', threshold: 0.22 },
  { id: 'messenger', label: 'Messenger 24/7', color: '#2563EB', corner: 'bl', threshold: 0.44 },
  { id: 'telegram', label: 'Telegram Agent', color: '#06b6d4', corner: 'br', threshold: 0.72 },
]

const wrapperRef = ref<HTMLElement | null>(null)
const sceneContainerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fleetListRef = ref<HTMLElement | null>(null)

const progress = ref(0)
let heroCtx: any = null
let scrollTriggerInstance: any = null

const stageCount = STAGES.length
const stageIndex = computed(() => {
  return Math.min(stageCount - 1, Math.floor(progress.value * stageCount))
})

// Debounced display index so stage changes wait for the scroll easing to settle.
const displayedStageIndex = ref(0)
let stageDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(stageIndex, (newIdx) => {
  if (stageDebounceTimer) clearTimeout(stageDebounceTimer)
  stageDebounceTimer = setTimeout(() => {
    displayedStageIndex.value = newIdx
  }, 60)
})

const currentStage = computed<Stage>(() => STAGES[displayedStageIndex.value] || STAGES[0]!)

// Auto-scroll the fleet rail on mobile so the active agent chip is always visible
watch(displayedStageIndex, (idx) => {
  if (!fleetListRef.value) return
  const buttons = fleetListRef.value.querySelectorAll<HTMLElement>('.asw-fleet-row')
  const activeBtn = buttons[idx]
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }
})

const stageTitleLines = computed<[string, string]>(() => {
  if (currentStage.value.titleLines) {
    return currentStage.value.titleLines
  }
  return [currentStage.value.title, '']
})

const activeAgentLabel = computed(() => {
  const ag = AGENTS.find((a) => a.id === currentStage.value.agent)
  return ag ? `${ag.label} Agent` : 'Swarm Active'
})

const isSmallScreen = ref(false)

const updateScreenSize = () => {
  if (typeof window !== 'undefined') {
    isSmallScreen.value = window.innerWidth <= 1024
  }
}

// PURE SCROLL-DRIVEN 3D ROTATION (ZERO auto-bobbing, ZERO auto-pulsing)
// Phone stays 100% still when user is not scrolling, and flat on mobile for clarity
const phoneRotateY = computed(() => {
  if (isSmallScreen.value) return 0
  return -8 + progress.value * 16
})
const phoneRotateX = computed(() => {
  if (isSmallScreen.value) return 0
  return 2 - progress.value * 4
})

const heroExitStyle = computed(() => {
  if (progress.value > 0.92) {
    const exitRatio = (progress.value - 0.92) / 0.08
    return {
      opacity: `${1 - exitRatio * 0.35}`,
      transform: `scale(${1 - exitRatio * 0.03}) translateY(${-exitRatio * 20}px)`,
    }
  }
  return {
    opacity: '1',
    transform: 'scale(1) translateY(0)',
  }
})

// Three.js Ambient Particle Depth (Moves ONLY when scrolling)
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let particlesMesh: THREE.Points | null = null

function initThreeBackground() {
  if (!canvasRef.value || !sceneContainerRef.value) return

  const container = sceneContainerRef.value
  const width = container.clientWidth || 600
  const height = container.clientHeight || 580

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000)
  camera.position.set(0, 0, 10)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Ambient 3D Particle Dust (Static backdrop depth, rotates ONLY on scroll)
  const particleCount = 50
  const particleGeom = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 14
    positions[i + 1] = (Math.random() - 0.5) * 10
    positions[i + 2] = (Math.random() - 0.5) * 6
  }
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const particleMat = new THREE.PointsMaterial({
    color: 0x7B4C85,
    size: 0.07,
    transparent: true,
    opacity: 0.35,
  })
  particlesMesh = new THREE.Points(particleGeom, particleMat)
  scene.add(particlesMesh)

  renderer.render(scene, camera)
}

function updateThreeOnScroll() {
  if (particlesMesh && renderer && scene && camera) {
    // Rotates purely with user scroll progress
    particlesMesh.rotation.y = progress.value * Math.PI
    renderer.render(scene, camera)
  }
}

const handleResize = () => {
  updateScreenSize()
  if (!sceneContainerRef.value || !renderer || !camera || !scene) return
  const width = sceneContainerRef.value.clientWidth || 600
  const height = sceneContainerRef.value.clientHeight || 580
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  renderer.render(scene, camera)
}

const goToStage = (index: number) => {
  if (!scrollTriggerInstance) {
    progress.value = index / (stageCount - 1)
    updateThreeOnScroll()
    return
  }
  const start = scrollTriggerInstance.start
  const end = scrollTriggerInstance.end
  const target = start + ((index + 0.1) / stageCount) * (end - start)
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: target, behavior: 'smooth' })
  }
}

const scrollNext = () => {
  if (!scrollTriggerInstance) {
    if (typeof window !== 'undefined') {
      window.scrollBy({ top: 750, behavior: 'smooth' })
    }
    return
  }
  const start = scrollTriggerInstance.start
  const end = scrollTriggerInstance.end
  const target = start + (1.2 / stageCount) * (end - start)
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: target, behavior: 'smooth' })
  }
}

onMounted(async () => {
  if (!import.meta.client) return

  updateScreenSize()
  initThreeBackground()
  window.addEventListener('resize', handleResize)

  // Initialize GSAP ScrollTrigger (Pure scroll scrub, adaptive distance)
  try {
    const gsapModule = await import('gsap')
    const gsap = gsapModule.default || gsapModule.gsap
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    gsap.registerPlugin(ScrollTrigger)

    heroCtx = gsap.context(() => {
      scrollTriggerInstance = ScrollTrigger.create({
        id: 'hero-swarm-trigger',
        trigger: wrapperRef.value,
        start: 'top top',
        end: () => (window.innerWidth < 768 ? '+=5000' : '+=7500'),
        pin: true,
        pinSpacing: true,
        scrub: 0.45,
        anticipatePin: 1,
        fastScrollEnd: false,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress.value = self.progress
          updateThreeOnScroll()
        },
      })
    })

    // Emit event so parent deck can refresh its ScrollTrigger in DOM order
    emit('hero-ready')
    ScrollTrigger.refresh()
  } catch (err) {
    console.error('AgentSwarmHero GSAP init error:', err)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (heroCtx) {
    heroCtx.revert()
  }
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.asw-root {
  /* Authentic Cicada Light Luxury Design System */
  --bg-top: #FAF8FC;
  --bg-base: #E0D8EB;
  --fat-tuesday: #341F37;
  --plum-accent: #7B4C85;
  --primary-brand: #7B4C85;
  --primary-accent: #341F37;
  --secondary-brand: #935B9E;
  --text-dark: #241427;
  --text-body: #5C4560;
  --border-light: rgba(52, 31, 55, 0.14);
  --border-subtle: rgba(52, 31, 55, 0.08);
  --surface-glass: rgba(255, 255, 255, 0.94);

  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  background: radial-gradient(120% 85% at 50% 15%, var(--bg-top) 0%, var(--bg-base) 75%);
  color: var(--text-dark);
  font-family: var(--main-font, 'Work Sans', sans-serif);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 5;
  box-sizing: border-box;
  padding: 70px 24px 20px;
}

.asw-root * {
  box-sizing: border-box;
}

/* Ambient Luminous Plum Glows */
.asw-ambient-glow {
  position: absolute;
  top: 15%;
  right: 12%;
  width: 30vw;
  height: 30vw;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(123, 76, 133, 0.18) 0%, rgba(224, 216, 235, 0) 70%);
  filter: blur(50px);
  pointer-events: none;
  z-index: 1;
}

.asw-ambient-glow-secondary {
  position: absolute;
  bottom: 10%;
  left: 10%;
  width: 26vw;
  height: 26vw;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(147, 91, 158, 0.14) 0%, rgba(249, 245, 255, 0) 70%);
  filter: blur(40px);
  pointer-events: none;
  z-index: 1;
}

/* Stage Grid */
.asw-stage-grid {
  position: relative;
  z-index: 2;
  width: min(1240px, 94vw);
  display: grid;
  grid-template-columns: minmax(320px, 460px) 1fr;
  gap: clamp(20px, 3.5vw, 54px);
  align-items: center;
  margin: 0 auto;
}

.asw-stage-col {
  position: relative;
}

.asw-stage-col.left-narrative {
  position: relative;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.asw-stage-anim {
  position: relative;
  width: 100%;
}

/* Smooth Stage Narrative Crossfade Transition */
.asw-stage-crossfade-enter-active,
.asw-stage-crossfade-leave-active {
  transition: opacity 0.34s ease,
              transform 0.34s ease;
  will-change: opacity, transform;
}

.asw-stage-crossfade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.asw-stage-crossfade-enter-active .asw-eyebrow-wrap,
.asw-stage-crossfade-enter-active .asw-title,
.asw-stage-crossfade-enter-active .asw-body,
.asw-stage-crossfade-enter-active .asw-cta-row {
  animation: asw-text-reveal 0.42s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

.asw-stage-crossfade-enter-active .asw-title {
  animation-delay: 0.06s;
}

.asw-stage-crossfade-enter-active .asw-body {
  animation-delay: 0.12s;
}

.asw-stage-crossfade-enter-active .asw-cta-row {
  animation-delay: 0.18s;
}

@keyframes asw-text-reveal {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.asw-stage-crossfade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.asw-stage-crossfade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.asw-stage-crossfade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
}

/* Phone screen chat content crossfade */
.asw-chat-crossfade-enter-active,
.asw-chat-crossfade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.22, 0.61, 0.36, 1),
              transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
  will-change: opacity, transform;
}

.asw-chat-crossfade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.asw-chat-crossfade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.asw-chat-crossfade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.asw-chat-crossfade-leave-to {
  opacity: 0;
  transform: translateY(-3px);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
}

/* Eyebrow badge */
.asw-eyebrow-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.asw-eyebrow {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--plum-accent);
  margin: 0;
  font-weight: 800;
  display: inline-block;
}

/* Titles */
.asw-title {
  font-family: inherit;
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 16px;
  letter-spacing: -0.025em;
  color: var(--fat-tuesday);
}

.asw-title.hero {
  font-size: clamp(36px, 4.5vw, 58px);
}

.asw-title.sub {
  font-size: clamp(28px, 3.5vw, 46px);
}

.title-line {
  display: block;
  line-height: 1.18;
}

.title-line > span {
  display: inline-block;
}

.asw-gradient-text {
  background: linear-gradient(135deg, var(--fat-tuesday) 0%, var(--plum-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Body */
.asw-body {
  font-size: clamp(15px, 1.3vw, 16.5px);
  line-height: 1.65;
  color: var(--text-body);
  max-width: 44ch;
  margin: 0 0 24px;
}

/* CTA Row */
.asw-cta-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.asw-btn {
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 600;
  padding: 12px 22px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.asw-btn:hover {
  transform: translateY(-2px);
}

.asw-btn.primary {
  background: linear-gradient(135deg, var(--fat-tuesday) 0%, #4D2B52 100%);
  color: #FFFFFF;
  box-shadow: 0 10px 24px -5px rgba(52, 31, 55, 0.35);
}

.asw-btn.primary:hover {
  box-shadow: 0 14px 28px -5px rgba(52, 31, 55, 0.45);
  background: linear-gradient(135deg, #241427 0%, #3D2241 100%);
}

.asw-btn.ghost {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(52, 31, 55, 0.18);
  color: var(--fat-tuesday);
  backdrop-filter: blur(8px);
}

.asw-btn.ghost:hover {
  background: #FFFFFF;
  border-color: rgba(52, 31, 55, 0.35);
}

/* Progress Dots */
.asw-dots {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}

.asw-dot {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.asw-dot-fill {
  display: block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(52, 31, 55, 0.2);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.asw-dot.active .asw-dot-fill {
  background: var(--plum-accent);
  transform: scale(1.4);
  box-shadow: 0 0 10px rgba(123, 76, 133, 0.6);
}

/* Right 3D Stage Container */
.asw-scene {
  position: relative;
  height: min(600px, 75vh);
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
}

.asw-three-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* Showcase Flex Layout: Agent Rail + Clear Phone */
.asw-showcase-wrap {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  width: 100%;
  max-width: 540px;
}

/* Dedicated Swarm Fleet Rail */
.asw-fleet-rail {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.88);
  border: 1.5px solid rgba(52, 31, 55, 0.12);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 20px;
  padding: 8px 8px;
  box-shadow: 0 12px 32px rgba(52, 31, 55, 0.08);
  width: 176px;
  min-width: 176px;
  flex-shrink: 0;
}

.asw-fleet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px 6px;
  border-bottom: 1px solid rgba(52, 31, 55, 0.08);
  margin-bottom: 5px;
  white-space: nowrap;
}

.fleet-title {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-body);
  white-space: nowrap;
  flex-shrink: 0;
}

.fleet-badge {
  font-size: 9px;
  font-weight: 800;
  background: rgba(123, 76, 133, 0.08);
  color: var(--plum-accent);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.asw-fleet-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.asw-fleet-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 7px;
  border-radius: 11px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-body);
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  position: relative;
}

.asw-fleet-row:hover {
  background: rgba(123, 76, 133, 0.08);
  color: var(--plum-accent);
}

.asw-fleet-row.active {
  background: linear-gradient(135deg, var(--plum-accent) 0%, #582C62 100%);
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(123, 76, 133, 0.35);
  transform: translateX(3px);
}

.fleet-row-icon {
  width: 25px;
  height: 25px;
  border-radius: 7px;
  background: rgba(52, 31, 55, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.25s ease;
}

.asw-fleet-row.active .fleet-row-icon {
  background: rgba(255, 255, 255, 0.22);
  color: #FFFFFF;
}

.fleet-row-info {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  flex: 1;
  min-width: 0;
}

.fleet-row-name {
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fleet-row-status {
  font-size: 8.5px;
  opacity: 0.75;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asw-fleet-row.active .fleet-row-status {
  opacity: 0.95;
  color: #E0D8EB;
}


/* 3D Phone Rig (Purely driven by scroll, ZERO auto-pulsing) */
.asw-phone-3d-stage {
  position: relative;
  transform-style: preserve-3d;
  will-change: transform;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.asw-phone-chassis {
  width: 300px;
  height: 550px;
  max-height: calc(100vh - 140px);
  border-radius: 44px;
  padding: 10px;
  background: linear-gradient(155deg, #FFFFFF 0%, #EFE8F6 50%, #DCD0E8 100%);
  border: 2px solid rgba(52, 31, 55, 0.14);
  box-shadow: 0 25px 60px -10px rgba(52, 31, 55, 0.22),
              0 10px 24px -5px rgba(123, 76, 133, 0.18),
              inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  position: relative;
}

.asw-phone-rim {
  position: absolute;
  inset: 0;
  border-radius: 44px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  pointer-events: none;
}

.asw-phone-screen {
  width: 100%;
  height: 100%;
  border-radius: 34px;
  background: #FAF8FC;
  border: 1px solid rgba(52, 31, 55, 0.1);
  box-shadow: inset 0 2px 6px rgba(52, 31, 55, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Phone Status Bar */
.asw-phone-status {
  padding: 8px 16px 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-dark);
  font-size: 12px;
  font-weight: 700;
  z-index: 2;
}

.asw-status-time {
  letter-spacing: -0.01em;
}

.asw-dynamic-island {
  width: 76px;
  height: 20px;
  background: #180B22;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
}

.camera-lens {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2D183E;
  box-shadow: inset 0 0 2px #0B0411;
}

.asw-status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0.85;
}

/* Chat Header */
.asw-chat-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  background: #FFFFFF;
  border-bottom: 1.5px solid rgba(52, 31, 55, 0.08);
}

.asw-chat-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--plum-accent) 0%, #582C62 100%);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(123, 76, 133, 0.3);
}

.asw-chat-name {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-dark);
  line-height: 1.15;
}

.asw-chat-status {
  font-size: 10.5px;
  font-weight: 600;
  color: #059669;
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
}

/* Chat Viewport and Body (Smooth Scroll Crossfade) */
.asw-chat-scroll-viewport {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.asw-chat-body {
  padding: 12px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow: hidden;
  width: 100%;
}

.asw-chat-crossfade-enter-active,
.asw-chat-crossfade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.asw-chat-crossfade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.asw-chat-crossfade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.asw-chat-crossfade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.asw-chat-crossfade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
}

.asw-chat-msg {
  display: flex;
}

.asw-chat-msg.user {
  justify-content: flex-end;
}

.asw-chat-msg.user .msg-bubble {
  background: linear-gradient(135deg, #7B4C85 0%, #582C62 100%);
  color: #FFFFFF;
  border-radius: 14px 14px 3px 14px;
  padding: 9px 12px;
  max-width: 88%;
  box-shadow: 0 3px 10px rgba(123, 76, 133, 0.25);
}

.asw-chat-msg.user .msg-text {
  font-size: 12.5px;
  font-weight: 600;
  margin: 0;
  line-height: 1.35;
}

.asw-chat-msg.agent {
  justify-content: flex-start;
}

.asw-chat-msg.agent .msg-bubble {
  background: #FFFFFF;
  color: var(--text-dark);
  border: 1.5px solid rgba(52, 31, 55, 0.12);
  border-radius: 14px 14px 14px 3px;
  padding: 9px 12px;
  max-width: 90%;
  box-shadow: 0 3px 8px rgba(52, 31, 55, 0.05);
}

.asw-chat-msg.agent .msg-text {
  font-size: 12.5px;
  font-weight: 600;
  margin: 0;
  line-height: 1.38;
  color: #241427;
}

.msg-source {
  display: inline-block;
  margin-top: 4px;
  background: rgba(123, 76, 133, 0.12);
  color: #7B4C85;
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.asw-chat-msg.system {
  justify-content: center;
}

.asw-chat-msg.system .msg-bubble {
  background: #F8F5FC;
  border: 1px solid rgba(123, 76, 133, 0.25);
  color: #7B4C85;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  font-style: italic;
  text-align: center;
}

/* Action Cards */
.asw-action-card {
  margin-top: auto;
  border-radius: 14px;
  padding: 10px 12px;
}

/* Router Card */
.asw-action-card.router {
  background: #f7f7f7;
  border: 1.5px solid #4D2B52;
}

.card-badge.router {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 800;
  color: #4D2B52;
  margin-bottom: 3px;
}

/* Product Card */
.asw-action-card.product {
  background: #f7f7f7;
  border: 1.5px solid #4D2B52;
}

.product-thumb-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.product-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(123, 76, 133, 0.12);
  color: #7B4C85;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.product-details {
  display: flex;
  flex-direction: column;
}

.product-title {
  font-size: 12.5px;
  font-weight: 800;
  color: #241427;
}

.product-meta {
  font-size: 10.5px;
  color: var(--text-body);
}

.product-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  color: #059669;
  background: #ECFDF5;
  padding: 2px 6px;
  border-radius: 4px;
}

.stock-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #10B981;
}

.product-price {
  font-size: 15px;
  font-weight: 900;
  color: #7B4C85;
}

/* Order Card */
.asw-action-card.order {
  background: #FFFFFF;
  border: 2px solid #7B4C85;
  box-shadow: 0 4px 14px rgba(123, 76, 133, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.card-tag {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-body);
}

.card-item-title {
  font-size: 12.5px;
  font-weight: 800;
  color: #241427;
  margin-bottom: 6px;
}

.card-divider {
  height: 1px;
  background: rgba(52, 31, 55, 0.08);
  margin-bottom: 6px;
}

.card-total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  font-weight: 700;
  color: #241427;
}

.total-price {
  font-size: 16px;
  font-weight: 900;
  color: #7B4C85;
}

/* Payment Card */
.asw-action-card.payment {
  background: #f7f7f7;
  border: 1.5px solid #582C62;
  color: #582C62;
}

.card-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 800;
  margin-bottom: 3px;
}

.card-sub {
  font-size: 11px;
  font-weight: 600;
  margin: 0;
  opacity: 0.9;
  line-height: 1.35;
}

/* Tracking Card */
.asw-action-card.tracking {
  background: #EFF6FF;
  border: 1.5px solid #2563EB;
  color: #1E40AF;
}

/* Returns Card */
.asw-action-card.returns {
  background: #f7f7f7;
  border: 1.5px solid #4D2B52;
  color: #4D2B52;
}

.card-badge.returns {
  color: #4D2B52;
}

/* Support Card */
.asw-action-card.support {
  background: #FDF4FF;
  border: 1.5px solid #4D2B52;
  color: #4D2B52;
}

.card-badge.support {
  color: #4D2B52;
}

/* Chat Input Bar */
.asw-chat-input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #FFFFFF;
  border-top: 1px solid rgba(52, 31, 55, 0.08);
}

.input-placeholder {
  flex: 1;
  background: #F4EFF8;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 11px;
  color: #8C7A92;
}

.send-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--plum-accent);
  color: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Platform Badges (Smooth Scroll-Triggered Reveal) */
.asw-pill {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border-radius: 999px;
  background: var(--surface-glass);
  border: 1px solid var(--border-light);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-size: 11.5px;
  font-weight: 700;
  opacity: 0;
  transform: translateY(14px) scale(0.92);
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 8px 20px rgba(52, 31, 55, 0.1);
  pointer-events: auto;
  z-index: 6;
  will-change: opacity, transform;
}

.asw-pill.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.asw-pill.tl {
  top: 4%;
  left: 2%;
}

.asw-pill.tr {
  top: 4%;
  right: 2%;
}

.asw-pill.bl {
  bottom: 4%;
  left: 2%;
}

.asw-pill.br {
  bottom: 4%;
  right: 2%;
}

/* ============================================================
   TABLET RESPONSIVE VIEW (769px to 1100px)
   Keeps high-end side-by-side layout with perfectly scaled elements
   ============================================================ */
@media (min-width: 768px) and (max-width: 1100px) {
  .asw-root {
    padding: calc(var(--nav-height, 64px) + 26px) clamp(16px, 2.5vw, 32px) clamp(20px, 3vh, 32px);
    height: 100vh;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  .asw-stage-grid {
    width: 100%;
    max-width: min(1040px, 94vw);
    grid-template-columns: minmax(0, 1.15fr) auto;
    gap: clamp(16px, 2.5vw, 28px);
    align-items: center;
    margin: auto 0;
    box-sizing: border-box;
  }
  .asw-stage-col.left-narrative {
    min-height: unset;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .asw-eyebrow-wrap {
    margin-bottom: 8px;
  }
  .asw-title.hero {
    font-size: clamp(28px, 3.6vw, 36px);
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-bottom: 12px;
  }
  .asw-title.sub {
    font-size: clamp(22px, 2.8vw, 28px);
    line-height: 1.18;
    margin-bottom: 12px;
  }
  .asw-body {
    font-size: clamp(13.5px, 1.6vw, 15px);
    line-height: 1.55;
    max-width: 40ch;
    margin: 0 0 20px;
  }
  .asw-cta-row {
    gap: 12px;
  }
  .asw-btn {
    padding: 10px 18px;
    font-size: 13px;
    border-radius: 11px;
  }
  .asw-dots {
    margin-top: 20px;
  }
  .asw-showcase-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: clamp(10px, 1.5vw, 14px);
    flex-shrink: 0;
    min-width: 0;
  }
  .asw-scene {
    height: auto;
    min-height: unset;
  }
  .asw-fleet-rail {
    width: clamp(124px, 15vw, 142px);
    min-width: 124px;
    padding: 7px 6px;
    border-radius: 16px;
    box-sizing: border-box;
    overflow: hidden;
  }
  .asw-fleet-header {
    gap: 3px;
    padding: 2px 4px 5px;
    margin-bottom: 4px;
    justify-content: space-between;
    overflow: hidden;
  }
  .fleet-title {
    font-size: 8.5px;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
  .fleet-badge {
    font-size: 7.5px;
    padding: 1px 4px;
    white-space: nowrap;
  }
  .asw-fleet-row {
    padding: 5px 6px;
    border-radius: 9px;
    gap: 6px;
  }
  .fleet-row-icon {
    width: 21px;
    height: 21px;
    border-radius: 6px;
  }
  .fleet-row-icon svg {
    width: 12px;
    height: 12px;
  }
  .fleet-row-name {
    font-size: 10.5px;
  }
  .fleet-row-status {
    font-size: 8.5px;
  }
  .asw-phone-chassis {
    width: clamp(248px, 30vw, 290px);
    height: clamp(520px, 58vh, 620px);
    max-height: calc(100vh - var(--nav-height, 64px) - 60px);
    border-radius: 38px;
    padding: 8px;
    box-sizing: border-box;
  }
  .asw-phone-screen {
    border-radius: 30px;
  }
  .asw-phone-status {
    padding: 6px 12px 3px;
    font-size: 11px;
  }
  .asw-dynamic-island {
    width: 66px;
    height: 17px;
  }
  .asw-chat-header {
    padding: 8px 11px;
    gap: 8px;
  }
  .asw-chat-avatar {
    width: 26px;
    height: 26px;
  }
  .asw-chat-name {
    font-size: 12.5px;
  }
  .asw-chat-status {
    font-size: 9.5px;
  }
  .asw-chat-body {
    padding: 10px 11px 8px;
    gap: 8px;
  }
  .asw-chat-msg.user .msg-bubble,
  .asw-chat-msg.agent .msg-bubble {
    padding: 8px 11px;
    border-radius: 13px;
  }
  .asw-chat-msg.user .msg-text,
  .asw-chat-msg.agent .msg-text {
    font-size: 12px;
  }
  .asw-action-card {
    padding: 9px 11px;
    border-radius: 11px;
  }
  .asw-pill {
    padding: 6px 11px;
    font-size: 11px;
  }
  .asw-pill.tl {
    top: 2%;
    left: -6px;
  }
  .asw-pill.tr {
    top: 2%;
    right: -6px;
  }
  .asw-pill.bl {
    bottom: 3%;
    left: -6px;
  }
  .asw-pill.br {
    bottom: 3%;
    right: -6px;
  }
}

/* ============================================================
   MOBILE RESPONSIVE VIEW (<= 767px)
   Vertical stacked layout with horizontal fleet chips & scaled phone
   100% visible on any mobile viewport (zero clipping, zero cutoff)
   ============================================================ */
@media (max-width: 767px) {
  .asw-root {
    height: 100vh;
    min-height: 100vh;
    padding: calc(env(safe-area-inset-top, 0px) + 52px) 12px calc(env(safe-area-inset-bottom, 0px) + 8px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  .asw-ambient-glow {
    width: 60vw;
    height: 60vw;
    filter: blur(35px);
  }
  .asw-ambient-glow-secondary {
    width: 50vw;
    height: 50vw;
    filter: blur(30px);
  }
  .asw-stage-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 360px;
    gap: 6px;
    margin: 0 auto;
    text-align: center;
  }
  .asw-stage-col.left-narrative {
    min-height: auto;
    width: 100%;
    max-width: 350px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .asw-stage-anim {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .asw-eyebrow-wrap {
    margin-bottom: 2px;
    gap: 6px;
    justify-content: center;
  }
  .asw-eyebrow {
    font-size: 9.5px;
    letter-spacing: 0.06em;
  }
  .asw-title {
    margin: 0 0 3px;
    line-height: 1.15;
  }
  .asw-title.hero {
    font-size: clamp(20px, 5.5vw, 24px);
  }
  .asw-title.sub {
    font-size: clamp(17px, 5vw, 21px);
  }
  .title-line {
    line-height: 1.15;
  }
  .asw-body {
    font-size: clamp(12px, 3vw, 13px);
    line-height: 1.45;
    max-width: 34ch;
    margin: 0 auto 6px;
    display: block;
    overflow: visible;
  }
  .asw-cta-row {
    gap: 7px;
    justify-content: center;
    margin-bottom: 4px;
  }
  .asw-btn {
    font-size: 11px;
    padding: 6px 13px;
    border-radius: 8px;
    gap: 4px;
  }
  .asw-dots {
    margin-top: 3px;
    margin-bottom: 5px;
    gap: 5px;
    justify-content: center;
  }
  .asw-dot {
    padding: 3px;
  }
  .asw-dot-fill {
    width: 6px;
    height: 6px;
  }
  .asw-dot.active .asw-dot-fill {
    transform: scale(1.3);
  }

  /* Right column / phone showcase */
  .asw-stage-col.right-stage {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .asw-scene {
    height: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    perspective: none;
  }
  .asw-showcase-wrap {
    flex-direction: column;
    align-items: center;
    gap: 5px;
    width: 100%;
    max-width: 330px;
  }

  /* Fleet Rail transforms into sleek horizontal chips bar on mobile */
  .asw-fleet-rail {
    width: 100%;
    max-width: 320px;
    padding: 3px 5px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(52, 31, 55, 0.1);
    box-shadow: 0 4px 14px rgba(52, 31, 55, 0.06);
  }
  .asw-fleet-header {
    display: none;
  }
  .asw-fleet-list {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    overflow-x: auto;
    width: 100%;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding: 1px 2px;
  }
  .asw-fleet-list::-webkit-scrollbar {
    display: none;
  }
  .asw-fleet-row {
    padding: 3px 6px;
    border-radius: 7px;
    gap: 3px;
    flex-shrink: 0;
    align-items: center;
    white-space: nowrap;
  }
  .asw-fleet-row.active {
    transform: none;
  }
  .fleet-row-icon {
    width: 17px;
    height: 17px;
    border-radius: 4px;
  }
  .fleet-row-icon svg {
    width: 11px;
    height: 11px;
  }
  .fleet-row-name {
    font-size: 8.5px;
    font-weight: 700;
    white-space: nowrap;
  }
  .fleet-row-status {
    display: none;
  }

  /* Flat, high-contrast, crystal-clear mobile phone */
  .asw-phone-3d-stage {
    transform: none !important;
    flex-shrink: 0;
  }
  .asw-phone-chassis {
    width: min(200px, 84vw);
    height: clamp(285px, 42vh, 345px);
    max-height: calc(100vh - 250px);
    border-radius: 26px;
    padding: 5px;
    box-shadow: 0 12px 30px -5px rgba(52, 31, 55, 0.16);
  }
  .asw-phone-rim {
    border-radius: 26px;
  }
  .asw-phone-screen {
    border-radius: 20px;
  }
  .asw-phone-status {
    padding: 3px 8px 1px;
    font-size: 9.5px;
  }
  .asw-dynamic-island {
    width: 48px;
    height: 12px;
    border-radius: 6px;
  }
  .camera-lens {
    width: 4px;
    height: 4px;
  }
  .asw-chat-header {
    padding: 4px 7px;
    gap: 5px;
  }
  .asw-chat-avatar {
    width: 20px;
    height: 20px;
  }
  .asw-chat-avatar svg {
    width: 12px;
    height: 12px;
  }
  .asw-chat-name {
    font-size: 10.5px;
  }
  .asw-chat-status {
    font-size: 8px;
    gap: 3px;
  }
  .status-dot {
    width: 4px;
    height: 4px;
  }
  .asw-chat-body {
    padding: 5px 7px;
    gap: 5px;
  }
  .asw-chat-msg.user .msg-bubble,
  .asw-chat-msg.agent .msg-bubble {
    padding: 5px 8px;
    border-radius: 9px;
    max-width: 92%;
  }
  .asw-chat-msg.user .msg-text,
  .asw-chat-msg.agent .msg-text {
    font-size: 10px;
    line-height: 1.25;
  }
  .msg-source {
    font-size: 8px;
    padding: 1px 4px;
  }
  .asw-action-card {
    padding: 5px 7px;
    border-radius: 8px;
    margin-top: auto;
  }
  .card-badge {
    font-size: 9.5px;
    margin-bottom: 2px;
  }
  .card-sub {
    font-size: 9px;
    line-height: 1.2;
  }
  .product-thumb-row {
    gap: 5px;
  }
  .product-icon-wrap {
    width: 22px;
    height: 22px;
  }
  .product-title {
    font-size: 9.5px;
  }
  .product-meta {
    font-size: 8px;
  }
  .stock-pill {
    font-size: 8px;
    padding: 1px 4px;
  }
  .product-price {
    font-size: 11px;
  }
  .card-header {
    margin-bottom: 2px;
  }
  .card-tag {
    font-size: 8.5px;
  }
  .card-item-title {
    font-size: 10px;
    margin-bottom: 3px;
  }
  .card-divider {
    margin-bottom: 3px;
  }
  .card-total-row {
    font-size: 9px;
  }
  .total-price {
    font-size: 11.5px;
  }
  .asw-chat-input-bar {
    padding: 3px 6px;
    gap: 5px;
  }
  .input-placeholder {
    padding: 3px 6px;
    font-size: 9px;
    border-radius: 8px;
  }
  .send-btn {
    width: 20px;
    height: 20px;
  }
  .send-btn svg {
    width: 10px;
    height: 10px;
  }
  .asw-pill {
    display: none;
  }
}
</style>
