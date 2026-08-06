<script setup>
const runtimeConfig = useRuntimeConfig()
const supabase = useSupabase()

const isLoggedIn = ref(false)
const activeFaq = ref(null)

const toggleFaq = (index) => {
  if (activeFaq.value === index) {
    activeFaq.value = null
  } else {
    activeFaq.value = index
  }
}

const faqs = [
  {
    q: "Is Clickify Mate secure? How is our data protected?",
    a: "Absolutely. We route message webhooks directly and securely through official Meta (Facebook/WhatsApp) APIs, utilizing robust end-to-end encryption. We never store credit cards, and we strictly follow data-compliance guidelines (GDPR & privacy regulations) to safeguard your customer interactions."
  },
  {
    q: "Which messaging platforms does Clickify Mate support?",
    a: "We currently support official integrations for WhatsApp Business, Telegram, Facebook Page Comments (Auto-Reply & Auto-DM), and Facebook Messenger. More platforms like Instagram Comments and DMs are coming soon."
  },
  {
    q: "How does the AI agent learn about my products or business?",
    a: "You can train your AI agent in under 2 minutes by typing or pasting your business details, policies, and pricing sheets directly into the agent's 'Knowledge Base' text area on the command center. Our system immediately syncs the instructions to the live agent."
  },
  {
    q: "Can the AI send images or catalogs to customers?",
    a: "Yes! You can link up to 3 product images and specific Product IDs (such as SKUs) directly to your agent. When a customer intent matches a product inquiry, the AI automatically dispatches the corresponding product image, details, and checkout links."
  },
  {
    q: "How quickly do updates to the agent take effect?",
    a: "Instantly. Once you click the 'SYNC' button on your dashboard command center, the agent's active memory is updated live. Any subsequent messages or comments will immediately reflect your new policies or prices."
  }
]

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  isLoggedIn.value = !!session?.user
})
</script>

<template>
  <div class="relative min-h-screen text-on-background overflow-hidden">
    <!-- Hero Section -->
    <section class="relative pt-24 pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[921px]">
      <!-- Grid Background with custom highlight shape overlays -->
      <div class="absolute inset-0 grid-bg opacity-[0.25] dark:opacity-[0.1] z-0 mask-image-b"></div>
      
      <!-- Decorative rounded outline cards overlaying the grid like in the screenshot -->
       
      <div class="max-w-4xl mx-auto px-4 text-center relative z-10">
       
        <h1 class="text-5xl md:text-7xl font-display font-black tracking-tight leading-[1.1] mb-6 text-slate-900 dark:text-white">
          Turn Comments into <br>
          <span class="text-[#2575FC] dark:text-[#3B82F6]">Instant</span> <span class="text-transparent [-webkit-text-stroke:1.5px_#D946EF] dark:[-webkit-text-stroke:1.5px_#F472B6] font-bold">Sales</span>
        </h1>
        <p class="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto font-medium">
          Automate price inquiries, auto-DM product links, and optimize WhatsApp, Telegram & Facebook replies with smart AI agents that sell 24/7.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink 
            :to="isLoggedIn ? '/dashboard' : '/login'" 
            class="px-6 py-2.5 w-full sm:w-auto text-center flex items-center justify-center gap-2 bg-[#2575FC] hover:bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <span>Request Demo</span>
            <span class="material-symbols-outlined text-sm font-black">arrow_forward</span>
          </NuxtLink>
          <a 
            href="#cta" 
            class="px-6 py-2.5 w-full sm:w-auto text-center flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-full font-bold shadow-sm transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <span class="material-symbols-outlined text-lg">chat_bubble</span>
            <span>Chat with Us</span>
          </a>
        </div>
      </div>

      <!-- Interactive Mockup Showcase (Flow Builder Diagram) -->
      <div class="w-full max-w-5xl mx-auto px-4 mt-20 relative z-10">
        <div class="relative rounded-3xl bg-surface shadow-2xl border border-outline overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
          <!-- Window Header -->
          <div class="h-12 border-b border-outline flex items-center px-4 bg-surface-hover/50">
            <div class="flex gap-2">
              <div class="w-3 h-3 rounded-full bg-red-400"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div class="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div class="mx-auto flex-1 px-8 flex justify-center">
              <div class="w-1/2 h-6 rounded-lg bg-surface shadow-xs border border-outline flex items-center justify-center text-[9px] text-on-surface-variant/60 font-mono">
                clickifymate.com/command-center
              </div>
            </div>
          </div>
          
          <!-- Window Body -->
          <div class="flex flex-col md:flex-row h-[550px] bg-surface-hover/10">
            <!-- Left Sidebar Menu -->
            <div class="w-full md:w-56 border-r border-outline p-4 bg-surface/50 shrink-0 hidden md:block">
              <div class="space-y-6 text-left">
                <!-- Branding/Status inside Mockup -->
                <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                  <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span class="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">CLICKIFY MATE ENGINE</span>
                </div>
                
                <div class="space-y-1">
                  <div class="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/40 px-2 mb-2">Workspace</div>
                  <div class="flex items-center gap-2.5 p-2 bg-primary/10 text-primary rounded-xl font-bold text-xs">
                    <span class="material-symbols-outlined text-sm">hub</span>
                    Agent Command Center
                  </div>
                  <div class="flex items-center gap-2.5 p-2 text-on-surface-variant hover:bg-surface-hover rounded-xl font-bold text-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">database</span>
                    Product Galleries
                  </div>
                  <div class="flex items-center gap-2.5 p-2 text-on-surface-variant hover:bg-surface-hover rounded-xl font-bold text-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">settings</span>
                    Webhook Settings
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/40 px-2 mb-2">Integrations</div>
                  <div class="flex items-center justify-between p-2 text-on-surface-variant hover:bg-surface-hover rounded-xl font-medium text-xs transition-colors">
                    <div class="flex items-center gap-2.5">
                      <span class="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                      <span>WhatsApp Business</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between p-2 text-on-surface-variant hover:bg-surface-hover rounded-xl font-medium text-xs transition-colors">
                    <div class="flex items-center gap-2.5">
                      <span class="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                      <span>Facebook Page Comments</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between p-2 text-on-surface-variant hover:bg-surface-hover rounded-xl font-medium text-xs transition-colors">
                    <div class="flex items-center gap-2.5">
                      <span class="material-symbols-outlined text-sm text-on-surface-variant/30">circle</span>
                      <span>Telegram Messenger</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Canvas Flow Workspace -->
            <div class="flex-grow relative overflow-hidden flex flex-col justify-between" style="background-image: radial-gradient(var(--color-outline) 1px, transparent 1px); background-size: 24px 24px;">
              <!-- Canvas Tools Header -->
              <div class="h-12 border-b border-outline bg-surface/80 backdrop-blur-xs flex items-center justify-between px-6 z-10">
                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold text-on-surface">Conversational Commerce Hub</span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-wider">Live &amp; Connected</span>
                </div>
                <div class="flex items-center gap-2">
                  <button class="h-7 px-3 bg-surface border border-outline rounded-lg text-[10px] font-bold hover:bg-surface-hover transition-colors">Run Test</button>
                  <button class="h-7 px-3 bg-primary text-white rounded-lg text-[10px] font-bold shadow-md shadow-primary/10 hover:brightness-110 transition-all">Sync Live Agent</button>
                </div>
              </div>

              <!-- Nodes Container -->
              <div class="flex-grow p-6 relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                <!-- Trigger Node -->
                <div class="premium-card p-4 w-48 shadow-lg bg-surface border border-outline relative z-10 group/node hover:border-primary transition-all">
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-7 h-7 rounded-lg  text-primary flex items-center justify-center">
                      <span class="material-symbols-outlined text-sm">bolt</span>
                    </div>
                    <div class="text-left">
                      <div class="text-[9px] font-black uppercase text-on-surface-variant/50 leading-none">Trigger</div>
                      <div class="text-xs font-bold text-on-surface">Customer Comment</div>
                    </div>
                  </div>
                  <p class="text-[10px] text-on-surface-variant text-left leading-relaxed">Customer comments "How much?" or "Price" on your Facebook post.</p>
                </div>

                <!-- Animated Line Connector 1 -->
                <div class="hidden md:block absolute left-[210px] w-18 h-[2px] bg-outline overflow-hidden">
                  <div class="w-15 h-full bg-primary flow-pulse-line"></div>
                </div>

                <!-- AI Agent Node -->
                <div class="premium-card p-4 w-52 shadow-lg bg-surface border-2 border-primary relative z-10 group/node hover:shadow-xl transition-all">
                  <div class="absolute -top-3 right-18 px-2 py-0.5 rounded-full bg-primary text-white text-[8px] font-black uppercase tracking-widest">
                    AI AGENT
                  </div>
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
                      <span class="material-symbols-outlined text-sm">psychology</span>
                    </div>
                    <div class="text-left">
                      <div class="text-[9px] font-black uppercase text-primary leading-none">Conversational AI</div>
                      <div class="text-xs font-bold text-on-surface">Interpret Intent &amp; SKU</div>
                    </div>
                  </div>
                  <p class="text-[10px] text-on-surface-variant text-left leading-relaxed">AI analyzes comment, matches requested product ID, and fetches prices.</p>
                </div>

                <!-- Animated Line Connector 2 -->
                <div class="hidden md:block absolute left-[445px] w-28 h-[2px] bg-outline overflow-hidden">
                  <div class="w-15 h-full bg-primary flow-pulse-line"></div>
                </div>

                <!-- Action Node -->
                <div class="premium-card p-4 w-48 shadow-lg bg-surface border border-outline relative z-10 group/node hover:border-primary transition-all">
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-7 h-7 rounded-lg  text-primary flex items-center justify-center">
                      <span class="material-symbols-outlined text-sm">send</span>
                    </div>
                    <div class="text-left">
                      <div class="text-[9px] font-black uppercase text-on-surface-variant/50 leading-none">Outcome</div>
                      <div class="text-xs font-bold text-on-surface">Send Private DM</div>
                    </div>
                  </div>
                  <p class="text-[10px] text-on-surface-variant text-left leading-relaxed">Replies to comment publicly and sends a private message with catalog &amp; checkout link.</p>
                </div>
              </div>

              <!-- Floating Tooltips/Details -->
              <div class="absolute bottom-4 left-6 bg-surface/90 backdrop-blur-xs border border-outline rounded-xl p-2.5 shadow-sm text-left max-w-xs z-10 hidden lg:block">
                <div class="text-[9px] text-on-surface-variant font-bold leading-relaxed flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Connect channels and sync knowledge base instantly.
                </div>
              </div>
              
              <div class="absolute bottom-4 right-6 bg-surface/90 backdrop-blur-xs border border-outline rounded-xl p-2.5 shadow-sm text-left max-w-xs z-10 hidden lg:block">
                <div class="text-[9px] text-on-surface-variant font-bold leading-relaxed flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Instant responses drive up to 35% higher checkouts.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trusted By Section -->
<section class="py-10 border-y border-outline bg-surface-hover/20 overflow-hidden">
  <div class="max-w-7xl mx-auto px-4">
    <div class="flex justify-center items-center gap-12 md:gap-24 opacity-60 grayscale flex-wrap text-slate-400 dark:text-slate-500">
      
      <!-- Demo Logo 1: Tech/SaaS Style -->
      <svg class="h-8 object-contain" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 4L26 25H4L15 4Z" fill="currentColor"/>
        <text x="35" y="22" font-family="sans-serif" font-weight="bold" font-size="16" fill="currentColor">Acme</text>
      </svg>

      <!-- Demo Logo 2: Cyber/Data Style -->
      <svg class="h-8 object-contain" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="10" stroke="currentColor" stroke-width="4"/>
        <circle cx="16" cy="16" r="3" fill="currentColor"/>
        <text x="35" y="22" font-family="sans-serif" font-weight="bold" font-size="16" fill="currentColor">GlobeX</text>
      </svg>

      <!-- Demo Logo 3: Modern/Abstract Style -->
      <svg class="h-8 object-contain" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="20" height="20" rx="4" stroke="currentColor" stroke-width="4"/>
        <path d="M13 13L19 19M19 13L13 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        <text x="38" y="22" font-family="sans-serif" font-weight="bold" font-size="16" fill="currentColor">Bolt</text>
      </svg>

      <!-- Demo Logo 4: Leaf/Bio Style -->
      <svg class="h-8 object-contain" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 16C6 8 14 6 26 6C26 14 24 26 6 26Z" fill="currentColor"/>
        <text x="38" y="22" font-family="sans-serif" font-weight="bold" font-size="16" fill="currentColor">Eco</text>
      </svg>

      <!-- Demo Logo 5: Layer/Stack Style (Hidden on mobile) -->
      <svg class="h-8 object-contain hidden md:block" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 10L16 5L26 10L16 15L6 10Z" fill="currentColor"/>
        <path d="M6 16L16 21L26 16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        <path d="M6 22L16 27L26 22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        <text x="38" y="22" font-family="sans-serif" font-weight="bold" font-size="16" fill="currentColor">Stack</text>
      </svg>

    </div>
  </div>
</section>

    <!-- Key Features Section -->
    <section id="features" class="py-24 bg-background relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-16 max-w-2xl text-left">
          <h3 class="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Key Features</h3>
          <h2 class="text-3xl md:text-4xl font-display font-bold leading-tight">
            Close deals automatically with high-converting features.
          </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Card 1 -->
          <div class="bg-surface p-6 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow text-left">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-primary mb-6">
              <span class="material-symbols-outlined">forum</span>
            </div>
            <h4 class="text-lg font-bold mb-2">Automated Comment-to-DM</h4>
            <p class="text-on-surface-variant text-sm">Send instant product links and customized checkout details directly to customer DMs when they comment on your posts.</p>
          </div>
          <!-- Card 2 -->
          <div class="bg-surface p-6 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow text-left">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-purple-600 mb-6">
              <span class="material-symbols-outlined">devices</span>
            </div>
            <h4 class="text-lg font-bold mb-2">Official Messaging APIs</h4>
            <p class="text-on-surface-variant text-sm">Deploy verified AI shopping assistants natively on WhatsApp Business, Facebook Pages, and Telegram channels.</p>
          </div>
          <!-- Card 3 -->
          <div class="bg-surface p-6 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow text-left">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-teal-600 mb-6">
              <span class="material-symbols-outlined">sync</span>
            </div>
            <h4 class="text-lg font-bold mb-2">Real-Time Knowledge Sync</h4>
            <p class="text-on-surface-variant text-sm">Type or copy-paste your business details, catalogs, and policies; our AI agents learn and update instantly.</p>
          </div>
          <!-- Card 4 -->
          <div class="bg-surface p-6 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow text-left">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-orange-600 mb-6">
              <span class="material-symbols-outlined">collections</span>
            </div>
            <h4 class="text-lg font-bold mb-2">Product Catalog Galleries</h4>
            <p class="text-on-surface-variant text-sm">Assign specific product images to SKUs so the AI agent can dispatch visual cards and buy buttons inside messaging chats.</p>
          </div>
          <!-- Card 5 -->
          <div class="bg-surface p-6 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow text-left">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 mb-6">
              <span class="material-symbols-outlined">filter_alt</span>
            </div>
            <h4 class="text-lg font-bold mb-2">Spam &amp; Sentiment Filters</h4>
            <p class="text-on-surface-variant text-sm">Automatically filter out irrelevant spam or hide negative comments on public posts to protect your brand reputation.</p>
          </div>
          <!-- Card 6 -->
          <div class="bg-surface p-6 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow text-left">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-pink-600 mb-6">
              <span class="material-symbols-outlined">shopping_cart</span>
            </div>
            <h4 class="text-lg font-bold mb-2">Automated Checkout Flows</h4>
            <p class="text-on-surface-variant text-sm">Allow the AI to gather customer delivery addresses, email addresses, and phone numbers in a secure conversation window.</p>
          </div>
          <!-- Card 7 -->
          <div class="bg-surface p-6 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow text-left">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-green-600 mb-6">
              <span class="material-symbols-outlined">verified_user</span>
            </div>
            <h4 class="text-lg font-bold mb-2">Safe &amp; Policy Compliant</h4>
            <p class="text-on-surface-variant text-sm">Strictly follows Meta's platform guidelines and API standards to keep your business page secure and active.</p>
          </div>
          <!-- Card 8 -->
          <div class="bg-surface p-6 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow text-left">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-cyan-600 mb-6">
              <span class="material-symbols-outlined">analytics</span>
            </div>
            <h4 class="text-lg font-bold mb-2">Centralized Sales Analytics</h4>
            <p class="text-on-surface-variant text-sm">Monitor chat counts, checkouts initiated, and overall conversational conversion performance inside one unified cockpit.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission Statement Section -->
    <section id="about" class="py-32 relative overflow-hidden bg-surface-hover/20">
      <div class="absolute inset-0 grid-bg opacity-30 z-0"></div>
      <div class="max-w-5xl mx-auto px-4 text-center relative z-10">
        <h2 class="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-8">
          Our goal 
          <span class="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 text-amber-600 dark:text-amber-400 align-middle mx-1">
            <!-- Classic Target / Compass Mark -->
            <svg class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M12 9v3l2 2"/></svg>
          </span> 
          is to build a world 
          <span class="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 text-sky-600 dark:text-sky-400 align-middle mx-1">
            <!-- Classic Latitude/Longitude Wireframe Globe -->
            <svg class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z"/></svg>
          </span> 
          <span class="text-on-surface-variant"> where conversational </span>  
          <span class="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 text-emerald-600 dark:text-emerald-400 align-middle mx-1">
            <!-- Classic Astrolabe / Fine Orbit Paths -->
            <svg class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>
          </span> 
          <span class="text-on-surface-variant"> commerce is seamless.</span>
        </h2>
        <h3 class="text-2xl md:text-3xl lg:text-4xl font-display font-medium text-on-surface-variant leading-tight mb-12 max-w-4xl mx-auto">
          Our platform harnesses the power of AI 
          <span class="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 text-rose-500 dark:text-rose-400 align-middle mx-0.5">
            <!-- Refined Shield / Intellect Node -->
            <svg class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </span> 
          <span class="text-on-surface-variant"> to convert social interactions </span>
          <span class="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 text-slate-600 dark:text-slate-400 align-middle mx-0.5">
            <!-- Classic Detailed Mechanical Clockwork Gear -->
            <svg class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </span> 
          <span class="text-on-surface-variant"> into completed sales.</span> 
          <span class="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 text-indigo-500 dark:text-indigo-400 align-middle mx-0.5">
            <!-- Classic Diamond / Final Clarity Aspect -->
            <svg class="w-full h-full" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>
          </span>
        </h3>
        <NuxtLink 
          :to="isLoggedIn ? '/dashboard' : '/login'" 
          class="premium-btn-primary px-8 py-3"
        >
          Get Started
        </NuxtLink>
      </div>
    </section>

    <!-- Use Cases Section -->
    <section id="use-cases" class="py-24 bg-background relative">
      <div class="absolute top-0 inset-x-0 h-64 bg-surface-hover/30 rounded-b-[4rem] z-0"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16">
          <h3 class="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Use Cases</h3>
          <h2 class="text-3xl md:text-4xl font-display font-bold mb-4">See Clickify Mate in action</h2>
          <p class="text-on-surface-variant">Helping online brands turn social media engagement into revenue.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Story 1 -->
          <div class="bg-surface p-8 rounded-3xl border border-outline shadow-sm hover:-translate-y-1 transition-transform flex flex-col h-full text-left">
            <div class="mb-8 h-8 flex items-center">
              <span class="font-bold text-sm tracking-widest uppercase text-indigo-600 dark:text-indigo-400">Social Sellers</span>
            </div>
            <h4 class="text-lg font-bold mb-6 flex-grow leading-snug">How boutique fashion brands use comment auto-replies to capture 2.5x more checkouts.</h4>
            <a class="text-primary font-semibold flex items-center gap-2 hover:underline text-sm" href="#">
              <span>Read story</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>
          <!-- Story 2 (Offset for premium layout effect) -->
          <div class="bg-surface p-8 rounded-3xl border border-outline shadow-sm hover:-translate-y-1 transition-transform flex flex-col h-full -mt-4 mb-4 md:-mt-8 md:mb-8 relative z-20 text-left">
            <div class="mb-8 h-8 flex items-center">
              <span class="font-bold text-sm tracking-widest uppercase text-blue-600 dark:text-blue-400">E-commerce Brands</span>
            </div>
            <h4 class="text-lg font-bold mb-6 flex-grow leading-snug">How cosmetics companies automate product catalog delivery and checkouts via WhatsApp Business.</h4>
            <a class="text-primary font-semibold flex items-center gap-2 hover:underline text-sm" href="#">
              <span>Read story</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>
          <!-- Story 3 -->
          <div class="bg-surface p-8 rounded-3xl border border-outline shadow-sm hover:-translate-y-1 transition-transform flex flex-col h-full text-left">
            <div class="mb-8 h-8 flex items-center">
              <span class="font-bold text-sm tracking-widest uppercase text-teal-600 dark:text-teal-400">Service Providers</span>
            </div>
            <h4 class="text-lg font-bold mb-6 flex-grow leading-snug">How local service agencies collect leads and book appointments automatically through Telegram.</h4>
            <a class="text-primary font-semibold flex items-center gap-2 hover:underline text-sm" href="#">
              <span>Read story</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>
        </div>
        <div class="mt-12 text-center">
          <button class="bg-surface border border-outline hover:border-primary text-on-background px-6 py-2.5 rounded-full text-sm font-semibold transition-all">
            More Case Studies
          </button>
        </div>
      </div>
    </section>

    <!-- Team / Enterprise Section -->
    <section class="py-24 bg-background">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Text Content Wrapper -->
        <div class="max-w-3xl mb-16 text-left">
          <h3 class="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Conversational Selling</h3>
          <h2 class="text-3xl md:text-5xl font-display font-bold leading-tight mb-6">
            The Future of Retail and Social Engagement
          </h2>
          <p class="text-on-surface-variant text-base md:text-lg leading-relaxed">
            Traditional web stores lose up to 70% of potential buyers at checkout. Clickify Mate bridges the gap by answering customer price inquiries and delivering personalized checkout links right inside the chat window, driving conversion rates through the roof.
          </p>
        </div>

        <!-- 3-Column Horizontal Image Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch w-full">
          
          <!-- Left Card Container -->
          <div class="rounded-2xl overflow-hidden aspect-[3/4] rotate-x-5 rotate-y-20 shadow-xl bg-surface-hover/10">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" alt="Enterprise Team 1" class="w-full h-full object-cover grayscale">
          </div>
          
          <!-- Center Card Container -->
          <div class="rounded-2xl overflow-hidden aspect-[3/4]  shadow-xl bg-surface-hover/10">
            <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80" alt="Enterprise Team 2" class="w-full h-full object-cover grayscale">
          </div>

          <!-- Right Card Container -->
          <div class="rounded-2xl overflow-hidden aspect-[3/4] rotate-x-5 -rotate-y-20 shadow-xl bg-surface-hover/10">
            <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80" alt="Enterprise Team 3" class="w-full h-full object-cover grayscale">
          </div>

        </div>

      </div>
    </section>

    <!-- FAQs Section -->
    <section id="faq" class="py-24 bg-surface-hover/20">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h3 class="text-primary font-semibold text-sm tracking-wider uppercase mb-3">FAQs</h3>
          <h2 class="text-3xl md:text-4xl font-display font-bold mb-4">Frequently asked questions</h2>
          <p class="text-on-surface-variant">Explore answers to common questions</p>
        </div>
        <div class="space-y-4">
          <div 
            v-for="(faq, index) in faqs" 
            :key="index"
            class="border-b border-outline pb-4 text-left"
          >
            <button 
              @click="toggleFaq(index)"
              class="w-full text-left py-4 flex justify-between items-center focus:outline-none group"
            >
              <span class="font-semibold text-lg group-hover:text-primary transition-colors">{{ faq.q }}</span>
              <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                {{ activeFaq === index ? 'remove' : 'add' }}
              </span>
            </button>
            <div 
              v-show="activeFaq === index" 
              class="mt-2 text-on-surface-variant text-sm leading-relaxed pr-12 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section id="cta" class="bg-primary text-white py-32 relative overflow-hidden">
      <div class="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div class="w-[800px] h-[800px] border-[1px] border-white rounded-full absolute"></div>
        <div class="w-[600px] h-[600px] border-[1px] border-white rounded-full absolute"></div>
        <div class="w-[400px] h-[400px] border-[1px] border-white rounded-full absolute"></div>
        <div class="w-[200px] h-[200px] bg-white rounded-full absolute blur-3xl opacity-30"></div>
      </div>
      <div class="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 class="text-4xl md:text-6xl font-display font-bold leading-tight mb-8">
          Ready to automate your social commerce sales? <br>
          Start selling in minutes.
        </h2>
        <div class="flex flex-col items-center">
          <NuxtLink 
            :to="isLoggedIn ? '/dashboard' : '/login'"
            class="bg-white text-primary hover:bg-gray-100 px-6 py-2.5 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl mb-4"
          >
            {{ isLoggedIn ? 'Go to Dashboard' : 'Get Started' }}
          </NuxtLink>
          <p class="text-blue-200 text-sm">*no credit or debit card required</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes flowPulse {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}
.flow-pulse-line {
  animation: flowPulse 2.5s infinite linear;
}
</style>
