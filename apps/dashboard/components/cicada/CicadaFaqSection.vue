<template>
  <section id="faq" class="cicada-stack-item">
    <div class="glass-faq-card">
      <div class="section-header-centered">
        <span class="section-badge">FREQUENTLY ASKED QUESTIONS</span>
        <h2 class="section-title">Everything You Need to Know About Autonomous Selling</h2>
        <p class="section-desc">Clear answers on multi-agent swarms, Meta compliance, catalog sync, and checkout settlement.</p>
      </div>

      <div class="faq-list">
        <div 
          v-for="(item, idx) in faqs" 
          :key="idx" 
          class="faq-card"
          :class="{ active: openIdx === idx }"
          @click="toggleFaq(idx)"
        >
          <div class="faq-question-row">
            <h3 class="faq-question">{{ item.q }}</h3>
            <span class="faq-toggle-icon">{{ openIdx === idx ? '−' : '+' }}</span>
          </div>
          <div v-show="openIdx === idx" class="faq-answer-block">
            <p class="faq-answer">{{ item.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const openIdx = ref<number | null>(0)

const toggleFaq = (idx: number) => {
  openIdx.value = openIdx.value === idx ? null : idx
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
    q: 'How do multi-agent swarms handle complex or custom customer questions?',
    a: 'Our swarm architecture delegates specialized tasks: one agent recommends products, another calculates bundle discounts, and another verifies delivery addresses. If an inquiry requires human intervention, it is escalated with full chat context.'
  },
  {
    q: 'Can I test Clickify Mate before committing?',
    a: 'Yes, you can start a free trial with full access to the Command Console, simulated test chat channels, and pre-built sales swarms.'
  }
]
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

.glass-faq-card {
  background: #FAF8FC;
  border: 1px solid rgba(123, 76, 133, 0.2);
  border-radius: 0.32rem;
  padding: 0.45rem 0.6rem;
  box-shadow: 0 24px 60px -12px rgba(52, 31, 55, 0.14),
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

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.faq-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 0.18rem;
  padding: 0.2rem 0.28rem;
  box-shadow: 0 8px 24px 0 rgba(84, 51, 89, 0.03);
  cursor: pointer;
  transition: all 0.25s ease;
}

.faq-card:hover {
  background: #FFFFFF;
  border-color: rgba(123, 76, 133, 0.25);
}

.faq-card.active {
  background: #FFFFFF;
  border-color: rgba(123, 76, 133, 0.4);
  box-shadow: 0 12px 30px 0 rgba(84, 51, 89, 0.06);
}

.faq-question-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
}

.faq-question {
  font-size: 0.21rem;
  font-weight: 700;
  color: #341F37;
  margin: 0;
  line-height: 1.3;
}

.faq-toggle-icon {
  font-size: 0.24rem;
  font-weight: 600;
  color: #7B4C85;
  line-height: 1;
}

.faq-answer-block {
  margin-top: 0.12rem;
  border-top: 1px solid rgba(84, 51, 89, 0.08);
  padding-top: 0.12rem;
}

.faq-answer {
  font-size: 0.175rem;
  line-height: 1.55;
  color: #5C4560;
  margin: 0;
}

@media (max-width: 768px) {
  .glass-faq-card {
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
  .faq-card {
    padding: 0.16rem 0.18rem;
  }
  .faq-question {
    font-size: 0.16rem;
  }
  .faq-toggle-icon {
    font-size: 0.2rem;
  }
  .faq-answer {
    font-size: 0.135rem;
  }
}
</style>
