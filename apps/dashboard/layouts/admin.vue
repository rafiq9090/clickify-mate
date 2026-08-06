<script setup>
const isScrolled = ref(false)
const auth = useCookie('toolkit_admin_auth')

const handleScroll = () => {
  if (process.client) {
    isScrolled.value = window.scrollY > 10
  }
}

const settings = ref({ site_name: 'Clickify Mate' })

const loadSettings = async () => {
  try {
    const data = await $fetch('/api/admin/manage?action=get_all')
    if (data.success && data.settings) settings.value = data.settings
  } catch (err) {}
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
  loadSettings()
})

useHead({
  title: 'Admin Center',
  titleTemplate: (title) => `${title} - ${settings.value.site_name}`,
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const handleLogout = () => {
    auth.value = null
    navigateTo('/admin/login')
}
</script>

<template>
  <div class="admin-layout min-h-screen flex flex-col bg-background text-white">
    <!-- Admin Navbar -->
    <nav 
      class="fixed top-0 w-full z-50 transition-all duration-300 border-b flex items-center bg-surface/80 backdrop-blur-xl border-white/5 h-20 shadow-2xl"
    >
      <div class="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
        <div class="flex items-center gap-8">
            <div class="hidden md:flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                <NuxtLink to="/" class="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">Public Site</NuxtLink>
                <NuxtLink to="/admin" class="px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-primary text-white rounded-lg shadow-lg shadow-primary/20">Dashboard</NuxtLink>
            </div>
        </div>

        <div class="flex items-center gap-6">
            <div class="hidden sm:flex flex-col text-right">
                <span class="text-[10px] font-black uppercase tracking-widest text-primary">STATUS: ACTIVE</span>
                <span class="text-xs font-bold text-white/60">Admin Session</span>
            </div>
            <button @click="handleLogout" class="w-11 h-11 flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                <span class="material-symbols-outlined text-[18px]">logout</span>
            </button>
        </div>
      </div>
    </nav>

    <!-- Content Area -->
    <main class="flex-grow pt-28 pb-20">
        <slot />
    </main>

    <!-- Admin Footer -->
    <footer class="bg-surface/40 border-t border-white/5 py-10">
        <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
             <div class="flex items-center gap-4">
                 <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">v4.2.0 Stable</span>
                 <div class="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                 <span class="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] italic">Encrypted Secure Node</span>
             </div>
             <p class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">© 2026 Clickify Mate Systems</p>
             <div class="flex items-center gap-6">
                 <a href="#" class="text-[10px] font-black uppercase text-white/40 hover:text-primary transition-colors tracking-widest">Docs</a>
                 <a href="#" class="text-[10px] font-black uppercase text-white/40 hover:text-primary transition-colors tracking-widest">Audit</a>
             </div>
        </div>
    </footer>
  </div>

</template>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
}
</style>
