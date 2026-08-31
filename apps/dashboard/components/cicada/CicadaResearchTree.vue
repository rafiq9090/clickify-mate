<template>
  <section class="tree">
    <div class="tree-name">Autonomous Swarm</div>
    <div class="tree-wrapp">
      <svg class="tree-svg" viewBox="0 0 2556 3440" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path class="tree-svg__bottom" d="M1278.07 3439.61L1278.07 1717" stroke="#341F37" stroke-width="3.21"/>
        <path class="tree-svg__top tree-svg__branches" data-position="top" d="M1278.07 1722.61L1278.07 0" stroke="#341F37" stroke-width="3.21"/>
        <path class="tree-svg__left tree-svg__branches" data-position="left" d="M1278.07 1716.2L2 651.193" stroke="#341F37" stroke-width="3.21"/>
        <path class="tree-svg__left-top tree-svg__branches" data-position="left-top" d="M1278.07 1716.2L552.609 176.432" stroke="#341F37" stroke-width="3.21"/>
        <path class="tree-svg__right-top tree-svg__branches" data-position="right-top" d="M1278.08 1716.2L2002.43 176.432" stroke="#341F37" stroke-width="3.21"/>
        <path class="tree-svg__right tree-svg__branches" data-position="right" d="M1278.07 1716.2L2554.09 651.193" stroke="#341F37" stroke-width="3.21"/>
      </svg>

      <div class="tree-circle tree-circle__big"></div>
      <div class="tree-circle tree-circle__small"></div>

      <!-- Node 1: Left - WhatsApp Commerce -->
      <div class="tree-title tree-title_left" data-position="left">
        <svg class="tree-title__decor left" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 1H3C1.89543 1 1 1.89543 1 3V3" stroke="#341F37"/>
        </svg>
        <span>WhatsApp Commerce</span>
        <svg class="tree-title__decor right" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 1H7C8.10457 1 9 1.89543 9 3V3" stroke="#341F37"/>
        </svg>
      </div>

      <!-- Node 2: Left-Top - Instagram Direct AI -->
      <div class="tree-title tree-title_left-top" data-position="left-top">
        <svg class="tree-title__decor left" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 1H3C1.89543 1 1 1.89543 1 3V3" stroke="#341F37"/>
        </svg>
        <span>Instagram Direct AI</span>
        <svg class="tree-title__decor right" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 1H7C8.10457 1 9 1.89543 9 3V3" stroke="#341F37"/>
        </svg>
      </div>

      <!-- Node 3: Top - Multi-Agent Swarms -->
      <div class="tree-title tree-title_top" data-position="top">
        <svg class="tree-title__decor left" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 1H3C1.89543 1 1 1.89543 1 3V3" stroke="#341F37"/>
        </svg>
        <span>Multi-Agent Swarm</span>
        <svg class="tree-title__decor right" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 1H7C8.10457 1 9 1.89543 9 3V3" stroke="#341F37"/>
        </svg>
      </div>

      <!-- Node 4: Right-Top - Catalog & Stock Sync -->
      <div class="tree-title tree-title_right-top" data-position="right-top">
        <svg class="tree-title__decor left" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 1H3C1.89543 1 1 1.89543 1 3V3" stroke="#341F37"/>
        </svg>
        <span>Catalog & Stock Sync</span>
        <svg class="tree-title__decor right" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 1H7C8.10457 1 9 1.89543 9 3V3" stroke="#341F37"/>
        </svg>
      </div>

      <!-- Node 5: Right - Revenue Attribution -->
      <div class="tree-title tree-title_right" data-position="right">
        <svg class="tree-title__decor left" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 1H3C1.89543 1 1 1.89543 1 3V3" stroke="#341F37"/>
        </svg>
        <span>Revenue Attribution</span>
        <svg class="tree-title__decor right" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 1H7C8.10457 1 9 1.89543 9 3V3" stroke="#341F37"/>
        </svg>
      </div>

      <!-- Interactive Node Pulsing Balls -->
      <div class="tree-ball tree-ball_left" data-position="left">
        <span class="tree-ball__1"></span><span class="tree-ball__2"></span><span class="tree-ball__3"></span>
      </div>
      <div class="tree-ball tree-ball_left-top" data-position="left-top">
        <span class="tree-ball__1"></span><span class="tree-ball__2"></span><span class="tree-ball__3"></span>
      </div>
      <div class="tree-ball tree-ball_top" data-position="top">
        <span class="tree-ball__1"></span><span class="tree-ball__2"></span><span class="tree-ball__3"></span>
      </div>
      <div class="tree-ball tree-ball_right-top" data-position="right-top">
        <span class="tree-ball__1"></span><span class="tree-ball__2"></span><span class="tree-ball__3"></span>
      </div>
      <div class="tree-ball tree-ball_right" data-position="right">
        <span class="tree-ball__1"></span><span class="tree-ball__2"></span><span class="tree-ball__3"></span>
      </div>

      <div class="tree-wings">
        <div class="tree-wings__item tree-wings__center">
          <svg viewBox="0 0 140 186" fill="none" xmlns="http://www.w3.org/2000/svg" class="butterfly-center-svg">
            <defs>
              <linearGradient id="cm-nucleus-grad" x1="70" y1="0" x2="70" y2="186" gradientUnits="userSpaceOnUse">
                <stop stop-color="#C5B3C8"/>
                <stop offset="0.45" stop-color="#BEACC1"/>
                <stop offset="1" stop-color="#AD99B0"/>
              </linearGradient>
            </defs>
            <ellipse cx="70" cy="93" rx="68" ry="91" fill="url(#cm-nucleus-grad)"/>
            <text x="70" y="98" text-anchor="middle" dominant-baseline="central" fill="#FAF8FC" font-size="44" font-weight="800" font-family="'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif" letter-spacing="-1.5">CM</text>
          </svg>
        </div>
        <div class="tree-wings__item tree-wings__top-left">
          <img src="https://cdn.zajno.com/dev/codepen/cicada/butterfly-top_left.png" alt="Top Left Wing">
        </div>
        <div class="tree-wings__item tree-wings__top-right">
          <img class="wing-flipped" src="https://cdn.zajno.com/dev/codepen/cicada/butterfly-top_left.png" alt="Top Right Wing">
        </div>
        <div class="tree-wings__item tree-wings__bottom-left">
          <img src="https://cdn.zajno.com/dev/codepen/cicada/butterfly-bottom_left.png" alt="Bottom Left Wing">
        </div>
        <div class="tree-wings__item tree-wings__bottom-right">
          <img class="wing-flipped" src="https://cdn.zajno.com/dev/codepen/cicada/butterfly-bottom_left.png" alt="Bottom Right Wing">
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Stateless Research Tree Viewport Component
</script>
