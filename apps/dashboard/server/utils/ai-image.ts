import { getApiKey } from './settings'

/**
 * Curated high-resolution Pexels commercial photo fallback registry
 */
const PEXELS_PHOTO_REGISTRY: Record<string, string[]> = {
  omnichannel: [
    'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Multi-screen developer workspace
    'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Modern laptop with code
    'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Modern engineering collaboration
    'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'  // Clean tech desk setup
  ],
  social_commerce: [
    'https://images.pexels.com/photos/16052346/pexels-photo-16052346.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Mobile online shopping & checkout
    'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Laptop with shopping cart
    'https://images.pexels.com/photos/7621381/pexels-photo-7621381.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Digital commerce & smartphone
    'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Shopping bags & boutique retail
    'https://images.pexels.com/photos/6214388/pexels-photo-6214388.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'  // E-commerce card & smartphone
  ],
  messaging_whatsapp: [
    'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Smartphone messaging on desk
    'https://images.pexels.com/photos/8867434/pexels-photo-8867434.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Customer support workspace
    'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'  // Modern communication team
  ],
  ai_swarms: [
    'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Data center server matrix
    'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Futuristic artificial intelligence visual
    'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'  // High-tech fiber data stream
  ],
  fintech_payments: [
    'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Contactless card payment POS
    'https://images.pexels.com/photos/6214476/pexels-photo-6214476.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Mobile digital wallet & card
    'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'  // Modern retail transaction
  ],
  analytics_growth: [
    'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Business analytics growth charts
    'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Data analytics laptop
    'https://images.pexels.com/photos/7947707/pexels-photo-7947707.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'  // Financial metrics & scaling
  ],
  logistics_courier: [
    'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Automated warehouse & parcel fulfillment
    'https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', // Package delivery & shipping box
    'https://images.pexels.com/photos/4392036/pexels-photo-4392036.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'  // Courier delivery tracking
  ]
}

/**
 * Resolves a crystal-clear, realistic commercial photo from Pexels API tailored to the blog topic
 */
export async function generateResilientCoverImage(topic: string, category: string, customPrompt?: string): Promise<string> {
  const cleanTopic = (topic || '').replace(/[^a-zA-Z0-9 ]/g, ' ').trim()
  const lower = (cleanTopic + ' ' + (category || '')).toLowerCase()

  // 1. Query Pexels Official API dynamically
  try {
    const dbKey = await getApiKey('pexels_api_key', 'pexelsApiKey')
    const pexelsKey = (dbKey && dbKey.trim().length > 10) ? dbKey : (process.env.PEXELS_API_KEY || '563492ad6f917000010000010b5ac71ca53c41379be542bbb219efc4')

    if (pexelsKey) {
      let searchQuery = 'ecommerce shopping smartphone'
      if (lower.includes('omnichannel') || lower.includes('unify') || lower.includes('software')) searchQuery = 'software developer workspace computer'
      else if (lower.includes('instagram') || lower.includes('shopify') || lower.includes('store')) searchQuery = 'online shopping smartphone ecommerce'
      else if (lower.includes('whatsapp') || lower.includes('inbox') || lower.includes('chat')) searchQuery = 'mobile messaging smartphone desk'
      else if (lower.includes('swarm') || lower.includes('agent') || lower.includes('ai')) searchQuery = 'artificial intelligence technology computer'
      else if (lower.includes('payment') || lower.includes('checkout') || lower.includes('bkash')) searchQuery = 'contactless payment credit card'
      else if (lower.includes('analytics') || lower.includes('growth') || lower.includes('conversion')) searchQuery = 'business data analytics laptop'
      else if (lower.includes('courier') || lower.includes('delivery') || lower.includes('logistics')) searchQuery = 'package delivery parcel shipping'

      console.log(`[Pexels API] Searching photos for query: "${searchQuery}" (Topic: ${cleanTopic})...`)
      const res = await $fetch<any>(`https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&orientation=landscape&per_page=15`, {
        headers: { 'Authorization': pexelsKey },
        timeout: 6000
      })

      if (res?.photos && res.photos.length > 0) {
        const randomIndex = Math.floor(Math.random() * res.photos.length)
        const photo = res.photos[randomIndex]
        const photoUrl = photo?.src?.landscape || photo?.src?.large2x || photo?.src?.large
        if (photoUrl) {
          console.log(`✓ Real Pexels 4K photo matched: [ID: ${photo.id} by ${photo.photographer}] -> ${photoUrl}`)
          return photoUrl
        }
      }
    }
  } catch (err: any) {
    console.warn('[Pexels API]: Search fallback to curated registry:', err?.message)
  }

  // 2. Curated Real Pexels Commercial Stock Registry Fallback
  let pool: string[] = PEXELS_PHOTO_REGISTRY.social_commerce || []

  if (lower.includes('omnichannel') || lower.includes('unify') || lower.includes('multi-channel') || (lower.includes('messenger') && lower.includes('whatsapp'))) {
    pool = PEXELS_PHOTO_REGISTRY.omnichannel || pool
  } else if (lower.includes('whatsapp') || lower.includes('cart') || lower.includes('inbox') || lower.includes('chat')) {
    pool = PEXELS_PHOTO_REGISTRY.messaging_whatsapp || pool
  } else if (lower.includes('instagram') || lower.includes('dm') || lower.includes('story') || lower.includes('social') || lower.includes('shopify')) {
    pool = PEXELS_PHOTO_REGISTRY.social_commerce || pool
  } else if (lower.includes('swarm') || lower.includes('multi-agent') || lower.includes('traditional') || lower.includes('latency') || lower.includes('autonomous') || lower.includes('agent')) {
    pool = PEXELS_PHOTO_REGISTRY.ai_swarms || pool
  } else if (lower.includes('payment') || lower.includes('bkash') || lower.includes('nagad') || lower.includes('sslcommerz') || lower.includes('gateway') || lower.includes('fintech')) {
    pool = PEXELS_PHOTO_REGISTRY.fintech_payments || pool
  } else if (lower.includes('analytics') || lower.includes('conversion') || lower.includes('gmv') || lower.includes('growth') || lower.includes('scaling') || lower.includes('roi')) {
    pool = PEXELS_PHOTO_REGISTRY.analytics_growth || pool
  } else if (lower.includes('courier') || lower.includes('logistics') || lower.includes('delivery') || lower.includes('tracking') || lower.includes('steadfast')) {
    pool = PEXELS_PHOTO_REGISTRY.logistics_courier || pool
  }

  const selectedUrl = pool[Math.floor(Math.random() * (pool.length || 1))] || 'https://images.pexels.com/photos/16052346/pexels-photo-16052346.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'
  console.log(`✓ High-res Pexels photo selected from registry for [${cleanTopic}]`)
  return selectedUrl
}

export function buildAccurateImagePrompt(topic: string, category: string, customPrompt?: string): { prompt: string; seed: number } {
  const seed = Math.floor(Math.random() * 900000) + 100000
  return { prompt: topic, seed }
}
