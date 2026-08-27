<script setup lang="ts">
defineProps<{
  loggedIn?: boolean
}>()

const channels = [
  { name: 'WhatsApp', mark: 'WA', className: 'channel-whatsapp' },
  { name: 'Messenger', mark: 'M', className: 'channel-messenger' },
  { name: 'Telegram', mark: 'TG', className: 'channel-telegram' },
  { name: 'Instagram', mark: 'IG', className: 'channel-instagram' },
  { name: 'Facebook Comments', mark: 'f', className: 'channel-facebook' }
]
</script>

<template>
  <section class="cinematic-hero" aria-labelledby="hero-title">
    <div class="hero-aura hero-aura-one" aria-hidden="true"></div>
    <div class="hero-aura hero-aura-two" aria-hidden="true"></div>

    <div class="hero-shell">
      <div class="hero-stage">
        <video
          class="hero-film"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
          poster="/images/hero-cinematic-ai-v1.png"
          aria-hidden="true"
        >
          <source src="/videos/ai-commerce-core.mp4" type="video/mp4">
        </video>
        <div class="hero-poster" aria-hidden="true"></div>
        <div class="hero-wash" aria-hidden="true"></div>
        <div class="hero-grid" aria-hidden="true"></div>

        <div class="hero-copy">
          <div class="hero-eyebrow">
            <span class="eyebrow-pulse" aria-hidden="true"></span>
            Omnichannel AI commerce
          </div>

          <h1 id="hero-title">
            Every conversation<br>
            can become an <span>order.</span>
          </h1>

          <p class="hero-lead">
            One intelligent sales agent answers customers, recommends products,
            collects order details and sends merchant-controlled payment links—across every channel you sell on.
          </p>

          <div class="hero-actions">
            <NuxtLink :to="loggedIn ? '/dashboard' : '/login'" class="hero-cta hero-cta-primary">
              <span>{{ loggedIn ? 'Open dashboard' : 'Build your AI agent' }}</span>
              <span class="material-symbols-outlined" aria-hidden="true">arrow_outward</span>
            </NuxtLink>
            <a href="#live-demo" class="hero-cta hero-cta-secondary">
              <span class="play-orb" aria-hidden="true">
                <span class="material-symbols-outlined">play_arrow</span>
              </span>
              See how it sells
            </a>
          </div>

          <div class="hero-proof" aria-label="Product advantages">
            <span><i class="material-symbols-outlined" aria-hidden="true">check</i>No card required</span>
            <span><i class="material-symbols-outlined" aria-hidden="true">check</i>Works 24/7</span>
            <span><i class="material-symbols-outlined" aria-hidden="true">check</i>Merchant controlled</span>
          </div>
        </div>

        <div class="channel-orbit" aria-label="Supported customer channels">
          <div
            v-for="(channel, index) in channels"
            :key="channel.name"
            class="channel-chip"
            :class="[channel.className, `channel-${index + 1}`]"
          >
            <span class="channel-mark">{{ channel.mark }}</span>
            <span class="channel-name">{{ channel.name }}</span>
            <span class="channel-live" aria-hidden="true"></span>
          </div>
        </div>

        <div class="commerce-trace" aria-label="Example automated commerce flow">
          <div class="trace-avatar">R</div>
          <div class="trace-message">
            <span>Customer message</span>
            <strong>“Is the black jacket available?”</strong>
          </div>
          <span class="trace-line" aria-hidden="true"></span>
          <div class="trace-ai">
            <span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
            AI matched product + stock
          </div>
          <span class="trace-line trace-line-short" aria-hidden="true"></span>
          <div class="trace-success">
            <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
            Checkout ready
          </div>
        </div>

        <div class="hero-scroll-cue" aria-hidden="true">
          <span>Explore the system</span>
          <i></i>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cinematic-hero {
  --ink: #0b1722;
  --muted: #566b78;
  --blue: #3867f4;
  --aqua: #66ddd0;
  position: relative;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  min-height: min(920px, calc(100svh - 5rem));
  background:
    radial-gradient(circle at 78% 30%, rgba(139, 214, 255, 0.3), transparent 34%),
    linear-gradient(180deg, #f8fbff 0%, #eff4ff 100%);
  overflow: hidden;
  isolation: isolate;
}

.hero-aura {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
  pointer-events: none;
}

.hero-aura-one {
  width: 30rem;
  height: 30rem;
  top: -14rem;
  left: -10rem;
  background: rgba(118, 240, 216, 0.2);
}

.hero-aura-two {
  width: 34rem;
  height: 34rem;
  right: -15rem;
  bottom: -20rem;
  background: rgba(89, 118, 255, 0.18);
}

.hero-shell {
  width: min(1500px, 100%);
  min-height: min(820px, calc(100svh - 8rem));
  margin: 0 auto;
  position: relative;
  border-radius: clamp(1.8rem, 4vw, 3.75rem);
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.26));
  box-shadow: 0 40px 100px rgba(75, 103, 157, 0.16), inset 0 1px 0 #fff;
}

.hero-stage {
  min-height: inherit;
  position: relative;
  overflow: hidden;
  border-radius: inherit;
  background: #eef4ff;
}

.hero-film,
.hero-poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero-film { z-index: 1; }

.hero-poster {
  z-index: 0;
  background: url('/images/hero-cinematic-ai-v1.png') center / cover no-repeat;
}

.hero-wash {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(90deg, rgba(247, 251, 255, 0.99) 0%, rgba(247, 251, 255, 0.94) 34%, rgba(247, 251, 255, 0.32) 61%, rgba(237, 245, 255, 0.05) 100%),
    linear-gradient(180deg, rgba(255,255,255,0.12), rgba(233,241,255,0.18));
}

.hero-grid {
  position: absolute;
  inset: 0;
  z-index: 3;
  opacity: 0.18;
  background-image:
    linear-gradient(rgba(45, 80, 130, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45, 80, 130, 0.09) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: linear-gradient(90deg, #000, transparent 62%);
}

.hero-copy {
  position: relative;
  z-index: 6;
  width: min(700px, 58%);
  padding: clamp(5rem, 10vh, 8.5rem) clamp(2rem, 6vw, 6.5rem) 8rem;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1.75rem;
  color: #31506a;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.eyebrow-pulse {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #35cda0;
  box-shadow: 0 0 0 6px rgba(53, 205, 160, 0.12);
}

h1 {
  max-width: 680px;
  margin: 0;
  color: var(--ink);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: clamp(3.45rem, 6.3vw, 7.1rem);
  font-weight: 700;
  letter-spacing: -0.075em;
  line-height: 0.9;
}

h1 span {
  color: var(--blue);
  position: relative;
  white-space: nowrap;
}

.hero-lead {
  max-width: 620px;
  margin: 2rem 0 0;
  color: var(--muted);
  font-size: clamp(1rem, 1.35vw, 1.18rem);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 2.25rem;
  flex-wrap: wrap;
}

.hero-cta {
  min-height: 3.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0.8rem 1.35rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 750;
  transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
}

.hero-cta:hover { transform: translateY(-2px); }

.hero-cta-primary {
  color: #fff;
  background: #10233c;
  box-shadow: 0 14px 32px rgba(16, 35, 60, 0.2);
}

.hero-cta-primary:hover { box-shadow: 0 18px 38px rgba(16, 35, 60, 0.26); }

.hero-cta-secondary {
  color: #173047;
  background: rgba(255,255,255,0.64);
  border: 1px solid rgba(33, 68, 105, 0.12);
  backdrop-filter: blur(18px);
}

.play-orb {
  width: 1.85rem;
  height: 1.85rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--blue);
}

.play-orb .material-symbols-outlined { font-size: 1rem; }

.hero-proof {
  display: flex;
  gap: 1.25rem;
  margin-top: 1.75rem;
  flex-wrap: wrap;
  color: #647783;
  font-size: 0.78rem;
  font-weight: 650;
}

.hero-proof span { display: inline-flex; align-items: center; gap: 0.3rem; }
.hero-proof i { color: #28b989; font-size: 1rem; font-style: normal; }

.channel-orbit {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}

.channel-chip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.6rem 0.45rem 0.48rem;
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 999px;
  color: #173047;
  background: rgba(255,255,255,0.54);
  box-shadow: 0 16px 34px rgba(56, 88, 140, 0.12), inset 0 1px 0 rgba(255,255,255,0.9);
  backdrop-filter: blur(18px) saturate(140%);
  animation: float-chip 5.5s ease-in-out infinite;
}

.channel-mark {
  min-width: 1.9rem;
  height: 1.9rem;
  display: grid;
  place-items: center;
  padding: 0 0.25rem;
  border-radius: 0.7rem;
  color: #fff;
  background: #5f7bf6;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.channel-name { font-size: 0.68rem; font-weight: 800; white-space: nowrap; }

.channel-live {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: #29c88f;
  box-shadow: 0 0 0 3px rgba(41,200,143,0.12);
}

.channel-whatsapp .channel-mark { background: #24bf75; }
.channel-messenger .channel-mark { background: linear-gradient(145deg, #168aff, #7b4dff); }
.channel-telegram .channel-mark { background: #2aabee; }
.channel-instagram .channel-mark { background: linear-gradient(145deg, #7846dc, #e74783 58%, #f2a33a); }
.channel-facebook .channel-mark { background: #1877f2; }

.channel-1 { top: 17%; right: 7%; }
.channel-2 { top: 37%; right: 2.8%; animation-delay: -1.4s; }
.channel-3 { top: 57%; right: 8%; animation-delay: -2.8s; }
.channel-4 { top: 25%; right: 26%; animation-delay: -3.6s; }
.channel-5 { top: 68%; right: 24%; animation-delay: -4.4s; }

.commerce-trace {
  position: absolute;
  z-index: 8;
  left: clamp(2rem, 6vw, 6.5rem);
  right: clamp(2rem, 6vw, 6.5rem);
  bottom: 2rem;
  min-height: 4.8rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(255,255,255,0.72);
  border-radius: 1.3rem;
  color: #1c3448;
  background: rgba(250,252,255,0.64);
  box-shadow: 0 18px 50px rgba(54, 84, 132, 0.12), inset 0 1px 0 #fff;
  backdrop-filter: blur(22px) saturate(140%);
}

.trace-avatar {
  width: 2.65rem;
  height: 2.65rem;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(145deg, #1c3851, #6480a0);
  font-weight: 800;
}

.trace-message { display: flex; flex-direction: column; gap: 0.15rem; }
.trace-message span { color: #78909f; font-size: 0.62rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.08em; }
.trace-message strong { font-size: 0.78rem; }

.trace-line {
  height: 1px;
  min-width: 2rem;
  flex: 1;
  background: linear-gradient(90deg, rgba(83,112,145,0.15), rgba(68,112,242,0.5), rgba(83,112,145,0.15));
}

.trace-line-short { max-width: 4rem; }

.trace-ai,
.trace-success {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.7rem;
  font-weight: 800;
  white-space: nowrap;
}

.trace-ai .material-symbols-outlined { color: #536ff2; font-size: 1.1rem; }
.trace-success { color: #158563; }
.trace-success .material-symbols-outlined { font-size: 1.1rem; }

.hero-scroll-cue {
  position: absolute;
  right: 2.2rem;
  bottom: 7.9rem;
  z-index: 7;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: #6f8494;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transform: rotate(90deg) translateX(100%);
  transform-origin: right bottom;
}

.hero-scroll-cue i { width: 3.5rem; height: 1px; background: rgba(58,82,105,0.32); }

@keyframes float-chip {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -9px, 0); }
}

@media (max-width: 1100px) {
  .hero-copy { width: 66%; }
  .channel-4 { right: 18%; }
  .channel-5 { right: 17%; }
  .trace-message strong { max-width: 180px; }
}

@media (max-width: 820px) {
  .cinematic-hero { padding: 0.75rem; min-height: auto; }
  .hero-shell { min-height: 790px; border-radius: 2rem; }
  .hero-film { display: none; }
  .hero-poster { background-position: 62% center; opacity: 0.76; }
  .hero-wash {
    background: linear-gradient(180deg, rgba(248,251,255,0.98) 0%, rgba(248,251,255,0.93) 50%, rgba(240,246,255,0.42) 78%, rgba(237,244,255,0.18) 100%);
  }
  .hero-grid { mask-image: linear-gradient(#000, transparent 75%); }
  .hero-copy { width: 100%; padding: 4.25rem 1.45rem 14rem; }
  h1 { font-size: clamp(3.15rem, 13vw, 5rem); max-width: 640px; }
  .hero-lead { max-width: 580px; }
  .channel-orbit { display: none; }
  .commerce-trace {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.65rem;
  }
  .trace-line { display: none; }
  .trace-ai { grid-column: 2 / -1; }
  .trace-success { grid-column: 2 / -1; }
  .hero-scroll-cue { display: none; }
}

@media (max-width: 540px) {
  .hero-shell { min-height: 820px; }
  .hero-copy { padding-top: 3.4rem; }
  .hero-eyebrow { font-size: 0.62rem; }
  h1 { font-size: clamp(2.9rem, 15vw, 4.25rem); }
  .hero-actions { align-items: stretch; flex-direction: column; }
  .hero-cta { width: 100%; }
  .hero-proof { gap: 0.7rem 1rem; }
  .trace-message strong { font-size: 0.7rem; max-width: 210px; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-film { display: none; }
  .channel-chip { animation: none; }
  .hero-cta { transition: none; }
}
</style>
