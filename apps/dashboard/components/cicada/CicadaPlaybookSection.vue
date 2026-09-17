<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const sectionRef = ref<HTMLElement | null>(null)
const stickyRef = ref<HTMLElement | null>(null)
const scalerRef = ref<HTMLElement | null>(null)
let scrollTriggerInstance: any = null
let animationTimeline: any = null

onMounted(async () => {
  if (!import.meta.client) return
  await nextTick()

  try {
    const { gsap } = await import('gsap')
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    gsap.registerPlugin(ScrollTrigger)

    const sectionEl = sectionRef.value
    const stickyEl = stickyRef.value
    const scalerEl = scalerRef.value
    if (!sectionEl || !stickyEl || !scalerEl) return

    // Guarantee all 14 background cards start completely hidden at scale 0 / opacity 0
    gsap.set('.playbook-grid-card', { scale: 0, opacity: 0, pointerEvents: 'none' })

    animationTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: sectionEl,
        start: 'top top',
        end: () => {
          if (window.innerWidth <= 767) return '+=650'
          if (window.innerWidth <= 1100) return '+=750'
          return 'bottom bottom'
        },
        scrub: 1,
        pin: stickyEl,
        pinSpacing: true,
        invalidateOnRefresh: true,
      }
    })

    // 1. Center Scaler shrinks from expanded full viewport card down to center grid cell
    animationTimeline.fromTo(
      scalerEl,
      {
        width: () => {
          if (window.innerWidth <= 767) return Math.min(window.innerWidth * 0.92, 340)
          if (window.innerWidth <= 1100) return Math.min(window.innerWidth - 32, 680)
          return Math.min(window.innerWidth * 0.82, 1080)
        },
        height: () => {
          if (window.innerWidth <= 767) return Math.min(window.innerHeight * 0.42, 280)
          if (window.innerWidth <= 1100) return Math.min(window.innerHeight * 0.45, 370)
          return Math.min(window.innerHeight * 0.60, 520)
        },
        borderRadius: () => (window.innerWidth <= 767 ? '16px' : '26px'),
        boxShadow: '0 28px 60px rgba(52, 31, 55, 0.22)',
      },
      {
        width: '100%',
        height: '100%',
        borderRadius: () => (window.innerWidth <= 767 ? '10px' : '16px'),
        boxShadow: '0 10px 24px rgba(52, 31, 55, 0.08)',
        ease: 'power1.inOut',
        duration: 1
      },
      0
    )

    // Scaler internal elements morph cleanly using autoAlpha (seamless crossfade, zero blank gap)
    animationTimeline.to(
      '.scaler-expanded-content',
      { autoAlpha: 0, pointerEvents: 'none', ease: 'power2.out', duration: 0.16 },
      0.06
    )

    animationTimeline.fromTo(
      '.scaler-compact-content',
      { autoAlpha: 0, pointerEvents: 'none' },
      { autoAlpha: 1, pointerEvents: 'auto', ease: 'power2.out', duration: 0.14 },
      0.14
    )

    // 2. Layer 1 (Social Commerce Channels) reveals and scales out from center
    animationTimeline.to(
      '.layer-1',
      { scale: 1, opacity: 1, pointerEvents: 'auto', stagger: 0.04, ease: 'power2.out', duration: 0.35 },
      0.15
    )

    // 3. Layer 2 (E-Commerce Storefronts) reveals and scales out
    animationTimeline.to(
      '.layer-2',
      { scale: 1, opacity: 1, pointerEvents: 'auto', stagger: 0.04, ease: 'power3.out', duration: 0.35 },
      0.35
    )

    // 4. Layer 3 (Couriers & Payments) blossoms to outer edges
    animationTimeline.to(
      '.layer-3',
      { scale: 1, opacity: 1, pointerEvents: 'auto', stagger: 0.04, ease: 'power4.out', duration: 0.35 },
      0.55
    )

    scrollTriggerInstance = animationTimeline.scrollTrigger
    ScrollTrigger.refresh()

    const handleResize = () => {
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', handleResize, { passive: true })
    cleanups.push(() => window.removeEventListener('resize', handleResize))
  } catch (e) {
    console.error('Playbook GSAP error:', e)
  }
})

const cleanups: (() => void)[] = []

onBeforeUnmount(() => {
  cleanups.forEach((fn) => fn())
  cleanups.length = 0
  if (animationTimeline) {
    animationTimeline.kill()
    animationTimeline = null
  }
  if (scrollTriggerInstance) {
    scrollTriggerInstance.kill()
    scrollTriggerInstance = null
  }
})
</script>

<template>
  <section ref="sectionRef" class="playbook-scroll-section" id="ecosystem-playbook">
    <!-- Sticky Centered Viewport Frame -->
    <div ref="stickyRef" class="playbook-sticky-frame">
      <!-- Section Header -->
      <div class="playbook-header">
        <span class="section-eyebrow">OMNICHANNEL ECOSYSTEM PLAYBOOK</span>
        <h2 class="playbook-title">Natively Connected to Your Modern Commerce Stack</h2>
        <p class="playbook-desc">
          As you scroll, watch the central Clickify Mate Swarm Core orchestrate social channels, storefronts, couriers, and payment engines into a unified ecosystem.
        </p>
      </div>

      <!-- Main Multi-Layer Grid Container -->
      <div class="playbook-grid-wrap">
        <div class="playbook-5x3-grid">
          
          <!-- ================= LAYER 1: Social DMs (Immediate Inner Ring) ================= -->
          <!-- Row 1, Col 2: WhatsApp -->
          <div class="playbook-grid-card layer-1 card-whatsapp pos-r1-c2">
            <div class="card-icon whatsapp-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.58 3.38 17.07L2.1 21.75C2.01 22.08 2.3 22.37 2.63 22.28L7.31 21C8.8 21.88 10.53 22.38 12.38 22.38C17.9 22.38 22.38 17.9 22.38 12.38C22.38 6.86 17.9 2 12 2Z" stroke="#25D366" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M17.5 14.4c-.3-.15-1.7-.84-2-.95-.26-.1-.45-.15-.64.15s-.74.95-.9 1.15c-.17.2-.33.22-.62.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.76-1.64-2.05-.17-.3-.02-.45.13-.6.13-.13.3-.34.45-.5.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.08-.15-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49-.17 0-.36-.02-.55-.02-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.08-.11-.27-.18-.56-.33z" fill="#25D366"/>
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Social Channel</span>
              <h4 class="card-name">WhatsApp Cloud</h4>
              <span class="card-sub">Official Meta API &bull; Green Badge</span>
            </div>
          </div>

          <!-- Row 1, Col 4: Instagram Direct -->
          <div class="playbook-grid-card layer-1 card-instagram pos-r1-c4">
            <div class="card-icon instagram-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke-width="2.5" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Social Channel</span>
              <h4 class="card-name">Instagram Direct</h4>
              <span class="card-sub">Comment-to-DM &bull; Stories</span>
            </div>
          </div>

          <!-- Row 3, Col 2: Messenger -->
          <div class="playbook-grid-card layer-1 card-messenger pos-r3-c2">
            <div class="card-icon messenger-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.4 5.5 3.8 7.2v3.6l3.5-1.9c.9.3 1.8.4 2.7.4 5.5 0 10-4.1 10-9.2C22 6.1 17.5 2 12 2z" fill="#0084FF" />
                <path d="M6.5 13.5l3.5-5.5 3 3 4.5-3-3.5 5.5-3-3-4.5 3z" fill="#FFFFFF" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Social Channel</span>
              <h4 class="card-name">Messenger</h4>
              <span class="card-sub">Page Inbox &bull; Ad Click Sync</span>
            </div>
          </div>

          <!-- Row 3, Col 4: Web Live Widget -->
          <div class="playbook-grid-card layer-1 card-widget pos-r3-c4">
            <div class="card-icon widget-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                <path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="2.5" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Social Channel</span>
              <h4 class="card-name">Store Web Chat</h4>
              <span class="card-sub">24/7 Real-Time Widget</span>
            </div>
          </div>

          <!-- ================= LAYER 2: E-Commerce Stores (Middle Ring) ================= -->
          <!-- Row 1, Col 3: Shopify -->
          <div class="playbook-grid-card layer-2 card-shopify pos-r1-c3">
            <div class="card-icon shopify-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5E8E3E" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Store Platform</span>
              <h4 class="card-name">Shopify Plus</h4>
              <span class="card-sub">Live 2-Way Catalog Sync</span>
            </div>
          </div>

          <!-- Row 3, Col 3: WooCommerce -->
          <div class="playbook-grid-card layer-2 card-woo pos-r3-c3">
            <div class="card-icon woo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#96588A" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1.5" />
                <circle cx="20" cy="21" r="1.5" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Store Platform</span>
              <h4 class="card-name">WooCommerce</h4>
              <span class="card-sub">Instant Webhook Orders</span>
            </div>
          </div>

          <!-- Row 2, Col 2: Headless API -->
          <div class="playbook-grid-card layer-2 card-graphql pos-r2-c2">
            <div class="card-icon api-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E535AB" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="3" r="2" />
                <circle cx="4" cy="19" r="2" />
                <circle cx="20" cy="19" r="2" />
                <line x1="12" y1="5" x2="4" y2="17" />
                <line x1="12" y1="5" x2="20" y2="17" />
                <line x1="6" y1="19" x2="18" y2="19" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Headless Store</span>
              <h4 class="card-name">GraphQL / REST</h4>
              <span class="card-sub">Custom Enterprise Storefront</span>
            </div>
          </div>

          <!-- Row 2, Col 4: Catalog CSV -->
          <div class="playbook-grid-card layer-2 card-csv pos-r2-c4">
            <div class="card-icon csv-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7B4C85" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Data Ingest</span>
              <h4 class="card-name">Catalog Embeddings</h4>
              <span class="card-sub">Vector Search Ready</span>
            </div>
          </div>

          <!-- ================= LAYER 3: Couriers & Payments (Outer Edge Ring) ================= -->
          <!-- Row 1, Col 1: Pathao Logistics -->
          <div class="playbook-grid-card layer-3 card-pathao pos-r1-c1">
            <div class="card-icon courier-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ED1C24" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Logistics API</span>
              <h4 class="card-name">Pathao Logistics</h4>
              <span class="card-sub">Automated Parcel Booking</span>
            </div>
          </div>

          <!-- Row 1, Col 5: bKash Merchant -->
          <div class="playbook-grid-card layer-3 card-bkash pos-r1-c5">
            <div class="card-icon payment-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E2136E" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <line x1="6" y1="15" x2="10" y2="15" />
                <line x1="14" y1="15" x2="18" y2="15" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Payment Gateway</span>
              <h4 class="card-name">bKash Merchant</h4>
              <span class="card-sub">One-Tap Dynamic Payment</span>
            </div>
          </div>

          <!-- Row 2, Col 1: Steadfast Courier -->
          <div class="playbook-grid-card layer-3 card-steadfast pos-r2-c1">
            <div class="card-icon courier-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#008848" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Logistics API</span>
              <h4 class="card-name">Steadfast Courier</h4>
              <span class="card-sub">Live Waybill Generation</span>
            </div>
          </div>

          <!-- Row 2, Col 5: Stripe Payments -->
          <div class="playbook-grid-card layer-3 card-stripe pos-r2-c5">
            <div class="card-icon payment-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#635BFF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M7 15h10M7 9h6" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Payment Gateway</span>
              <h4 class="card-name">Stripe Payments</h4>
              <span class="card-sub">Global Cards &bull; Apple Pay</span>
            </div>
          </div>

          <!-- Row 3, Col 1: RedX Delivery -->
          <div class="playbook-grid-card layer-3 card-redx pos-r3-c1">
            <div class="card-icon courier-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.2z" />
                <path d="M21 7v10" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Logistics API</span>
              <h4 class="card-name">RedX Delivery</h4>
              <span class="card-sub">Nationwide Doorstep Delivery</span>
            </div>
          </div>

          <!-- Row 3, Col 5: Verified COD -->
          <div class="playbook-grid-card layer-3 card-cod pos-r3-c5">
            <div class="card-icon cod-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div class="card-text">
              <span class="card-tag">Fraud Prevention</span>
              <h4 class="card-name">Verified COD</h4>
              <span class="card-sub">OTP Verified &bull; -78% Returns</span>
            </div>
          </div>

          <!-- ================= CENTER SCALER: Clickify Mate Orchestrator ================= -->
          <div class="scaler-grid-slot pos-r2-c3">
            <div ref="scalerRef" class="scaler-card">
              
              <!-- State A: Scaler Expanded Content (Visible initially, zooms down on scroll) -->
              <div class="scaler-expanded-content">
                <div class="expanded-top-bar">
                  <div class="hub-brand">
                    <span class="brand-title">Clickify Mate Swarm Core</span>
                  </div>
                </div>

                <div class="expanded-body">
                  <div class="expanded-left">
                    <h3 class="expanded-headline">The Central Nervous System for Omnichannel Commerce</h3>
                    <p class="expanded-sub">
                      Autonomous conversational AI that links your customer chats directly with stock inventory, instant checkout, and courier delivery APIs.
                    </p>
                    <div class="expanded-chips">
                      <span class="chip">Meta Cloud Tier-1</span>
                      <span class="chip">Vector Search RAG</span>
                      <span class="chip">Automated COD Dispatch</span>
                    </div>
                  </div>

                  <div class="expanded-right">
                    <div class="telemetry-terminal">
                      <div class="term-header">
                        <span class="term-title">orchestrator</span>
                      </div>
                      <div class="term-body">
                        <div class="t-line"><span class="t-time">00:01</span> [ROUTER] Inbound DM matched &rarr; WhatsApp #9482</div>
                        <div class="t-line"><span class="t-time">00:02</span> [DISCOVERY] Ingested 1,420 SKUs from Shopify Plus</div>
                        <div class="t-line"><span class="t-time">00:03</span> [PAYMENT] Verified COD Order #CM-88392</div>
                        <div class="t-line highlight"><span class="t-time">00:04</span> [LOGISTICS] Pathao Parcel Waybill #PT-77192 Generated</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="expanded-scroll-hint">
                  <span>&darr; Scroll down to see surrounding ecosystem blossom &darr;</span>
                </div>
              </div>

              <!-- State B: Scaler Compact Content (Visible once fully contracted into grid cell) -->
              <div class="scaler-compact-content">
                <div class="card-icon core-hub-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                  </svg>
                </div>
                <div class="card-text">
                  <span class="card-tag core-tag">Orchestration Core</span>
                  <h4 class="card-name">Clickify Mate</h4>
                  <span class="card-sub">Autonomous Swarm Brain</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Main 240vh Scroll Container */
.playbook-scroll-section {
  position: relative;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  min-height: 240vh;
  margin-bottom: 0;
  background: #FAF8FC;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: #341F37;
}

/* Pinned Frame centered in viewport */
.playbook-sticky-frame {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

/* Section Header */
.playbook-header {
  text-align: center;
  max-width: 780px;
  margin-bottom: clamp(36px, 5vh, 52px);
  position: relative;
  z-index: 25;
}

.section-eyebrow {
  display: inline-block;
  font-size: clamp(9px, 0.65vw + 7px, 11.5px);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7B4C85;
}

.playbook-title {
  font-size: clamp(18px, 2.2vw + 10px, 32px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0 0 8px;
}

.playbook-desc {
  font-size: clamp(12px, 0.7vw + 9px, 14.5px);
  line-height: 1.5;
  color: #5C4560;
  margin: 0;
}

/* Grid Wrapper */
.playbook-grid-wrap {
  position: relative;
  width: 100%;
  max-width: 1280px;
  height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 5-Column x 3-Row Grid */
.playbook-5x3-grid {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 16px;
  place-items: center;
}

/* Base Card Style */
.playbook-grid-card {
  width: 100%;
  height: 100%;
  max-height: 150px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(52, 31, 55, 0.05);
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  z-index: 2;
  will-change: transform, opacity;
}

.playbook-grid-card:hover {
  transform: translateY(-2px) scale(1.02);
  border-color: #7B4C85;
  box-shadow: 0 12px 28px rgba(123, 76, 133, 0.15);
}

.card-icon {
  width: 32px;
  height: 32px;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.card-tag {
  font-size: clamp(8px, 0.55vw + 6px, 10px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7B4C85;
}

.card-name {
  font-size: clamp(11px, 0.7vw + 8px, 14px);
  font-weight: 800;
  color: #341F37;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-sub {
  font-size: clamp(9px, 0.55vw + 7px, 11px);
  color: #7A627E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Explicit Grid Positions */
.pos-r1-c1 { grid-area: 1 / 1 / 2 / 2; }
.pos-r1-c2 { grid-area: 1 / 2 / 2 / 3; }
.pos-r1-c3 { grid-area: 1 / 3 / 2 / 4; }
.pos-r1-c4 { grid-area: 1 / 4 / 2 / 5; }
.pos-r1-c5 { grid-area: 1 / 5 / 2 / 6; }

.pos-r2-c1 { grid-area: 2 / 1 / 3 / 2; }
.pos-r2-c2 { grid-area: 2 / 2 / 3 / 3; }
.pos-r2-c3 { grid-area: 2 / 3 / 3 / 4; } /* CENTER */
.pos-r2-c4 { grid-area: 2 / 4 / 3 / 5; }
.pos-r2-c5 { grid-area: 2 / 5 / 3 / 6; }

.pos-r3-c1 { grid-area: 3 / 1 / 4 / 2; }
.pos-r3-c2 { grid-area: 3 / 2 / 4 / 3; }
.pos-r3-c3 { grid-area: 3 / 3 / 4 / 4; }
.pos-r3-c4 { grid-area: 3 / 4 / 4 / 5; }
.pos-r3-c5 { grid-area: 3 / 5 / 4 / 6; }

/* ========================================================
   CENTER SCALER ELEMENT
   ======================================================== */
.scaler-grid-slot {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.scaler-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(145deg, #FFFFFF 0%, #FAF5FC 100%);
  border: 1.5px solid rgba(123, 76, 133, 0.28);
  box-sizing: border-box;
  overflow: hidden;
  will-change: width, height, border-radius;
}

/* Expanded View inside Scaler */
.scaler-expanded-content {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 32px 36px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  will-change: opacity, transform;
}

.expanded-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hub-brand {
  display: flex;
  align-items: center;
}
.brand-title {
  font-size: clamp(12px, 0.9vw + 9px, 16px);
  font-weight: 800;
  color: #341F37;
}


.expanded-body {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  align-items: center;
}

.expanded-headline {
  font-size: clamp(16px, 1.8vw + 10px, 28px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0 0 10px;
}

.expanded-sub {
  font-size: clamp(12px, 0.7vw + 9px, 14.5px);
  line-height: 1.55;
  color: #5C4560;
  margin: 0 0 16px;
}

.expanded-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.chip {
  font-size: clamp(9px, 0.5vw + 7px, 11px);
  font-weight: 700;
  color: #7B4C85;
  padding: 3px 10px;
  border-radius: 6px;
}

.telemetry-terminal {
  background: #201323;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 14px;
  font-family: monospace;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
}

.term-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}
.term-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.term-dot.red { background: #EF4444; }
.term-dot.yellow { background: #F59E0B; }
.term-dot.green { background: #10B981; }
.term-title {
  font-size: clamp(8.5px, 0.5vw + 7px, 10px);
  color: #A994B2;
  margin-left: 4px;
}

.term-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: clamp(9px, 0.5vw + 7.5px, 11px);
}
.t-line { color: #E0D8EB; }
.t-time { color: #7B4C85; margin-right: 4px; }
.t-line.highlight { color: #70E2B8; font-weight: 700; }

.expanded-scroll-hint {
  text-align: center;
  font-size: clamp(9.5px, 0.55vw + 8px, 12px);
  font-weight: 700;
  color: #7B4C85;
  letter-spacing: 0.04em;
}

/* Compact View inside Scaler (When locked into center slot) */
.scaler-compact-content {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 16px 18px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 14px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  background: linear-gradient(135deg, #FAF4FC 0%, #FFFFFF 100%);
  border-radius: 16px;
  will-change: opacity;
  z-index: 4;
}

.core-hub-icon {
  width: 32px;
  height: 32px;
  background: transparent !important;
  color: #7B4C85;
  border: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: none !important;
}

.core-tag {
  color: #7B4C85 !important;
  font-weight: 800;
}

/* ============================================================
   TABLET RESPONSIVE VIEW (768px to 1100px)
   Full 5x3 Ecosystem Grid with Scaled Hub & Cards
   ============================================================ */
@media (min-width: 768px) and (max-width: 1100px) {
  .playbook-scroll-section {
    min-height: auto;
    margin-bottom: 0;
  }
  .playbook-sticky-frame {
    height: auto;
    min-height: auto;
    padding: calc(var(--nav-height, 64px) + 20px) 16px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    box-sizing: border-box;
  }
  .playbook-header {
    margin-bottom: 20px;
    max-width: 660px;
    text-align: center;
    position: relative;
    z-index: 25;
  }
  .playbook-title {
    font-size: clamp(20px, 2.5vw, 26px);
    margin-bottom: 6px;
  }
  .playbook-desc {
    font-size: clamp(12px, 1.1vw + 7px, 13.5px);
    line-height: 1.45;
  }
  .playbook-grid-wrap {
    max-width: min(860px, calc(100vw - 32px));
    width: 100%;
    height: 420px;
    margin: 0 auto;
    position: relative;
  }
  .playbook-5x3-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
    height: 100%;
  }
  .playbook-grid-card {
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 6px 8px;
    border-radius: 12px;
    gap: 6px;
    max-height: 105px;
  }
  .card-icon {
    width: 22px;
    height: 22px;
  }
  .card-icon svg {
    width: 18px;
    height: 18px;
  }
  .card-tag {
    font-size: clamp(7px, 0.7vw + 5px, 8px);
  }
  .card-name {
    font-size: clamp(10px, 0.9vw + 7px, 12px);
  }
  .card-sub {
    font-size: clamp(8px, 0.7vw + 6px, 9px);
  }
  .scaler-card {
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
  }
  .scaler-compact-content {
    padding: 6px 8px;
    gap: 6px;
  }
  .core-hub-icon {
    width: 22px;
    height: 22px;
  }
  .core-hub-icon svg {
    width: 18px;
    height: 18px;
  }
  .core-tag {
    font-size: clamp(7px, 0.7vw + 5px, 8px);
  }
  .scaler-expanded-content {
    padding: 16px 20px;
    box-sizing: border-box;
    width: 100%;
  }
  .brand-title {
    font-size: clamp(12px, 1.2vw + 8px, 14px);
  }
  .expanded-body {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
  }
  .expanded-left,
  .expanded-right {
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
  .expanded-headline {
    font-size: clamp(16px, 2vw + 10px, 20px);
    line-height: 1.2;
    margin-bottom: 6px;
  }
  .expanded-sub {
    font-size: clamp(11px, 0.9vw + 8px, 12.5px);
    line-height: 1.45;
    margin-bottom: 8px;
  }
  .expanded-chips {
    gap: 5px;
    flex-wrap: wrap;
  }
  .chip {
    font-size: clamp(8px, 0.6vw + 6px, 9.5px);
    padding: 2px 7px;
  }
  .telemetry-terminal {
    padding: 10px 12px;
    border-radius: 10px;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }
  .term-header {
    padding-bottom: 6px;
    margin-bottom: 6px;
  }
  .term-title {
    font-size: clamp(8px, 0.6vw + 6px, 9px);
  }
  .term-body {
    font-size: clamp(8px, 0.6vw + 6px, 9px);
    gap: 4px;
    width: 100%;
    overflow: hidden;
  }
  .t-line {
    font-size: clamp(8px, 0.6vw + 6px, 9px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    max-width: 100%;
  }
  .expanded-scroll-hint {
    font-size: clamp(9px, 0.7vw + 7px, 10.5px);
    margin-top: 4px;
  }
}

/* ============================================================
   MOBILE RESPONSIVE VIEW (<= 767px)
   Full 5x3 Ecosystem Grid with Scaled Hub, Telemetry, and Blossoms
   ============================================================ */
@media (max-width: 767px) {
  .playbook-scroll-section {
    min-height: auto;
    margin-bottom: 0;
  }
  .playbook-sticky-frame {
    height: auto;
    min-height: auto;
    padding: calc(env(safe-area-inset-top, 0px) + 20px) 10px 32px;
    justify-content: flex-start;
  }
  .playbook-header {
    margin-bottom: 34px;
    max-width: 350px;
    position: relative;
    z-index: 25;
  }
  .section-eyebrow {
    font-size: clamp(9px, 2.2vw, 10px);
    letter-spacing: 0.06em;
  }
  .playbook-title {
    font-size: clamp(17px, 4.5vw, 21px);
    line-height: 1.2;
    margin-bottom: 4px;
  }
  .playbook-desc {
    font-size: clamp(11px, 2.8vw, 12.5px);
    line-height: 1.35;
    max-width: 320px;
    margin: 0 auto;
  }
  .playbook-grid-wrap {
    width: 100%;
    max-width: 355px;
    height: 230px;
    margin: 0 auto;
  }
  .playbook-5x3-grid {
    gap: 4px;
  }
  .playbook-grid-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4px 2px;
    border-radius: 8px;
    gap: 2px;
    max-height: unset;
    box-shadow: 0 4px 10px rgba(52, 31, 55, 0.04);
  }
  .card-icon {
    width: 20px;
    height: 20px;
  }
  .card-icon svg {
    width: 16px;
    height: 16px;
  }
  .card-text {
    align-items: center;
    gap: 0;
    max-width: 100%;
  }
  .card-tag {
    display: none;
  }
  .card-name {
    font-size: clamp(7.5px, 2vw, 8.5px);
    font-weight: 700;
    line-height: 1.1;
    max-width: 58px;
    text-align: center;
  }
  .card-sub {
    display: none;
  }
  .scaler-compact-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4px 2px;
    gap: 2px;
    border-radius: 8px;
  }
  .core-hub-icon {
    width: 20px;
    height: 20px;
  }
  .core-hub-icon svg {
    width: 16px;
    height: 16px;
  }
  .core-tag {
    display: none;
  }
  .scaler-compact-content .card-name {
    font-size: clamp(8px, 2.1vw, 9px);
    font-weight: 800;
    color: #7B4C85;
    line-height: 1.1;
  }
  .scaler-compact-content .card-sub {
    display: none;
  }
  .scaler-expanded-content {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .expanded-top-bar {
    margin-bottom: 2px;
  }
  .brand-title {
    font-size: clamp(11.5px, 2.8vw, 12.5px);
  }
  .expanded-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .expanded-headline {
    font-size: clamp(13px, 3.2vw, 15px);
    font-weight: 800;
    line-height: 1.2;
    margin: 0;
  }
  .expanded-sub {
    display: none;
  }
  .expanded-chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .chip {
    font-size: clamp(7px, 1.8vw, 8px);
    padding: 2px 5px;
    border-radius: 4px;
  }
  .telemetry-terminal {
    padding: 6px 8px;
    border-radius: 7px;
  }
  .term-header {
    gap: 4px;
    padding-bottom: 3px;
    margin-bottom: 3px;
  }
  .term-dot {
    width: 5px;
    height: 5px;
  }
  .term-title {
    font-size: clamp(7px, 1.8vw, 7.5px);
  }
  .term-body {
    font-size: clamp(7.5px, 2vw, 8px);
    gap: 2.5px;
  }
  .t-line {
    font-size: clamp(7.5px, 2vw, 8px);
    line-height: 1.2;
  }
  .expanded-scroll-hint {
    font-size: clamp(8.5px, 2.2vw, 9.5px);
    margin-top: 3px;
  }
}
</style>
