<template>
  <section id="integrations" class="cicada-stack-item">
    <div class="glass-integrations-card">
      <div class="section-header-centered">
        <span class="section-badge">OMNICHANNEL ECOSYSTEM</span>
        <h2 class="section-title">Natively Connected to Your Modern Stack</h2>
        <p class="section-desc">Zero code setup across Meta official APIs, e-commerce engines, payment gateways, and shipping providers.</p>
      </div>

      <div class="integrations-grid">
        <div class="integration-pill">
          <div class="integration-meta">
            <span class="integration-name">WhatsApp Cloud API</span>
            <span class="integration-sub">Official Meta BSP</span>
          </div>
        </div>

        <div class="integration-pill">
          <div class="integration-meta">
            <span class="integration-name">Instagram Direct</span>
            <span class="integration-sub">Story &amp; Post AI</span>
          </div>
        </div>

        <div class="integration-pill">
          <div class="integration-meta">
            <span class="integration-name">Facebook Messenger</span>
            <span class="integration-sub">Comment Auto-Reply</span>
          </div>
        </div>

        <div class="integration-pill">
          <div class="integration-meta">
            <span class="integration-name">Shopify Store</span>
            <span class="integration-sub">Real-Time Vector Sync</span>
          </div>
        </div>

        <div class="integration-pill">
          <div class="integration-meta">
            <span class="integration-name">WooCommerce</span>
            <span class="integration-sub">Full Product &amp; Order Sync</span>
          </div>
        </div>

        <div class="integration-pill">
          <div class="integration-meta">
            <span class="integration-name">Stripe &amp; In-Chat Pay</span>
            <span class="integration-sub">Instant 1-Click Settlement</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Stateless Integrations Ecosystem Component
</script>

<style scoped>
.cicada-stack-item {
  width: 100%;
  height: 100%;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: var(--main-font, "Work Sans", sans-serif);
  color: #341F37;
}

.glass-integrations-card {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.2);
  border-radius: 0.32rem;
  padding: 0.45rem 0.6rem;
  box-shadow: 0 24px 60px -12px rgba(52, 31, 55, 0.12),
              inset 0 1px 2px 0 rgba(255, 255, 255, 1);
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  width: 100%;
  height: 100%;
  justify-content: center;
}

.section-header-centered {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;
}

.section-badge {
  font-size: 0.15rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #7B4C85;
  text-transform: uppercase;
}

.section-title {
  font-size: 0.38rem;
  font-weight: 800;
  letter-spacing: -0.015rem;
  color: #341F37;
  margin: 0;
  line-height: 1.2;
}

.section-desc {
  font-size: 0.19rem;
  color: #5C4560;
  margin: 0;
  max-width: 8rem;
}

.integrations-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.2rem;
}

.integration-pill {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 0.18rem;
  padding: 0.22rem 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  box-shadow: 0 10px 24px 0 rgba(84, 51, 89, 0.04);
  transition: all 0.25s ease;
}

.integration-pill:hover {
  transform: translateY(-2px);
  background: #FFFFFF;
  border-color: rgba(123, 76, 133, 0.25);
  box-shadow: 0 16px 36px rgba(84, 51, 89, 0.08);
}

.integration-meta {
  display: flex;
  flex-direction: column;
  gap: 0.04rem;
}

.integration-name {
  font-size: 0.21rem;
  font-weight: 700;
  color: #341F37;
}

.integration-sub {
  font-size: 0.165rem;
  color: #6E5373;
}

@media (max-width: 1024px) {
  .integrations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .glass-integrations-card {
    padding: 0.28rem 0.2rem;
    gap: 0.2rem;
    justify-content: flex-start;
  }
  .section-title {
    font-size: 0.24rem;
  }
  .section-desc {
    font-size: 0.15rem;
  }
  .section-badge {
    font-size: 0.12rem;
  }
  .integrations-grid {
    grid-template-columns: 1fr;
    gap: 0.1rem;
  }
  .integration-pill {
    padding: 0.14rem 0.16rem;
    border-radius: 0.14rem;
  }
  .integration-name {
    font-size: 0.165rem;
  }
  .integration-sub {
    font-size: 0.13rem;
  }
}
</style>
