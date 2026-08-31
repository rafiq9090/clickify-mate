<template>
  <div class="cicada-page-wrapper">
    <!-- Mobile Navigation Drawer -->
    <CicadaDrawerMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <!-- Navbar -->
    <CicadaNavbar @toggle-menu="isMenuOpen = !isMenuOpen" />

    <!-- Main Content -->
    <main class="page-main-content">
      <!-- Hero Header -->
      <section class="page-hero-section">
        <span class="page-badge">TERMS &amp; CONDITIONS</span>
        <h1 class="page-hero-title">
          Terms of <span>Service</span>
        </h1>
        <p class="page-hero-subtitle">
          Last updated: August 2026. Please read these terms carefully before accessing Clickify Mate's multi-agent conversational commerce platform, APIs, and automated checkout services.
        </p>
      </section>

      <!-- Terms Content Card -->
      <section class="legal-card-section">
        <div class="legal-card">
          <!-- Table of Contents -->
          <div class="legal-toc">
            <span class="toc-title">Quick Navigation</span>
            <div class="toc-links">
              <a href="#acceptance" class="toc-link">1. Acceptance of Terms</a>
              <a href="#service-license" class="toc-link">2. Platform License &amp; Scope</a>
              <a href="#acceptable-use" class="toc-link">3. Acceptable Use Policy</a>
              <a href="#meta-compliance" class="toc-link">4. Meta API Terms Compliance</a>
              <a href="#billing-plans" class="toc-link">5. Subscription, Billing &amp; Refunds</a>
              <a href="#sla-uptime" class="toc-link">6. Service Level Agreement (SLA)</a>
              <a href="#ip-ownership" class="toc-link">7. Intellectual Property &amp; Data</a>
              <a href="#liability-warranty" class="toc-link">8. Limitation of Liability</a>
              <a href="#termination" class="toc-link">9. Account Termination</a>
              <a href="#governing-law" class="toc-link">10. Governing Law &amp; Disputes</a>
            </div>
          </div>

          <!-- Legal Sections Body -->
          <div class="legal-body">
            <section id="acceptance" class="legal-section">
              <h2 class="section-title">1. Acceptance of Terms</h2>
              <p>
                By creating an account, connecting your Meta business assets, or utilizing any services provided by Clickify Mate ("Clickify Mate", "we", "us", or "our"), you ("Merchant", "User", or "Customer") agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or legal entity, you represent that you possess the authority to bind such entity.
              </p>
            </section>

            <section id="service-license" class="legal-section">
              <h2 class="section-title">2. Platform License &amp; Scope</h2>
              <p>
                Clickify Mate grants you a non-exclusive, non-transferable, revocable license to access our cloud-based SaaS platform for managing automated social commerce swarms, AI consultative sales bots, catalog vector sync, and checkout flows across WhatsApp Business, Instagram Direct, and Facebook Pages.
              </p>
              <p>
                You may not reverse-engineer, decompile, resell, sub-license, or scrape the platform or its underlying vector embedding models without express prior written consent.
              </p>
            </section>

            <section id="acceptable-use" class="legal-section">
              <h2 class="section-title">3. Acceptable Use Policy</h2>
              <p>You agree not to use Clickify Mate to:</p>
              <ul class="legal-list">
                <li>Send unsolicited messages, bulk spam, or deceptive marketing promotions.</li>
                <li>Sell prohibited, counterfeit, or regulated goods (including illegal substances, weapons, or unauthorized pharmaceutical items) in violation of local laws or Meta commerce policies.</li>
                <li>Impersonate individuals or misrepresent affiliations with third-party brands.</li>
                <li>Attempt to bypass message rate limits, security tokens, or webhook endpoints.</li>
              </ul>
            </section>

            <section id="meta-compliance" class="legal-section">
              <h2 class="section-title">4. Meta API Terms Compliance</h2>
              <p>
                Clickify Mate operates in full alignment with official Meta Cloud APIs and WhatsApp Business Terms. You acknowledge that your continued access requires maintaining good standing with Meta. Clickify Mate is not liable for merchant account restrictions imposed directly by Meta resulting from merchant policy violations, excessive spam reports, or unapproved template broadcasts.
              </p>
            </section>

            <section id="billing-plans" class="legal-section">
              <h2 class="section-title">5. Subscription, Billing &amp; Refunds</h2>
              <p>
                Services are billed on a recurring monthly or annual subscription basis according to your chosen plan tier and conversational volume.
              </p>
              <ul class="legal-list">
                <li><strong>Free Trial:</strong> New accounts may receive access to trial tiers with sandbox tokens and message allowances.</li>
                <li><strong>Overage Billing:</strong> Conversations exceeding plan allocations will be billed at the standard rate per active conversation.</li>
                <li><strong>Cancellations:</strong> You may cancel your subscription at any time through the Command Console. Cancellation takes effect at the end of the current paid billing cycle.</li>
              </ul>
            </section>

            <section id="sla-uptime" class="legal-section">
              <h2 class="section-title">6. Service Level Agreement (SLA)</h2>
              <p>
                We strive to provide 99.99% platform availability for enterprise tier merchants. Scheduled maintenance windows will be communicated in advance. For mission-critical SLA inquiries or dedicated support tiers, please refer to our <NuxtLink to="/contact">Enterprise Service Agreement</NuxtLink>.
              </p>
            </section>

            <section id="ip-ownership" class="legal-section">
              <h2 class="section-title">7. Intellectual Property &amp; Data Ownership</h2>
              <p>
                You retain complete ownership of all merchant product catalogs, brand imagery, customer lists, and business trade secrets. Clickify Mate retains ownership of its platform software, swarm routing algorithms, UI components, and proprietary AI orchestration pipelines.
              </p>
            </section>

            <section id="liability-warranty" class="legal-section">
              <h2 class="section-title">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Clickify Mate and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities arising out of your use of the platform.
              </p>
            </section>

            <section id="termination" class="legal-section">
              <h2 class="section-title">9. Account Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate our Acceptable Use Policy, engage in fraudulent transactions, or compromise system stability. Upon termination, access to the Command Console is revoked and data retention policies apply.
              </p>
            </section>

            <section id="governing-law" class="legal-section">
              <h2 class="section-title">10. Governing Law &amp; Disputes</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws applicable to commercial software agreements. Any disputes shall be resolved through good-faith negotiations or binding arbitration.
              </p>
              <div class="contact-box">
                <p><strong>Clickify Mate Legal Department</strong></p>
                <p>Email: <a href="mailto:legal@clickifymate.com">legal@clickifymate.com</a></p>
                <p>Inquiries: <NuxtLink to="/contact">clickifymate.com/contact</NuxtLink></p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>

    <!-- Unified Footer -->
    <CicadaFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CicadaNavbar from '~/components/cicada/CicadaNavbar.vue'
import CicadaDrawerMenu from '~/components/cicada/CicadaDrawerMenu.vue'
import CicadaFooter from '~/components/cicada/CicadaFooter.vue'

const isMenuOpen = ref(false)

useHead({
  title: 'Terms of Service — Clickify Mate',
  meta: [
    { name: 'description', content: 'Review the Terms of Service governing your use of Clickify Mate autonomous selling swarms and APIs.' }
  ]
})
</script>

<style scoped>
.cicada-page-wrapper {
  min-height: 100vh;
  background-color: #FAF8FC;
  color: #341F37;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  position: relative;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.page-main-content {
  flex: 1;
  padding: 110px 24px 70px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.page-hero-section {
  text-align: center;
  margin-bottom: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.page-badge {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  border: 1px solid rgba(123, 76, 133, 0.2);
  padding: 6px 16px;
  border-radius: 9999px;
}

.page-hero-title {
  font-size: 46px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: #341F37;
  margin: 0;
  line-height: 1.18;
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

.legal-card-section {
  width: 100%;
}

.legal-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 20px 48px 0 rgba(84, 51, 89, 0.06);
  padding: 40px;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 48px;
  align-items: start;
}

.legal-toc {
  position: sticky;
  top: 100px;
  background: rgba(123, 76, 133, 0.04);
  border: 1px solid rgba(123, 76, 133, 0.12);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toc-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7B4C85;
}

.toc-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toc-link {
  font-size: 13px;
  color: #5C4560;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
  line-height: 1.4;
}

.toc-link:hover {
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
}

.legal-body {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.legal-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-margin-top: 120px;
}

.section-title {
  font-size: 22px;
  font-weight: 800;
  color: #341F37;
  letter-spacing: -0.01em;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(84, 51, 89, 0.08);
}

.legal-section p {
  font-size: 15px;
  line-height: 1.65;
  color: #5C4560;
  margin: 0;
}

.legal-list {
  margin: 0;
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legal-list li {
  font-size: 14.5px;
  line-height: 1.6;
  color: #5C4560;
}

.contact-box {
  margin-top: 12px;
  padding: 20px 24px;
  background: rgba(123, 76, 133, 0.06);
  border: 1px solid rgba(123, 76, 133, 0.15);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contact-box p {
  font-size: 13.5px;
  color: #341F37;
  margin: 0;
}

.contact-box a {
  color: #7B4C85;
  font-weight: 700;
  text-decoration: underline;
}

@media (max-width: 960px) {
  .legal-card {
    grid-template-columns: 1fr;
  }
  .legal-toc {
    display: none;
  }
}

@media (max-width: 768px) {
  .page-main-content {
    padding: 72px 10px 36px;
    width: 100%;
    max-width: 100vw;
  }
  .page-hero-title {
    font-size: 28px;
    line-height: 1.2;
  }
  .page-hero-subtitle {
    font-size: 14.5px;
    line-height: 1.5;
  }
  .legal-card {
    padding: 18px 12px;
    border-radius: 18px;
  }
  .section-title {
    font-size: 19px;
  }
  .legal-section p,
  .legal-list li {
    font-size: 14px;
    line-height: 1.55;
  }
}
</style>
