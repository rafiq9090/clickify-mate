import { defineEventHandler, readBody, createError } from 'h3'
import { getApiKey } from '../../utils/settings'
import { uploadToBackblaze } from '../../utils/backblaze'
import { requireAdminSession } from '../../utils/auth-session'

async function getNvidiaApiKey(): Promise<string | null> {
  const envKey = process.env.NVIDIA_API_KEY
  if (envKey && envKey.startsWith('nvapi-')) return envKey
  const dbKey = await getApiKey('nvidia_api_key', 'nvidiaApiKey')
  if (dbKey && dbKey.startsWith('nvapi-')) return dbKey
  return null
}

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const body = await readBody(event) || {}
  const { prompt, topic, category } = body

  if (!prompt && !topic) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt or topic is required.' })
  }

  const cleanPrompt = String(prompt || `${topic} in ${category || 'E-Commerce'}, ultra photorealistic 8k studio photography, sleek violet plum lighting, 16:9 banner, no text, no watermark`).trim()

  const nvidiaKey = await getNvidiaApiKey()
  const seed = Math.floor(Math.random() * 900000) + 100000

  // 1. If NVIDIA API Key is present, attempt NVIDIA NIM Cloud Generation
  if (nvidiaKey) {
    try {
      const invokeUrl = 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b'

      const nvidiaRes = await $fetch<any>(invokeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nvidiaKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          prompt: cleanPrompt,
          width: 1344, // 16:9 banner
          height: 768,
          seed,
          steps: 4
        },
        timeout: 45000
      })

      const base64Artifact = nvidiaRes?.artifacts?.[0]?.base64 || nvidiaRes?.b64_json || nvidiaRes?.image
      if (base64Artifact) {
        const imageBuffer = Buffer.from(base64Artifact, 'base64')
        const fileName = `nvidia_flux_${Date.now()}_${seed}.jpg`
        
        // Save to Backblaze storage
        const uploaded = await uploadToBackblaze(imageBuffer, fileName, 'image/jpeg', 'blog_covers')
        return {
          success: true,
          url: uploaded.url,
          proxyUrl: uploaded.proxyUrl,
          source: 'nvidia_nim',
          prompt: cleanPrompt
        }
      }
    } catch (err: any) {
      console.warn('[NVIDIA NIM Image Generation]: Primary endpoint skipped/fallback:', err.message)
    }
  }

  // 2. High-Fidelity Pexels Photo Fallback
  const pexelsPhotoUrl = await generateResilientCoverImage(topic || cleanPrompt, category || 'Social Commerce')

  return {
    success: true,
    url: pexelsPhotoUrl,
    proxyUrl: pexelsPhotoUrl,
    source: 'pexels_4k',
    prompt: cleanPrompt
  }
})
