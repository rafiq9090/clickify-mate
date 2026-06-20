<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-sans">

    <!-- Premium Background Effects -->
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full mix-blend-screen opacity-50 animate-pulse duration-[10s]"></div>
        <div class="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-primary-accent/15 blur-[150px] rounded-full mix-blend-screen opacity-40 animate-pulse duration-[12s]"></div>
    </div>

    <!-- Auth Card -->
    <div class="w-full max-w-[400px] bg-surface/40 border border-outline p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl z-10 relative animate-in fade-in zoom-in-95 duration-500 backdrop-blur-3xl premium-card">
        <div class="text-center mb-8 space-y-4">
            <NuxtLink to="/" class="inline-flex items-center justify-center w-14 h-14 bg-surface/20 text-primary rounded-[1.2rem] mb-2 shadow-inner border border-outline hover:-translate-y-1 transition-all group">
                <div class="w-10 h-10 rounded-[12px] bg-primary text-white flex items-center justify-center font-black text-2xl md:text-3xl pt-1 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 font-leckerli-one">
                    {{ settings?.site_name?.charAt(0) || 'P' }}
                </div>
            </NuxtLink>

            <h1 class="text-2xl md:text-3xl font-black tracking-tighter text-white">
                {{ showOtpInput ? 'Enter Recovery Code' : (isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome back')) }}
            </h1>
            <p class="text-on-surface-variant/70 font-medium text-[10px] md:text-xs leading-relaxed uppercase tracking-widest">
                {{ showOtpInput ? 'Enter the code from your email to set a new password.' : (isForgotPassword ? 'Enter your email to receive a recovery link.' : (isSignUp ? 'Join our intelligence suite for free today.' : 'Enter your credentials to access the intelligence suite.')) }}
            </p>

        </div>

        <form @submit.prevent="handleAuth" class="space-y-4">
            <div class="space-y-3">
                <div class="relative group">
                    <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors text-xl">mail</span>
                    <input 
                        v-model="email"
                        type="email" 
                        placeholder="Email Address" 
                        required
                        class="w-full bg-surface/20 pl-14 pr-8 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-white/20 text-white"
                    />
                </div>

                
                <div v-if="!isForgotPassword" class="relative group">
                    <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors text-xl">lock</span>
                    <input 
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'" 
                        placeholder="Password" 
                        :required="!isForgotPassword"
                        class="w-full bg-surface/20 pl-14 pr-14 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-white/20 text-white"
                    />
                    <button type="button" @click="showPassword = !showPassword" class="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-xl">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </div>

                <div v-if="!isSignUp && !isForgotPassword" class="flex justify-end px-2">
                    <button type="button" @click="isForgotPassword = true" class="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-primary transition-colors">
                        Forgot Password?
                    </button>
                </div>


                <div v-if="showOtpInput" class="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div class="relative group">
                        <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors text-xl">pin</span>
                        <input 
                            v-model="otpCode"
                            type="text" 
                            placeholder="8-Digit Recovery Code" 
                            required
                            class="w-full bg-surface/20 pl-14 pr-8 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-white/20 text-white tracking-[0.5em]"
                        />
                    </div>
                    <!-- Only show password reset fields if OTP code is started -->
                    <div v-if="otpCode.length >= 4" class="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div class="relative group">
                            <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors text-xl">lock</span>
                            <input 
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'" 
                                placeholder="New Password" 
                                required
                                class="w-full bg-surface/20 pl-14 pr-14 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-white/20 text-white"
                            />
                            <button type="button" @click="showPassword = !showPassword" class="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary transition-colors">
                                <span class="material-symbols-outlined text-xl">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                            </button>
                        </div>
                        <div class="relative group">
                            <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors text-xl">verified_user</span>
                            <input 
                                v-model="confirmPassword"
                                :type="showConfirmPassword ? 'text' : 'password'" 
                                placeholder="Confirm New Password" 
                                required
                                class="w-full bg-surface/20 pl-14 pr-14 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-white/20 text-white"
                            />
                            <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary transition-colors">
                                <span class="material-symbols-outlined text-xl">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="isSignUp" class="relative group animate-in fade-in duration-300">
                    <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors text-xl">verified_user</span>
                    <input 
                        v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'" 
                        placeholder="Confirm Password" 
                        required
                        class="w-full bg-surface/20 pl-14 pr-14 py-4 rounded-2xl text-sm font-bold border border-outline focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-white/20 text-white"
                    />
                    <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-xl">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </div>

            </div>

            <button 
                type="submit" 
                :disabled="loading"
                class="w-full py-4 bg-gradient-to-r from-primary to-primary-accent text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
                <span v-if="loading" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                {{ loading ? 'Processing...' : (showOtpInput ? 'Verify & Reset Password' : (isForgotPassword ? 'Send Recovery Link' : (isSignUp ? 'Verify & Create Account' : 'Sign In To System'))) }}
            </button>
            
            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
            <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
        </form>

        <div class="mt-6 pt-6 border-t border-white/10 text-center space-y-4">
            <p class="text-[10px] font-black uppercase tracking-widest text-white/30">Or continue with</p>

            <div class="grid grid-cols-1 gap-4">
                <button @click="signInWithProvider('google')" class="flex items-center justify-center gap-3 py-3.5 bg-surface/20 border border-outline rounded-2xl hover:bg-surface/40 shadow-sm transition-all group">
                    <img src="https://www.google.com/favicon.ico" class="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" alt="Google" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-white/80">Google</span>
                </button>
            </div>
            
            <p class="text-[11px] font-bold text-white/60 pt-2 tracking-tight">
                <template v-if="isForgotPassword || showOtpInput">
                    Remember your password?
                    <button @click="isForgotPassword = false; showOtpInput = false" class="text-primary font-black hover:text-primary-accent hover:underline transition-colors ml-1 uppercase text-[10px] tracking-widest">
                        Back to Login
                    </button>
                </template>
                <template v-else>
                    {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }} 
                    <button @click="isSignUp = !isSignUp" class="text-primary font-black hover:text-primary-accent hover:underline transition-colors ml-1 uppercase text-[10px] tracking-widest">
                        {{ isSignUp ? 'Sign In' : 'Create Account' }}
                    </button>
                </template>
            </p>

        </div>
    </div>


    <!-- Return Link -->
    <!-- Small Return Link -->
    <NuxtLink to="/" class="fixed top-6 left-6 z-50 flex items-center gap-2 py-2 px-3 bg-surface/20 border border-outline rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-primary hover:bg-surface/40 transition-all group backdrop-blur-md">
        <span class="material-symbols-outlined text-sm group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        <span>Home</span>
    </NuxtLink>



  </div>
</template>

<script setup>
defineProps({
  settings: {
    type: Object,
    default: () => ({ site_name: 'PaperSnapPro', site_description: 'Professional document intelligence suites.' })
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

const showError = (msg) => {
    errorMessage.value = msg
    successMessage.value = ''
    setTimeout(() => errorMessage.value = '', 5000)
}

const showSuccess = (msg) => {
    successMessage.value = msg
    errorMessage.value = ''
    setTimeout(() => successMessage.value = '', 5000)
}

const supabase = useSupabase()

const handleAuth = async () => {
    if (showOtpInput.value) {
        handleVerifyOtp()
        return
    }

    if (isForgotPassword.value) {
        handleForgotPassword()
        return
    }

    if (isSignUp.value && password.value !== confirmPassword.value) {
        showError('Passwords do not match!')
        return
    }

    if (isSignUp.value) {
        loading.value = true
        const isLeaked = await isPasswordPwned(password.value)
        if (isLeaked) {
            showError('This password has been leaked in a data breach. Please choose a more secure password.')
            loading.value = false
            return
        }
    }

    loading.value = true
    try {
        if (isSignUp.value) {
            const { data, error } = await supabase.auth.signUp({
                email: email.value,
                password: password.value,
            })
            
            if (error) {
                // Specific check for existing users
                if (error.message.toLowerCase().includes('already registered') || error.status === 400) {
                    throw new Error('This email is already in use. Please sign in instead.')
                }
                throw error
            }

            if (data?.user?.identities?.length === 0) {
                 throw new Error('This email is already in use. Please sign in instead.')
            }

            // SOLUTION 1: If confirmation is OFF, data.session will exist
            if (data?.session) {
                showSuccess('Account created successfully! Welcome.')
                setTimeout(() => navigateTo('/'), 1500)
            } else {
                showSuccess('Verification email sent! Please check your inbox.')
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.value,
                password: password.value,
            })
            if (error) throw error
            navigateTo('/')
        }
    } catch (e) {
        showError(e.message)
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
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const redirectUrl = isLocal 
            ? `${window.location.origin}/auth/reset-password`
            : 'https://papersnappro.com/auth/reset-password'

        const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
            redirectTo: redirectUrl,
        })
        if (error) throw error
        showSuccess('Recovery link sent! You can also enter the code below.')
        showOtpInput.value = true
    } catch (e) {
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
    const isLeaked = await isPasswordPwned(password.value)
    if (isLeaked) {
        showError('This password has been leaked in a data breach. Please choose a more secure password.')
        loading.value = false
        return
    }

    try {
        // 1. Verify the OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: email.value,
            token: otpCode.value,
            type: 'recovery'
        })
        if (verifyError) throw verifyError

        // 2. Update the password (now that we are logged in via OTP)
        const { error: updateError } = await supabase.auth.updateUser({
            password: password.value
        })
        if (updateError) throw updateError

        showSuccess('Password reset successful! Welcome back.')
        setTimeout(() => navigateTo('/'), 2000)
    } catch (e) {
        showError(e.message)
    } finally {
        loading.value = false
    }
}

const signInWithProvider = async (provider) => {
    try {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const redirectUrl = isLocal 
            ? window.location.origin 
            : 'https://papersnappro.com'

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: redirectUrl
            }
        })
        if (error) throw error
    } catch (e) {
        showError(e.message)
    }
}

definePageMeta({
    layout: false
})

useHead({
    title: isSignUp.value ? 'Create Account - PaperSnapPro' : 'Sign In - PaperSnapPro'
})
onMounted(() => {
    const error = useRoute().query.error
    if (error) {
        showError(decodeURIComponent(error))
    }
})
</script>

<style scoped>
@reference "../assets/css/main.css";

.error-message {
    @apply p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl text-center;
    animation: fadeIn 300ms both, slideInFromTop2 300ms both;
}

.success-message {
    @apply p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl text-center;
    animation: fadeIn 300ms both, slideInFromTop2 300ms both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInFromTop2 {
  from { opacity: 0; transform: translateY(-0.5rem); }
  to { opacity: 1; transform: translateY(0); }
}

.premium-glass {
    box-shadow: 0 25px 80px -12px rgba(0, 0, 0, 0.7);
}
</style>
