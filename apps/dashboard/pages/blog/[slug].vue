<template>
  <div class="article-page-wrapper">
    <!-- Mobile Navigation Drawer -->
    <CicadaDrawerMenu :is-open="isMenuOpen" @close="isMenuOpen = false" />

    <!-- Main Header Navbar -->
    <CicadaNavbar @toggle-menu="isMenuOpen = !isMenuOpen" />

    <main v-if="post" class="article-main-content">
      <!-- Breadcrumb Bar -->
      <nav class="article-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Home</NuxtLink>
        <span class="bc-sep">/</span>
        <NuxtLink to="/blog">Blog</NuxtLink>
        <span class="bc-sep">/</span>
        <span class="bc-current">{{ post.title }}</span>
      </nav>

      <!-- Article Header -->
      <header class="article-header">
        <div class="article-category-badge">{{ post.category }}</div>
        <h1 class="article-main-title">{{ post.title }}</h1>
        <p class="article-main-subtitle">{{ post.subtitle }}</p>

        <!-- Author & Metadata Row -->
        <div class="article-author-card">
          <div class="article-author-left">
            <img v-if="post.author && post.author.avatar" :src="post.author.avatar" :alt="post.author?.name || 'Author'" class="article-avatar" />
            <span v-else class="article-avatar-fallback">{{ (post.author?.name || 'A').charAt(0) }}</span>
            <div class="article-author-info">
              <span class="article-author-name">{{ post.author?.name || 'Engineering Team' }}</span>
              <span class="article-author-role">{{ post.author?.role || 'Commerce AI Specialist' }}</span>
            </div>
          </div>
          <div class="article-meta-divider"></div>
          <div class="article-time-info">
            <span class="article-date">{{ post.publishedAt || (post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent') }}</span>
            <span class="article-read-badge">{{ post.readTime || '5 min read' }}</span>
          </div>
        </div>

        <!-- Optional Article Cover Banner -->
        <div v-if="post.image" class="article-cover-banner">
          <img :src="post.image" :alt="post.title" class="article-cover-img" />
        </div>
      </header>

      <!-- Article Content Body -->
      <article class="article-body-wrapper">
        <div class="article-body-content" v-html="renderedBodyHtml"></div>

        <!-- Sidebar / Interactive Box -->
        <aside class="article-sidebar">
          <div class="sidebar-box">
            <h4 class="sidebar-title">Autonomous Commerce Swarms</h4>
            <p class="sidebar-desc">
              Connect WhatsApp Business API and Instagram Direct to automate your customer checkouts with zero manual work.
            </p>
            <NuxtLink to="/dashboard" class="sidebar-cta-btn">
              <span>Start Free Trial</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </NuxtLink>
          </div>

          <div class="sidebar-tags-box">
            <h4 class="sidebar-tags-title">Related Topics</h4>
            <div class="tags-cloud">
              <span v-for="tag in post.tags" :key="tag" class="tag-pill">{{ tag }}</span>
            </div>
          </div>
        </aside>
      </article>

      <!-- Related Posts Section -->
      <section class="related-posts-section">
        <h2 class="related-heading">More Commerce Blueprints</h2>
        <div class="related-grid">
          <NuxtLink 
            v-for="rel in relatedPosts" 
            :key="rel.slug" 
            :to="`/blog/${rel.slug}`"
            class="related-card"
          >
            <span class="rel-tag">{{ rel.category }}</span>
            <h3 class="rel-title">{{ rel.title }}</h3>
            <span class="rel-read-time">{{ rel.readTime }} • Read Article →</span>
          </NuxtLink>
        </div>
      </section>
    </main>

    <!-- 404 Fallback if slug not found -->
    <main v-else class="article-not-found">
      <h1>Article Not Found</h1>
      <p>The requested blueprint does not exist or has been moved.</p>
      <NuxtLink to="/blog" class="btn-primary-fallback">Back to Blog Hub</NuxtLink>
    </main>

    <!-- Footer -->
    <CicadaFooter @scroll-top="scrollToTop" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
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

const route = useRoute()
const isMenuOpen = ref(false)
const slug = computed(() => route.params.slug as string)

const { posts, getPostBySlug } = useBlogPosts()

// Fetch dynamically from Firebase Firestore API with fallback to local blueprints
const { data: apiData } = await useAsyncData(`blog-${slug.value}`, async () => {
  try {
    const res: any = await $fetch(`/api/blogs/${slug.value}`)
    if (res && res.success && res.blog) {
      return res.blog
    }
  } catch {
    // Ignore fetch error, fallback below
  }
  return null
})

const post = computed(() => {
  if (apiData.value) {
    const d = apiData.value
    return {
      ...d,
      author: d.author || {
        name: d.author_name || 'Engineering Team',
        role: d.author_role || 'Commerce AI Specialist',
        avatar: d.author_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      readTime: d.readTime || `${Math.max(1, Math.ceil((typeof d.content === 'string' ? d.content.split(/\s+/).length : 500) / 200))} min read`,
      publishedAt: d.publishedAt || (d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recent')
    }
  }
  return getPostBySlug(slug.value)
})

const relatedPosts = computed(() => {
  return posts.filter(p => p.slug !== slug.value).slice(0, 2)
})

const renderedBodyHtml = computed(() => {
  if (!post.value || !post.value.content) return ''
  return renderMarkdownToHtml(post.value.content)
})

// Full SEO Schema injection
useHead(() => {
  if (!post.value) {
    return { title: 'Article Not Found — Clickify Mate' }
  }

  const p = post.value
  return {
    title: `${p.title} — Clickify Mate Blog`,
    meta: [
      { name: 'description', content: p.excerpt },
      { name: 'keywords', content: (p.tags || []).join(', ') },
      { property: 'og:title', content: p.title },
      { property: 'og:description', content: p.excerpt },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: `https://clickifymate.com/blog/${p.slug}` },
      { property: 'article:published_time', content: p.dateISO },
      { property: 'article:author', content: p.author.name },
      { property: 'article:section', content: p.category },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: p.title },
      { name: 'twitter:description', content: p.excerpt }
    ],
    link: [
      { rel: 'canonical', href: `https://clickifymate.com/blog/${p.slug}` }
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          'headline': p.title,
          'description': p.excerpt,
          'datePublished': p.dateISO,
          'dateModified': p.dateISO,
          'author': {
            '@type': 'Person',
            'name': p.author.name,
            'jobTitle': p.author.role
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'Clickify Mate',
            'logo': 'https://clickifymate.com/logo.png'
          },
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `https://clickifymate.com/blog/${p.slug}`
          }
        })
      }
    ]
  }
})
</script>

<style scoped>
.article-page-wrapper {
  min-height: 100vh;
  background-color: #FAF8FC;
  font-family: var(--main-font, "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: #341F37;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

.article-main-content {
  flex: 1;
  padding: 100px 24px 70px;
  max-width: 1060px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* Breadcrumbs */
.article-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #8C7E92;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.article-breadcrumb a {
  color: #7B4C85;
  text-decoration: none;
  font-weight: 600;
}

.article-breadcrumb a:hover {
  text-decoration: underline;
}

.bc-sep {
  opacity: 0.5;
}

.bc-current {
  color: #55445E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}

/* Article Header */
.article-header {
  margin-bottom: 44px;
}

.article-category-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.1);
  padding: 4px 14px;
  border-radius: 9999px;
  margin-bottom: 14px;
  white-space: nowrap;
}

.article-main-title {
  font-size: 40px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: #341F37;
  margin: 0 0 16px 0;
}

.article-main-subtitle {
  font-size: 17.5px;
  line-height: 1.6;
  color: #5C4B62;
  margin: 0 0 28px 0;
}

/* Author Card */
.article-author-card {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.16);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(52, 31, 55, 0.04);
  max-width: 100%;
  box-sizing: border-box;
}

.article-author-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.article-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(123, 76, 133, 0.15);
}

.article-avatar-fallback {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #7B4C85;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.article-author-info {
  display: flex;
  flex-direction: column;
}

.article-author-name {
  font-size: 14px;
  font-weight: 700;
  color: #341F37;
  white-space: nowrap;
}

.article-author-role {
  font-size: 12px;
  color: #7C6D82;
  white-space: nowrap;
}

.article-meta-divider {
  width: 1px;
  height: 28px;
  background: rgba(84, 51, 89, 0.12);
  margin: 0 2px;
  flex-shrink: 0;
}

.article-time-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #7C6D82;
  white-space: nowrap;
}

/* Article Cover Banner */
.article-cover-banner {
  width: 100%;
  max-height: 420px;
  border-radius: 24px;
  overflow: hidden;
  margin-top: 28px;
  border: 1px solid rgba(123, 76, 133, 0.14);
  box-shadow: 0 8px 30px rgba(52, 31, 55, 0.06);
}

.article-cover-img {
  width: 100%;
  height: 100%;
  max-height: 420px;
  object-fit: cover;
  display: block;
}

.article-read-badge {
  background: rgba(123, 76, 133, 0.08);
  color: #7B4C85;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 9999px;
  white-space: nowrap;
}

/* Body Layout */
.article-body-wrapper {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 48px;
  margin-bottom: 64px;
}

.article-body-content {
  font-size: 16px;
  line-height: 1.75;
  color: #3A2B3E;
}

.article-body-content :deep(strong) {
  color: #341F37;
  font-weight: 700;
}

.article-body-content :deep(em) {
  color: #543359;
  font-style: italic;
}

.article-body-content :deep(.article-h1) {
  font-size: 32px;
  font-weight: 800;
  color: #341F37;
  margin: 44px 0 20px 0;
  letter-spacing: -0.025em;
}

.article-body-content :deep(.article-h2) {
  font-size: 26px;
  font-weight: 800;
  color: #341F37;
  margin: 38px 0 16px 0;
  letter-spacing: -0.02em;
}

.article-body-content :deep(.article-h3) {
  font-size: 21px;
  font-weight: 800;
  color: #7B4C85;
  margin: 28px 0 12px 0;
  letter-spacing: -0.015em;
}

.article-body-content :deep(.article-h4) {
  font-size: 17px;
  font-weight: 700;
  color: #55445E;
  margin: 20px 0 8px 0;
}

.article-body-content :deep(.article-quote) {
  border-left: 4px solid #7B4C85;
  background: rgba(123, 76, 133, 0.05);
  margin: 24px 0;
  padding: 16px 20px;
  border-radius: 0 14px 14px 0;
  color: #55445E;
  font-size: 16.5px;
  font-style: italic;
  line-height: 1.6;
}

/* Alert Callout Boxes (Zero Icons) */
.article-body-content :deep(.article-alert) {
  padding: 16px 20px;
  border-radius: 12px;
  margin: 24px 0;
  font-size: 15px;
  line-height: 1.6;
}

.article-body-content :deep(.alert-content) {
  color: #341F37;
  font-size: 15px;
  line-height: 1.6;
}

.article-body-content :deep(.alert-tip) {
  background: rgba(16, 185, 129, 0.07);
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.article-body-content :deep(.alert-warning) {
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.15);
}

.article-body-content :deep(.alert-info) {
  background: rgba(59, 130, 246, 0.07);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.article-body-content :deep(.alert-success) {
  background: rgba(123, 76, 133, 0.07);
  border-right: 1px solid rgba(123, 76, 133, 0.15);
  border-bottom: 1px solid rgba(123, 76, 133, 0.15);
}

/* Tables */
.article-body-content :deep(.article-table-wrapper) {
  overflow-x: auto;
  margin: 28px 0;
  border-radius: 14px;
  border: 1px solid rgba(123, 76, 133, 0.16);
  box-shadow: 0 4px 16px rgba(52, 31, 55, 0.04);
}

.article-body-content :deep(.article-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14.5px;
  text-align: left;
}

.article-body-content :deep(.article-table th) {
  background: #FAF8FC;
  padding: 12px 18px;
  font-weight: 800;
  color: #341F37;
  border-bottom: 2px solid rgba(123, 76, 133, 0.16);
}

.article-body-content :deep(.article-table td) {
  padding: 12px 18px;
  color: #55445E;
  border-bottom: 1px solid rgba(123, 76, 133, 0.08);
}

.article-body-content :deep(.article-table tr:last-child td) {
  border-bottom: none;
}

/* Task Checklists */
.article-body-content :deep(.article-task-list) {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.article-body-content :deep(.task-item) {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15.5px;
  color: #3A2B3E;
}

.article-body-content :deep(.task-check-box) {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid rgba(123, 76, 133, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: #FFFFFF;
  background: #FFFFFF;
  flex-shrink: 0;
}

.article-body-content :deep(.task-checked .task-check-box) {
  background: #7B4C85;
  border-color: #7B4C85;
}

.article-body-content :deep(.task-checked .task-label) {
  text-decoration: line-through;
  color: #8C7E92;
}

/* Video Embeds */
.article-body-content :deep(.article-video-container) {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: 18px;
  margin: 28px 0;
  box-shadow: 0 8px 30px rgba(52, 31, 55, 0.1);
  border: 1px solid rgba(123, 76, 133, 0.15);
}

.article-body-content :deep(.article-video-container iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Dividers */
.article-body-content :deep(.article-divider) {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(123, 76, 133, 0.25), transparent);
  margin: 36px 0;
}

/* Strikethrough & Links */
.article-body-content :deep(.article-del) {
  color: #8C7E92;
  text-decoration: line-through;
}

.article-body-content :deep(.article-inline-link) {
  color: #7B4C85;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.article-body-content :deep(.article-inline-link:hover) {
  color: #341F37;
}

.article-body-content :deep(.article-code-pill) {
  background: rgba(123, 76, 133, 0.08);
  color: #7B4C85;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 0.88em;
  font-family: monospace;
}

/* Code Blocks */
.article-body-content :deep(.article-code-block) {
  background: #1e1322;
  border-radius: 14px;
  overflow: hidden;
  margin: 24px 0;
}

.article-body-content :deep(.code-block-header) {
  background: #2a1b30;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 700;
  color: #B3A1BA;
  letter-spacing: 0.05em;
}

.article-body-content :deep(pre) {
  margin: 0;
  padding: 16px 20px;
  overflow-x: auto;
  color: #F3EDF7;
  font-size: 13.5px;
  line-height: 1.6;
  font-family: monospace;
}

/* Inline Images */
.article-body-content :deep(.article-inline-image-box) {
  margin: 28px 0;
  text-align: center;
}

.article-body-content :deep(.article-inline-img) {
  max-width: 100%;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(52, 31, 55, 0.08);
}

.article-body-content :deep(.img-caption) {
  display: block;
  font-size: 12.5px;
  color: #8C7E92;
  margin-top: 8px;
  font-style: italic;
}

.article-body-content :deep(.article-paragraph) {
  margin: 0 0 18px 0;
}

.article-body-content :deep(.article-bullet-list) {
  margin: 0 0 18px 0;
  padding-left: 24px;
  list-style-type: disc;
}

.article-body-content :deep(.article-numbered-list) {
  margin: 0 0 18px 0;
  padding-left: 24px;
  list-style-type: decimal;
}

.article-body-content :deep(.article-bullet-item),
.article-body-content :deep(.article-numbered-item) {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #3A2B3E;
}

/* Sidebar Box */
.article-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-box {
  background: linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%);
  border: 1.5px solid rgba(123, 76, 133, 0.2);
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(52, 31, 55, 0.06);
}

.sidebar-title {
  font-size: 16px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 10px 0;
}

.sidebar-desc {
  font-size: 13px;
  line-height: 1.55;
  color: #64536A;
  margin: 0 0 18px 0;
}

.sidebar-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 9999px;
  background: #341F37;
  color: #FFFFFF;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.sidebar-cta-btn:hover {
  background: #543359;
  transform: translateY(-1px);
}

.sidebar-tags-box {
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 22px;
  padding: 20px;
}

.sidebar-tags-title {
  font-size: 14px;
  font-weight: 700;
  color: #341F37;
  margin: 0 0 12px 0;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-pill {
  font-size: 11.5px;
  font-weight: 600;
  color: #7B4C85;
  background: rgba(123, 76, 133, 0.08);
  padding: 4px 10px;
  border-radius: 9999px;
  white-space: nowrap;
}

/* Related Posts */
.related-posts-section {
  border-top: 1px solid rgba(84, 51, 89, 0.1);
  padding-top: 40px;
}

.related-heading {
  font-size: 24px;
  font-weight: 800;
  color: #341F37;
  margin: 0 0 20px 0;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.related-card {
  display: block;
  text-decoration: none;
  background: #FFFFFF;
  border: 1px solid rgba(123, 76, 133, 0.14);
  border-radius: 18px;
  padding: 20px;
  transition: all 0.2s ease;
}

.related-card:hover {
  transform: translateY(-2px);
  border-color: #7B4C85;
  box-shadow: 0 10px 24px -4px rgba(84, 51, 89, 0.1);
}

.rel-tag {
  font-size: 11px;
  font-weight: 700;
  color: #7B4C85;
  display: inline-block;
  margin-bottom: 8px;
  white-space: nowrap;
}

.rel-title {
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.35;
  color: #341F37;
  margin: 0 0 10px 0;
}

.rel-read-time {
  font-size: 12px;
  color: #8C7E92;
  font-weight: 600;
}

.article-not-found {
  padding: 120px 24px;
  text-align: center;
}

.btn-primary-fallback {
  display: inline-block;
  margin-top: 20px;
  padding: 10px 24px;
  background: #341F37;
  color: #FFFFFF;
  border-radius: 9999px;
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 768px) {
  .article-main-content {
    padding: 85px 16px 50px;
  }
  .article-main-title {
    font-size: 26px;
  }
  .article-main-subtitle {
    font-size: 15px;
  }
  .article-body-wrapper {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

@media (max-width: 640px) {
  .article-author-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
  }
  .article-author-left {
    width: 100%;
  }
  .article-meta-divider {
    display: none;
  }
  .article-time-info {
    width: 100%;
    padding-top: 10px;
    border-top: 1px solid rgba(84, 51, 89, 0.08);
    justify-content: space-between;
  }
}
</style>
