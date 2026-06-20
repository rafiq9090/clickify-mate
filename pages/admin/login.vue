<template>
  <div class="page-login min-h-screen flex items-center justify-center bg-surface p-6">
    <!-- Decorative background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -left-1/4 -top-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px]"></div>
        <div class="absolute -right-1/4 -bottom-1/4 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[100px]"></div>
    </div>

    <div class="w-full max-w-md bg-[#0f172a] p-8 md:p-10 rounded-[3rem] shadow-2xl border border-white/10 relative z-10 text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary mx-auto mb-8 shadow-xl shadow-primary/5 border border-primary/20">
            <span class="material-symbols-outlined text-3xl">lock_person</span>
        </div>

        <h1 class="text-3xl md:text-4xl font-black mb-3 tracking-tighter text-white">Toolkit <span class="text-gradient">Security.</span></h1>
        <p class="text-white/60 font-medium text-xs mb-10 leading-relaxed max-w-[280px] mx-auto">Authorized personnel only. Please verify administrative credentials to access the command center.</p>

        <form @submit.prevent="handleLogin" class="space-y-4 text-left">
            <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Administrative Identity</label>
                <div class="relative group">
                    <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors text-xl">person</span>
                    <input 
                        v-model="credentials.username"
                        type="text" 
                        placeholder="Admin Username" 
                        class="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 ring-primary/20 transition-all placeholder:text-white/20 placeholder:font-medium outline-none"
                    />
                </div>
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Security Passphrase</label>
                <div class="relative group">
                    <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors text-xl">key_visualizer</span>
                    <input 
                        v-model="credentials.password"
                        type="password" 
                        placeholder="••••••••" 
                        class="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 ring-primary/20 transition-all placeholder:text-white/20 placeholder:font-medium outline-none"
                    />
                </div>
            </div>

            <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in shake duration-500 text-center">
                {{ error }}
            </div>

            <button 
                :disabled="loading"
                class="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group mt-6"
            >
                <span class="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">{{ loading ? 'sync' : 'verified_user' }}</span>
                {{ loading ? 'VERIFYING...' : 'AUTHORIZE ACCESS' }}
            </button>
        </form>

        <p class="mt-8 text-[9px] font-black uppercase tracking-widest text-white/20">System-wide encryption enabled</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
    layout: false
})

const credentials = reactive({
    username: '',
    password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
        error.value = 'Identity and passphrase are required.'
        return
    }

    loading.value = true
    error.value = ''

    try {
        const res = await $fetch('/api/auth/login', {
            method: 'POST',
            body: credentials
        })

        if (res.success) {
            // Set simple local state check if needed
            // Middleware will handle redirect 
            navigateTo('/admin')
        }
    } catch (err) {
        error.value = err.statusMessage || 'Authorization failed. Access denied.'
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.text-gradient {
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  font-weight: 900;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
.shake {
  animation: shake 0.5s ease-in-out;
}
</style>
