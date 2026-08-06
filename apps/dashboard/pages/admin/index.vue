<script setup>
definePageMeta({
    layout: 'admin'
})

const activeTab = ref('templates')
const templates = ref([])
const trends = ref([])
const navigation = ref([])
const ads = ref([])
const blog = ref([])
const settings = ref({
    adsense_pub_id: '',
    adsense_code: '',
    google_analytics_id: '',
    site_name: '',
    google_search_console_id: '',
    bing_webmaster_id: '',
    yandex_webmaster_id: '',
    groq_api_key: '',
    gemini_api_key: '',
    tinyurl_api_token: '',
    supabase_url: '',
    supabase_key: '',
    supabase_service_role_key: ''
})
const loading = ref(false)

const tokenStats = ref({
    todayTokens: 0,
    yesterdayTokens: 0,
    allTimeTokens: 0,
    dailyUsage: [],
    weeklyUsage: [],
    monthlyUsage: [],
    featureUsage: [],
    sessionUsage: []
})
const loadingTokens = ref(false)
const tokenTimeframe = ref('daily')

const loadTokenStats = async (silent = false) => {
    if (!silent) loadingTokens.value = true
    try {
        const data = await $fetch('/api/admin/token-stats')
        if (data && data.success) {
            tokenStats.value = data.stats
        }
    } catch (e) {
        console.error('Failed to load token stats:', e)
    } finally {
        if (!silent) loadingTokens.value = false
    }
}


const loadAdminData = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/admin/manage?action=get_all')
    if (data.success) {
      templates.value = data.templates
      trends.value = data.trends
      navigation.value = data.navigation || []
      ads.value = data.ads || []
      blog.value = data.blog || []
      if (data.settings) settings.value = data.settings
    }
  } catch (err) {
    console.error('Failed to load admin data:', err)
  } finally {
    loading.value = false
  }
}

const saveCollection = async (collection) => {
  try {
    const dataToSave = collection === 'templates' ? templates.value : 
                       collection === 'trends' ? trends.value : 
                       collection === 'blog' ? blog.value :
                       collection === 'ads' ? ads.value : 
                       collection === 'settings' ? [settings.value] : navigation.value
    const res = await $fetch('/api/admin/manage?action=save_all', {
      method: 'POST',
      body: { collection, data: dataToSave }
    })
    if (res.success) {
      await loadAdminData() // Reload to get newly generated IDs from DB
      alert(`${collection.toUpperCase()} saved successfully!`)
    }
  } catch (err) {
    alert('Save failed. Check console.')
  }
}

const addTemplate = () => {
    templates.value.unshift({ title: 'New Blueprint', content: '[Name], insert your message structure here.' })
}

const addTrend = () => {
    trends.value.unshift({ keyword: 'New Niche Topic', volume: '10K', growth: '+25%', difficulty: 'Easy', rank: trends.value.length + 1 })
}

const addNavItem = () => {
    navigation.value.push({ label: 'New Link', path: '/', icon: 'link' })
}

const addBlogPost = () => {
    blog.value.unshift({ 
        title: 'New Post Title',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        slug: 'new-post-title',
        category: 'STRATEGY', 
        excerpt: 'Short description for card...', 
        content: 'Long form content here...', 
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop', 
        date: new Date().toISOString().split('T')[0] 
    })
}

const blogTopic = ref('')
const isGeneratingBlog = ref(false)
const generateAiBlog = async () => {
    if (!blogTopic.value) return alert('Enter a topic first!')
    isGeneratingBlog.value = true
    try {
        const data = await $fetch('/api/blog/generate', {
            method: 'POST',
            body: { topic: blogTopic.value }
        })
        if (data.success) {
            blog.value.unshift(data.blog)
            saveCollection('blog')
            blogTopic.value = ''
            alert('Blog Generated and Saved!')
        }
    } catch (e) {
        const msg = (e.data && e.data.statusMessage) || e.message
        alert('AI Generation Error: ' + msg)
    } finally {
        isGeneratingBlog.value = false
    }
}

const deleteItem = async (idx, collection) => {
    if (confirm(`Permanently delete this item from ${collection}?`)) {
        let itemToRemove;
        if (collection === 'templates') itemToRemove = templates.value[idx]
        else if (collection === 'trends') itemToRemove = trends.value[idx]
        else if (collection === 'ads') itemToRemove = ads.value[idx]
        else if (collection === 'blog') itemToRemove = blog.value[idx]
        else itemToRemove = navigation.value[idx]

        // If the item has an ID, delete it from the database first
        if (itemToRemove && itemToRemove.id) {
            try {
                const res = await $fetch(`/api/admin/manage?action=delete&collection=${collection}&id=${itemToRemove.id}`)
                if (!res.success) throw new Error('Delete failed')
            } catch (err) {
                return alert('Failed to delete from database: ' + err.message)
            }
        }

        // Remove from UI
        if (collection === 'templates') templates.value.splice(idx, 1)
        else if (collection === 'trends') trends.value.splice(idx, 1)
        else if (collection === 'ads') ads.value.splice(idx, 1)
        else if (collection === 'blog') blog.value.splice(idx, 1)
        else navigation.value.splice(idx, 1)

        // Save the remaining collection (just in case they made other edits)
        saveCollection(collection)
    }
}

const toggleAllAds = (state) => {
    ads.value.forEach(ad => ad.isEnabled = state)
    saveCollection('ads')
}

const activeVisitors = ref([])
const loadVisitors = async () => {
    try {
        const data = await $fetch('/api/analytics/monitor')
        if (data && data.success) {
            activeVisitors.value = data.visitors || []
            nextTick(() => renderCharts())
        }
    } catch (e) {
        // silent fail on fetch
    }
}

// --- Chart Computed Data ---
const countryStats = computed(() => {
    const map = {}
    activeVisitors.value.forEach(v => {
        const c = v.country || 'Unknown'
        map[c] = (map[c] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10)
})

const browserStats = computed(() => {
    const map = {}
    activeVisitors.value.forEach(v => {
        const b = v.browser || 'Unknown'
        map[b] = (map[b] || 0) + 1
    })
    return Object.entries(map)
})

const osStats = computed(() => {
    const map = {}
    activeVisitors.value.forEach(v => {
        const o = v.os || 'Unknown'
        map[o] = (map[o] || 0) + 1
    })
    return Object.entries(map)
})

const deviceStats = computed(() => {
    const map = {}
    activeVisitors.value.forEach(v => {
        const d = v.device || 'Desktop'
        map[d] = (map[d] || 0) + 1
    })
    return Object.entries(map)
})

const totalTime = computed(() => {
    const secs = activeVisitors.value.reduce((sum, v) => sum + (v.time_spent_seconds || 0), 0)
    return secs < 60 ? `${secs}s` : `${Math.floor(secs/60)}m ${secs%60}s`
})

// --- Chart.js rendering ---
const countryChartRef = ref(null)
const browserChartRef = ref(null)
const osChartRef = ref(null)
const deviceChartRef = ref(null)
let chartInstances = {}

const CHART_COLORS = ['#6366f1','#0b62d2','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16','#f97316','#14b8a6']

const destroyCharts = () => {
    Object.values(chartInstances).forEach((c) => c?.destroy?.())
    chartInstances = {}
}

const renderCharts = () => {
    if (activeTab.value !== 'monitor') return
    if (typeof window === 'undefined' || !window.Chart) return
    destroyCharts()
    const Chart = window.Chart

    if (countryChartRef.value && countryStats.value.length > 0) {
        chartInstances.country = new Chart(countryChartRef.value, {
            type: 'bar',
            data: {
                labels: countryStats.value.map(([c]) => c),
                datasets: [{ label: 'Visitors', data: countryStats.value.map(([,n]) => n), backgroundColor: CHART_COLORS, borderRadius: 8, borderSkipped: false }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
        })
    }

    if (browserChartRef.value && browserStats.value.length > 0) {
        chartInstances.browser = new Chart(browserChartRef.value, {
            type: 'doughnut',
            data: {
                labels: browserStats.value.map(([b]) => b),
                datasets: [{ data: browserStats.value.map(([,n]) => n), backgroundColor: CHART_COLORS, borderWidth: 0, hoverOffset: 8 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, padding: 12 } } }, cutout: '65%' }
        })
    }

    if (osChartRef.value && osStats.value.length > 0) {
        chartInstances.os = new Chart(osChartRef.value, {
            type: 'doughnut',
            data: {
                labels: osStats.value.map(([o]) => o),
                datasets: [{ data: osStats.value.map(([,n]) => n), backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4'], borderWidth: 0, hoverOffset: 8 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, padding: 12 } } }, cutout: '65%' }
        })
    }

    if (deviceChartRef.value && deviceStats.value.length > 0) {
        chartInstances.device = new Chart(deviceChartRef.value, {
            type: 'doughnut',
            data: {
                labels: deviceStats.value.map(([d]) => d),
                datasets: [{ data: deviceStats.value.map(([,n]) => n), backgroundColor: ['#0b62d2','#06b6d4','#f97316'], borderWidth: 0, hoverOffset: 8 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, padding: 12 } } }, cutout: '65%' }
        })
    }
}

// Load Chart.js from CDN once
const loadChartJs = () => {
    return new Promise((resolve) => {
        if (window.Chart) return resolve()
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
        script.onload = () => resolve()
        document.head.appendChild(script)
    })
}

const inboxMessages = ref([])
const loadInbox = async () => {
    try {
        const data = await $fetch('/api/admin/leads')
        if (data && data.success) inboxMessages.value = data.messages || []
    } catch (e) {
        // silent fail
    }
}

const deleteInboxMessage = async (id, idx) => {
    if (confirm('Permanently delete this incoming message?')) {
        try {
            await $fetch('/api/admin/leads', { method: 'DELETE', body: { id } })
            inboxMessages.value.splice(idx, 1)
        } catch (e) {
            alert('Deletion failed.')
        }
    }
}

watch(activeTab, async (newTab) => {
    if (newTab === 'monitor') {
        await loadChartJs()
        await loadVisitors()
    }
    if (newTab === 'inbox') loadInbox()
    if (newTab === 'tokens') loadTokenStats()
})

onMounted(() => {
    loadAdminData()
    loadInbox()
    loadTokenStats()
    setInterval(() => {
      if (activeTab.value === 'monitor') loadVisitors()
      if (activeTab.value === 'tokens') loadTokenStats(true)
    }, 5000)
})
</script>

<template>
  <div class="page-admin-content max-w-[1400px] mx-auto px-3 flex flex-col lg:flex-row gap-8">

    <!-- Left Sidebar Menu -->
    <aside class="w-full lg:w-72 shrink-0">
        <div class="bg-surface/40 p-6 rounded-[2rem] border border-white/10 shadow-2xl lg:sticky lg:top-28 space-y-6">
            <div class="px-2">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Navigation</div>
                <h3 class="text-sm font-black uppercase tracking-widest text-primary">Admin Panel</h3>
            </div>
            
            <nav class="flex flex-col gap-1.5">
                <button 
                    @click="activeTab = 'templates'" 
                    :class="[activeTab === 'templates' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5']" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all w-full text-left"
                >
                    <span class="material-symbols-outlined text-[18px]">auto_stories</span>
                    Blueprints
                </button>
                <button 
                    @click="activeTab = 'trends'" 
                    :class="[activeTab === 'trends' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5']" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all w-full text-left"
                >
                    <span class="material-symbols-outlined text-[18px]">trending_up</span>
                    Trends
                </button>
                <button 
                    @click="activeTab = 'nav'" 
                    :class="[activeTab === 'nav' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5']" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all w-full text-left"
                >
                    <span class="material-symbols-outlined text-[18px]">navigation</span>
                    Navigation
                </button>
                <button 
                    @click="activeTab = 'ads'" 
                    :class="[activeTab === 'ads' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5']" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all w-full text-left"
                >
                    <span class="material-symbols-outlined text-[18px]">ad_units</span>
                    Ads
                </button>
                <button 
                    @click="activeTab = 'blog'" 
                    :class="[activeTab === 'blog' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5']" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all w-full text-left"
                >
                    <span class="material-symbols-outlined text-[18px]">article</span>
                    Blog
                </button>
                <button 
                    @click="activeTab = 'monitor'" 
                    :class="[activeTab === 'monitor' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5']" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all w-full text-left"
                >
                    <span class="material-symbols-outlined text-[18px]">sensors</span>
                    Live Monitor
                </button>
                <button 
                    @click="activeTab = 'inbox'" 
                    :class="[activeTab === 'inbox' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5']" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all w-full text-left relative"
                >
                    <span class="material-symbols-outlined text-[18px]">mail</span>
                    Inbox Server
                    <span v-if="inboxMessages.length > 0" class="absolute right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm border border-white"></span>
                </button>
                <button 
                    @click="activeTab = 'tokens'" 
                    :class="[activeTab === 'tokens' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5']" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all w-full text-left"
                >
                    <span class="material-symbols-outlined text-[18px]">analytics</span>
                    Tokens Analytics
                </button>
                <button 
                    @click="activeTab = 'settings'" 
                    :class="[activeTab === 'settings' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5']" 
                    class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all w-full text-left"
                >
                    <span class="material-symbols-outlined text-[18px]">settings</span>
                    Global Config
                </button>
            </nav>
        </div>
    </aside>

    <!-- Right Content Area -->
    <div class="flex-grow max-w-full lg:max-w-[calc(100%-20rem)]">


    <!-- Global Config / Settings Manager -->
    <div v-if="activeTab === 'settings'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
             <h2 class="text-3xl font-black tracking-tight flex items-center gap-4">
                 <span class="w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <span class="material-symbols-outlined">settings</span>
                 </span>
                 Global Application Configuration
             </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 text-white">
            <!-- AdSense Section -->
            <div class="bg-surface/40 p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-8 opacity-5">
                    <span class="material-symbols-outlined text-9xl">ads_click</span>
                </div>
                <div class="space-y-4">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-400/10 text-yellow-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-400/20">
                        <span class="material-symbols-outlined text-[14px]">monetization_on</span> Google AdSense
                    </div>
                    <h3 class="text-2xl font-black">Monetization Engine</h3>
                    <p class="text-sm text-white/60 font-medium">Configure your AdSense Publisher ID and Auto-Ads script for global monetization.</p>
                </div>


                <div class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-outline ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">badge</span> AdSense Publisher ID
                        </label>
                        <input v-model="settings.adsense_pub_id" class="w-full bg-surface-container-low px-6 py-4 rounded-2xl text-[11px] font-mono font-bold border border-outline-variant/15 focus:ring-4 ring-yellow-400/10 transition-all outline-none" placeholder="pub-XXXXXXXXXXXXXXXX" />
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-outline ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">code</span> AdSense Auto-Ads Script (Head Section)
                        </label>
                        <textarea v-model="settings.adsense_code" class="w-full bg-surface-container-low px-6 py-4 rounded-2xl text-[10px] font-mono border border-outline-variant/15 focus:ring-4 ring-yellow-400/10 transition-all outline-none resize-none h-48" placeholder="<script async src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-...' crossorigin='anonymous'></script>"></textarea>
                        <p class="text-[9px] font-bold text-yellow-700/60 px-4">Paste the code snippet provided by Google AdSense to enable Auto-Ads across all pages.</p>
                    </div>
                </div>
                <button @click="saveCollection('settings')" class="w-full py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-yellow-400/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">save</span> SAVE ADSENSE CONFIG
                </button>
            </div>

            <!-- Site Config Section -->
            <div class="bg-surface/40 p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
                <div class="space-y-4">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                        <span class="material-symbols-outlined text-[14px]">public</span> Site Branding
                    </div>
                    <h3 class="text-2xl font-black text-white">General Identity</h3>
                    <p class="text-sm text-white/60 font-medium">Control the core SEO and identification parameters of the application.</p>
                </div>

                <div class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">title</span> Formal Site Name
                        </label>
                        <input v-model="settings.site_name" class="w-full bg-white/5 px-6 py-4 rounded-2xl text-sm font-bold border border-white/10 focus:ring-4 ring-primary/10 transition-all outline-none text-white" placeholder="Clickify Mate" />
                    </div>

                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">bar_chart</span> Google Analytics ID (G-XXXX)
                        </label>
                        <input v-model="settings.google_analytics_id" class="w-full bg-white/5 px-6 py-4 rounded-2xl text-xs font-mono font-bold border border-white/10 focus:ring-4 ring-primary/10 transition-all outline-none text-white" placeholder="G-XXXXXXXXXX" />
                    </div>
                </div>
                <button @click="saveCollection('settings')" class="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">save</span> UPDATE SITE IDENTITY
                </button>
            </div>


            <!-- SEO & Search Engines Section -->
            <div class="bg-surface/40 p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8 lg:col-span-2">
                <div class="space-y-4">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                        <span class="material-symbols-outlined text-[14px]">search</span> SEO & Search Engines
                    </div>
                    <h3 class="text-2xl font-black text-white">Webmaster Verifications</h3>
                    <p class="text-sm text-white/60 font-medium">Add verification IDs for major search engines to ensure your site is indexed correctly.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">language</span> Google Search Console
                        </label>
                        <input v-model="settings.google_search_console_id" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[10px] font-mono border border-white/5 focus:ring-2 ring-indigo-500/20 outline-none text-white" placeholder="e.g. 12345ABC..." />
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">travel_explore</span> Bing Webmaster
                        </label>
                        <input v-model="settings.bing_webmaster_id" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[10px] font-mono border border-white/5 focus:ring-2 ring-indigo-500/20 outline-none text-white" placeholder="e.g. EBX-123..." />
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">manage_search</span> Yandex Verification
                        </label>
                        <input v-model="settings.yandex_webmaster_id" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[10px] font-mono border border-white/5 focus:ring-2 ring-indigo-500/20 outline-none text-white" placeholder="e.g. 98d6..." />
                    </div>
                </div>
                <button @click="saveCollection('settings')" class="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">save_as</span> SYNC SEARCH VERIFICATIONS
                </button>
            </div>


            <!-- API & Integration Keys Section -->
            <div class="bg-surface/40 p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8 lg:col-span-2 text-white">
                <div class="space-y-4">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                        <span class="material-symbols-outlined text-[14px]">key</span> API & Infrastructure (Overrides .env)
                    </div>
                    <h3 class="text-2xl font-black">Integration Gateway</h3>
                    <p class="text-sm text-white/60 font-medium">Manage your service keys. If left blank, the system will default to the values in your .env file.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">psychology</span> Groq API Key(s)
                        </label>
                        <input type="text" v-model="settings.groq_api_key" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[10px] font-mono border border-white/5 focus:ring-2 ring-red-500/20 outline-none text-white" placeholder="gsk_key1, gsk_key2, ..." />
                        <p class="text-[9px] font-bold text-white/30 px-4">Supports multiple comma-separated keys for automatic round-robin rotation & fallback.</p>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">auto_awesome</span> Google Gemini Key
                        </label>
                        <input type="password" v-model="settings.gemini_api_key" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[10px] font-mono border border-white/5 focus:ring-2 ring-red-500/20 outline-none text-white" placeholder="AIza..." />
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">link</span> TinyURL Token
                        </label>
                        <input type="password" v-model="settings.tinyurl_api_token" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[10px] font-mono border border-white/5 focus:ring-2 ring-red-500/20 outline-none text-white" placeholder="Token..." />
                    </div>

                    <div class="space-y-2 lg:col-span-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">database</span> Supabase URL
                        </label>
                        <input v-model="settings.supabase_url" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[10px] font-mono border border-white/5 focus:ring-2 ring-red-500/20 outline-none text-white" placeholder="https://xyz.supabase.co" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">lock_open</span> Supabase Anon Key
                        </label>
                        <input type="password" v-model="settings.supabase_key" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[10px] font-mono border border-white/5 focus:ring-2 ring-red-500/20 outline-none text-white" placeholder="eyJhbG..." />
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">admin_panel_settings</span> Service Role Key
                        </label>
                        <input type="password" v-model="settings.supabase_service_role_key" class="w-full bg-white/5 px-4 py-3 rounded-xl text-[10px] font-mono border border-white/5 focus:ring-2 ring-red-500/20 outline-none text-white" placeholder="eyJhbG..." />
                    </div>
                </div>
                <div class="flex items-center justify-center gap-4">
                  <button @click="saveCollection('settings')" class="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-red-600/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
                      <span class="material-symbols-outlined">security</span> AUTHORIZE & SAVE INFRASTRUCTURE
                  </button>
                </div>
                <p class="text-[9px] font-bold text-red-500/60 text-center uppercase tracking-widest">⚠️ Access Restricted: These values remain encrypted where supported.</p>
            </div>

        </div>
    </div>

    <!-- Inbox / Messages Manager -->
    <div v-if="activeTab === 'inbox'" class="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
        <div class="flex justify-between items-center mb-12">
             <h2 class="text-3xl font-black tracking-tight flex items-center gap-4">
                 <span class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-white/10">
                    <span class="material-symbols-outlined">inbox</span>
                 </span>
                 Global Intelligence Inbox
             </h2>
             <button @click="loadInbox" class="px-6 py-3 bg-white/5 text-primary border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2">
                 <span class="material-symbols-outlined text-sm">sync</span> FORCE SYNC
             </button>
        </div>
        
        <div v-if="inboxMessages.length === 0" class="text-center py-24 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <span class="material-symbols-outlined text-6xl text-white/10 mb-4">all_inbox</span>
            <h3 class="text-xl font-bold text-white">No Messages Yet</h3>
            <p class="text-sm text-white/40 max-w-sm mx-auto mt-2">There currently are no support queries or business access requests in the database.</p>
        </div>

        <div v-else class="space-y-6">
            <div v-for="(msg, idx) in inboxMessages" :key="idx" class="bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 hover:shadow-2xl transition-all relative overflow-hidden group">
                <div class="flex flex-col gap-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-secondary/10 text-secondary rounded-[1.2rem] flex items-center justify-center font-black text-xl shadow-inner">
                                {{ msg.data?.name ? msg.data.name.charAt(0).toUpperCase() : 'U' }}
                            </div>
                            <div>
                                <h3 class="font-black text-lg text-white">{{ msg.data?.name || 'Anonymous Operator' }}</h3>
                                <a :href="'mailto:' + msg.email" class="text-xs font-bold text-primary hover:underline">{{ msg.email }}</a>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
                            <span class="text-[10px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-4 py-2 text-center rounded-xl border border-white/5 flex-grow md:flex-grow-0">
                                {{ new Date(msg.created_at).toLocaleString() }}
                            </span>
                            <button @click="deleteInboxMessage(msg.id, idx)" class="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm shrink-0" title="Delete Message">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                    <div class="bg-white/5 p-6 rounded-2xl border border-white/5 text-sm font-medium leading-relaxed whitespace-pre-wrap text-white/80">
                        {{ msg.data?.message || 'No encoded payload.' }}
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Blog Manager -->
    <div v-if="activeTab === 'blog'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8 text-white">
             <h2 class="text-3xl font-black tracking-tight flex items-center gap-4">
                 <span class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-white/10">
                    <span class="material-symbols-outlined">edit_note</span>
                 </span>
                 Publish Expert Insights
             </h2>

             <div class="flex items-center gap-4 bg-white/5 p-3 rounded-[2.5rem] border border-white/10 shadow-sm w-full md:w-auto">
                <input v-model="blogTopic" class="bg-white/5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-none focus:ring-2 ring-primary/20 w-full md:w-64 text-white placeholder:text-white/20" placeholder="Enter SEO Topic (e.g. AI Business)..." @keyup.enter="generateAiBlog" />
                <button 
                  @click="generateAiBlog" 
                  :disabled="isGeneratingBlog"
                  class="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 whitespace-nowrap"
                >
                    <span class="material-symbols-outlined text-sm">{{ isGeneratingBlog ? 'sync' : 'auto_awesome' }}</span>
                    {{ isGeneratingBlog ? 'GENERATING...' : 'GENERATE AI ARTICLE' }}
                </button>
             </div>

             <button @click="addBlogPost" class="px-8 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-secondary/20 flex items-center gap-2">
                 <span class="material-symbols-outlined">add</span> NEW BLANK
             </button>
        </div>

        <div class="space-y-8">
            <div v-for="(post, idx) in blog" :key="idx" class="bg-surface/40 p-10 rounded-[3rem] border border-white/10 shadow-2xl transition-all group text-white">
                 <div class="grid grid-cols-1 lg:grid-cols-4 gap-12">
                     <div class="lg:col-span-1 space-y-6">
                         <!-- Permanent Image Preview -->
                         <div class="aspect-video bg-white/5 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-white/10">
                             <img v-if="post.image" :src="post.image" class="w-full h-full object-cover" />
                             <span v-else class="material-symbols-outlined text-4xl opacity-20">image</span>
                         </div>
                         <!-- Explicit Image URL Option Add -->
                         <div class="space-y-2">
                             <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2 flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">image</span> Change Image URL</label>
                             <input v-model="post.image" class="w-full bg-white/5 px-4 py-2.5 rounded-xl text-[10px] font-bold border border-white/5 focus:ring-2 ring-primary/20 text-white" placeholder="https://..." />
                         </div>
                         <div class="space-y-2">
                             <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Category Option</label>
                             <input v-model="post.category" class="w-full bg-white/5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 focus:ring-2 ring-primary/20 text-white" placeholder="CATEGORY" />
                         </div>
                         <div class="space-y-2">
                             <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Publish Date</label>
                             <input v-model="post.date" type="date" class="w-full bg-white/5 px-4 py-2.5 rounded-xl text-[10px] font-black border border-white/5 focus:ring-2 ring-primary/20 text-white" />
                         </div>
                     </div>
                     <div class="lg:col-span-3 space-y-6">
                         <!-- Title with updated options block -->
                         <input v-model="post.title" class="w-full bg-transparent border-none p-0 text-3xl font-black tracking-tighter focus:ring-0 text-primary" placeholder="Article Title..." />
                         
                         <!-- Option Include Section -->
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-5 rounded-2xl border border-white/5">
                             <div class="space-y-2">
                                 <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">SEO URL Slug Option</label>
                                 <input v-model="post.slug" class="w-full bg-white/5 px-4 py-2.5 rounded-xl text-xs font-mono lowercase border border-white/5 focus:ring-2 ring-primary/20 text-white/60" placeholder="e.g. how-to-format-whatsapp" />
                             </div>
                             <div class="space-y-2">
                                 <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">SEO Meta Title (Override)</label>
                                 <input v-model="post.meta_title" class="w-full bg-white/5 px-4 py-2.5 rounded-xl text-xs font-bold border border-white/5 focus:ring-2 ring-primary/20 text-white" placeholder="Leave blank to use main title" />
                             </div>
                             <div class="space-y-2 md:col-span-2">
                                 <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">SEO Meta Description</label>
                                 <textarea v-model="post.meta_description" class="w-full bg-white/5 px-4 py-4 rounded-xl text-xs border border-white/5 focus:ring-2 ring-primary/20 h-20 resize-none text-white/80" placeholder="Custom SEO description..."></textarea>
                             </div>
                             <div class="space-y-2 md:col-span-1">
                                 <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Focus Keywords</label>
                                 <input v-model="post.meta_keywords" class="w-full bg-white/5 px-4 py-2.5 rounded-xl text-xs border border-white/5 focus:ring-2 ring-primary/20 text-white" placeholder="whatsapp, marketing, ai" />
                             </div>
                             <div class="space-y-2 md:col-span-1">
                                 <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Visibility Status</label>
                                 <select class="w-full bg-white/5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 focus:ring-2 ring-primary/20 text-white outline-none">
                                     <option value="published" class="bg-surface">🟢 Published properly</option>
                                     <option value="draft" class="bg-surface">🟡 Hidden / Draft</option>
                                 </select>
                             </div>
                         </div>
                         
                         <div class="space-y-4">
                             <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Short Excerpt (For cards)</label>
                             <textarea v-model="post.excerpt" class="w-full bg-white/5 rounded-xl p-4 text-xs font-medium leading-relaxed border border-white/5 focus:ring-2 ring-primary/20 h-20 resize-none text-white/80" placeholder="Write a catchy summary..."></textarea>
                         </div>
                         <div class="space-y-4">
                             <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Full Narrative Content</label>
                             <textarea v-model="post.content" class="w-full bg-white/5 rounded-xl p-6 text-xs font-medium leading-loose border border-white/5 focus:ring-2 ring-primary/20 min-h-[300px] text-white/90" placeholder="Deep dive into the subject..."></textarea>
                         </div>
                         <div class="flex gap-4 pt-6 border-t border-white/5">
                            <button @click="saveCollection('blog')" class="flex-grow py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">PUBLISH CHANGES</button>
                            <button @click="deleteItem(idx, 'blog')" class="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined text-xl">delete</span></button>
                         </div>
                     </div>
                 </div>
            </div>
        </div>

    </div>

    <!-- Ads Placement Manager -->
    <div v-if="activeTab === 'ads'" class="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
        <div class="flex justify-between items-center mb-12">
             <h2 class="text-3xl font-black tracking-tight flex items-center gap-4">
                 <span class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-white/10">
                    <span class="material-symbols-outlined">ads_click</span>
                 </span>
                 Inventory Management
             </h2>
             <button @click="saveCollection('ads')" class="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-primary/20 flex items-center gap-2">
                 <span class="material-symbols-outlined">sync</span> DEPLOY ALL PLACEMENTS
             </button>
        </div>

        <div class="bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl mb-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <div class="flex items-center gap-6">
                <div class="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-400/20">
                    <span class="material-symbols-outlined text-3xl">account_balance_wallet</span>
                </div>
                <div>
                    <h4 class="text-xs font-black uppercase tracking-widest text-white/40">Master Publisher ID</h4>
                    <input v-model="settings.adsense_pub_id" class="bg-transparent border-none p-0 text-xl font-black tracking-tight focus:ring-0 text-white w-64" placeholder="pub-xxxxxxxxxxxxxxxx" />
                </div>
            </div>
            <div class="h-12 w-px bg-white/10 hidden md:block"></div>
            <div class="flex items-center gap-4">
                <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Global Auto-Ads Status</span>
                <button @click="settings.adsense_enabled = !settings.adsense_enabled" :class="[settings.adsense_enabled ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40']" class="px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                    {{ settings.adsense_enabled ? 'Active Injection' : 'Scripts Disabled' }}
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
                v-for="(ad, idx) in ads" 
                :key="idx" 
                class="bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 hover:shadow-2xl transition-all relative group"
            >
                <div class="flex flex-col gap-6">
                    <div class="flex justify-between items-center">
                         <input v-model="ad.placement_id" class="bg-transparent border-none p-0 text-lg font-black tracking-tight focus:ring-0 text-primary uppercase" placeholder="SLOT_ID" />
                         <span class="text-[9px] font-black text-white/30 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">Responsive</span>
                    </div>
                    <div class="space-y-4">
                         <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4 flex items-center gap-1">
                             <span class="material-symbols-outlined text-[12px]">code</span> AdSense Data Slot Key
                         </label>
                         <input v-model="ad.data_ad_slot" class="w-full bg-white/5 px-5 py-4 rounded-xl text-xs font-mono border border-white/5 focus:ring-2 ring-primary/20 text-white" placeholder="e.g. 123456789" />
                    </div>
                    <div class="flex gap-4">
                        <button @click="saveCollection('ads')" class="flex-grow py-3 bg-white/5 text-primary border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">UPDATE SLOT</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Navigation Manager -->
    <div v-if="activeTab === 'nav'" class="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
        <div class="flex justify-between items-center mb-12">
             <h2 class="text-3xl font-black tracking-tight flex items-center gap-4">
                 <span class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-white/10">
                    <span class="material-symbols-outlined">menu</span>
                 </span>
                 Navigation Architecture
             </h2>
             <button @click="addNavItem" class="px-8 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-secondary/20 flex items-center gap-2">
                 <span class="material-symbols-outlined">add</span> ADD LINK
             </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
                v-for="(item, idx) in navigation" 
                :key="idx" 
                class="bg-surface/40 p-6 rounded-[2.5rem] border border-white/10 hover:shadow-2xl transition-all relative group"
            >
                <div class="flex flex-col gap-4">
                    <div class="space-y-2">
                         <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Display Label</label>
                         <input v-model="item.label" class="w-full bg-white/5 px-4 py-2 rounded-xl text-sm font-black border border-white/5 focus:ring-2 ring-primary/20 text-white" />
                    </div>
                    <div class="space-y-2">
                         <label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Destination Path</label>
                         <input v-model="item.path" class="w-full bg-white/5 px-4 py-2 rounded-xl text-xs font-mono border border-white/5 focus:ring-2 ring-primary/20 text-white/60" />
                    </div>
                    <div class="flex gap-3">
                        <button @click="saveCollection('navigation')" class="flex-grow py-2.5 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">SAVE</button>
                        <button @click="deleteItem(idx, 'navigation')" class="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"><span class="material-symbols-outlined text-[16px]">delete</span></button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Live Traffic Monitor -->
    <div v-if="activeTab === 'monitor'" class="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
        <div class="flex justify-between items-center mb-12">
             <h2 class="text-3xl font-black tracking-tight flex items-center gap-4 text-white">
                 <span class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-white/10">
                    <span class="material-symbols-outlined">analytics</span>
                 </span>
                 Live Traffic Control
             </h2>
             <div class="flex items-center gap-4">
                 <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Node Status: <span class="text-green-400">Syncing</span></span>
                 <div class="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
             </div>
        </div>

        <div v-if="loadingMonitor" class="flex flex-col items-center justify-center py-40 bg-surface/40 rounded-[3rem] border border-dashed border-white/10">
             <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
             <p class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Initialising Intelligence Feed...</p>
        </div>

        <template v-else>
            <!-- KPI Stats Bar -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div class="bg-surface/40 p-6 rounded-3xl border border-white/10 shadow-2xl text-center">
                    <div class="text-3xl font-black text-primary">{{ activeVisitors.length }}</div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Active Sessions</div>
                </div>
                <div class="bg-surface/40 p-6 rounded-3xl border border-white/10 shadow-2xl text-center">
                    <div class="text-3xl font-black text-secondary">{{ countryStats.length }}</div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Countries</div>
                </div>
                <div class="bg-surface/40 p-6 rounded-3xl border border-white/10 shadow-2xl text-center">
                    <div class="text-3xl font-black text-emerald-400">{{ browserStats.length }}</div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Browsers</div>
                </div>
                <div class="bg-surface/40 p-6 rounded-3xl border border-white/10 shadow-2xl text-center">
                    <div class="text-3xl font-black text-amber-400">{{ totalTime }}</div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Total Time Spent</div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <!-- Geo Traffic Bar Chart -->
                <div class="lg:col-span-1 bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white mb-1 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-[18px]">public</span> Traffic by Country
                    </h3>
                    <p class="text-[9px] text-white/40 mb-6">Top 10 countries by active sessions</p>
                    <div class="relative h-64">
                        <canvas ref="countryChartRef"></canvas>
                        <div v-if="countryStats.length === 0" class="absolute inset-0 flex items-center justify-center text-white/20 text-xs">No location data yet</div>
                    </div>
                </div>

                <!-- Browser Pie -->
                <div class="bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white mb-1 flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary text-[18px]">web</span> Browser Split
                    </h3>
                    <p class="text-[9px] text-white/40 mb-6">Which browser visitors use</p>
                    <div class="relative h-64">
                        <canvas ref="browserChartRef"></canvas>
                        <div v-if="browserStats.length === 0" class="absolute inset-0 flex items-center justify-center text-white/20 text-xs">No browser data yet</div>
                    </div>
                </div>

                <!-- OS Pie -->
                <div class="bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white mb-1 flex items-center gap-2">
                        <span class="material-symbols-outlined text-amber-400 text-[18px]">devices</span> OS Platform
                    </h3>
                    <p class="text-[9px] text-white/40 mb-6">Device operating system breakdown</p>
                    <div class="relative h-64">
                        <canvas ref="osChartRef"></canvas>
                        <div v-if="osStats.length === 0" class="absolute inset-0 flex items-center justify-center text-white/20 text-xs">No OS data yet</div>
                    </div>
                </div>

                <!-- Device Type Pie -->
                <div class="bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white mb-1 flex items-center gap-2">
                        <span class="material-symbols-outlined text-indigo-400 text-[18px]">smartphone</span> Device Distribution
                    </h3>
                    <p class="text-[9px] text-white/40 mb-6">Mobile vs Tablet vs Desktop share</p>
                    <div class="relative h-64">
                        <canvas ref="deviceChartRef"></canvas>
                        <div v-if="deviceStats.length === 0" class="absolute inset-0 flex items-center justify-center text-white/20 text-xs">No device data yet</div>
                    </div>
                </div>
            </div>


            <!-- Country Traffic Geo Heatbar -->
            <div class="bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl mb-10">
                <h3 class="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-[18px]">location_on</span> Geographic Traffic Distribution
                </h3>
                <div class="space-y-3">
                    <div v-for="([country, count], i) in countryStats" :key="country" class="flex items-center gap-4">
                        <span class="text-[10px] font-black uppercase tracking-widest text-white/60 w-28 truncate shrink-0">{{ country }}</span>
                        <div class="flex-grow h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                                class="h-full rounded-full transition-all duration-700" 
                                :style="{ width: (count / countryStats[0][1] * 100) + '%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }"
                            ></div>
                        </div>
                        <span class="text-[11px] font-black text-primary w-6 text-right shrink-0">{{ count }}</span>
                    </div>
                    <div v-if="countryStats.length === 0" class="text-center py-8 text-white/20 text-xs uppercase tracking-widest font-black">No location data yet.</div>
                </div>
            </div>


            <!-- Active Visitor Cards -->
            <h3 class="text-lg font-black tracking-tight mb-6 text-white flex items-center gap-3">
                <span class="material-symbols-outlined text-green-400">groups</span> Live Session Feed
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
                v-for="(visitor, idx) in activeVisitors" 
                :key="idx" 
                class="bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 hover:shadow-2xl hover:border-primary/20 transition-all relative overflow-hidden"
            >
                <div class="flex flex-col gap-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3 text-sm font-black text-white">
                            <span class="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                                <span class="material-symbols-outlined text-primary text-[18px]">person</span>
                            </span>
                            <span class="truncate block w-32 md:w-40 text-xs">{{ visitor.session_id }}</span>
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-1 bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                            <span class="material-symbols-outlined text-[14px]">timer</span> {{ Math.floor((visitor.time_spent_seconds || 0) / 60) }}m {{ (visitor.time_spent_seconds || 0) % 60 }}s
                        </span>
                    </div>
                    <div class="space-y-3 pt-5 border-t border-white/5">
                        <div class="flex justify-between items-center">
                             <span class="text-[9px] font-black uppercase tracking-widest text-white/30">Current Page</span>
                             <span class="text-[10px] font-bold text-primary truncate max-w-[180px]">{{ visitor.current_path }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                             <span class="text-[9px] font-black uppercase tracking-widest text-white/30">IP Address</span>
                             <span class="text-[10px] font-mono font-bold text-white/60">{{ visitor.ip_address || '—' }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                             <span class="text-[9px] font-black uppercase tracking-widest text-white/30">Location</span>
                             <span class="text-[10px] font-bold text-white/60">📍 {{ [visitor.city, visitor.country].filter(x => x && x !== 'Unknown').join(', ') || 'Unknown' }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                             <span class="text-[9px] font-black uppercase tracking-widest text-white/30">Hardware</span>
                             <span class="text-[10px] font-bold text-white/60">💻 {{ visitor.device || 'Desktop' }} ({{ visitor.os || '—' }} / {{ visitor.browser || '—' }})</span>
                        </div>
                        <div class="flex justify-between items-center">
                             <span class="text-[9px] font-black uppercase tracking-widest text-white/30">Status</span>
                             <span class="text-[10px] font-bold text-green-400 flex items-center gap-1"><span class="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span> Online</span>
                        </div>
                        <div class="flex justify-between items-center">
                             <span class="text-[9px] font-black uppercase tracking-widest text-white/30">Last Seen</span>
                             <span class="text-[10px] font-bold text-white/60">{{ new Date(visitor.last_active_at).toLocaleTimeString() }}</span>
                        </div>
                        <div>
                             <span class="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-3">Tools Engaged</span>
                             <div class="flex flex-wrap gap-2">
                                <span v-if="!visitor.tools_used || visitor.tools_used.length === 0" class="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-white/20 border border-white/5 uppercase tracking-widest">Browsing</span>
                                <span v-for="t in visitor.tools_used" :key="t" class="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-[9px] font-black uppercase tracking-widest">{{ t }}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div><!-- /visitor cards v-for -->
            </div><!-- /visitor grid parent -->
        </template><!-- /v-else -->
    </div><!-- /monitor tab -->


    <!-- Token Analytics Dashboard -->
    <div v-if="activeTab === 'tokens'" class="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
             <h2 class="text-3xl font-black tracking-tight flex items-center gap-4">
                 <span class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-white/10">
                    <span class="material-symbols-outlined">analytics</span>
                 </span>
                 Token Intelligence & Rotator
             </h2>
             <button @click="loadTokenStats" class="px-6 py-3 bg-white/5 text-primary border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2">
                 <span class="material-symbols-outlined text-sm">sync</span> REFRESH STATS
             </button>
        </div>

        <div v-if="loadingTokens && !tokenStats.allTimeTokens" class="flex flex-col items-center justify-center py-40 bg-surface/40 rounded-[3rem] border border-dashed border-white/10">
             <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
             <p class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Loading Token Statistics...</p>
        </div>

        <template v-else>
            <!-- KPI Stats Bar -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div class="bg-surface/40 p-6 rounded-3xl border border-white/10 shadow-2xl text-center relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="text-3xl font-black text-primary">{{ tokenStats.todayTokens?.toLocaleString() }}</div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Today's Tokens</div>
                </div>
                <div class="bg-surface/40 p-6 rounded-3xl border border-white/10 shadow-2xl text-center relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="text-3xl font-black text-secondary">{{ tokenStats.yesterdayTokens?.toLocaleString() }}</div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Yesterday's Tokens</div>
                </div>
                <div class="bg-surface/40 p-6 rounded-3xl border border-white/10 shadow-2xl text-center relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="text-3xl font-black text-emerald-400">{{ tokenStats.allTimeTokens?.toLocaleString() }}</div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">All-Time Tokens</div>
                </div>
                <div class="bg-surface/40 p-6 rounded-3xl border border-white/10 shadow-2xl text-center relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="text-3xl font-black text-amber-400">{{ settings.groq_api_key ? settings.groq_api_key.split(',').filter(k => k.trim()).length : 0 }}</div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Active Rotator Keys</div>
                </div>
            </div>

            <!-- Content Split Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <!-- Daily/Weekly/Monthly Token Trends -->
                <div class="lg:col-span-2 bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h3 class="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary text-[18px]">calendar_month</span> Consumption Trends
                        </h3>
                        <div class="flex bg-white/5 p-0.5 rounded-xl border border-white/10">
                            <button 
                                @click="tokenTimeframe = 'daily'" 
                                :class="[tokenTimeframe === 'daily' ? 'bg-primary text-white shadow-sm' : 'text-white/40 hover:text-white']" 
                                class="px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all"
                            >
                                Daily
                            </button>
                            <button 
                                @click="tokenTimeframe = 'weekly'" 
                                :class="[tokenTimeframe === 'weekly' ? 'bg-primary text-white shadow-sm' : 'text-white/40 hover:text-white']" 
                                class="px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all"
                            >
                                Weekly (1Y)
                            </button>
                            <button 
                                @click="tokenTimeframe = 'monthly'" 
                                :class="[tokenTimeframe === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-white/40 hover:text-white']" 
                                class="px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all"
                            >
                                Monthly (1Y)
                            </button>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b border-white/10">
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40">
                                        {{ tokenTimeframe === 'daily' ? 'Usage Date' : (tokenTimeframe === 'weekly' ? 'Week Commencing' : 'Billing Month') }}
                                    </th>
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Requests</th>
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Prompt Tokens</th>
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Completion</th>
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Total Tokens</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-if="tokenTimeframe === 'daily'">
                                    <tr v-for="(day, i) in tokenStats.dailyUsage" :key="'d-'+i" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td class="py-4 text-xs font-bold text-white/80">{{ new Date(day.usage_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) }}</td>
                                        <td class="py-4 text-xs font-mono text-white/60 text-right">{{ day.request_count }}</td>
                                        <td class="py-4 text-xs font-mono text-white/60 text-right">{{ day.total_prompt_tokens?.toLocaleString() }}</td>
                                        <td class="py-4 text-xs font-mono text-white/60 text-right">{{ day.total_completion_tokens?.toLocaleString() }}</td>
                                        <td class="py-4 text-xs font-mono font-black text-primary text-right">{{ day.total_tokens?.toLocaleString() }}</td>
                                    </tr>
                                    <tr v-if="tokenStats.dailyUsage?.length === 0">
                                        <td colspan="5" class="py-12 text-center text-xs text-white/20 uppercase tracking-widest font-black">No usage data logged yet</td>
                                    </tr>
                                </template>
                                <template v-else-if="tokenTimeframe === 'weekly'">
                                    <tr v-for="(week, i) in tokenStats.weeklyUsage" :key="'w-'+i" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td class="py-4 text-xs font-bold text-white/80">Week of {{ new Date(week.usage_week).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }}</td>
                                        <td class="py-4 text-xs font-mono text-white/60 text-right">{{ week.request_count }}</td>
                                        <td class="py-4 text-xs font-mono text-white/60 text-right">{{ week.total_prompt_tokens?.toLocaleString() }}</td>
                                        <td class="py-4 text-xs font-mono text-white/60 text-right">{{ week.total_completion_tokens?.toLocaleString() }}</td>
                                        <td class="py-4 text-xs font-mono font-black text-primary text-right">{{ week.total_tokens?.toLocaleString() }}</td>
                                    </tr>
                                    <tr v-if="tokenStats.weeklyUsage?.length === 0">
                                        <td colspan="5" class="py-12 text-center text-xs text-white/20 uppercase tracking-widest font-black">No weekly usage data logged yet</td>
                                    </tr>
                                </template>
                                <template v-else-if="tokenTimeframe === 'monthly'">
                                    <tr v-for="(mon, i) in tokenStats.monthlyUsage" :key="'m-'+i" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td class="py-4 text-xs font-bold text-white/80">{{ new Date(mon.usage_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }}</td>
                                        <td class="py-4 text-xs font-mono text-white/60 text-right">{{ mon.request_count }}</td>
                                        <td class="py-4 text-xs font-mono text-white/60 text-right">{{ mon.total_prompt_tokens?.toLocaleString() }}</td>
                                        <td class="py-4 text-xs font-mono text-white/60 text-right">{{ mon.total_completion_tokens?.toLocaleString() }}</td>
                                        <td class="py-4 text-xs font-mono font-black text-primary text-right">{{ mon.total_tokens?.toLocaleString() }}</td>
                                    </tr>
                                    <tr v-if="tokenStats.monthlyUsage?.length === 0">
                                        <td colspan="5" class="py-12 text-center text-xs text-white/20 uppercase tracking-widest font-black">No monthly usage data logged yet</td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Feature Breakdown -->
                <div class="lg:col-span-1 bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col gap-6">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary text-[18px]">pie_chart</span> Consumption by Feature
                    </h3>
                    <div class="space-y-6">
                        <div v-for="(feat, i) in tokenStats.featureUsage" :key="i" class="space-y-2">
                            <div class="flex justify-between items-center text-xs">
                                <span class="font-black uppercase tracking-wider text-white/80">{{ feat.feature?.replace(/_/g, ' ') }}</span>
                                <span class="font-mono font-bold text-secondary">{{ feat.total_tokens?.toLocaleString() }} tokens</span>
                            </div>
                            <div class="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div 
                                    class="h-full rounded-full transition-all duration-700" 
                                    :style="{ 
                                        width: (feat.total_tokens / (tokenStats.allTimeTokens || 1) * 100) + '%', 
                                        background: 'linear-gradient(90deg, #6366f1, #06b6d4)' 
                                    }"
                                ></div>
                            </div>
                            <div class="flex justify-between items-center text-[9px] text-white/40">
                                <span>{{ feat.request_count }} requests</span>
                                <span>{{ Math.round(feat.total_tokens / (tokenStats.allTimeTokens || 1) * 100) }}% share</span>
                            </div>
                        </div>
                        <div v-if="tokenStats.featureUsage?.length === 0" class="text-center py-12 text-xs text-white/20 uppercase tracking-widest font-black">No feature statistics yet</div>
                    </div>
                </div>

                <!-- Session / Visitor Breakdown -->
                <div class="lg:col-span-3 bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-amber-400 text-[18px]">person_search</span> Top Sessions / Users
                    </h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b border-white/10">
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40">Session ID</th>
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40">IP Address</th>
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40">Location</th>
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Requests</th>
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Last Active</th>
                                    <th class="pb-4 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Total Tokens Used</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(sess, i) in tokenStats.sessionUsage" :key="i" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td class="py-4 text-xs font-mono text-white/80 max-w-[150px] truncate">{{ sess.session_id }}</td>
                                    <td class="py-4 text-xs font-mono text-white/60">{{ sess.ip_address }}</td>
                                    <td class="py-4 text-xs font-bold text-white/60">📍 {{ [sess.city, sess.country].filter(x => x && x !== 'Unknown').join(', ') || 'Unknown' }}</td>
                                    <td class="py-4 text-xs font-mono text-white/60 text-right">{{ sess.request_count }}</td>
                                    <td class="py-4 text-xs text-white/40 text-right">{{ new Date(sess.last_active_at).toLocaleString() }}</td>
                                    <td class="py-4 text-xs font-mono font-black text-amber-400 text-right">{{ sess.total_tokens?.toLocaleString() }}</td>
                                </tr>
                                <tr v-if="tokenStats.sessionUsage?.length === 0">
                                    <td colspan="6" class="py-12 text-center text-xs text-white/20 uppercase tracking-widest font-black">No user sessions logged yet</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </template>
    </div>

    <!-- Main Content Area -->
    <div v-if="activeTab === 'templates'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="flex justify-between items-center mb-12">
             <h2 class="text-3xl font-black tracking-tight flex items-center gap-4">
                 <span class="w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <span class="material-symbols-outlined">auto_stories</span>
                 </span>
                 Manage Message Blueprints
             </h2>
             <button @click="addTemplate" class="px-8 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-secondary/20 flex items-center gap-2">
                 <span class="material-symbols-outlined">add</span> ADD NEW
             </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
                v-for="(temp, idx) in templates" 
                :key="idx" 
                class="bg-surface/40 p-8 rounded-[2.5rem] border border-white/10 group hover:border-primary/30 hover:shadow-2xl transition-all relative overflow-hidden"
            >
                <div class="flex flex-col gap-6">
                    <input v-model="temp.title" class="bg-transparent border-none p-0 text-xl font-black tracking-tight focus:ring-0 text-primary" placeholder="Enter Title..." />
                    <textarea v-model="temp.content" class="bg-white/5 border border-white/5 text-white/80 rounded-xl p-4 text-xs font-medium leading-loose min-h-[150px] focus:ring-2 ring-primary/20 resize-none shadow-inner" placeholder="Enter message content..."></textarea>
                    <div class="flex gap-4">
                        <button @click="saveCollection('templates')" class="flex-grow py-3 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">SAVE CHANGES</button>
                        <button @click="deleteItem(idx, 'templates')" class="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- Trends Editor Area -->
    <div v-if="activeTab === 'trends'" class="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
        <div class="flex justify-between items-center mb-12">
             <h2 class="text-3xl font-black tracking-tight flex items-center gap-4">
                 <span class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-white/10">
                    <span class="material-symbols-outlined">trending_up</span>
                 </span>
                 Dynamic Niche Intelligence
             </h2>
             <button @click="addTrend" class="px-8 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-secondary/20 flex items-center gap-2">
                 <span class="material-symbols-outlined">add</span> SYNTHESIZE TREND
             </button>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div 
                v-for="(trend, idx) in trends" 
                :key="idx" 
                class="bg-surface/40 p-10 rounded-[2.5rem] border border-white/10 flex flex-col hover:shadow-2xl hover:border-primary/20 transition-all relative group"
            >
                <div class="grid grid-cols-2 gap-8 text-white">
                    <div class="space-y-4">
                         <label class="text-[9px] font-black uppercase tracking-widest text-white/40">Keyword Topic</label>
                         <input v-model="trend.keyword" class="w-full bg-white/5 p-4 rounded-xl text-lg font-black tracking-tighter border border-white/5 focus:ring-2 ring-primary/20 text-white" />
                    </div>
                    <div class="space-y-4">
                         <label class="text-[9px] font-black uppercase tracking-widest text-white/40">Growth Vector (%)</label>
                         <input v-model="trend.growth" class="w-full bg-secondary/5 text-secondary p-4 rounded-xl text-lg font-black tracking-tighter border border-secondary/20 text-secondary" />
                    </div>
                    <div class="space-y-4">
                         <label class="text-[9px] font-black uppercase tracking-widest text-white/40">Volume Estimator</label>
                         <input v-model="trend.volume" class="w-full bg-white/5 p-4 rounded-xl text-xs font-bold border border-white/5 focus:ring-2 ring-primary/20 text-white" />
                    </div>
                    <div class="space-y-4">
                         <label class="text-[9px] font-black uppercase tracking-widest text-white/40">Market Difficulty</label>
                         <select v-model="trend.difficulty" class="w-full bg-white/5 p-4 rounded-xl text-xs font-bold border border-white/5 focus:ring-2 ring-primary/20 text-white outline-none">
                             <option value="Easy" class="bg-surface">Easy</option>
                             <option value="Medium" class="bg-surface">Medium</option>
                             <option value="Hard" class="bg-surface">Hard</option>
                         </select>
                    </div>
                </div>
                <div class="mt-8 pt-8 border-t border-white/5 flex items-center gap-6">
                    <button @click="saveCollection('trends')" class="flex-grow py-4 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-primary/20">DEPLOY TREND DATA</button>
                    <button @click="deleteItem(idx, 'trends')" class="w-14 h-14 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined text-xl">delete</span></button>
                </div>
            </div>
        </div>
    </div>

    </div>
  </div>
</template>

<style scoped>
.text-gradient {
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  font-weight: 900;
}
</style>
