<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-sans">

    <!-- Premium Background Glow Effects -->
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full mix-blend-screen opacity-50 animate-pulse duration-[10s]"></div>
        <div class="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-primary-accent/15 blur-[150px] rounded-full mix-blend-screen opacity-40 animate-pulse duration-[12s]"></div>
    </div>

    <!-- Auth Card -->
    <div class="w-full max-w-[400px] bg-surface/90 border border-outline p-6 md:p-10 rounded-[2.5rem] shadow-2xl z-10 relative animate-in fade-in zoom-in-95 duration-500 backdrop-blur-3xl">
        <div class="text-center mb-8 space-y-4">
            <NuxtLink to="/" class="inline-flex items-center justify-center w-14 h-14 bg-surface-hover text-primary rounded-[1.2rem] mb-2 shadow-inner border border-outline hover:-translate-y-1 transition-all group">
                <div class="w-10 h-10 rounded-[12px] bg-primary text-white flex items-center justify-center font-black text-2xl md:text-3xl pt-1 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 font-leckerli-one">
                    {{ settings?.site_name?.charAt(0) || 'C' }}
                </div>
            </NuxtLink>

            <h1 class="text-2xl md:text-3xl font-black tracking-tighter text-on-surface">
                {{ showOtpInput ? 'Enter Recovery Code' : (isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome back')) }}
            </h1>
            <p class="text-on-surface-variant/75 font-semibold text-[10px] md:text-xs leading-relaxed uppercase tracking-widest">
                {{ showOtpInput ? 'Enter the code from your email to set a new password.' : (isForgotPassword ? 'Enter your email to receive a recovery link.' : (isSignUp ? 'Join our intelligence suite for free today.' : 'Enter your credentials to access the intelligence suite.')) }}
            </p>
        </div>

        <form @submit.prevent="handleAuth" class="space-y-4">
            <div class="space-y-3">
                <div class="relative group">
                    <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors text-xl">mail</span>
                    <input 
                        v-model="email"
                        type="email" 
                        placeholder="Email Address" 
                        required
                        class="w-full bg-surface pl-14 pr-8 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-on-surface-variant/40 text-on-surface"
                    />
                </div>

                <div v-if="!isForgotPassword" class="relative group">
                    <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors text-xl">lock</span>
                    <input 
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'" 
                        :placeholder="isSignUp ? 'Create Password (min 6 chars)' : 'Password'" 
                        :required="!isForgotPassword"
                        class="w-full bg-surface pl-14 pr-14 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-on-surface-variant/40 text-on-surface"
                    />
                    <button type="button" @click="showPassword = !showPassword" class="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors cursor-pointer">
                        <span class="material-symbols-outlined text-xl">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </div>

                <div v-if="isSignUp" class="relative group animate-in fade-in duration-300">
                    <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors text-xl">verified_user</span>
                    <input 
                        v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'" 
                        placeholder="Confirm Password" 
                        required
                        class="w-full bg-surface pl-14 pr-14 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-on-surface-variant/40 text-on-surface"
                    />
                    <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors cursor-pointer">
                        <span class="material-symbols-outlined text-xl">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </div>

                <div v-if="!isSignUp && !isForgotPassword" class="flex justify-end px-2">
                    <button type="button" @click="isForgotPassword = true" class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer">
                        Forgot Password?
                    </button>
                </div>

                <div v-if="showOtpInput" class="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div class="relative group">
                        <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors text-xl">pin</span>
                        <input 
                            v-model="otpCode"
                            type="text" 
                            placeholder="12-Character Recovery Code" 
                            required
                            class="w-full bg-surface pl-14 pr-8 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-on-surface-variant/40 text-on-surface tracking-[0.5em]"
                        />
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                :disabled="loading"
                class="w-full py-4 bg-gradient-to-r from-primary to-primary-accent text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
                <span v-if="loading" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                {{ loading ? 'Processing...' : (showOtpInput ? 'Verify & Reset Password' : (isForgotPassword ? 'Send Recovery Link' : (isSignUp ? 'Verify & Create Account' : 'Sign In To System'))) }}
            </button>
            
            <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl text-center">
                {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-xl text-center">
                {{ successMessage }}
            </div>
        </form>

        <div v-if="googleOAuthEnabled" class="mt-6 pt-6 border-t border-outline text-center space-y-4">
            <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Or continue with</p>
            <div class="grid grid-cols-1 gap-4">
                <button type="button" @click="signInWithProvider('google')" class="flex items-center justify-center gap-3 py-3.5 bg-surface-hover/50 border border-outline rounded-2xl hover:bg-surface-hover shadow-sm transition-all group cursor-pointer">
                    <img src="https://www.google.com/favicon.ico" class="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" alt="Google" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-on-surface/80">Google</span>
                </button>
            </div>
        </div>

        <!-- Account Switcher / Create Account Toggle -->
        <div class="mt-6 pt-6 border-t border-outline text-center">
            <p class="text-[11px] font-bold text-on-surface-variant/70 tracking-tight">
                <template v-if="isForgotPassword || showOtpInput">
                    Remember your password?
                    <button type="button" @click="isForgotPassword = false; showOtpInput = false" class="text-primary font-black hover:text-primary-accent hover:underline transition-colors ml-1 uppercase text-[10px] tracking-widest cursor-pointer">
                        Back to Login
                    </button>
                </template>
                <template v-else>
                    {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }} 
                    <button type="button" @click="toggleSignUp" class="text-primary font-black hover:text-primary-accent hover:underline transition-colors ml-1 uppercase text-[10px] tracking-widest cursor-pointer">
                        {{ isSignUp ? 'Sign In' : 'Create Account' }}
                    </button>
                </template>
            </p>
        </div>
    </div>

    <!-- Small Return Link -->
    <NuxtLink to="/" class="fixed top-6 left-6 z-50 flex items-center gap-2 py-2 px-3 bg-surface/80 border border-outline rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary hover:bg-surface/100 transition-all group backdrop-blur-md shadow-sm">
        <span class="material-symbols-outlined text-sm group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        <span>Home</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRuntimeConfig, useHead } from '#app'

const runtimeConfig = useRuntimeConfig()
const googleOAuthEnabled = computed(() => Boolean(runtimeConfig.public.googleOAuthEnabled === true || (runtimeConfig.public.googleOAuthEnabled as any) === 'true'))

defineProps({
  settings: {
    type: Object,
    default: () => ({ site_name: 'Clickify Mate', site_description: 'AI Sales Assistant for E-Commerce.' })
  }
})

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const isSignUp = ref(false)
const isForgotPassword = ref(false)
const showOtpInput = ref(false)
const otpCode = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const toggleSignUp = () => {
    isSignUp.value = !isSignUp.value
    isForgotPassword.value = false
    showOtpInput.value = false
    errorMessage.value = ''
    successMessage.value = ''
}

const showError = (msg: string) => {
    errorMessage.value = msg
    successMessage.value = ''
    setTimeout(() => { errorMessage.value = '' }, 6000)
}

const showSuccess = (msg: string) => {
    successMessage.value = msg
    errorMessage.value = ''
}

const handleAuth = async () => {
    if (showOtpInput.value) {
        handleVerifyOtp()
        return
    }

    if (isForgotPassword.value) {
        handleForgotPassword()
        return
    }

    if (!email.value || !password.value) {
        showError('Please fill in both email and password.')
        return
    }

    if (isSignUp.value && password.value !== confirmPassword.value) {
        showError('Passwords do not match!')
        return
    }

    if (isSignUp.value && password.value.length < 6) {
        showError('Password must be at least 6 characters.')
        return
    }

    loading.value = true
    errorMessage.value = ''

    try {
        if (isSignUp.value) {
            const res: any = await $fetch('/api/auth/signup', {
                method: 'POST',
                body: { email: email.value, password: password.value }
            })
            if (res?.success) {
                showSuccess('Account created successfully! Entering dashboard...')
                setTimeout(() => {
                    window.location.href = '/dashboard'
                }, 900)
            }
        } else {
            const res: any = await $fetch('/api/auth/login', {
                method: 'POST',
                body: { email: email.value, password: password.value }
            })
            if (res?.success) {
                showSuccess('Login successful! Entering dashboard...')
                setTimeout(() => {
                    window.location.href = '/dashboard'
                }, 700)
            }
        }
    } catch (e: any) {
        const msg = e.data?.statusMessage || e.data?.message || e.message || 'Authentication failed. Please check your credentials.'
        showError(msg)
    } finally {
        loading.value = false
    }
}

const handleForgotPassword = async () => {
    if (!email.value) {
        showError('Please enter your email address.')
        return
    }

    loading.value = true
    try {
        showSuccess('Recovery instructions sent if email exists.')
        showOtpInput.value = true
    } catch (e: any) {
        showError(e.message)
    } finally {
        loading.value = false
    }
}

const handleVerifyOtp = async () => {
    if (!otpCode.value || !password.value) {
        showError('Please enter both the recovery code and your new password.')
        return
    }

    loading.value = true
    try {
        const res: any = await $fetch('/api/auth/update-password', {
            method: 'POST',
            body: { token: otpCode.value, password: password.value }
        })
        if (res?.success) {
            showSuccess('Password reset successful. Please sign in.')
            setTimeout(() => {
                showOtpInput.value = false
                isForgotPassword.value = false
                password.value = ''
            }, 1200)
        }
    } catch (e: any) {
        showError(e.data?.statusMessage || e.message || 'Failed to verify recovery code.')
    } finally {
        loading.value = false
    }
}

const signInWithProvider = (provider: string) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const redirectUrl = isLocal ? window.location.origin : 'https://clickifymate.com'
    window.location.href = `/api/auth/oauth/${provider}?redirect=${encodeURIComponent(redirectUrl)}`
}

definePageMeta({
    layout: false
})

useHead({
    title: computed(() => isSignUp.value ? 'Create Account - Clickify Mate' : 'Sign In - Clickify Mate')
})

onMounted(() => {
    const route = useRoute()
    if (route.query.mode === 'signup' || route.query.signup === 'true') {
        isSignUp.value = true
    }
    const error = route.query.error
    if (error) {
        showError(decodeURIComponent(String(error)))
    }
})
</script>

<style scoped>
/* Clean scoped CSS block */
</style>
