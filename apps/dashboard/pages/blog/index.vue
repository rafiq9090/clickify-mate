<template>
  <div class="blog-page-wrapper">
    <!-- Mobile Navigation Drawer -->
    <CicadaDrawerMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <!-- Main Header Navbar -->
    <CicadaNavbar @toggle-menu="isMenuOpen = !isMenuOpen" />

    <!-- Main Blog Content -->
    <main class="blog-main-content">
      <!-- Blog Hero Header -->
      <section class="blog-hero-section">
        <span class="blog-hero-badge">COMMERCE INSIGHTS &amp; AI PLAYBOOKS</span>
        <h1 class="blog-hero-title">
          The Social Commerce &amp; <span>Conversational AI Blog</span>
        </h1>
        <p class="blog-hero-subtitle">
          Expert guides, architectural blueprints, and growth playbooks for scaling sales across WhatsApp, Instagram, and Facebook with autonomous multi-agent AI swarms.
        </p>

        <!-- Category Filters -->
        <div class="category-filters-track">
          <button 
            type="button" 
            class="category-filter-btn"
            :class="{ 'is-active': selectedCategory === 'All' }"
            @click="selectedCategory = 'All'"
          >
            All Articles ({{ posts.length }})
          </button>
          <button 
            v-for="cat in categories" 
            :key="cat"
            type="button" 
            class="category-filter-btn"
            :class="{ 'is-active': selectedCategory === cat }"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </section>

      <!-- Featured Article Spotlight Card -->
      <section v-if="featuredPost && selectedCategory === 'All'" class="featured-spotlight-section">
        <NuxtLink :to="`/blog/${featuredPost.slug}`" class="featured-card">
          <div class="featured-card-body">
            <div class="featured-meta-row">
              <span class="featured-tag">{{ featuredPost.category }}</span>
              <span class="featured-dot">•</span>
              <span class="featured-read-time">{{ featuredPost.readTime }}</span>
              <span class="featured-dot">•</span>
              <span class="featured-date">{{ featuredPost.publishedAt }}</span>
            </div>
            <h2 class="featured-title">{{ featuredPost.title }}</h2>
            <p class="featured-excerpt">{{ featuredPost.excerpt }}</p>
            <div class="featured-author-row">
              <div class="featured-author-left">
                <img :src="featuredPost.author.avatar" :alt="featuredPost.author.name" class="author-avatar" />
                <div class="author-info">
                  <span class="author-name">{{ featuredPost.author.name }}</span>
                  <span class="author-role">{{ featuredPost.author.role }}</span>
                </div>
              </div>
              <span class="read-article-link">
                <span>Read Full Blueprint</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </NuxtLink>
      </section>

      <!-- Articles Grid Section -->
      <section class="articles-grid-section">
        <div class="articles-grid">
          <NuxtLink 
            v-for="post in filteredPosts" 
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="article-card"
          >
            <div class="article-card-header">
              <span class="article-category-badge">{{ post.category }}</span>
              <span class="article-read-time">{{ post.readTime }}</span>
            </div>

            <div class="article-card-content">
              <h3 class="article-title">{{ post.title }}</h3>
              <p class="article-excerpt">{{ post.excerpt }}</p>
            </div>

            <div class="article-card-footer">
              <div class="article-author-meta">
                <img v-if="post.author && post.author.avatar" :src="post.author.avatar" :alt="post.author?.name || 'Author'" class="card-author-avatar" />
                <span v-else class="card-author-avatar-fallback">{{ (post.author?.name || 'A').charAt(0) }}</span>
                <div class="card-author-text">
                  <span class="card-author-name">{{ post.author?.name || 'Engineering Team' }}</span>
                  <span class="card-date">{{ post.publishedAt || (post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent') }}</span>
                </div>
              </div>
              <span class="card-read-arrow">→</span>
            </div>
          </NuxtLink>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <CicadaFooter @scroll-top="scrollToTop" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBlogPosts } from '~/composables/useBlogPosts'
import CicadaNavbar from '~/components/cicada/CicadaNavbar.vue'
import CicadaDrawerMenu from '~/components/cicada/CicadaDrawerMenu.vue'
import CicadaFooter from '~/components/cicada/CicadaFooter.vue'

definePageMeta({
  layout: false
})

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const isMenuOpen = ref(false)
const selectedCategory = ref<string>('All')

const { posts: initialPosts, getFeaturedPost } = useBlogPosts()

// Fetch dynamically from Firebase Firestore
const { data: apiBlogs } = await useAsyncData('all-blogs-firestore', async () => {
  try {
    const res: any = await $fetch('/api/blogs')
    if (res && res.success && Array.isArray(res.blogs)) {
      return res.blogs
    }
  } catch {
    // ignore
  }
  return []
})

const posts = computed(() => {
  const firestoreList = (apiBlogs.value || []).map((d: any) => ({
    ...d,
    author: d.author || {
      name: d.author_name || 'Engineering Team',
      role: d.author_role || 'Commerce AI Specialist',
      avatar: d.author_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    readTime: d.readTime || `${Math.max(1, Math.ceil((typeof d.content === 'string' ? d.content.split(/\s+/).length : 500) / 200))} min read`,
    publishedAt: d.publishedAt || (d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recent')
  }))

  const existingSlugs = new Set(firestoreList.map((b: any) => b.slug))
  const remainingInitial = initialPosts.filter(p => !existingSlugs.has(p.slug))
  return [...firestoreList, ...remainingInitial]
})

const featuredPost = computed(() => {
  return posts.value.find(p => p.featured) || posts.value[0] || getFeaturedPost()
})

const categories = ['WhatsApp Commerce', 'Instagram Automation', 'AI Swarms', 'Growth & Strategy']

const filteredPosts = computed(() => {
  const list = posts.value || []
  if (selectedCategory.value === 'All') {
    return list.filter(p => p.slug !== featuredPost.value?.slug)
  }
  return list.filter(p => p.category === selectedCategory.value)
})

useHead({
  title: 'Blog & Playbooks — Conversational Commerce & AI Social Selling | Clickify Mate',
  meta: [
    { name: 'description', content: 'Explore in-depth engineering playbooks, WhatsApp Business automation guides, and multi-agent AI frameworks for high-converting social commerce.' },
    { name: 'keywords', content: 'WhatsApp Automation Blog, Social Commerce Playbook, Instagram DM Selling, Conversational AI Architecture, Clickify Mate Articles' },
    { property: 'og:title', content: 'Blog — Autonomous Social Commerce & Conversational AI | Clickify Mate' },
    { property: 'og:description', content: 'In-depth engineering playbooks and growth strategies for automated messaging checkouts.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://clickifymate.com/blog' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Clickify Mate Blog — AI Social Commerce Insights' },
    { name: 'twitter:description', content: 'Actionable blueprints for scaling social commerce sales with autonomous AI agents.' }
  ],
  link: [
    { rel: 'canonical', href: 'https://clickifymate.com/blog' }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Clickify Mate Commerce & AI Blog',
        'description': 'Guides and architecture blueprints for social selling automation and multi-agent AI swarms.',
        'url': 'https://clickifymate.com/blog',
        'publisher': {
          '@type': 'Organization',
          'name': 'Clickify Mate',
          'logo': 'https://clickifymate.com/logo.png'
        }
      })
    }
  ]
})
</script>

<style scoped>
.blog-page-wrapper {
  min-height: 100vh;
  background-color: #FAF8FC;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: #341F37;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

.blog-main-content {
  flex: 1;
  padding: 110px 24px 70px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 56px;
  box-sizing: border-box;
}

/* Hero Section */
.blog-hero-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 20px;
}

.blog-hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #7B4C85;
  text-transform: uppercase;
}

.blog-hero-title {
  font-size: 44px;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -0.025em;
  color: #341F37;
  max-width: 860px;
  margin: 0;
}

.blog-hero-title span {
  color: #7B4C85;
}

.blog-hero-subtitle {
  font-size: 16px;
  line-height: 1.6;
  color: #6C5B72;
  max-width: 680px;
  margin: 0;
}

/* Category Filters Track */
.category-filters-track {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 14px;
}

.category-filter-btn {
  padding: 8px 18px;
  border-radius: 9999px;
  border: 1px solid rgba(123, 76, 133, 0.16);
  background: rgba(255, 255, 255, 0.8);
  color: #55445E;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-filter-btn:hover {
  background: #FFFFFF;
  border-color: #7B4C85;
  color: #7B4C85;
  transform: translateY(-1px);
}

.category-filter-btn.is-active {
  background: #341F37;
  border-color: #341F37;
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(52, 31, 55, 0.18);
}

/* Featured Spotlight Card */
.featured-spotlight-section {
  width: 100%;
}

.featured-card {
  display: block;
  text-decoration: none;
  background: linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%);
  border: 1.5px solid rgba(123, 76, 133, 0.2);
  border-radius: 28px;
  padding: 40px 44px;
  box-shadow: 0 16px 40px -10px rgba(52, 31, 55, 0.09);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.featured-card:hover {
  transform: translateY(-3px);
  border-color: #7B4C85;
  box-shadow: 0 24px 52px -12px rgba(84, 51, 89, 0.16);
}

.featured-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #7C6D82;
}

.featured-tag {
  font-weight: 700;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.1);
  padding: 4px 12px;
  border-radius: 9999px;
  white-space: nowrap;
  font-size: 12px;
}

.featured-read-time,
.featured-date {
  white-space: nowrap;
}

.featured-dot {
  opacity: 0.5;
  flex-shrink: 0;
}

.featured-title {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: #341F37;
  margin: 0 0 14px 0;
}

.featured-excerpt {
  font-size: 15.5px;
  line-height: 1.6;
  color: #5C4B62;
  margin: 0 0 28px 0;
  max-width: 820px;
}

.featured-author-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.featured-author-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(123, 76, 133, 0.2);
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 14px;
  font-weight: 700;
  color: #341F37;
}

.author-role {
  font-size: 12px;
  color: #7C6D82;
}

.read-article-link {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #7B4C85;
}

/* Articles Grid */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.article-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 22px;
  padding: 28px 24px;
  box-shadow: 0 6px 20px rgba(52, 31, 55, 0.04);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.article-card:hover {
  transform: translateY(-3px);
  border-color: #7B4C85;
  box-shadow: 0 16px 36px -8px rgba(84, 51, 89, 0.12);
}

.article-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 8px;
}

.article-category-badge {
  font-size: 11.5px;
  font-weight: 700;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  padding: 3px 10px;
  border-radius: 9999px;
  white-space: nowrap;
}

.article-read-time {
  font-size: 12px;
  color: #8C7E92;
  font-weight: 500;
  white-space: nowrap;
}

.article-title {
  font-size: 18.5px;
  font-weight: 800;
  line-height: 1.35;
  color: #341F37;
  margin: 0 0 10px 0;
  letter-spacing: -0.015em;
}

.article-excerpt {
  font-size: 13.5px;
  line-height: 1.55;
  color: #64536A;
  margin: 0 0 20px 0;
}

.article-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(84, 51, 89, 0.06);
  padding-top: 14px;
  margin-top: auto;
}

.article-author-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.card-author-avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #7B4C85;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-author-text {
  display: flex;
  flex-direction: column;
}

.card-author-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #341F37;
}

.card-date {
  font-size: 11px;
  color: #8C7E92;
}

.card-read-arrow {
  font-size: 18px;
  font-weight: 700;
  color: #7B4C85;
  transition: transform 0.2s ease;
}

.article-card:hover .card-read-arrow {
  transform: translateX(3px);
}

@media (max-width: 768px) {
  .blog-main-content {
    padding: 85px 16px 50px;
    gap: 36px;
  }
  .blog-hero-title {
    font-size: 28px;
  }
  .featured-card {
    padding: 24px 20px;
  }
  .featured-title {
    font-size: 22px;
  }
  .articles-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .featured-author-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  .read-article-link {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
    padding-top: 10px;
    border-top: 1px solid rgba(84, 51, 89, 0.08);
  }
}
</style>
