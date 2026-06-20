<script setup>
import { onMounted } from 'vue'

useHead({
  script: [
    { src: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', async: true },
    { src: 'https://docs.opencv.org/4.10.0/opencv.js', async: true, onload: 'window.cvReady = true' }
  ]
})

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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
