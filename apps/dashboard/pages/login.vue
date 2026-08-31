<template>
  <div class="auth-wrapper">
    <!-- Back to Home Link -->
    <NuxtLink to="/" class="floating-home-link">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      <span>Back to Clickify Mate</span>
    </NuxtLink>

    <div class="auth-card">
      <!-- Header / Logo -->
      <div class="card-header">
        <NuxtLink to="/" class="brand-logo">
        </NuxtLink>

        <h1 class="card-title">
          {{ isForgotPassword 
              ? (recoveryStage === 'code' ? 'Enter Recovery Code' : (recoveryStage === 'password' ? 'Set New Password' : 'Reset Password')) 
              : (isSignUp ? 'Create Account' : 'Welcome back') }}
        </h1>
        <p class="card-subtitle">
          {{ isForgotPassword 
              ? (recoveryStage === 'code' ? 'Enter the 12-character code sent to your email.' : (recoveryStage === 'password' ? 'Code verified! Enter your new password below.' : 'Enter your email to receive a recovery code.')) 
              : (isSignUp ? 'Join our intelligence suite for free today.' : 'Enter your credentials to access your dashboard.') }}
        </p>
      </div>

      <!-- Auth Form -->
      <form @submit.prevent="handleAuth" class="auth-form">
        
        <!-- ======================= STEP 1: EMAIL (Login, Signup, or Forgot Password Request) ======================= -->
        <div v-if="!isForgotPassword || recoveryStage === 'email' || recoveryStage === 'code'" class="input-group">
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
              :readonly="isForgotPassword && recoveryStage === 'code'"
              required
              class="auth-input"
            />
          </div>
        </div>

        <!-- ======================= STEP 2: RECOVERY CODE ONLY ======================= -->
        <div v-if="isForgotPassword && recoveryStage === 'code'" class="input-group">
          <div class="label-row">
            <label class="input-label">12-Character Recovery Code</label>
            <span v-if="expiresInSeconds > 0" class="expiry-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="timer-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Expires in {{ formattedExpiryTime }}
            </span>
            <span v-else class="expiry-badge expired">
              Code Expired
            </span>
          </div>
          <div class="input-field-wrapper">
            <input 
              v-model="otpCode"
              type="text" 
              placeholder="ENTER 12-CHARACTER CODE" 
              required
              maxlength="12"
              class="auth-input otp-field"
            />
          </div>
          <!-- Resend Code Row -->
          <div class="resend-row">
            <span>Didn't receive the code?</span>
            <button 
              type="button" 
              :disabled="resendCooldown > 0 || loading" 
              @click="handleSendRecoveryCode" 
              class="resend-btn"
            >
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code' }}
            </button>
          </div>
        </div>

        <!-- ======================= STEP 3: NEW PASSWORD (Only shown in Step 3 OR standard Login/Signup) ======================= -->
        <div v-if="(!isForgotPassword) || (isForgotPassword && recoveryStage === 'password')" class="input-group">
          <div class="label-row">
            <label class="input-label">{{ isForgotPassword ? 'New Password' : (isSignUp ? 'Create Password' : 'Password') }}</label>
            <button v-if="!isSignUp && !isForgotPassword" type="button" @click="startForgotPassword" class="forgot-btn">
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
              :placeholder="isForgotPassword ? 'Enter new password (min. 8 chars)' : (isSignUp ? 'Min. 6 characters' : 'Enter your password')" 
              required
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

        <!-- Confirm Password (for sign up or new password step) -->
        <div v-if="isSignUp || (isForgotPassword && recoveryStage === 'password')" class="input-group">
          <label class="input-label">{{ isForgotPassword ? 'Confirm New Password' : 'Confirm Password' }}</label>
          <div class="input-field-wrapper">
            <span class="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span>
            <input 
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'" 
              :placeholder="isForgotPassword ? 'Confirm new password' : 'Confirm your password'" 
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
          <span>
            {{ loading ? 'Processing...' : (
                isForgotPassword 
                  ? (recoveryStage === 'code' ? 'Verify Code' : (recoveryStage === 'password' ? 'Set New Password & Sign In' : 'Send Recovery Code')) 
                  : (isSignUp ? 'Create Account' : 'Sign In')
            ) }}
          </span>
        </button>
      </form>

      <!-- Google OAuth (if enabled) -->
      <div v-if="googleOAuthEnabled && !isForgotPassword" class="divider-section">
        <div class="divider-line"><span>or continue with</span></div>
        <button type="button" @click="signInWithProvider('google')" class="oauth-btn">
          <img src="https://www.google.com/favicon.ico" class="oauth-icon" alt="Google" />
          <span>Continue with Google</span>
        </button>
      </div>

      <!-- Account Switcher / Create Account Toggle -->
      <div class="card-footer">
        <template v-if="isForgotPassword">
          <span>Remember your password?</span>
          <button type="button" @click="resetToSignIn" class="link-btn">
            Back to Sign In
          </button>
        </template>
        <template v-else>
          <span>{{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}</span>
          <button type="button" @click="toggleSignUp" class="link-btn">
            {{ isSignUp ? 'Sign in instead' : 'Sign up for free' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const config = useRuntimeConfig()
const googleOAuthEnabled = computed(() => Boolean(config.public?.googleOAuthEnabled))

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
const recoveryStage = ref<'email' | 'code' | 'password'>('email')
const otpCode = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Expiration & Resend Countdown
const expiresInSeconds = ref(900) // 15 minutes
const resendCooldown = ref(60) // 60 seconds
let timerInterval: any = null

const formattedExpiryTime = computed(() => {
  const mins = Math.floor(expiresInSeconds.value / 60)
  const secs = expiresInSeconds.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const startTimers = () => {
  expiresInSeconds.value = 900
  resendCooldown.value = 60
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (expiresInSeconds.value > 0) expiresInSeconds.value--
    if (resendCooldown.value > 0) resendCooldown.value--
  }, 1000)
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const startForgotPassword = () => {
  isForgotPassword.value = true
  recoveryStage.value = 'email'
  errorMessage.value = ''
  successMessage.value = ''
}

const resetToSignIn = () => {
  isForgotPassword.value = false
  recoveryStage.value = 'email'
  otpCode.value = ''
  password.value = ''
  confirmPassword.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  if (timerInterval) clearInterval(timerInterval)
}

const toggleSignUp = () => {
  isSignUp.value = !isSignUp.value
  isForgotPassword.value = false
  recoveryStage.value = 'email'
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
  if (isForgotPassword.value) {
    if (recoveryStage.value === 'email') {
      await handleSendRecoveryCode()
    } else if (recoveryStage.value === 'code') {
      await handleVerifyRecoveryCode()
    } else if (recoveryStage.value === 'password') {
      await handleSetNewPassword()
    }
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

// Stage 1: Send Code to Email
const handleSendRecoveryCode = async () => {
  if (!email.value) {
    showError('Please enter your email address.')
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/request-password-reset', {
      method: 'POST',
      body: { email: email.value }
    })
    showSuccess('12-Character recovery code sent to your email!')
    recoveryStage.value = 'code'
    startTimers()
  } catch (e: any) {
    showError(e?.data?.statusMessage || e?.message || 'Failed to send recovery email.')
  } finally {
    loading.value = false
  }
}

// Stage 2: Verify Code
const handleVerifyRecoveryCode = async () => {
  if (!otpCode.value || otpCode.value.trim().length !== 12) {
    showError('Please enter the valid 12-character recovery code.')
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/verify-reset-code', {
      method: 'POST',
      body: { email: email.value, token: otpCode.value.trim().toUpperCase() }
    })
    showSuccess('Code verified! Please enter your new password below.')
    recoveryStage.value = 'password'
  } catch (e: any) {
    showError(e?.data?.statusMessage || e?.message || 'Invalid or expired recovery code.')
  } finally {
    loading.value = false
  }
}

// Stage 3: Set New Password
const handleSetNewPassword = async () => {
  if (!password.value) {
    showError('Please enter your new password.')
    return
  }

  if (password.value !== confirmPassword.value) {
    showError('New password and confirmation do not match!')
    return
  }

  if (password.value.length < 8) {
    showError('Password must be at least 8 characters long.')
    return
  }

  loading.value = true
  try {
    const res: any = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { email: email.value, token: otpCode.value.trim().toUpperCase(), password: password.value }
    })
    if (res?.success) {
      showSuccess('Password updated successfully! Please sign in.')
      setTimeout(() => {
        resetToSignIn()
      }, 1400)
    }
  } catch (e: any) {
    showError(e?.data?.statusMessage || e?.message || 'Failed to reset password.')
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
</script>

<style scoped>
/* Scoped styles preserved identically */
.auth-wrapper {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.floating-home-link {
  position: absolute;
  top: 24px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #341F37;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid #D8CEE6;
  transition: all 0.2s ease;
  z-index: 10;
}
.floating-home-link:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(-3px);
}

.auth-card {
  position: relative;
  width: 100%;
  max-width: 460px;
  background: #FFFFFF;
  border: 1px solid #D8CEE6;
  border-radius: 24px;
  padding: 40px 36px;
  box-shadow: 0 20px 40px -10px rgba(52, 31, 55, 0.12);
  z-index: 10;
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
}
.card-title {
  font-size: 26px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}
.card-subtitle {
  font-size: 14px;
  color: #6e5873;
  margin: 0;
  line-height: 1.5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.input-label {
  font-size: 13px;
  font-weight: 600;
  color: #341F37;
}
.forgot-btn {
  font-size: 12px;
  font-weight: 600;
  color: #6e5873;
  background: none;
  border: none;
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
  left: 14px;
  color: #8a758f;
  pointer-events: none;
  display: flex;
  align-items: center;
}
.auth-input {
  width: 100%;
  height: 48px;
  padding: 0 16px 0 44px;
  background: #F9F5FF;
  border: 1.5px solid #D8CEE6;
  border-radius: 12px;
  font-size: 14px;
  color: #341F37;
  outline: none;
  transition: all 0.2s ease;
}
.auth-input:focus {
  border-color: #341F37;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(52, 31, 55, 0.1);
}
.auth-input.otp-field {
  padding: 0 16px;
  text-align: center;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 3px;
  color: #341F37;
}

.expiry-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #6e5873;
  background: #F9F5FF;
  border: 1px solid #D8CEE6;
  padding: 3px 8px;
  border-radius: 6px;
}
.expiry-badge.expired {
  color: #dc2626;
  background: #fef2f2;
  border-color: #fecaca;
}
.timer-icon {
  color: #341F37;
}

.resend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
  color: #6e5873;
}
.resend-btn {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #341F37;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}
.resend-btn:hover:not(:disabled) {
  text-decoration: underline;
}
.resend-btn:disabled {
  color: #a195a6;
  cursor: not-allowed;
  text-decoration: none;
}

.visibility-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #8a758f;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
}
.visibility-btn:hover {
  color: #341F37;
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: #341F37;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) {
  background: #4a2c50;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px -4px rgba(52, 31, 55, 0.3);
}
.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.alert {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.error-alert {
  background: #FDF2F2;
  border: 1px solid #FDE8E8;
  color: #9B1C1C;
}
.success-alert {
  background: #EDFDF5;
  border: 1px solid #DEF7EC;
  color: #03543F;
}

.divider-section {
  margin: 20px 0 0 0;
}
.divider-line {
  position: relative;
  text-align: center;
  margin-bottom: 16px;
}
.divider-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #D8CEE6;
}
.divider-line span {
  position: relative;
  background: #FFFFFF;
  padding: 0 12px;
  font-size: 12px;
  color: #8a758f;
}

.oauth-btn {
  width: 100%;
  height: 46px;
  background: #FFFFFF;
  border: 1.5px solid #D8CEE6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #341F37;
  cursor: pointer;
  transition: all 0.2s ease;
}
.oauth-btn:hover {
  background: #F9F5FF;
  border-color: #341F37;
}
.oauth-icon {
  width: 18px;
  height: 18px;
}

.card-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #6e5873;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.link-btn {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 700;
  color: #341F37;
  cursor: pointer;
  padding: 0;
}
.link-btn:hover {
  text-decoration: underline;
}

.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
