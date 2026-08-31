<template>
  <div class="admin-login-viewport">
    <!-- Top Navigation / Back to site -->
    <div class="top-nav-bar">
      <NuxtLink to="/" class="back-link">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 19"></polyline>
        </svg>
        <span>Back to Clickify Mate</span>
      </NuxtLink>
    </div>

    <!-- Ambient Subtle Background Glow -->
    <div class="ambient-glow" aria-hidden="true">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
    </div>

    <!-- Centered Card Container -->
    <main class="login-card-wrapper">
      <div class="login-card">
        <!-- Brand / Header -->
        <div class="card-header">
          <h1 class="card-title">Admin Console</h1>
          <p class="card-subtitle">Please enter your authorized credentials to access system management.</p>
        </div>

        <!-- Error Notification Callout -->
        <div v-if="error" class="error-banner" role="alert">
          <svg class="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Username Input -->
          <div class="form-group">
            <label for="admin-username" class="form-label">Admin Username</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input 
                id="admin-username"
                v-model="credentials.username"
                type="text" 
                placeholder="Enter username" 
                autocomplete="username"
                required
                class="form-input"
              />
            </div>
          </div>

          <!-- Passphrase Input -->
          <div class="form-group">
            <label for="admin-password" class="form-label">Security Passphrase</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input 
                id="admin-password"
                v-model="credentials.password"
                :type="showPassword ? 'text' : 'password'" 
                placeholder="••••••••••••" 
                autocomplete="current-password"
                required
                class="form-input password-input"
              />
              <button 
                type="button" 
                class="toggle-password-btn" 
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="loading" 
            class="submit-btn"
          >
            <svg v-if="loading" class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle class="spinner-track" cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
              <path class="spinner-head" d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
            </svg>
            <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>{{ loading ? 'Authenticating...' : 'Sign In to Console' }}</span>
          </button>
        </form>

        <!-- Security Footer Badge -->
        <div class="card-footer">
          <div class="security-indicator">
            <span>256-bit Encrypted Session • Rate-limit Protected</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

definePageMeta({
  layout: false
})

useHead({
  title: 'Admin Login — Clickify Mate'
})

const credentials = reactive({
  username: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!credentials.username.trim() || !credentials.password) {
    error.value = 'Username and security passphrase are required.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await $fetch<{ success: boolean; admin?: boolean }>('/api/auth/login', {
      method: 'POST',
      body: {
        username: credentials.username.trim(),
        password: credentials.password
      }
    })

    if (res?.success) {
      await navigateTo('/admin')
    }
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Invalid credentials or unauthorized access.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login-viewport {
  min-height: 100vh;
  background-color: #FAF8FC;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: #341F37;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

/* Ambient glow blobs */
.ambient-glow {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.55;
}

.orb-1 {
  top: -80px;
  left: -80px;
  width: 440px;
  height: 440px;
  background: radial-gradient(circle, rgba(123, 76, 133, 0.18) 0%, rgba(250, 248, 252, 0) 70%);
}

.orb-2 {
  bottom: -60px;
  right: -60px;
  width: 460px;
  height: 460px;
  background: radial-gradient(circle, rgba(84, 51, 89, 0.12) 0%, rgba(250, 248, 252, 0) 70%);
}

/* Top bar */
.top-nav-bar {
  padding: 24px 32px 0;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: #7B4C85;
  text-decoration: none;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(123, 76, 133, 0.16);
  border-radius: 9999px;
  backdrop-filter: blur(8px);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.back-link:hover {
  background: #FFFFFF;
  color: #341F37;
  border-color: #7B4C85;
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(52, 31, 55, 0.06);
}

/* Center Wrapper */
.login-card-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px 60px;
  position: relative;
  z-index: 1;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #FFFFFF;
  border: 1.5px solid rgba(123, 76, 133, 0.16);
  border-radius: 28px;
  padding: 40px 36px 32px;
  box-shadow: 0 20px 48px -12px rgba(52, 31, 55, 0.08), 0 4px 16px rgba(52, 31, 55, 0.03);
  box-sizing: border-box;
}

/* Card Header */
.card-header {
  text-align: center;
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.admin-badge-icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, rgba(123, 76, 133, 0.12) 0%, rgba(84, 51, 89, 0.2) 100%);
  border: 1px solid rgba(123, 76, 133, 0.25);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7B4C85;
  margin-bottom: 16px;
  box-shadow: 0 6px 16px rgba(123, 76, 133, 0.12);
}

.card-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0 0 8px 0;
}

.card-subtitle {
  font-size: 13.5px;
  line-height: 1.5;
  color: #6C5B72;
  margin: 0;
  max-width: 320px;
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF1F2;
  border: 1px solid #FECDD3;
  color: #E11D48;
  padding: 11px 14px;
  border-radius: 12px;
  font-size: 12.5px;
  font-weight: 600;
  margin-bottom: 22px;
  line-height: 1.4;
  animation: fadeIn 0.2s ease-out;
}

.error-icon {
  flex-shrink: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Form Styles */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
  text-align: left;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #55445E;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 15px;
  color: #9C8EA2;
  display: flex;
  align-items: center;
  pointer-events: none;
  transition: color 0.2s ease;
}

.form-input {
  width: 100%;
  padding: 13px 16px 13px 44px;
  background: #FAF8FC;
  border: 1.5px solid rgba(123, 76, 133, 0.18);
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #341F37;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.form-input.password-input {
  padding-right: 44px;
}

.form-input::placeholder {
  color: #B5A8B9;
  font-weight: 400;
}

.form-input:focus {
  background: #FFFFFF;
  border-color: #7B4C85;
  box-shadow: 0 0 0 3.5px rgba(123, 76, 133, 0.14);
}

.input-wrapper:focus-within .input-icon {
  color: #7B4C85;
}

.toggle-password-btn {
  position: absolute;
  right: 13px;
  background: none;
  border: none;
  color: #9C8EA2;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: color 0.2s ease;
}

.toggle-password-btn:hover {
  color: #341F37;
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 14px 20px;
  margin-top: 6px;
  background: #341F37;
  color: #FFFFFF;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 20px rgba(52, 31, 55, 0.2);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.submit-btn:hover:not(:disabled) {
  background: #4E2E52;
  transform: translateY(-1.5px);
  box-shadow: 0 12px 26px rgba(52, 31, 55, 0.25);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Card Footer */
.card-footer {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid rgba(84, 51, 89, 0.08);
  display: flex;
  justify-content: center;
}

.security-indicator {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 600;
  color: #8C7E92;
  letter-spacing: 0.02em;
}

.security-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .top-nav-bar {
    padding: 16px 20px 0;
  }
  .login-card-wrapper {
    padding: 20px 16px 40px;
  }
  .login-card {
    padding: 32px 22px 24px;
    border-radius: 24px;
  }
  .card-title {
    font-size: 21px;
  }
  .card-subtitle {
    font-size: 12.5px;
  }
  .form-input {
    font-size: 13.5px;
  }
}
</style>
