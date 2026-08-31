<template>
  <div class="admin-layout-root">
    <!-- Top Admin Header -->
    <header class="admin-top-nav">
      <div class="nav-inner">
        <!-- Brand / Identity -->
        <div class="nav-left">
          <NuxtLink to="/admin" class="admin-brand">
            <span class="brand-badge">ADMIN</span>
            <span class="brand-text">Clickify Mate</span>
          </NuxtLink>

          <div class="system-status-indicator">
            <span class="status-label">Operational</span>
          </div>
        </div>

        <!-- Right Action Controls -->
        <div class="nav-right">
          <NuxtLink to="/" class="site-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Live Storefront</span>
          </NuxtLink>

          <div class="admin-user-badge">
            <span class="user-avatar-circle">A</span>
            <span class="user-name">Root Admin</span>
          </div>

          <button @click="handleLogout" class="logout-btn" title="Sign out of Console">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span class="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Admin Workspace Body -->
    <main class="admin-main-container">
      <slot />
    </main>

    <!-- Clean Minimal Footer -->
    <footer class="admin-footer">
      <div class="footer-inner">
        <div class="footer-left">
          <span>Clickify Mate v4.2 • Autonomous Commerce Swarms</span>
          <span class="footer-dot">•</span>
          <span class="secure-badge">256-bit Encrypted Node</span>
        </div>
        <div class="footer-right">
          <span>&copy; {{ new Date().getFullYear() }} Clickify Mate</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

useHead({
  title: 'Admin Console — Clickify Mate',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch {}
  await navigateTo('/admin/login')
}
</script>

<style scoped>
.admin-layout-root {
  min-height: 100vh;
  background-color: #FAF8FC;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: #341F37;
  display: flex;
  flex-direction: column;
}

/* Header */
.admin-top-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(123, 76, 133, 0.14);
  height: 70px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 20px rgba(52, 31, 55, 0.03);
}

.nav-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #341F37;
}

.brand-badge {
  background: #341F37;
  color: #FFFFFF;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  border-radius: 6px;
}

.brand-text {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #341F37;
}

.system-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 700;
  color: #059669;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  animation: pulseDot 2s infinite ease-in-out;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

/* Nav Right */
.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.site-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #7B4C85;
  text-decoration: none;
  padding: 7px 14px;
  border-radius: 9999px;
  background: rgba(123, 76, 133, 0.08);
  border: 1px solid rgba(123, 76, 133, 0.16);
  transition: all 0.2s ease;
}

.site-link:hover {
  background: #7B4C85;
  color: #FFFFFF;
}

.admin-user-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 6px;
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.16);
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  color: #341F37;
}

.user-avatar-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #7B4C85;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #FFF1F2;
  border: 1px solid #FECDD3;
  color: #E11D48;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #E11D48;
  color: #FFFFFF;
  border-color: #E11D48;
}

/* Main Container */
.admin-main-container {
  flex: 1;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 24px 60px;
  box-sizing: border-box;
}

/* Footer */
.admin-footer {
  background: #FFFFFF;
  border-top: 1px solid rgba(123, 76, 133, 0.12);
  padding: 18px 24px;
  font-size: 12.5px;
  color: #8C7E92;
}

.footer-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-dot {
  opacity: 0.4;
}

.secure-badge {
  color: #7B4C85;
  font-weight: 600;
}

@media (max-width: 768px) {
  .nav-inner {
    padding: 0 16px;
  }
  .system-status-indicator,
  .site-link,
  .user-name,
  .logout-text {
    display: none;
  }
  .admin-main-container {
    padding: 20px 16px 40px;
  }
  .admin-user-badge {
    padding: 4px;
  }
}
</style>
