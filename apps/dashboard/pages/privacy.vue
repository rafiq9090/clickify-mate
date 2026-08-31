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
        <span class="page-badge">LEGAL COMPLIANCE</span>
        <h1 class="page-hero-title">
          Privacy <span>Policy</span>
        </h1>
        <p class="page-hero-subtitle">
          Last updated: August 2026. Learn how Clickify Mate protects your merchant data, customer chat logs, and adheres strictly to Meta Platform terms and international data privacy regulations.
        </p>
      </section>

      <!-- Privacy Content Card -->
      <section class="legal-card-section">
        <div class="legal-card">
          <!-- Table of Contents -->
          <div class="legal-toc">
            <span class="toc-title">Quick Navigation</span>
            <div class="toc-links">
              <a href="#overview" class="toc-link">1. Overview &amp; Scope</a>
              <a href="#data-collection" class="toc-link">2. Information We Collect</a>
              <a href="#meta-apis" class="toc-link">3. Meta API &amp; Messaging Compliance</a>
              <a href="#how-we-use" class="toc-link">4. How Information Is Used</a>
              <a href="#storage-security" class="toc-link">5. Data Storage &amp; Encryption</a>
              <a href="#retention-deletion" class="toc-link">6. Data Retention &amp; Erasure Rights</a>
              <a href="#subprocessors" class="toc-link">7. Third-Party Subprocessors</a>
              <a href="#merchant-responsibilities" class="toc-link">8. Merchant Obligations (GDPR / CCPA)</a>
              <a href="#contact-dpo" class="toc-link">9. Data Protection Contact</a>
            </div>
          </div>

          <!-- Legal Sections Body -->
          <div class="legal-body">
            <section id="overview" class="legal-section">
              <h2 class="section-title">1. Overview &amp; Scope</h2>
              <p>
                Clickify Mate ("Clickify", "we", "us", or "our") provides an autonomous AI conversational commerce platform that connects merchants with customers on WhatsApp Business, Instagram Direct, and Facebook Pages. This Privacy Policy applies to all merchants, business partners, and authorized users who access our web applications, APIs, and AI selling swarms.
              </p>
              <p>
                As a merchant utilizing Clickify Mate, you remain the Data Controller of your customer records and messaging conversations. Clickify Mate acts as a Data Processor, executing automated sales, catalog queries, and checkout processes strictly under your authorization and configuration.
              </p>
            </section>

            <section id="data-collection" class="legal-section">
              <h2 class="section-title">2. Information We Collect</h2>
              <p>To deliver automated conversational selling, we collect and process the following categories of data:</p>
              <ul class="legal-list">
                <li><strong>Merchant Account Information:</strong> Business name, email address, billing details, store URL, and authentication credentials.</li>
                <li><strong>Connected Social Identifiers:</strong> Meta Page IDs, WhatsApp Business Account IDs (WABA), Instagram Direct Scoped User IDs (IGSID), and access tokens.</li>
                <li><strong>Product Catalog Data:</strong> Product titles, descriptions, SKU variants, real-time inventory counts, and pricing rules synchronized from your Shopify, WooCommerce, or custom ERP systems.</li>
                <li><strong>Customer Conversation Data:</strong> Customer chat messages, intent classifications, selected product inquiries, shipping address submissions, and order checkout references.</li>
                <li><strong>Payment &amp; Transaction References:</strong> Hosted payment transaction IDs, COD phone verification logs, and order status timestamps. <em>(Note: Clickify Mate never stores raw customer credit card numbers or CVVs; all payment processing is handled through certified PCI-DSS Level 1 payment gateways such as Stripe or merchant payment gateways.)</em></li>
              </ul>
            </section>

            <section id="meta-apis" class="legal-section">
              <h2 class="section-title">3. Meta API &amp; Messaging Compliance</h2>
              <p>
                Clickify Mate integrates exclusively with official Meta Graph APIs and Cloud APIs through certified Business Solution Provider (BSP) infrastructure. We strictly enforce Meta’s Developer Policies and WhatsApp Business Messaging Policies:
              </p>
              <ul class="legal-list">
                <li>We do not send unsolicited bulk marketing messages (spam) or bypass 24-hour messaging window constraints without approved utility/authentication templates.</li>
                <li>All customer opt-ins and comment triggers (e.g., commenting "PRICE" on a merchant's reel) are logged with verifiable timestamps.</li>
                <li>Customer opt-out requests (e.g., messaging "STOP" or "UNSUBSCRIBE") are processed instantaneously by our swarm routers, immediately halting automated outreach.</li>
              </ul>
            </section>

            <section id="how-we-use" class="legal-section">
              <h2 class="section-title">4. How Information Is Used</h2>
              <p>We process data exclusively for legitimate operational purposes:</p>
              <ul class="legal-list">
                <li>Delivering autonomous, low-latency AI responses to shopper inquiries.</li>
                <li>Searching vector product catalogs to match customer intent with available warehouse inventory.</li>
                <li>Generating customized 1-click in-chat checkout invoices and automated COD phone confirmation prompts.</li>
                <li>Providing attribution analytics to merchants measuring sales lift, agent response speed, and channel ROI.</li>
                <li>Detecting fraud, preventing platform abuse, and maintaining 99.99% system uptime SLA.</li>
              </ul>
            </section>

            <section id="storage-security" class="legal-section">
              <h2 class="section-title">5. Data Storage &amp; Encryption</h2>
              <p>
                We implement industry-standard technical and organizational security controls:
              </p>
              <ul class="legal-list">
                <li><strong>Encryption in Transit:</strong> All data transmitted between user browsers, Meta servers, e-commerce engines, and Clickify Mate APIs is encrypted using TLS 1.3.</li>
                <li><strong>Encryption at Rest:</strong> Merchant database records, access tokens, and vector embeddings are stored using AES-256 encryption.</li>
                <li><strong>Role-Based Access Control (RBAC):</strong> Strict principle of least privilege governs internal engineering access with multi-factor authentication (MFA) and immutable audit logging.</li>
              </ul>
            </section>

            <section id="retention-deletion" class="legal-section">
              <h2 class="section-title">6. Data Retention &amp; Erasure Rights</h2>
              <p>
                We retain merchant and customer conversation data only for as long as necessary to fulfill the operational purposes described in this policy or to comply with statutory legal requirements.
              </p>
              <p>
                Merchants have the right to request a complete export or permanent deletion of their store data at any time via the Command Console or by contacting support. Upon account termination, all active credentials, catalog vectors, and conversation logs are permanently purged from active servers within 30 days.
              </p>
            </section>

            <section id="subprocessors" class="legal-section">
              <h2 class="section-title">7. Third-Party Subprocessors</h2>
              <p>
                We partner with select third-party infrastructure and service providers to operate our platform. Each subprocessor is bound by rigorous Data Processing Agreements (DPAs):
              </p>
              <ul class="legal-list">
                <li><strong>Meta Platforms, Inc.:</strong> WhatsApp Business API and Instagram Direct message delivery.</li>
                <li><strong>Cloud Infrastructure Providers:</strong> Secure database hosting, vector database indexing, and serverless compute.</li>
                <li><strong>Payment Gateways (e.g., Stripe):</strong> Hosted tokenized payment processing and checkout verification.</li>
              </ul>
            </section>

            <section id="merchant-responsibilities" class="legal-section">
              <h2 class="section-title">8. Merchant Obligations (GDPR / CCPA)</h2>
              <p>
                As a merchant, you are responsible for ensuring that your collection and processing of customer data complies with applicable data protection laws, including the European Union General Data Protection Regulation (GDPR), the UK GDPR, and the California Consumer Privacy Act (CCPA):
              </p>
              <ul class="legal-list">
                <li>You must maintain an accessible privacy policy informing end customers of how their personal data is processed through social channels.</li>
                <li>You must have a lawful basis for initiating conversations and processing orders via WhatsApp or Instagram.</li>
              </ul>
            </section>

            <section id="contact-dpo" class="legal-section">
              <h2 class="section-title">9. Data Protection Contact</h2>
              <p>
                If you have questions, concerns, or data subject requests regarding this Privacy Policy, please contact our Data Protection Office:
              </p>
              <div class="contact-box">
                <p><strong>Clickify Mate Privacy &amp; Data Protection Office</strong></p>
                <p>Email: <a href="mailto:privacy@clickifymate.com">privacy@clickifymate.com</a></p>
                <p>Enterprise Support Desk: <NuxtLink to="/contact">clickifymate.com/contact</NuxtLink></p>
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
  title: 'Privacy Policy — Clickify Mate',
  meta: [
    { name: 'description', content: 'Learn how Clickify Mate protects merchant data, ensures Meta API compliance, and secures customer conversational commerce.' }
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
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
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
