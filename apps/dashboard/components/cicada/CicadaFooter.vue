<template>
  <footer class="cicada-footer-section">
    <!-- Ambient Backdrop Glow -->
    <div class="footer-ambient-glow"></div>

    <div class="cicada-footer-wrapper">
      <!-- Top Floating Liquid Glass CTA Card -->
      <div class="cicada-footer-cta-card">
        <div class="footer-cta-content">
         
          <h2 class="footer-cta-title">
            Ready to unlock autonomous selling for your business?
          </h2>
          <p class="footer-cta-desc">
            Deploy intelligent AI sales agents across WhatsApp, Instagram, and Facebook in minutes. Sync your real-time catalog and capture every checkout 24/7.
          </p>
        </div>
        <div class="footer-cta-actions">
          <NuxtLink to="/dashboard" class="footer-primary-btn">
            <span>Start Free Trial</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </NuxtLink>
          <NuxtLink to="/login" class="footer-secondary-btn">
            Request Custom Demo
          </NuxtLink>
        </div>
      </div>

      <!-- Main Liquid Glass Grid Card -->
      <div class="cicada-footer-main-card">
        <div class="cicada-footer-grid">
          <!-- Brand Info Column -->
          <div class="footer-col footer-col-brand">
            <div class="footer-logo">
              <span class="logo-text">Clickify Mate<span class="logo-dot">.</span></span>
            </div>
            <p class="footer-tagline">
              Autonomous conversational AI infrastructure built for social sellers, creators, and modern omnichannel e-commerce brands.
            </p>
           
            <div class="footer-compliance-badges">
              <span class="compliance-tag">SOC2 Type II</span>
              <span class="compliance-tag">GDPR Compliant</span>
              <span class="compliance-tag">Meta Official API</span>
            </div>
          </div>

          <!-- Product & Features -->
          <div class="footer-col">
            <h3 class="footer-col-heading">Platform &amp; Features</h3>
            <ul class="footer-links">
              <li><NuxtLink to="/features#overview">Platform Overview</NuxtLink></li>
              <li><NuxtLink to="/features#swarms">Autonomous Sales Swarm</NuxtLink></li>
              <li><NuxtLink to="/features#whatsapp">WhatsApp Catalog Engine</NuxtLink></li>
              <li><NuxtLink to="/features#instagram">Instagram Direct AI</NuxtLink></li>
              <li><NuxtLink to="/features#attribution">Attribution Analytics</NuxtLink></li>
            </ul>
          </div>

          <!-- Solutions & Use Cases -->
          <div class="footer-col">
            <h3 class="footer-col-heading">Solutions</h3>
            <ul class="footer-links">
              <li><NuxtLink to="/solutions#social-sellers">Social Sellers &amp; Creators</NuxtLink></li>
              <li><NuxtLink to="/solutions#comment-to-dm">Comment-to-DM Checkout</NuxtLink></li>
              <li><NuxtLink to="/solutions#whatsapp-storefronts">WhatsApp Storefronts</NuxtLink></li>
              <li><NuxtLink to="/solutions#enterprise">Enterprise Retail Swarms</NuxtLink></li>
              <li><NuxtLink to="/solutions#cod-verification">COD Verification</NuxtLink></li>
            </ul>
          </div>

          <!-- Company & Resources -->
          <div class="footer-col">
            <h3 class="footer-col-heading">Company</h3>
            <ul class="footer-links">
              <li><NuxtLink to="/blog">Blog &amp; Playbooks</NuxtLink></li>
              <li><NuxtLink to="/contact">Contact Sales &amp; Support</NuxtLink></li>
              <li><NuxtLink to="/login">Sign In to Console</NuxtLink></li>
              <li><NuxtLink to="/privacy">Privacy Policy</NuxtLink></li>
              <li><NuxtLink to="/terms">Terms of Service</NuxtLink></li>
              <li><NuxtLink to="/dashboard">Live App Demo</NuxtLink></li>
            </ul>
          </div>
        </div>

        <!-- Bottom Sub-footer -->
        <div class="cicada-footer-bottom">
          <div class="footer-bottom-left">
            <span>&copy; {{ new Date().getFullYear() }} Clickify Mate Inc. All rights reserved.</span>
            <span class="footer-sep">•</span>
            <span>Built with modern conversational AI infrastructure</span>
          </div>
          <div class="footer-bottom-right">
            <button type="button" class="back-to-top-btn" @click="emit('scrollTop')">
              <span>Back to top</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'scrollTop'): void
}>()
</script>

<style scoped>
.cicada-footer-section {
  position: relative;
  z-index: 20;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  background: #ECE5F3;
  border-top: 1px solid rgba(255, 255, 255, 0.8);
  padding: 60px 24px 40px;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  font-size: 15px;
  line-height: 1.5;
  color: #341F37;
  overflow: hidden;
}

.footer-ambient-glow {
  position: absolute;
  top: -120px;
  left: 50%;
  width: 100%;
  max-width: 1200px;
  height: 350px;
  background: radial-gradient(circle, rgba(123, 76, 133, 0.18) 0%, rgba(224, 216, 235, 0) 70%);
  filter: blur(80px);
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 0;
}

.cicada-footer-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

/* Liquid Glass CTA Card */
.cicada-footer-cta-card {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 36px;
  padding: 36px 42px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 22px;
  box-shadow: 0 16px 36px 0 rgba(84, 51, 89, 0.08),
              inset 0 1px 2px 0 rgba(255, 255, 255, 1);
}

.footer-cta-content {
  max-width: 750px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-cta-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: #341F37;
  margin: 0;
}

.footer-cta-desc {
  font-size: 15px;
  line-height: 1.55;
  color: #5C4560;
  margin: 0;
}

.footer-cta-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 220px;
  flex-shrink: 0;
}

.footer-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 26px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #341F37 0%, #543359 50%, #7B4C85 100%);
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 20px rgba(52, 31, 55, 0.22);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.footer-primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(52, 31, 55, 0.3);
  filter: brightness(1.08);
}

.footer-secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 22px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.85);
  color: #341F37;
  font-size: 14.5px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(84, 51, 89, 0.15);
  transition: all 0.25s ease;
  cursor: pointer;
}

.footer-secondary-btn:hover {
  background: #FFFFFF;
  border-color: #7B4C85;
  color: #7B4C85;
}

/* Main Liquid Glass Grid Card */
.cicada-footer-main-card {
  width: 100%;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 22px;
  padding: 38px 42px 28px;
  box-shadow: 0 16px 36px 0 rgba(84, 51, 89, 0.06),
              inset 0 1px 2px 0 rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cicada-footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 32px;
  align-items: start;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.footer-logo {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #341F37;
  line-height: 1;
}

.logo-dot {
  color: #7B4C85;
}

.footer-tagline {
  font-size: 14px;
  line-height: 1.55;
  color: #5C4560;
  max-width: 340px;
  margin: 0;
}

.footer-compliance-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.compliance-tag {
  font-size: 11px;
  font-weight: 700;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  border: 1px solid rgba(123, 76, 133, 0.15);
  padding: 3px 8px;
  border-radius: 6px;
}

.footer-col-heading {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #7B4C85;
  margin: 0 0 4px 0;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.footer-links li {
  margin: 0;
  padding: 0;
  display: block;
}

.footer-links a {
  font-size: 14px;
  font-weight: 500;
  color: #4A334E;
  text-decoration: none;
  transition: all 0.2s ease;
  display: inline-block;
  line-height: 1.4;
}

.footer-links a:hover {
  color: #7B4C85;
  transform: translateX(2px);
}

/* Bottom Bar */
.cicada-footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  line-height: 1.4;
  color: #7A627E;
  border-top: 1px solid rgba(52, 31, 55, 0.08);
  padding-top: 20px;
}

.footer-bottom-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-sep {
  opacity: 0.5;
}

.back-to-top-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(84, 51, 89, 0.12);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 600;
  color: #341F37;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-to-top-btn:hover {
  background: #FFFFFF;
  border-color: #7B4C85;
  color: #7B4C85;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(84, 51, 89, 0.1);
}

@media (max-width: 1024px) {
  .cicada-footer-cta-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .cicada-footer-grid {
    grid-template-columns: 1fr 1fr;
  }
  .cicada-footer-bottom {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .cicada-footer-section {
    padding: 30px 16px 24px;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }
  .cicada-footer-wrapper {
    width: 100%;
    gap: 16px;
  }
  .cicada-footer-cta-card {
    padding: 22px 18px;
    gap: 16px;
    border-radius: 18px;
  }
  .footer-cta-title {
    font-size: 20px;
    line-height: 1.25;
  }
  .footer-cta-desc {
    font-size: 13.5px;
    line-height: 1.5;
  }
  .footer-cta-actions {
    width: 100%;
    min-width: unset;
    gap: 8px;
  }
  .footer-primary-btn,
  .footer-secondary-btn {
    width: 100%;
    box-sizing: border-box;
    font-size: 14.5px;
    padding: 12px 18px;
  }
  .cicada-footer-main-card {
    padding: 22px 18px;
    gap: 18px;
    border-radius: 18px;
  }
  .cicada-footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 20px 12px;
  }
  .footer-col-brand {
    grid-column: 1 / -1;
    gap: 8px;
    border-bottom: 1px solid rgba(52, 31, 55, 0.08);
    padding-bottom: 14px;
    margin-bottom: 2px;
  }
  .footer-logo {
    font-size: 20px;
  }
  .footer-tagline {
    font-size: 13px;
    max-width: 100%;
    line-height: 1.45;
  }
  .compliance-tag {
    font-size: 11px;
    padding: 2px 6px;
  }
  .footer-col-heading {
    font-size: 12.5px;
    margin-bottom: 2px;
  }
  .footer-links a {
    font-size: 13.5px;
  }
  .cicada-footer-bottom {
    font-size: 12px;
    padding-top: 14px;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .footer-bottom-left {
    font-size: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .footer-sep {
    display: none;
  }
  .back-to-top-btn {
    font-size: 12px;
    padding: 6px 12px;
    align-self: flex-start;
  }
}
</style>
