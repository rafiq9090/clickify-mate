<template>
  <section class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/40">
      <div>
        <div class="flex items-center gap-2.5">
          <h2 class="text-xl font-bold tracking-tight text-on-surface">Problem &amp; Feedback Center</h2>
        </div>
        <p class="text-xs text-on-surface-variant mt-1">
          Report technical bugs, channel issues, or suggest improvements with screenshots and video recordings directly to the admin team.
        </p>
      </div>
    </div>

    <!-- Main Content Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Submit New Ticket Form (7 Cols) -->
      <div class="lg:col-span-7 bg-surface border border-outline rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div class="border-b border-outline/40 pb-3 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-on-surface">Submit Problem Report</h3>
            <p class="text-xs text-on-surface-variant">Your report and media will be securely stored in Firebase and sent to the admin team.</p>
          </div>
        </div>

        <form @submit.prevent="submitFeedback" class="space-y-4 text-xs">
          <!-- Title / Subject -->
          <div class="space-y-1.5">
            <label class="font-semibold text-on-surface-variant">Issue Subject / Title <span class="text-primary">*</span></label>
            <input 
              v-model="form.title" 
              type="text" 
              required
              maxlength="180"
              placeholder="e.g. WhatsApp Agent not replying to product inquiry"
              class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <!-- Category & Priority Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="font-semibold text-on-surface-variant">Category <span class="text-primary">*</span></label>
              <select 
                v-model="form.category"
                class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                <option value="Bug Report">Bug Report</option>
                <option value="AI Agent Issue">AI Agent Issue</option>
                <option value="Payment Gateway Problem">Payment Gateway Problem</option>
                <option value="Order & Checkout Issue">Order &amp; Checkout Issue</option>
                <option value="Courier Logistics">Courier Logistics</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General Feedback">General Feedback</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-on-surface-variant">Severity / Priority</label>
              <select 
                v-model="form.priority"
                class="w-full bg-surface-hover border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                <option value="Low">Low - Minor question / suggestion</option>
                <option value="Medium">Medium - Standard issue</option>
                <option value="High">High - Impairing store operation</option>
                <option value="Critical">Critical - Urgent blocker / revenue impact</option>
              </select>
            </div>
          </div>

          <!-- Detailed Description -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="font-semibold text-on-surface-variant">Problem Description <span class="text-primary">*</span></label>
              <span class="text-[11px] text-on-surface-variant font-mono">{{ form.description.length }} chars</span>
            </div>
            <textarea 
              v-model="form.description" 
              rows="5"
              required
              placeholder="Explain the steps to reproduce the issue, what happened vs what was expected..."
              class="w-full bg-surface-hover border border-outline rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed"
            ></textarea>
          </div>

          <!-- Media Attachments Upload Zone (Image & Video) -->
          <div class="space-y-2 pt-1">
            <div class="flex items-center justify-between">
              <label class="font-semibold text-on-surface-variant flex items-center gap-1">
                <span>Attach Images &amp; Video Recordings</span>
                <span class="text-[11px] text-on-surface-variant/70">(Optional, up to 50MB)</span>
              </label>
              <span class="text-[11px] text-primary font-semibold">
                {{ form.attachments.length }} file(s) attached
              </span>
            </div>

            <!-- Drag and drop box -->
            <label 
              class="border-2 border-dashed border-outline hover:border-primary/50 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2 text-center bg-surface-hover/30 hover:bg-surface-hover/60 transition-all cursor-pointer relative"
              :class="{ 'opacity-60 pointer-events-none': uploadingFile }"
            >
              <input 
                type="file" 
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" 
                class="hidden" 
                @change="handleFileUpload" 
              />
              
              <div v-if="uploadingFile" class="flex flex-col items-center gap-2 py-2">
                <div class="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <span class="text-xs font-semibold text-primary">Uploading attachment</span>
              </div>

              <template v-else>
                <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined text-2xl">cloud_upload</span>
                </div>
                <div>
                  <p class="text-xs font-bold text-on-surface">Click to upload screenshots or screen recording video</p>
                  <p class="text-[11px] text-on-surface-variant mt-0.5">PNG, JPG, WebP, MP4, WebM, MOV (Max 50 MB per file)</p>
                </div>
              </template>
            </label>

            <!-- Attachment Previews Grid -->
            <div v-if="form.attachments.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div 
                v-for="(att, idx) in form.attachments" 
                :key="idx" 
                class="p-2.5 rounded-xl bg-surface border border-outline flex items-center justify-between gap-2 shadow-2xs group"
              >
                <!-- Thumbnail / Icon -->
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                  <div class="w-10 h-10 rounded-lg overflow-hidden bg-surface-hover border border-outline shrink-0 flex items-center justify-center">
                    <img 
                      v-if="att.isImage" 
                      :src="att.proxyUrl || att.url" 
                      alt="Thumbnail" 
                      class="w-full h-full object-cover" 
                    />
                    <span v-else class="material-symbols-outlined text-lg text-primary">videocam</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-on-surface truncate" :title="att.fileName">{{ att.fileName }}</p>
                    <span class="text-[10px] text-on-surface-variant font-mono">{{ formatFileSize(att.size) }}</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 shrink-0">
                  <button 
                    type="button" 
                    @click="previewMedia(att)" 
                    class="p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                    title="Preview file"
                  >
                    <span class="material-symbols-outlined text-base">visibility</span>
                  </button>
                  <button 
                    type="button" 
                    @click="removeAttachment(idx)" 
                    class="p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                    title="Remove attachment"
                  >
                    <span class="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-3 border-t border-outline/40 flex justify-end">
            <button 
              type="submit" 
              :disabled="submitting || uploadingFile"
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-accent transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <span v-if="submitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span class="material-symbols-outlined text-base" v-else>send</span>
              <span>{{ submitting ? 'Submitting Report...' : 'Send Feedback' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Right Column: My Submitted Tickets (5 Cols) -->
      <div class="lg:col-span-5 bg-surface border border-outline rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div class="border-b border-outline/40 pb-3 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-on-surface">Recent Problem Reports</h3>
            <p class="text-xs text-on-surface-variant">Track status and replies from administration.</p>
          </div>
        </div>

        <div v-if="loading" class="py-12 text-center space-y-3">
          <div class="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p class="text-xs text-on-surface-variant">Loading submitted feedback...</p>
        </div>

        <!-- Ticket List -->
        <div v-else-if="tickets.length > 0" class="space-y-3 max-h-[580px] overflow-y-auto pr-1">
          <div 
            v-for="ticket in tickets" 
            :key="ticket.id" 
            class="p-4 rounded-xl bg-surface-hover/50 border border-outline space-y-2.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface border border-outline text-on-surface">
                    {{ ticket.category }}
                  </span>
                  <span class="text-[10px] font-semibold text-on-surface-variant/70 font-mono">
                    {{ formatDate(ticket.created_at) }}
                  </span>
                </div>
                <h4 class="text-xs font-bold text-on-surface leading-snug">{{ ticket.title }}</h4>
              </div>

              <!-- Status Badge -->
              <span 
                class="px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize shrink-0"
                :class="ticket.status === 'resolved' 
                  ? 'bg-primary/10 text-primary border-primary/20' 
                  : 'bg-surface text-on-surface border-outline'"
              >
                {{ ticket.status || 'Open' }}
              </span>
            </div>

            <p class="text-xs text-on-surface-variant leading-relaxed line-clamp-3 bg-surface p-2.5 rounded-lg border border-outline/50">
              {{ ticket.description }}
            </p>

            <!-- Attachments preview if present -->
            <!-- Attachments preview if present -->
            <div v-if="ticket.attachments && ticket.attachments.length > 0" class="space-y-1">
              <span class="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Attachments ({{ ticket.attachments.length }})</span>
              <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <div 
                  v-for="(att, aIdx) in ticket.attachments" 
                  :key="aIdx" 
                  @click="previewMedia(att)"
                  class="w-12 h-12 rounded-lg bg-surface border border-outline overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center shadow-2xs relative"
                  :title="getMediaName(att)"
                >
                  <img v-if="isMediaImage(att)" :src="getMediaUrl(att)" class="w-full h-full object-cover" />
                  <span v-else class="material-symbols-outlined text-lg text-primary">play_circle</span>
                </div>
              </div>
            </div>

            <!-- Admin Reply if resolved / replied -->
            <div v-if="ticket.admin_reply" class="p-2.5 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
              <span class="text-[10px] font-bold text-primary flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">admin_panel_settings</span>
                Admin Response:
              </span>
              <p class="text-xs text-on-surface leading-relaxed">{{ ticket.admin_reply }}</p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="py-12 text-center space-y-2 border border-dashed border-outline rounded-xl">
          <span class="material-symbols-outlined text-3xl text-on-surface-variant/40">feedback</span>
          <p class="text-xs font-semibold text-on-surface">No feedback reports submitted yet</p>
          <p class="text-[11px] text-on-surface-variant max-w-xs mx-auto">
            When you encounter a problem or have a request, submit it here to receive support.
          </p>
        </div>
      </div>
    </div>

    <!-- Media Lightbox / Full Video Preview Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="selectedMedia" 
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          @click.self="selectedMedia = null"
        >
          <div class="bg-surface border border-outline rounded-3xl p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-outline/40 pb-2">
              <span class="text-xs font-bold text-on-surface truncate">{{ getMediaName(selectedMedia) }}</span>
              <button @click="selectedMedia = null" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-hover transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <!-- Preview Display -->
            <div class="flex-1 overflow-hidden flex items-center justify-center bg-black/40 rounded-2xl min-h-[300px]">
              <img 
                v-if="isMediaImage(selectedMedia)" 
                :src="getMediaUrl(selectedMedia)" 
                alt="Full View" 
                class="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
              <video 
                v-else 
                :src="getMediaUrl(selectedMedia)" 
                controls 
                autoplay
                class="max-w-full max-h-[70vh] rounded-xl"
              ></video>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const emit = defineEmits(['show-toast'])

const loading = ref(false)
const submitting = ref(false)
const uploadingFile = ref(false)
const tickets = ref([])
const selectedMedia = ref(null)

const form = reactive({
  title: '',
  category: 'Bug Report',
  priority: 'Medium',
  description: '',
  attachments: []
})

const isMediaImage = (att) => {
  if (!att) return false
  if (typeof att === 'string') {
    if (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(att) || att.startsWith('data:video/')) return false
    return /\.(jpe?g|png|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(att) || att.startsWith('data:image/') || true
  }
  if (att.isImage === true) return true
  if (att.isVideo === true) return false
  if (att.contentType && typeof att.contentType === 'string') {
    if (att.contentType.startsWith('image/')) return true
    if (att.contentType.startsWith('video/')) return false
  }
  const str = String(att.fileName || att.name || att.url || att.proxyUrl || '')
  if (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(str) || str.startsWith('data:video/')) return false
  return /\.(jpe?g|png|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(str) || str.startsWith('data:image/') || !att.isVideo
}

const getMediaUrl = (att) => {
  if (!att) return ''
  if (typeof att === 'string') return att
  const urlCandidate = att.proxyUrl || att.url || att.src || att.link || ''
  if (typeof urlCandidate === 'string') return urlCandidate
  return ''
}

const getMediaName = (att) => {
  if (!att) return 'Attachment File'
  if (typeof att === 'string') {
    const parts = att.split('/')
    return parts[parts.length - 1]?.split('?')[0] || 'Attachment File'
  }
  if (typeof att.fileName === 'string' && att.fileName.trim()) return att.fileName
  if (typeof att.name === 'string' && att.name.trim()) return att.name
  const urlStr = getMediaUrl(att)
  if (urlStr) {
    const parts = urlStr.split('/')
    return parts[parts.length - 1]?.split('?')[0] || 'Attachment File'
  }
  return 'Attachment File'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Recently'
  const d = new Date(dateStr)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchTickets = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/feedback/list')
    if (res?.tickets) {
      tickets.value = res.tickets
    }
  } catch (err) {
    console.error('Failed to load feedback tickets:', err)
  } finally {
    loading.value = false
  }
}

const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  uploadingFile.value = true
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)

      const res = await $fetch('/api/feedback/upload', {
        method: 'POST',
        body: formData
      })

      if (res?.success) {
        form.attachments.push({
          url: res.url,
          proxyUrl: res.proxyUrl,
          fileName: res.fileName,
          size: res.size,
          contentType: res.contentType,
          isImage: res.isImage,
          isVideo: res.isVideo
        })
      }
    }
    emit('show-toast', { message: 'Attachment uploaded to storage', type: 'success' })
  } catch (err) {
    emit('show-toast', { message: 'Upload failed: ' + (err.data?.statusMessage || err.message), type: 'error' })
  } finally {
    uploadingFile.value = false
    event.target.value = ''
  }
}

const removeAttachment = (index) => {
  form.attachments.splice(index, 1)
}

const previewMedia = (media) => {
  selectedMedia.value = media
}

const submitFeedback = async () => {
  if (!form.title || !form.description) {
    emit('show-toast', { message: 'Please enter a title and description', type: 'warning' })
    return
  }

  submitting.value = true
  try {
    const res = await $fetch('/api/feedback/submit', {
      method: 'POST',
      body: {
        title: form.title,
        category: form.category,
        priority: form.priority,
        description: form.description,
        attachments: form.attachments
      }
    })

    if (res?.success) {
      emit('show-toast', { message: 'Problem report submitted successfully!', type: 'success' })
      // Reset form
      form.title = ''
      form.description = ''
      form.attachments = []
      form.category = 'Bug Report'
      form.priority = 'Medium'
      await fetchTickets()
    }
  } catch (err) {
    emit('show-toast', { message: 'Submission failed: ' + (err.data?.statusMessage || err.message), type: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchTickets()
})
</script>
