<template>
  <div class="login-viewport">
    <!-- Back to Home Button -->
    <NuxtLink to="/" class="back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 19"></polyline>
      </svg>
      <span>Back to Home</span>
    </NuxtLink>

    <!-- Ambient Background Lighting -->
    <div class="ambient-bg" aria-hidden="true">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="glow-orb orb-3"></div>
    </div>

    <!-- Main Auth Card -->
    <div class="auth-card">
      <!-- Header / Logo -->
      <div class="card-header">
        <NuxtLink to="/" class="brand-logo">
        </NuxtLink>

        <h1 class="card-title">
          {{ showOtpInput ? 'Enter Recovery Code' : (isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome back')) }}
        </h1>
        <p class="card-subtitle">
          {{ showOtpInput ? 'Enter the code from your email to set a new password.' : (isForgotPassword ? 'Enter your email to receive a recovery link.' : (isSignUp ? 'Join our intelligence suite for free today.' : 'Enter your credentials to access your dashboard.')) }}
        </p>
      </div>

      <!-- Auth Form -->
      <form @submit.prevent="handleAuth" class="auth-form">
        <!-- Email Input -->
        <div class="input-group">
          <label class="input-label">Email Address</label>
          <div class="input-field-wrapper">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </span>
            <input 
              v-model="email"
              type="email" 
              placeholder="name@company.com" 
              required
              class="auth-input"
            />
          </div>
        </div>

        <!-- Password Input -->
        <div v-if="!isForgotPassword" class="input-group">
          <div class="label-row">
            <label class="input-label">{{ isSignUp ? 'Create Password' : 'Password' }}</label>
            <button v-if="!isSignUp" type="button" @click="isForgotPassword = true" class="forgot-btn">
              Forgot Password?
            </button>
          </div>
          <div class="input-field-wrapper">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input 
              v-model="password"
              :type="showPassword ? 'text' : 'password'" 
              :placeholder="isSignUp ? 'Min. 6 characters' : 'Enter your password'" 
              :required="!isForgotPassword"
              class="auth-input"
            />
            <button type="button" @click="showPassword = !showPassword" class="visibility-btn" aria-label="Toggle password visibility">
              <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Confirm Password (for sign up) -->
        <div v-if="isSignUp" class="input-group">
          <label class="input-label">Confirm Password</label>
          <div class="input-field-wrapper">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span>
            <input 
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'" 
              placeholder="Confirm your password" 
              required
              class="auth-input"
            />
            <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="visibility-btn" aria-label="Toggle password visibility">
              <svg v-if="!showConfirmPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- OTP Code (for recovery) -->
        <div v-if="showOtpInput" class="input-group">
          <label class="input-label">12-Character Recovery Code</label>
          <div class="input-field-wrapper">
            <input 
              v-model="otpCode"
              type="text" 
              placeholder="ENTER RECOVERY CODE" 
              required
              class="auth-input otp-field"
            />
          </div>
        </div>

        <!-- Error & Success Alerts -->
        <div v-if="errorMessage" class="alert error-alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <div v-if="successMessage" class="alert success-alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{{ successMessage }}</span>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          :disabled="loading"
          class="submit-btn"
        >
          <svg v-if="loading" class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          <span>{{ loading ? 'Processing...' : (showOtpInput ? 'Verify & Reset Password' : (isForgotPassword ? 'Send Recovery Link' : (isSignUp ? 'Create Account' : 'Sign In'))) }}</span>
        </button>
      </form>

      <!-- Google OAuth (if enabled) -->
      <div v-if="googleOAuthEnabled" class="divider-section">
        <div class="divider-line"><span>or continue with</span></div>
        <button type="button" @click="signInWithProvider('google')" class="oauth-btn">
          <img src="https://www.google.com/favicon.ico" class="oauth-icon" alt="Google" />
          <span>Continue with Google</span>
        </button>
      </div>

      <!-- Account Switcher / Create Account Toggle -->
      <div class="card-footer">
        <template v-if="isForgotPassword || showOtpInput">
          <span>Remember your password?</span>
          <button type="button" @click="isForgotPassword = false; showOtpInput = false" class="link-btn">
            Back to Sign In
          </button>
        </template>
        <template v-else>
          <span>{{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}</span>
          <button type="button" @click="toggleSignUp" class="link-btn">
            {{ isSignUp ? 'Sign In' : 'Create Account' }}
          </button>
        </template>
      </div>
    </div>
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
    if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('cicada-active')
        document.documentElement.style.fontSize = ''
    }

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
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

.login-page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #FAF8FC;
}

.login-viewport {
  flex: 1;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #FBF8FD 0%, #F5EFF8 50%, #ECE4F0 100%);
  font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #341F37;
}

/* Ambient Glow Orbs */
.ambient-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.45;
  will-change: transform;
}

.orb-1 {
  top: -10%;
  left: -5%;
  width: 550px;
  height: 550px;
  background: #E5D8EB;
}

.orb-2 {
  bottom: -15%;
  right: -5%;
  width: 600px;
  height: 600px;
  background: #D9C3E2;
}

.orb-3 {
  top: 40%;
  left: 60%;
  width: 400px;
  height: 400px;
  background: #ECE0F2;
}

/* Back Link */
.back-link {
  position: fixed;
  top: 28px;
  left: 28px;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(52, 31, 55, 0.1);
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #543359;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(52, 31, 55, 0.05);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.back-link:hover {
  background: #FFFFFF;
  color: #341F37;
  transform: translateX(-3px);
  box-shadow: 0 8px 24px rgba(52, 31, 55, 0.08);
}

/* Auth Card */
.auth-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 24px 60px -12px rgba(52, 31, 55, 0.12), 0 0 0 1px rgba(52, 31, 55, 0.06);
  border-radius: 32px;
  padding: 40px 36px;
  position: relative;
  z-index: 10;
  animation: cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Card Header */
.card-header {
  text-align: center;
  margin-bottom: 28px;
}

.brand-logo {
  display: inline-flex;
  align-items: baseline;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #341F37;
  text-decoration: none;
  margin-bottom: 12px;
  transition: transform 0.2s ease;
}

.brand-logo:hover {
  transform: scale(1.02);
}

.logo-dot {
  color: #7B4C85;
}

.card-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #341F37;
  margin: 0 0 6px 0;
}

.card-subtitle {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  color: #705977;
  margin: 0;
}

/* Form & Inputs */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #543359;
}

.forgot-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  color: #7B4C85;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.forgot-btn:hover {
  color: #341F37;
  text-decoration: underline;
}

.input-field-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8C7392;
  pointer-events: none;
  transition: color 0.2s ease;
}

.auth-input {
  width: 100%;
  padding: 13px 16px 13px 44px;
  background: #FAF7FC;
  border: 1px solid rgba(52, 31, 55, 0.12);
  border-radius: 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #341F37;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-input::placeholder {
  color: #A390A8;
  font-weight: 500;
}

.auth-input:focus {
  background: #FFFFFF;
  border-color: #7B4C85;
  box-shadow: 0 0 0 4px rgba(123, 76, 133, 0.15);
}

.input-field-wrapper:focus-within .field-icon {
  color: #7B4C85;
}

.otp-field {
  padding-left: 16px;
  text-align: center;
  letter-spacing: 0.25em;
  font-weight: 700;
}

.visibility-btn {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  color: #8C7392;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.visibility-btn:hover {
  color: #341F37;
}

/* Alerts */
.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.error-alert {
  background: #FDF2F2;
  border: 1px solid #F8B4B4;
  color: #9B1C1C;
}

.success-alert {
  background: #F3FAF7;
  border: 1px solid #A6E9D5;
  color: #0E7490;
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 14px;
  margin-top: 4px;
  background: linear-gradient(135deg, #341F37 0%, #543359 50%, #7B4C85 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 16px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 10px 24px -4px rgba(52, 31, 55, 0.25);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1.5px);
  box-shadow: 0 14px 28px -4px rgba(52, 31, 55, 0.32);
  filter: brightness(1.05);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* OAuth Section */
.divider-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.divider-line {
  display: flex;
  align-items: center;
  text-align: center;
  color: #8C7392;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.divider-line::before,
.divider-line::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(52, 31, 55, 0.1);
}

.divider-line span {
  padding: 0 12px;
}

.oauth-btn {
  width: 100%;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #FAF7FC;
  border: 1px solid rgba(52, 31, 55, 0.12);
  border-radius: 16px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: #341F37;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.oauth-btn:hover {
  background: #FFFFFF;
  border-color: rgba(52, 31, 55, 0.25);
  box-shadow: 0 4px 16px rgba(52, 31, 55, 0.06);
}

.oauth-icon {
  width: 16px;
  height: 16px;
}

/* Footer Switcher */
.card-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(52, 31, 55, 0.08);
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #705977;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.link-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  color: #7B4C85;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.link-btn:hover {
  color: #341F37;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 32px 24px;
    border-radius: 24px;
  }
  .back-link {
    top: 16px;
    left: 16px;
  }
}
</style>
