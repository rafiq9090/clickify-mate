import { requireAdminSession } from '../../utils/auth-session'
import { saveBlogToFirestore, getBlogsFromFirestore, getAuthorProfileFromFirestore } from '../../utils/firebase'
import { getProviderByName } from '~/server/utils/agent/providers/router'
import { generateResilientCoverImage, buildAccurateImagePrompt } from '~/server/utils/ai-image'

// Large comprehensive dynamic topic pool across social commerce, AI swarms, payments & logistics
const TOPIC_POOL = [
  'WhatsApp Abandoned Cart Recovery in 2026',
  'Multi-Agent Swarms vs Traditional Chatbots',
  'Automating Instagram DM Sales for Shopify Stores',
  'Reducing AI Response Latency to Under 300ms',
  'How to Connect WhatsApp Cloud API with WooCommerce',
  'Building an Autonomous Social Commerce Sales Swarm',
  'Why Single-Prompt Bots Fail in E-Commerce',
  'Zero-Latency Product Discovery on Instagram DMs',
  'Payment Link Automation in WhatsApp Conversations',
  'Human-in-the-Loop AI: Balancing Bots and Agents',
  'COD Verification Automation with WhatsApp OTP',
  'Instagram Story Reply Automation for D2C Brands',
  'Vector Search for Conversational Product Discovery',
  'Handling High-Volume Chat Spikes with Serverless AI',
  'WhatsApp Business API: Green Tick Verification Guide',
  'Telegram Bot Commerce: 2026 Implementation Blueprint',
  'AI Order Tracking via WhatsApp Without Human Agents',
  'Personalized Upsell Flows in Conversational Commerce',
  'Real-Time Inventory Sync for Conversational Checkouts',
  'Slash LLM Costs: Caching Strategies for Commerce Bots',
  'bKash and Nagad Automated Payment Verification with AI',
  'Steadfast Courier API Integration for Automated Dispatch',
  'Omnichannel Commerce: Unifying Messenger, Instagram, and WhatsApp',
  'Building High-Converting Product Carousels in WhatsApp Chat',
  'Automated Defect & Complaint Resolution Using Multimodal AI',
  'Boosting Repeat Orders with Automated Post-Purchase Sequences',
  'How to Prevent WhatsApp Account Bans on Cloud API',
  'Meta Conversion API (CAPI) Integration for WhatsApp Ad Campaigns',
  'Real-Time Stock Deduction During Social Chat Checkouts',
  'Autonomous Price Negotiation Rules for AI Sales Agents',
  'Scaling D2C Brand Support from 1,000 to 100,000 Daily Messages',
  'AI-Powered Live Delivery Notifications and Customer Updates',
  'How to Train Llama-3.3 on Your Custom Store Product Catalog',
  'Automated Facebook Page Comment to Messenger Sales Conversion',
  'Reducing Return-to-Origin (RTO) Rates with Automated Order Confirmation'
]

async function generateOneBlog(topic: string, category: string, existingSlugs: Set<string>, authorProfile: any) {
  const systemPrompt = `You are a world-class senior technical writer for Clickify Mate.
You write authoritative, human-toned engineering blueprints and tutorials that rank #1 on Google by adhering strictly to the SEO Golden Rule.

THE SEO GOLDEN RULE:
1. Target Length: 2,000 to 2,800 words of comprehensive, dense, actionable insights. Zero fluff.
2. Inverted Pyramid: Provide the direct solution and core takeaway in the first 2 paragraphs.
3. First-Person E-E-A-T Tone: ("We benchmarked", "In production testing", "Here is what works").
4. Rich Formatting: 6+ headings (##), 1 Code snippet, 1 Data/Benchmark Table, 1 Implementation Checklist, 3 Callouts (> [!TIP], > [!WARNING], > [!NOTE]), and 1 FAQ section.
5. NO raw emojis and NO generic AI phrases.

OUTPUT FORMAT:
Output strictly using this header format followed by the complete markdown:
---
TITLE: Compelling, high-CTR SEO Article Title (50-65 chars)
SLUG: url-friendly-slug-with-hyphens
EXCERPT: Compelling 140-160 char Google search snippet meta description
---
[Full markdown content adhering to all Golden Rule requirements (2,000-2,800 words)]`

  const userPrompt = `Write a complete, in-depth 2,000+ word engineering playbook on: "${topic}". Category: ${category}. Tone: conversational, direct, and authoritative.`

  const candidates = ['groq', 'deepseek', 'openai', 'kimi']
  let rawContent = ''

  for (const name of candidates) {
    try {
      const provider = getProviderByName(name)
      if (!provider) continue
      const res = await provider.generate({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.75,
        maxTokens: 6000
      })
      if (res?.text?.trim()) {
        rawContent = res.text
        console.log(`✓ Batch blog generated via [${name}] (length: ${rawContent.length} chars)`)
        break
      }
    } catch { /* try next provider */ }
  }

  let parsed: any = null

  if (rawContent) {
    const titleMatch = rawContent.match(/TITLE:\s*(.+)/i)
    const slugMatch = rawContent.match(/SLUG:\s*(.+)/i)
    const excerptMatch = rawContent.match(/EXCERPT:\s*(.+)/i)

    let parsedContent = rawContent
      .replace(/^---[\s\S]*?---/m, '')
      .replace(/^(TITLE|SLUG|EXCERPT):.+$/gim, '')
      .replace(/```markdown\s*/g, '')
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .trim()

    if (titleMatch || parsedContent.length > 500) {
      parsed = {
        title: titleMatch?.[1] ? titleMatch[1].replace(/["']/g, '').trim() : `${topic}: The 2026 Complete Engineering Playbook`,
        slug: slugMatch?.[1] ? slugMatch[1].replace(/["']/g, '').trim().toLowerCase() : topic.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        excerpt: excerptMatch?.[1] ? excerptMatch[1].replace(/["']/g, '').trim() : `Mastering ${topic} to cut latency and scale revenue.`,
        content: parsedContent
      }
    }
  }

  // Clean emojis
  if (typeof parsed.content === 'string') {
    parsed.content = parsed.content.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
  }

  // Deduplicate slug
  let slug = (parsed.slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '')
  if (existingSlugs.has(slug)) slug = `${slug}-${Date.now().toString().slice(-4)}`
  existingSlugs.add(slug)

  // Resilient Image Generation (NVIDIA NIM -> Seeded FLUX.1)
  const coverImage = await generateResilientCoverImage(topic, category)

  const authorName  = authorProfile?.author_name  || 'Engineering Team'
  const authorRole  = authorProfile?.author_role  || 'Commerce AI Specialist'
  const authorPhoto = authorProfile?.author_photo || ''

  return {
    title: parsed.title || topic,
    slug,
    excerpt: parsed.excerpt || '',
    category,
    author_name: authorName,
    author_role: authorRole,
    author_photo: authorPhoto,
    author: { name: authorName, role: authorRole, avatar: authorPhoto },
    image: coverImage,
    content: parsed.content || '',
    created_at: new Date().toISOString()
  }
}

async function brainstormNewTopics(existingTitles: string[], category: string, count: number): Promise<string[]> {
  const sampleExisting = existingTitles.slice(0, 25).join('\n- ')
  const userPrompt = `Brainstorm ${count} brand-new, high-converting 2026 social commerce, WhatsApp/Instagram automation, and AI swarm engineering topics.
Category: ${category}
DO NOT repeat any of these already published titles:
- ${sampleExisting}

Respond ONLY with a valid JSON array of strings:
["Topic Title 1", "Topic Title 2", "Topic Title 3"]`

  const candidates = ['groq', 'deepseek', 'openai', 'nvidia']
  for (const name of candidates) {
    try {
      const provider = getProviderByName(name)
      if (!provider) continue
      const res = await provider.generate({
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.85
      })
      if (res?.text) {
        const raw = res.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const match = raw.match(/\[[\s\S]*\]/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((t: any) => String(t).trim()).filter(Boolean)
          }
        }
      }
    } catch { /* try next */ }
  }
  return []
}

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  const body = await readBody(event) || {}
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 20)
  const category = String(body.category || 'WhatsApp Commerce')

  // Load existing slugs to avoid duplicates
  let existingBlogs: any[] = []
  try { existingBlogs = await getBlogsFromFirestore() } catch { /* ignore */ }
  const existingSlugs = new Set<string>(existingBlogs.map((b: any) => b.slug))

  // Load author profile from Firestore
  let authorProfile: any = null
  try { authorProfile = await getAuthorProfileFromFirestore() } catch { /* ignore */ }

  // Pick N unique topics not already published
  const publishedTitles = existingBlogs.map((b: any) => String(b.title || '').toLowerCase())
  const publishedSet = new Set(publishedTitles)
  let availableTopics = TOPIC_POOL.filter(t => !publishedSet.has(t.toLowerCase()))

  // If pool is exhausted or less than needed, brainstorm fresh topics via LLM
  if (availableTopics.length < count) {
    try {
      const freshTopics = await brainstormNewTopics(publishedTitles, category, count - availableTopics.length + 5)
      availableTopics = [...availableTopics, ...freshTopics]
    } catch (e) {
      console.warn('[Batch Generator] Dynamic topic ideation failed, recycling pool:', e)
    }
  }

  const pool = availableTopics.length > 0 ? availableTopics : TOPIC_POOL

  const generated: any[] = []
  const errors: string[] = []

  for (let i = 0; i < count; i++) {
    const topic = pool[i % pool.length] || TOPIC_POOL[i % TOPIC_POOL.length]
    try {
      const article = await generateOneBlog(topic!, category, existingSlugs, authorProfile)
      await saveBlogToFirestore(article)
      generated.push({ slug: article.slug, title: article.title })
      // Small delay between requests to avoid rate limiting
      if (i < count - 1) await new Promise(r => setTimeout(r, 1500))
    } catch (err: any) {
      errors.push(`${topic}: ${err.message}`)
    }
  }

  return {
    success: true,
    generated: generated.length,
    articles: generated,
    errors
  }
})
