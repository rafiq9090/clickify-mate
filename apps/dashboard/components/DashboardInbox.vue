<template>
  <section class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/40">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-xl">forum</span>
          </div>
          <h2 class="text-xl font-bold tracking-tight text-on-surface">Live Customer Inbox</h2>
        </div>
        <p class="text-xs text-on-surface-variant mt-1">
          Monitor real-time AI conversations across WhatsApp, Telegram, and Facebook Messenger.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <button 
          @click="refreshMessages" 
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-outline hover:bg-surface-hover text-on-surface transition-all shadow-xs cursor-pointer"
        >
          <span class="material-symbols-outlined text-base" :class="loading ? 'animate-spin' : ''">sync</span>
          <span>{{ loading ? 'Refreshing...' : 'Refresh Inbox' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Inbox Split View with Fixed Height & Independent Column Scrolling -->
    <div class="bg-surface border border-outline rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 h-[640px] max-h-[calc(100vh-210px)] min-h-[500px]">
      
      <!-- Left Column: Conversations List (Scrollable) -->
      <div class="md:col-span-5 lg:col-span-4 border-r border-outline flex flex-col h-full bg-surface-hover/30 min-h-0">
        <!-- Search & Filter -->
        <div class="p-3.5 border-b border-outline space-y-2.5 bg-surface shrink-0">
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-base">search</span>
            <input 
              v-model="searchQuery" 
              placeholder="Search customer name or ID..." 
              class="w-full h-9 pl-8 pr-3 bg-surface-hover border border-outline rounded-xl text-xs text-on-surface outline-none focus:border-primary/50 transition-colors placeholder:text-on-surface-variant/50"
            />
          </div>

          <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button 
              v-for="tab in ['all', 'telegram', 'whatsapp', 'facebook']" 
              :key="tab"
              @click="activePlatform = tab"
              :class="activePlatform === tab 
                ? 'bg-primary text-white font-semibold' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-hover'"
              class="px-2.5 py-1 rounded-lg text-[11px] capitalize transition-colors whitespace-nowrap cursor-pointer"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <!-- Scrollable Thread List -->
        <div class="flex-1 overflow-y-auto divide-y divide-outline/40 in-scroll min-h-0">
          <div 
            v-for="thread in filteredThreads" 
            :key="thread.user_external_id"
            @click="selectThread(thread)"
            class="p-3.5 hover:bg-surface-hover/70 transition-colors cursor-pointer flex items-start gap-3"
            :class="{ 'bg-primary/10 border-l-3 border-l-primary': selectedThread?.user_external_id === thread.user_external_id }"
          >
            <!-- Customer Avatar with Platform Sub-Badge -->
            <div class="relative shrink-0">
              <div 
                class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs border border-outline/70 bg-surface shadow-xs"
                :class="!thread.customer_avatar ? getPlatformBadgeClass(thread.platform) : ''"
              >
                <img 
                  v-if="thread.customer_avatar" 
                  :src="thread.customer_avatar" 
                  alt="Avatar" 
                  class="w-full h-full object-cover" 
                  @error="thread.customer_avatar = ''"
                />
                <span v-else>{{ getCustomerInitials(thread.customer_name, thread.user_external_id) }}</span>
              </div>
              <div 
                class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-xs border border-surface"
                :class="getPlatformBadgeClass(thread.platform)"
              >
                <span class="material-symbols-outlined text-[10px]">{{ getPlatformIcon(thread.platform) }}</span>
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <span class="font-semibold text-xs text-on-surface truncate">
                  {{ thread.customer_name || formatCustomerName(thread.user_external_id, thread.platform) }}
                </span>
                <span class="text-[10px] text-on-surface-variant/60 font-mono shrink-0">{{ formatTime(thread.last_active) }}</span>
              </div>
              <p class="text-xs text-on-surface-variant line-clamp-1 leading-snug">
                {{ cleanDisplayMessage(thread.last_message) }}
              </p>
              <div class="flex items-center gap-1.5 mt-1.5">
                <span 
                  class="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider border"
                  :class="getPlatformBadgeClass(thread.platform)"
                >
                  {{ thread.platform }}
                </span>
                <span class="text-[10px] text-on-surface-variant/60 font-mono">
                  {{ thread.message_count }} msgs
                </span>
              </div>
            </div>
          </div>

          <div v-if="filteredThreads.length === 0" class="py-16 text-center text-xs text-on-surface-variant space-y-1">
            <span class="material-symbols-outlined text-3xl text-on-surface-variant/30">chat_bubble_outline</span>
            <p>No active conversations found</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Active Chat View (Pinned Header + Scrollable Messages + Pinned Input Bar) -->
      <div class="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-surface min-h-0 relative">
        <template v-if="selectedThread">
          <!-- Chat Header (Pinned) -->
          <div class="p-3.5 px-5 border-b border-outline flex items-center justify-between bg-surface shrink-0 z-10">
            <div class="flex items-center gap-3">
              <div class="relative shrink-0">
                <div 
                  class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs border border-outline bg-surface shadow-xs"
                  :class="!selectedThread.customer_avatar ? getPlatformBadgeClass(selectedThread.platform) : ''"
                >
                  <img 
                    v-if="selectedThread.customer_avatar" 
                    :src="selectedThread.customer_avatar" 
                    alt="Avatar" 
                    class="w-full h-full object-cover" 
                    @error="selectedThread.customer_avatar = ''"
                  />
                  <span v-else>{{ getCustomerInitials(selectedThread.customer_name, selectedThread.user_external_id) }}</span>
                </div>
                <div 
                  class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-xs border border-surface"
                  :class="getPlatformBadgeClass(selectedThread.platform)"
                >
                  <span class="material-symbols-outlined text-[10px]">{{ getPlatformIcon(selectedThread.platform) }}</span>
                </div>
              </div>

              <div>
                <h3 class="text-xs font-bold text-on-surface flex items-center gap-2">
                  {{ selectedThread.customer_name || formatCustomerName(selectedThread.user_external_id, selectedThread.platform) }}
                  <span class="text-[10px] font-normal text-on-surface-variant font-mono">({{ selectedThread.user_external_id }})</span>
                </h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <span 
                    class="text-[11px] flex items-center gap-1 font-medium"
                    :class="selectedThread.ai_disabled ? 'text-amber-500' : 'text-emerald-500'"
                  >
                    <span 
                      class="w-1.5 h-1.5 rounded-full"
                      :class="selectedThread.ai_disabled ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'"
                    ></span>
                    {{ selectedThread.ai_disabled ? 'AI Auto-Pilot Paused (Manual Mode)' : 'AI Auto-Pilot Active' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- AI Auto-Pilot Stop / Start Toggle -->
              <button 
                @click="toggleAiForThread(selectedThread)"
                :disabled="togglingAi"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs"
                :class="selectedThread.ai_disabled 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'"
                :title="selectedThread.ai_disabled ? 'Start AI Auto-Pilot for this customer' : 'Pause AI Auto-Pilot to take over manually'"
              >
                <span class="material-symbols-outlined text-sm">
                  {{ selectedThread.ai_disabled ? 'play_arrow' : 'pause' }}
                </span>
                <span>{{ selectedThread.ai_disabled ? 'Start AI Reply' : 'Stop AI Reply' }}</span>
              </button>

              <span class="text-[11px] font-semibold text-on-surface-variant bg-surface-hover px-2.5 py-1 rounded-lg border border-outline uppercase">
                {{ selectedThread.platform }}
              </span>

              <!-- Clear Conversation Button -->
              <button 
                @click="handleClearThread(selectedThread)"
                class="p-1.5 rounded-lg text-on-surface-variant/70 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Clear / Delete entire conversation"
              >
                <span class="material-symbols-outlined text-base">delete_sweep</span>
              </button>
            </div>
          </div>

          <!-- Message Bubbles Scroll Area (Independent Smooth Scrolling) -->
          <div 
            class="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 bg-surface-hover/20 in-scroll min-h-0 relative" 
            ref="chatBox"
            @scroll="handleChatScroll"
          >
            <div 
              v-for="msg in selectedThread.messages" 
              :key="msg.id || msg.created_at" 
              class="group flex items-end gap-2.5"
              :class="msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'"
            >
              <!-- Avatar beside bubble -->
              <div 
                v-if="msg.role === 'user'" 
                class="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-bold text-[10px] shrink-0 border border-outline bg-surface mb-1"
                :class="!selectedThread.customer_avatar ? getPlatformBadgeClass(selectedThread.platform) : ''"
              >
                <img v-if="selectedThread.customer_avatar" :src="selectedThread.customer_avatar" class="w-full h-full object-cover" />
                <span v-else>{{ getCustomerInitials(selectedThread.customer_name, selectedThread.user_external_id) }}</span>
              </div>

              <div 
                v-else 
                class="w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mb-1"
              >
                <span class="material-symbols-outlined text-sm">smart_toy</span>
              </div>

              <!-- Delete Action Button (Appears on Hover) -->
              <button 
                v-if="!msg.is_deleted"
                @click="handleDeleteMessage(msg)"
                class="opacity-0 group-hover:opacity-100 p-1 rounded-md text-on-surface-variant/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer mb-2 shrink-0"
                title="Delete message from user chat & dashboard"
              >
                <span class="material-symbols-outlined text-xs">delete</span>
              </button>

              <!-- Bubble Box -->
              <div class="flex flex-col max-w-md" :class="msg.role === 'user' ? 'items-start' : 'items-end'">
                <div class="flex items-center gap-1.5 text-[10px] text-on-surface-variant/60 mb-1 px-1">
                  <span class="font-semibold">{{ msg.role === 'user' ? (selectedThread.customer_name || 'Customer') : 'AI Assistant' }}</span>
                  <span>•</span>
                  <span>{{ formatTime(msg.created_at) }}</span>
                </div>

                <!-- Deleted Message Placeholder (Shown in Dashboard for audit trail) -->
                <div 
                  v-if="msg.is_deleted" 
                  class="p-3 rounded-2xl text-xs bg-surface-hover/80 border border-dashed border-outline text-on-surface-variant/70 italic flex items-center gap-2"
                >
                  <span class="material-symbols-outlined text-sm text-rose-500">delete_outline</span>
                  <span>This message was deleted from user chat</span>
                </div>

                <div 
                  v-else
                  class="p-3.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs border"
                  :class="msg.role === 'user' 
                    ? 'bg-surface border-outline text-on-surface rounded-tl-xs' 
                    : 'bg-primary text-white border-primary rounded-tr-xs'"
                >
                  <!-- Quoted / Replied Message Preview Box -->
                  <div 
                    v-if="getRepliedMessage(msg)" 
                    class="mb-2.5 p-2 rounded-xl border-l-3 text-[11px] space-y-0.5"
                    :class="msg.role === 'user' 
                      ? 'bg-surface-hover border-l-primary text-on-surface' 
                      : 'bg-white/15 border-l-white text-white'"
                  >
                    <div class="font-semibold text-[10px] opacity-80 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">reply</span>
                      <span>{{ getRepliedMessage(msg).author || 'Reply to' }}</span>
                    </div>
                    <div class="line-clamp-2 opacity-90 italic">
                      {{ getRepliedMessage(msg).text }}
                    </div>
                  </div>

                  <p v-if="cleanDisplayMessage(msg.content)">
                    {{ cleanDisplayMessage(msg.content) }}
                  </p>

                  <!-- Render Attached Product Images Gallery in Bubble -->
                  <div 
                    v-if="getMessageImages(msg).length > 0" 
                    class="mt-2.5 grid gap-1.5"
                    :class="getMessageImages(msg).length === 1 ? 'grid-cols-1 max-w-[240px]' : 'grid-cols-2 max-w-[280px]'"
                  >
                    <div 
                      v-for="(imgUrl, imgIdx) in getMessageImages(msg)" 
                      :key="imgIdx"
                      class="relative rounded-xl overflow-hidden bg-black/20 border border-white/10 aspect-square group cursor-pointer"
                      @click="previewImage(imgUrl)"
                      title="Click to view full image"
                    >
                      <img 
                        :src="imgUrl" 
                        alt="Product photo" 
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        @error="handleInboxImageError($event)"
                      />
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span class="material-symbols-outlined text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                      </div>
                    </div>
                  </div>
                </div>

                <span v-if="msg.tokens_used > 0 && msg.role === 'assistant' && !msg.is_deleted" class="text-[9px] text-on-surface-variant/50 mt-0.5 px-1 font-mono">
                  ⚡ {{ msg.tokens_used }} tokens
                </span>
              </div>
            </div>

            <!-- Jump to bottom floating button when scrolled up -->
            <Transition name="fade">
              <button 
                v-if="showScrollBottomBtn" 
                @click="scrollToBottom(true)"
                class="sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-surface border border-outline shadow-lg text-xs font-semibold text-primary flex items-center gap-1 hover:bg-surface-hover transition-all z-20 cursor-pointer"
              >
                <span class="material-symbols-outlined text-sm">arrow_downward</span>
                <span>Scroll to latest</span>
              </button>
            </Transition>
          </div>

          <!-- Human Quick Reply / Takeover Bar (Pinned Bottom) -->
          <div class="p-3 border-t border-outline bg-surface shrink-0 z-10">
            <div class="flex items-center gap-2">
              <input 
                v-model="replyText" 
                @keyup.enter="handleSendReply"
                placeholder="Type manual reply to customer (Take over chat)..." 
                class="flex-1 bg-surface-hover border border-outline rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors"
              />
              <button 
                @click="handleSendReply"
                :disabled="!replyText.trim() || sendingReply"
                class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <span class="material-symbols-outlined text-sm">send</span>
                <span>Send</span>
              </button>
            </div>
          </div>
        </template>

        <!-- No Thread Selected -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant space-y-2">
          <span class="material-symbols-outlined text-5xl text-on-surface-variant/20">chat</span>
          <h4 class="text-sm font-semibold text-on-surface">No Conversation Selected</h4>
          <p class="text-xs max-w-xs">Select a conversation from the left to view full message history and manage AI reply.</p>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="previewImageUrl" 
          @click="previewImageUrl = ''"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
        >
          <div class="relative max-w-3xl max-h-[90vh] bg-surface rounded-2xl overflow-hidden p-2 shadow-2xl" @click.stop>
            <button 
              @click="previewImageUrl = ''"
              class="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-base">close</span>
            </button>
            <img :src="previewImageUrl" alt="Full view" class="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  agents: { type: Array, default: () => [] },
  mockInventory: { type: Array, default: () => [] }
})

const emit = defineEmits(['show-toast'])

const supabase = useSupabase()
const loading = ref(false)
const threads = ref([])
const selectedThread = ref(null)
const searchQuery = ref('')
const activePlatform = ref('all')
const replyText = ref('')
const sendingReply = ref(false)
const togglingAi = ref(false)
const previewImageUrl = ref('')
const chatBox = ref(null)
const showScrollBottomBtn = ref(false)
let autoPollTimer = null

const getMessageImages = (msg) => {
  if (!msg) return []
  const images = []

  // 1. If explicit images array on message object
  if (Array.isArray(msg.images)) {
    images.push(...msg.images.filter(Boolean))
  }

  // 2. Extract [IMAGE: url] tags
  if (msg.content) {
    const imgMatches = [...msg.content.matchAll(/\[IMAGE:?\s*([^\]]*?)\]/gi)]
    for (const m of imgMatches) {
      if (m[1]) {
        const urls = m[1].split(',').map(s => s.trim()).filter(Boolean)
        images.push(...urls)
      }
    }

    // Direct image URL matches
    const urlMatches = msg.content.match(/https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|webp|gif|svg)(\?[^\s\)]*)?/gi)
    if (urlMatches) {
      for (const u of urlMatches) {
        if (!images.includes(u)) images.push(u)
      }
    }

    // 3. Fallback for historical messages in database that mentioned products before image tags were saved
    if (images.length === 0 && msg.role === 'assistant') {
      const text = msg.content.toLowerCase()
      if (text.includes('hoodie') || text.includes('winter hoodie')) {
        const hoodie = (props.mockInventory || []).find(p => p.sku === 'premium-winter-hoodie' || (p.name && p.name.toLowerCase().includes('hoodie')))
        if (hoodie) {
          if (hoodie.images && hoodie.images[0]?.url) images.push(hoodie.images[0].url)
          else if (hoodie.image) images.push(hoodie.image)
        }
      } else if (text.includes('t-shirt') || text.includes('tshirt') || text.includes('shirt')) {
        const tshirt = (props.mockInventory || []).find(p => p.sku === 't-shirt-white' || (p.name && p.name.toLowerCase().includes('t-shirt')))
        if (tshirt) {
          if (tshirt.images && Array.isArray(tshirt.images)) {
            images.push(...tshirt.images.slice(0, 2).map(img => img.url).filter(Boolean))
          } else if (tshirt.image) {
            images.push(tshirt.image)
          }
        }
      }
    }
  }

  // Replace any broken/expired Backblaze URLs with working CDN image
  const sanitized = images.map(u => {
    if (u && (u.includes('1786964415932_ai-generated') || u.includes('agent-chat-store.s3'))) {
      return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
    }
    return u
  }).filter(Boolean)

  return Array.from(new Set(sanitized))
}

const handleInboxImageError = (event) => {
  if (event?.target) {
    event.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
  }
}

const previewImage = (url) => {
  previewImageUrl.value = url
}

const getRepliedMessage = (msg) => {
  if (!msg) return null
  if (msg.reply_to && msg.reply_to.text) return msg.reply_to

  // Parse [In reply to "..."]: or [In reply to Author: "..."]:
  if (msg.content) {
    const match = msg.content.match(/^\[In reply to (?:([^:]+):\s*)?"([^"]+)"\]/i)
    if (match) {
      return {
        author: match[1] || 'Reply to',
        text: match[2]
      }
    }
  }
  return null
}

const cleanDisplayMessage = (msg) => {
  if (!msg) return ''
  return msg
    .replace(/^\[In reply to [^\]]+\]\s*/gi, '')
    .replace(/\[IMAGE:?[^\]]*?\]/gi, '')
    .replace(/\[STATE_UPDATE:?[^\]]*?\]/gi, '')
    .replace(/\[ROUTE:?[^\]]*?\]/gi, '')
    .replace(/\[SEND_IMAGES:?[^\]]*?\]/gi, '')
    .replace(/\[ORDER_DATA:?[^\]]*?\]/gi, '')
    .trim()
}

const handleDeleteMessage = async (msg) => {
  if (!confirm('Are you sure you want to delete this message? It will be deleted from the customer\'s chat interface and marked as deleted in your dashboard.')) return

  try {
    const res = await $fetch('/api/inbox/delete-message', {
      method: 'POST',
      body: {
        id: msg.id,
        message_id: msg.message_id,
        media_message_ids: msg.media_message_ids,
        user_external_id: selectedThread.value?.user_external_id,
        agent_id: selectedThread.value?.agent_id,
        platform: selectedThread.value?.platform
      }
    })

    msg.is_deleted = true
    emit('show-toast', {
      message: res?.deleted_from_platform ? 'Message deleted from customer chat & recorded as deleted in dashboard!' : 'Message recorded as deleted in dashboard!',
      type: 'success'
    })
  } catch (delErr) {
    console.error('Delete message error:', delErr)
    emit('show-toast', { message: 'Failed to delete message: ' + (delErr.data?.statusMessage || delErr.message), type: 'error' })
  }
}

const handleClearThread = async (thread) => {
  if (!thread) return
  if (!confirm(`Are you sure you want to delete all messages in the conversation with ${thread.customer_name || thread.user_external_id}?`)) return

  try {
    await $fetch('/api/inbox/delete-message', {
      method: 'POST',
      body: {
        user_external_id: thread.user_external_id,
        permanent: true
      }
    })

    thread.messages = []
    thread.last_message = 'Conversation cleared'
    thread.message_count = 0
    emit('show-toast', { message: 'Conversation history cleared!', type: 'info' })
  } catch (err) {
    console.error('Clear thread error:', err)
    emit('show-toast', { message: 'Failed to clear thread: ' + (err.data?.statusMessage || err.message), type: 'error' })
  }
}

const toggleAiForThread = async (thread) => {
  if (!thread) return
  togglingAi.value = true
  const newStatus = !thread.ai_disabled

  try {
    const res = await $fetch('/api/inbox/toggle-ai', {
      method: 'POST',
      body: {
        user_external_id: thread.user_external_id,
        platform: thread.platform,
        agent_id: thread.agent_id,
        ai_disabled: newStatus
      }
    })

    thread.ai_disabled = newStatus
    emit('show-toast', {
      message: newStatus 
        ? 'AI Auto-Pilot paused. You can now chat manually.' 
        : 'AI Auto-Pilot resumed! Bot will auto-reply.',
      type: newStatus ? 'warning' : 'success'
    })
  } catch (err) {
    console.error('Toggle AI error:', err)
    emit('show-toast', {
      message: 'Failed to update AI state: ' + (err.data?.statusMessage || err.message),
      type: 'error'
    })
  } finally {
    togglingAi.value = false
  }
}

const getCustomerInitials = (name, id) => {
  if (name && name.trim()) {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return id ? id.slice(-2).toUpperCase() : 'CU'
}

const handleChatScroll = () => {
  if (!chatBox.value) return
  const { scrollTop, scrollHeight, clientHeight } = chatBox.value
  // If user scrolled up more than 120px from bottom, show jump button
  showScrollBottomBtn.value = (scrollHeight - scrollTop - clientHeight) > 120
}

const scrollToBottom = (smooth = false) => {
  nextTick(() => {
    if (chatBox.value) {
      chatBox.value.scrollTo({
        top: chatBox.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
      showScrollBottomBtn.value = false
    }
  })
}

const fetchChatHistory = async (isBackground = false) => {
  if (!isBackground) loading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Parallel fetch: chat messages + customer lead AI states
    const [historyRes, leadsRes] = await Promise.all([
      supabase.from('chat_history').select('*').order('created_at', { ascending: true }),
      supabase.from('leads').select('email, data').order('created_at', { ascending: false })
    ])

    const { data, error } = historyRes
    if (error) throw error

    const aiStatusMap = {}
    if (leadsRes.data) {
      leadsRes.data.forEach(lead => {
        const userExtId = lead.data?.customer || (lead.email ? lead.email.split('@')[0] : '')
        if (userExtId && lead.data?.ai_disabled !== undefined) {
          aiStatusMap[userExtId] = Boolean(lead.data.ai_disabled)
        }
      })
    }

    if (data && data.length > 0) {
      // Group messages by user_external_id
      const threadMap = {}
      for (const row of data) {
        const key = row.user_external_id || 'unknown'
        if (!threadMap[key]) {
          // Look up matching agent
          const matchedAgent = (props.agents || []).find(a => a.id === row.agent_id)
          let platform = matchedAgent?.platform

          if (!platform) {
            if (key.startsWith('tg_') || /^\d{8,10}$/.test(key)) {
              platform = 'telegram'
            } else if (key.startsWith('880') || /^\d{11,14}$/.test(key)) {
              platform = 'whatsapp'
            } else {
              platform = 'facebook'
            }
          }

          threadMap[key] = {
            user_external_id: key,
            agent_id: row.agent_id,
            customer_name: row.customer_name || '',
            customer_avatar: row.customer_avatar || '',
            platform,
            ai_disabled: aiStatusMap[key] || false,
            last_active: row.created_at,
            last_message: row.content,
            message_count: 0,
            messages: []
          }
        }

        if (row.customer_name && !threadMap[key].customer_name) {
          threadMap[key].customer_name = row.customer_name
        }
        if (row.customer_avatar && !threadMap[key].customer_avatar) {
          threadMap[key].customer_avatar = row.customer_avatar
        }

        threadMap[key].messages.push(row)
        threadMap[key].last_message = row.content
        threadMap[key].last_active = row.created_at
        threadMap[key].message_count++
      }

      // Convert to array and sort by latest activity
      const threadList = Object.values(threadMap).sort((a, b) => new Date(b.last_active) - new Date(a.last_active))
      threads.value = threadList

      if (!selectedThread.value && threadList.length > 0) {
        selectedThread.value = threadList[0]
        scrollToBottom()
      } else if (selectedThread.value) {
        // Refresh selected thread object
        const updatedSelected = threadList.find(t => t.user_external_id === selectedThread.value.user_external_id)
        if (updatedSelected) {
          const prevMsgCount = selectedThread.value.messages.length
          selectedThread.value = updatedSelected
          if (updatedSelected.messages.length > prevMsgCount) {
            scrollToBottom(true)
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to load chat history:', e)
  } finally {
    if (!isBackground) loading.value = false
  }
}

const refreshMessages = async () => {
  await fetchChatHistory()
}

const selectThread = (thread) => {
  selectedThread.value = thread
  scrollToBottom()
}

const filteredThreads = computed(() => {
  return threads.value.filter(t => {
    const q = searchQuery.value.toLowerCase()
    const matchSearch = q 
      ? t.user_external_id.toLowerCase().includes(q) || 
        (t.customer_name && t.customer_name.toLowerCase().includes(q)) || 
        t.last_message.toLowerCase().includes(q)
      : true
    const matchPlatform = activePlatform.value === 'all' || t.platform.toLowerCase() === activePlatform.value.toLowerCase()
    return matchSearch && matchPlatform
  })
})

const handleSendReply = async () => {
  if (!replyText.value.trim() || !selectedThread.value) return
  sendingReply.value = true
  const textToSend = replyText.value.trim()
  replyText.value = ''

  const newMsg = {
    id: 'msg-' + Date.now(),
    role: 'assistant',
    content: textToSend,
    tokens_used: 0,
    created_at: new Date().toISOString()
  }

  selectedThread.value.messages.push(newMsg)
  selectedThread.value.last_message = newMsg.content
  selectedThread.value.last_active = newMsg.created_at
  scrollToBottom(true)

  try {
    await $fetch('/api/inbox/send-manual-reply', {
      method: 'POST',
      body: {
        agent_id: selectedThread.value.agent_id || props.agents?.[0]?.id,
        user_external_id: selectedThread.value.user_external_id,
        customer_name: selectedThread.value.customer_name || '',
        customer_avatar: selectedThread.value.customer_avatar || '',
        platform: selectedThread.value.platform,
        content: textToSend
      }
    })
    emit('show-toast', { message: 'Message sent to customer!', type: 'success' })
  } catch (e) {
    console.error('Manual reply send error:', e)
    emit('show-toast', { message: 'Delivery failed: ' + (e.data?.statusMessage || e.message), type: 'error' })
  } finally {
    sendingReply.value = false
  }
}

const formatCustomerName = (id, platform) => {
  if (!id) return 'Customer'
  if (platform === 'telegram' || id.startsWith('tg_')) return `Telegram User #${id.slice(-6)}`
  if (id.startsWith('880')) return `+${id}`
  return `Customer #${id.slice(0, 8)}`
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getPlatformIcon = (platform) => {
  if (platform === 'whatsapp') return 'chat'
  if (platform === 'telegram') return 'send'
  return 'forum'
}

const getPlatformBadgeClass = (platform) => {
  if (platform === 'whatsapp') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  if (platform === 'telegram') return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
  return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
}

onMounted(() => {
  fetchChatHistory()
  // Auto-refresh chat history every 3 seconds
  autoPollTimer = setInterval(() => {
    fetchChatHistory(true)
  }, 3000)
})

onUnmounted(() => {
  if (autoPollTimer) clearInterval(autoPollTimer)
})
</script>

<style scoped>
/* Custom sleek scrollbar for Live Inbox */
.in-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.in-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.in-scroll::-webkit-scrollbar-thumb {
  background: rgba(140, 140, 160, 0.25);
  border-radius: 9999px;
}
.in-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(140, 140, 160, 0.5);
}
</style>
