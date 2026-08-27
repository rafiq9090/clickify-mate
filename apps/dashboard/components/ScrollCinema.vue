<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{ loggedIn?: boolean }>()

const root = ref<HTMLElement | null>(null)
const film = ref<HTMLVideoElement | null>(null)
const activeScene = ref(0)
const scrollProgress = ref(0)
const isReady = ref(false)

const scenes = [
  {
    number: '01',
    kicker: 'The signal',
    title: 'A customer sends an image.',
    body: 'A product question arrives through the channel your customer already uses.'
  },
  {
    number: '02',
    kicker: 'Visual intelligence',
    title: 'The agent understands what it sees.',
    body: 'Vision analysis identifies the product, colour and buying intent before the answer is written.'
  },
  {
    number: '03',
    kicker: 'Business context',
    title: 'Your real store knowledge joins the conversation.',
    body: 'Catalog, stock, pricing, policy and customer memory move around one shared intelligence core.'
  },
  {
    number: '04',
    kicker: 'The outcome',
    title: 'One intelligent response becomes an order-ready action.',
    body: 'The customer receives the right answer, the next question or a merchant-controlled checkout path.'
  }
]

let frame = 0
let targetTime = 0
let renderedTime = 0
let duration = 8
let reducedMotion = false

const updateFromScroll = () => {
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  const travel = Math.max(root.value.offsetHeight - window.innerHeight, 1)
  const progress = Math.min(Math.max(-rect.top / travel, 0), 1)
  scrollProgress.value = progress
  activeScene.value = Math.min(Math.floor(progress * scenes.length), scenes.length - 1)
  targetTime = progress * Math.max(duration - 0.04, 0)
}

const renderFrame = () => {
  if (!reducedMotion && film.value && isReady.value) {
    renderedTime += (targetTime - renderedTime) * 0.16
    if (Math.abs(film.value.currentTime - renderedTime) > 0.025) {
      film.value.currentTime = renderedTime
    }
  }
  frame = requestAnimationFrame(renderFrame)
}

const handleMetadata = () => {
  if (!film.value) return
  duration = Number.isFinite(film.value.duration) ? film.value.duration : 8
  isReady.value = true
  film.value.pause()
  film.value.currentTime = 0.001
  updateFromScroll()
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('scroll', updateFromScroll, { passive: true })
  window.addEventListener('resize', updateFromScroll, { passive: true })
  updateFromScroll()
  frame = requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateFromScroll)
  window.removeEventListener('resize', updateFromScroll)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <section ref="root" class="scroll-cinema" aria-labelledby="cinema-title">
    <div class="cinema-stage">
      <video
        ref="film"
        class="cinema-film"
        muted
        playsinline
        preload="auto"
        poster="/images/agent-image-to-response-cinematic-v1.png"
        aria-hidden="true"
        @loadedmetadata="handleMetadata"
      >
        <source src="/videos/agent-image-scroll-v1.mp4" type="video/mp4">
      </video>

      <div class="cinema-shade" aria-hidden="true"></div>
      <div class="cinema-grain" aria-hidden="true"></div>

      <div class="cinema-intro" :class="{ hidden: scrollProgress > 0.06 }">
        <p>Scroll-controlled product story</p>
        <h1 id="cinema-title">From product image<br>to intelligent action.</h1>
        <span>Scroll to enter the agent</span>
      </div>

      <div class="scene-copy" :class="`scene-position-${activeScene + 1}`">
        <Transition name="scene" mode="out-in">
          <div :key="activeScene" class="scene-copy-inner" v-if="scenes[activeScene]">
            <span class="scene-index">{{ scenes[activeScene]?.number }}</span>
            <div>
              <small>{{ scenes[activeScene]?.kicker }}</small>
              <h2>{{ scenes[activeScene]?.title }}</h2>
              <p>{{ scenes[activeScene]?.body }}</p>
            </div>
          </div>
        </Transition>
      </div>

      <div class="cinema-topline">
        <span><i></i> Clickify intelligence system</span>
        <b>{{ isReady ? 'Scroll connected' : 'Preparing film' }}</b>
      </div>

      <div class="cinema-timeline" aria-label="Agent processing stages">
        <div class="timeline-progress"><i :style="{ transform: `scaleX(${scrollProgress})` }"></i></div>
        <button
          v-for="(sceneItem, index) in scenes"
          :key="sceneItem.number"
          type="button"
          :class="{ active: index === activeScene, passed: index < activeScene }"
          :aria-label="sceneItem.title"
        >
          <span>{{ sceneItem.number }}</span>
          <small>{{ sceneItem.kicker }}</small>
        </button>
      </div>

      <div class="cinema-actions" :class="{ visible: scrollProgress > 0.92 }">
        <NuxtLink :to="loggedIn ? '/dashboard' : '/login'">
          {{ loggedIn ? 'Open dashboard' : 'Build your agent' }}
          <span class="material-symbols-outlined">arrow_outward</span>
        </NuxtLink>
        <span>WhatsApp · Messenger · Facebook · Instagram · Telegram</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scroll-cinema {
  height: 520vh;
  position: relative;
  color: #0b1b27;
  background: #edf4ff;
}

.cinema-stage {
  width: 100%;
  height: 100svh;
  position: sticky;
  top: 0;
  overflow: hidden;
  background: #eef4ff;
  isolation: isolate;
}

.cinema-film {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  z-index: 0;
  object-fit: cover;
  object-position: center;
}

.cinema-shade {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(242,247,255,.78) 0%, transparent 31%, transparent 70%, rgba(242,247,255,.35) 100%),
    linear-gradient(180deg, rgba(239,246,255,.15), transparent 66%, rgba(225,235,249,.72));
}

.cinema-grain {
  position: absolute;
  inset: 0;
  z-index: 2;
  opacity: .07;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.92' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.34'/%3E%3C/svg%3E");
}

.cinema-topline {
  position: absolute;
  z-index: 5;
  top: 2rem;
  left: clamp(1.25rem, 4vw, 4rem);
  right: clamp(1.25rem, 4vw, 4rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #466074;
  font-size: .62rem;
  font-weight: 850;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.cinema-topline span { display: flex; align-items: center; gap: .6rem; }
.cinema-topline i { width: .48rem; height: .48rem; border-radius: 50%; background: #35cda2; box-shadow: 0 0 0 5px rgba(53,205,162,.13); }
.cinema-topline b { color: #718698; font-size: .56rem; }

.cinema-intro {
  position: absolute;
  z-index: 4;
  left: clamp(1.25rem, 5vw, 5rem);
  top: 50%;
  max-width: 780px;
  transform: translateY(-50%);
  transition: opacity .45s ease, transform .45s ease;
}

.cinema-intro.hidden { opacity: 0; transform: translateY(-56%); pointer-events: none; }
.cinema-intro p { margin: 0 0 1.2rem; color: #547085; font-size: .68rem; font-weight: 850; letter-spacing: .16em; text-transform: uppercase; }
.cinema-intro h1 { max-width: 900px; margin: 0; color: #0b1b27; font-size: clamp(4rem, 8vw, 8.7rem); font-weight: 690; letter-spacing: -.075em; line-height: .86; }
.cinema-intro>span { display: inline-flex; margin-top: 2rem; padding-bottom: .45rem; border-bottom: 1px solid rgba(17,46,68,.26); color: #587083; font-size: .68rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }

.scene-copy {
  position: absolute;
  z-index: 5;
  width: min(490px, 37vw);
  transition: left .65s cubic-bezier(.2,.8,.2,1), right .65s cubic-bezier(.2,.8,.2,1), top .65s cubic-bezier(.2,.8,.2,1);
}

.scene-position-1 { left: 4vw; top: 29%; }
.scene-position-2 { left: 4vw; top: 24%; }
.scene-position-3 { right: 4vw; top: 25%; }
.scene-position-4 { right: 4vw; top: 28%; }

.scene-copy-inner { display: grid; grid-template-columns: 2.5rem 1fr; gap: 1rem; }
.scene-index { padding-top: .35rem; color: #466bf0; font-size: .65rem; font-weight: 900; letter-spacing: .12em; }
.scene-copy small { color: #4d6b7f; font-size: .62rem; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; }
.scene-copy h2 { margin: .75rem 0 1rem; color: #0b1b27; font-size: clamp(2.5rem, 4.2vw, 5rem); font-weight: 690; letter-spacing: -.065em; line-height: .92; }
.scene-copy p { max-width: 410px; margin: 0; color: #587183; font-size: .9rem; line-height: 1.7; }

.scene-enter-active,.scene-leave-active { transition: opacity .28s ease, transform .38s cubic-bezier(.2,.8,.2,1); }
.scene-enter-from { opacity: 0; transform: translateY(22px); }
.scene-leave-to { opacity: 0; transform: translateY(-18px); }

.cinema-timeline {
  position: absolute;
  z-index: 6;
  left: clamp(1.25rem,4vw,4rem);
  right: clamp(1.25rem,4vw,4rem);
  bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 0;
  padding-top: 1rem;
}

.timeline-progress { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: rgba(22,53,75,.15); overflow: hidden; }
.timeline-progress i { display:block; width:100%; height:100%; transform-origin:left; background:linear-gradient(90deg,#526df0,#60d8c9); }
.cinema-timeline button { display: flex; align-items: center; gap: .55rem; padding: .4rem 0; border: 0; color: #8a9aa6; background: transparent; text-align: left; }
.cinema-timeline button span { font-size: .58rem; font-weight: 900; }
.cinema-timeline button small { font-size: .57rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.cinema-timeline button.active { color: #172f43; }
.cinema-timeline button.passed { color: #4e6af0; }

.cinema-actions {
  position: absolute;
  z-index: 7;
  right: 4vw;
  bottom: 6rem;
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: .7rem;
  opacity: 0;
  transform: translateY(14px);
  pointer-events: none;
  transition: .35s ease;
}
.cinema-actions.visible { opacity: 1; transform: none; pointer-events: auto; }
.cinema-actions a { min-height: 3.5rem; display:flex; align-items:center; gap:.6rem; padding:.8rem 1.3rem; border-radius:99px; color:#fff; background:#10263a; font-size:.8rem; font-weight:850; box-shadow:0 15px 35px rgba(16,38,58,.22); }
.cinema-actions>span { color:#5e7383; font-size:.55rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }

@media (max-width: 800px) {
  .scroll-cinema { height: 440vh; }
  .cinema-film { object-fit: contain; object-position: center 34%; }
  .cinema-shade { background: linear-gradient(180deg, rgba(240,246,255,.74), transparent 27%, transparent 62%, rgba(231,239,250,.98) 78%); }
  .cinema-intro { top: 22%; left: 1.15rem; right: 1.15rem; transform: none; }
  .cinema-intro.hidden { transform: translateY(-18px); }
  .cinema-intro h1 { font-size: clamp(3.4rem, 15vw, 5.4rem); }
  .scene-copy { width: auto; left: 1.15rem!important; right: 1.15rem!important; top: auto!important; bottom: 8.5rem; }
  .scene-copy h2 { font-size: clamp(2.55rem, 12vw, 4rem); }
  .scene-copy p { max-width: 560px; }
  .cinema-timeline { left: 1.15rem; right: 1.15rem; bottom: 1rem; }
  .cinema-timeline button { justify-content: center; }
  .cinema-timeline button small { display: none; }
  .cinema-actions { left:1.15rem; right:1.15rem; bottom:5.2rem; align-items:stretch; }
  .cinema-actions a { justify-content:center; }
  .cinema-actions>span { display:none; }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-cinema { height: 120vh; }
  .cinema-film { display:none; }
  .cinema-intro { opacity:1!important; transform:translateY(-50%)!important; }
  .scene-copy,.cinema-timeline,.cinema-actions { display:none; }
}
</style>
