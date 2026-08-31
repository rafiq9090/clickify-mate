<template>
  <section id="workflow" class="cicada-stack-item">
    <div class="glass-workflow-card">
      <div class="section-header-centered">
        <span class="section-badge">SEAMLESS ONBOARDING</span>
        <h2 class="section-title">From Connect to Full Autonomous Selling in 4 Steps</h2>
        <p class="section-desc">Get started in under 5 minutes without writing a single line of code.</p>
      </div>

      <div class="workflow-steps-grid">
        <!-- Step 1 -->
        <div class="workflow-step-card">
          <div class="step-badge-num">01</div>
          <h3 class="step-title">Connect Social Channels</h3>
          <p class="step-body">1-click official Meta authorization for WhatsApp Business, Instagram Direct, and Facebook Pages.</p>
        </div>

        <!-- Step 2 -->
        <div class="workflow-step-card">
          <div class="step-badge-num">02</div>
          <h3 class="step-title">Sync Product Knowledge</h3>
          <p class="step-body">Ingest your Shopify or WooCommerce product catalogs, pricing rules, and warehouse stock into vector embeddings.</p>
        </div>

        <!-- Step 3 -->
        <div class="workflow-step-card">
          <div class="step-badge-num">03</div>
          <h3 class="step-title">Activate AI Sales Swarm</h3>
          <p class="step-body">Assign specialized sub-agents to consultative recommendations, price negotiation, and VIP incentives.</p>
        </div>

        <!-- Step 4 -->
        <div class="workflow-step-card">
          <div class="step-badge-num">04</div>
          <h3 class="step-title">Automate Checkout & Delivery</h3>
          <p class="step-body">Generate instant payment links or automated COD confirmation with live courier dispatch 24/7.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Stateless Workflow Steps Component
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

.glass-workflow-card {
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

.workflow-steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.22rem;
}

.workflow-step-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 0.22rem;
  padding: 0.3rem 0.26rem 0.28rem;
  box-shadow: 0 12px 28px 0 rgba(84, 51, 89, 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  transition: all 0.25s ease;
}

.workflow-step-card:hover {
  transform: translateY(-4px);
  background: #FFFFFF;
  border-color: rgba(123, 76, 133, 0.3);
  box-shadow: 0 16px 36px rgba(84, 51, 89, 0.08);
}

.step-badge-num {
  font-size: 0.24rem;
  font-weight: 900;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.1);
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 0.14rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.step-title {
  font-size: 0.21rem;
  font-weight: 700;
  letter-spacing: -0.005rem;
  color: #341F37;
  margin: 0;
  line-height: 1.25;
}

.step-body {
  font-size: 0.165rem;
  line-height: 1.5;
  color: #5C4560;
  margin: 0;
}

@media (max-width: 1024px) {
  .workflow-steps-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .glass-workflow-card {
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
  .workflow-steps-grid {
    grid-template-columns: 1fr;
    gap: 0.12rem;
  }
  .workflow-step-card {
    padding: 0.18rem 0.16rem;
    border-radius: 0.16rem;
    gap: 0.06rem;
  }
  .step-badge-num {
    font-size: 0.18rem;
    width: 0.36rem;
    height: 0.36rem;
    border-radius: 0.1rem;
  }
  .step-title {
    font-size: 0.17rem;
  }
  .step-body {
    font-size: 0.135rem;
  }
}
</style>
