<script setup>
import { onMounted } from 'vue'

// Handle Global Auth Errors (like expired links)
onMounted(() => {
  const hash = window.location.hash
  if (hash && hash.includes('error=')) {
    const params = new URLSearchParams(hash.substring(1))
    const errorMsg = params.get('error_description') || params.get('error')
    if (errorMsg) {
      // Redirect to login page with the error message
      navigateTo(`/login?error=${encodeURIComponent(errorMsg)}`)
    }
  }
})
</script>

<template>
  <div class="app-container">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
.app-container {
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

html,
body,
#__nuxt {
  width: 100%;
  min-width: 0;
  margin: 0;
  overflow-x: hidden;
}
</style>
