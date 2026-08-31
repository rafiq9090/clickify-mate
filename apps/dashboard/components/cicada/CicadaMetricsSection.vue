<template>
  <section id="metrics" class="cicada-stack-item">
    <div class="glass-cockpit-card">
      <div class="cockpit-top">
        <div class="cockpit-heading-block">
          <span class="section-badge">LIVE TELEMETRY COCKPIT</span>
          <h2 class="cockpit-title">Proven Velocity Across Millions of Conversations</h2>
          <p class="cockpit-desc">Autonomous multi-agent swarms running 24/7 with zero human intervention required.</p>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">99.99%</div>
          <div class="metric-title">Message Delivery SLA</div>
          <div class="metric-sub">Direct Tier-1 Meta Graph Cloud API routing with zero dropped webhooks.</div>
        </div>

        <div class="metric-card">
          <div class="metric-value">&lt; 380ms</div>
          <div class="metric-title">Mean Response Latency</div>
          <div class="metric-sub">Instant answers eliminate shopper drop-off on high-intent social DMs.</div>
        </div>

        <div class="metric-card">
          <div class="metric-value">4.8x</div>
          <div class="metric-title">ROAS Revenue Lift</div>
          <div class="metric-sub">Average conversion acceleration measured across social ad campaigns.</div>
        </div>

        <div class="metric-card">
          <div class="metric-value">+42%</div>
          <div class="metric-title">In-Chat Checkout Rate</div>
          <div class="metric-sub">Frictionless 1-click cart generation and automated COD phone verification.</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Stateless Telemetry Metrics Component
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

.glass-cockpit-card {
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

.cockpit-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.3rem;
  border-bottom: 1px solid rgba(84, 51, 89, 0.08);
  padding-bottom: 0.22rem;
}

.cockpit-heading-block {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  max-width: 9.5rem;
}

.section-badge {
  font-size: 0.15rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #7B4C85;
  text-transform: uppercase;
}

.cockpit-title {
  font-size: 0.38rem;
  font-weight: 800;
  letter-spacing: -0.015rem;
  color: #341F37;
  margin: 0;
  line-height: 1.2;
}

.cockpit-desc {
  font-size: 0.19rem;
  line-height: 1.5;
  color: #5C4560;
  margin: 0;
}

.cockpit-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
  padding: 0.08rem 0.16rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 9999px;
  font-size: 0.15rem;
  font-weight: 700;
  color: #065F46;
  white-space: nowrap;
}

.live-pulse {
  width: 0.08rem;
  height: 0.08rem;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 0.08rem #10B981;
  animation: pulseLive 2s infinite;
}

@keyframes pulseLive {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.7; }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.22rem;
}

.metric-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.95);
  padding: 0.25rem 0.22rem;
  border-radius: 0.18rem;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  transition: all 0.25s ease;
}

.metric-card:hover {
  transform: translateY(-3px);
  background: #FFFFFF;
  border-color: rgba(123, 76, 133, 0.25);
  box-shadow: 0 12px 28px rgba(84, 51, 89, 0.08);
}

.metric-value {
  font-size: 0.48rem;
  font-weight: 900;
  letter-spacing: -0.018rem;
  color: #7B4C85;
  line-height: 1;
}

.metric-title {
  font-size: 0.21rem;
  font-weight: 700;
  color: #341F37;
  line-height: 1.25;
}

.metric-sub {
  font-size: 0.165rem;
  line-height: 1.45;
  color: #6E5373;
}

@media (max-width: 1024px) {
  .cockpit-top {
    flex-direction: column;
    align-items: flex-start;
  }
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .glass-cockpit-card {
    padding: 0.28rem 0.2rem;
    gap: 0.2rem;
    justify-content: flex-start;
  }
  .cockpit-title {
    font-size: 0.24rem;
  }
  .cockpit-desc {
    font-size: 0.15rem;
  }
  .section-badge {
    font-size: 0.12rem;
  }
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.12rem;
  }
  .metric-card {
    padding: 0.16rem 0.14rem;
    border-radius: 0.14rem;
  }
  .metric-value {
    font-size: 0.28rem;
  }
  .metric-title {
    font-size: 0.15rem;
  }
  .metric-sub {
    font-size: 0.12rem;
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
