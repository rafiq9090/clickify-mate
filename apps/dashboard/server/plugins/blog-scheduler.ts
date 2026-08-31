// server/plugins/blog-scheduler.ts
// Checks every 30 minutes whether it's time to auto-generate the daily blog batch.
// Schedule settings are read from Firestore: scheduler/blog_daily

import { getBlogScheduleFromFirestore, saveBlogScheduleToFirestore } from '../utils/firebase'
import { saveBlogToFirestore, getBlogsFromFirestore, getAuthorProfileFromFirestore } from '../utils/firebase'
import { getProviderByName } from '../utils/agent/providers/router'
import { generateResilientCoverImage } from '../utils/ai-image'

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
  'Slash LLM Costs: Caching Strategies for Commerce Bots'
]

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function currentUTCHour(): number {
  return new Date().getUTCHours()
}

async function runDailyBlogBatch(): Promise<void> {
  const config = await getBlogScheduleFromFirestore()

  if (!config.enabled) return
  if (config.last_run_date === todayUTC()) return // already ran today
  if (currentUTCHour() < config.runHour) return    // not yet time

  console.log(`[Blog Scheduler] Starting daily batch: ${config.blogsPerDay} blog(s) at UTC hour ${config.runHour}`)

  let existingBlogs: any[] = []
  try { existingBlogs = await getBlogsFromFirestore() } catch { /* ignore */ }
  const existingSlugs = new Set<string>(existingBlogs.map((b: any) => b.slug))
  const publishedTitles = new Set(existingBlogs.map((b: any) => b.title?.toLowerCase()))

  let authorProfile: any = null
  try { authorProfile = await getAuthorProfileFromFirestore() } catch { /* ignore */ }

  const available = TOPIC_POOL.filter(t => !publishedTitles.has(t.toLowerCase()))
  const pool = available.length >= config.blogsPerDay ? available : TOPIC_POOL

  let generated = 0

  for (let i = 0; i < config.blogsPerDay; i++) {
    const topic = pool[i % pool.length] || TOPIC_POOL[i % TOPIC_POOL.length]
    try {
      const article = await generateOne(topic!, existingSlugs, authorProfile)
      await saveBlogToFirestore(article)
      generated++
      console.log(`[Blog Scheduler] Published: "${article.title}" (${article.slug})`)
      if (i < config.blogsPerDay - 1) await new Promise(r => setTimeout(r, 2000))
    } catch (err: any) {
      console.error(`[Blog Scheduler] Failed for topic "${topic}":`, err.message)
    }
  }

  // Mark today as done so we don't re-run
  await saveBlogScheduleToFirestore({ last_run_date: todayUTC() })
  console.log(`[Blog Scheduler] Done — generated ${generated}/${config.blogsPerDay} blog(s) for ${todayUTC()}`)
}

async function generateOne(topic: string, existingSlugs: Set<string>, authorProfile: any) {
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

  const userPrompt = `Write a complete, in-depth 2,000+ word engineering playbook on: "${topic}". Category: WhatsApp Commerce. Tone: conversational, direct, and authoritative.`

  let rawContent = ''
  for (const name of ['groq', 'deepseek', 'openai', 'kimi']) {
    try {
      const provider = getProviderByName(name)
      if (!provider) continue
      const res = await provider.generate({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.75,
        maxTokens: 6000
      })
      if (res?.text?.trim()) {
        rawContent = res.text
        console.log(`✓ Scheduler blog generated via [${name}] (length: ${rawContent.length} chars)`)
        break
      }
    } catch { /* try next */ }
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

  if (typeof parsed.content === 'string') {
    parsed.content = parsed.content.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
  }

  let slug = (parsed.slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '')
  if (existingSlugs.has(slug)) slug = `${slug}-${Date.now().toString().slice(-4)}`
  existingSlugs.add(slug)

  const authorName  = authorProfile?.author_name  || 'Md. Rafiqul Islam'
  const authorRole  = authorProfile?.author_role  || 'Chief AI Architect'
  const authorPhoto = authorProfile?.author_photo || ''
  
  // Real 4K Pexels Commercial Photography Cover
  const coverImage = await generateResilientCoverImage(topic, 'WhatsApp Commerce')

  return {
    title: parsed.title || topic,
    slug,
    excerpt: parsed.excerpt || '',
    category: 'WhatsApp Commerce',
    author_name: authorName,
    author_role: authorRole,
    author_photo: authorPhoto,
    author: { name: authorName, role: authorRole, avatar: authorPhoto },
    image: coverImage,
    content: parsed.content || '',
    created_at: new Date().toISOString()
  }
}

export default defineNitroPlugin((_nitroApp) => {
  console.log('[Blog Scheduler] Initialized — checking every 30 minutes')

  // First check 60 s after startup (let the app fully initialize)
  setTimeout(async () => {
    try { await runDailyBlogBatch() } catch (e: any) {
      console.warn('[Blog Scheduler] Startup check error:', e.message)
    }
  }, 60_000)

  // Then check every 30 minutes
  setInterval(async () => {
    try { await runDailyBlogBatch() } catch (e: any) {
      console.warn('[Blog Scheduler] Interval check error:', e.message)
    }
  }, 30 * 60 * 1000)
})
