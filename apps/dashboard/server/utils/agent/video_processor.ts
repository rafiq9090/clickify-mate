import { analyzeImage } from './vision'
import { getApiKey } from '../settings'

export interface VideoAnalysisOptions {
    videoBuffer?: Buffer
    thumbnailBuffer?: Buffer
    mimeType?: string
    duration?: number
    fileSize?: number
    caption?: string
    groqApiKey?: string
}

export interface VideoAnalysisResult {
    visualSummary: string
    audioTranscript: string
    combinedText: string
    isDefectOrComplaint: boolean
    isPaymentProof: boolean
    isLongOrHeavyVideo: boolean
    requiresHumanReview: boolean
    extractedTrxId?: string
}

const MAX_DIRECT_PROCESS_DURATION_SEC = 60
const MAX_DIRECT_PROCESS_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

/**
 * Enterprise Multi-Modal Video Processing Subsystem
 * Analyzes customer video messages via Keyframe Thumbnail Vision + Whisper Audio Transcription.
 * Applies intelligent guards for heavy/long videos.
 */
export async function analyzeVideoMessage(options: VideoAnalysisOptions): Promise<VideoAnalysisResult> {
    const { videoBuffer, thumbnailBuffer, mimeType, duration, fileSize, caption, groqApiKey } = options
    const safeCaption = caption || ''

    const isLong = Boolean(duration && duration > MAX_DIRECT_PROCESS_DURATION_SEC)
    const isHeavy = Boolean(fileSize && fileSize > MAX_DIRECT_PROCESS_FILE_SIZE_BYTES)
    const isLongOrHeavyVideo = isLong || isHeavy

    let visualSummary = ''
    let audioTranscript = ''

    // 1. Visual Analysis from Keyframe Thumbnail (NVIDIA NIM Vision)
    // Always runs fast (300ms) regardless of video file size!
    if (thumbnailBuffer && thumbnailBuffer.length > 0) {
        try {
            const base64Thumb = thumbnailBuffer.toString('base64')
            const prompt = "Describe the product, defect, payment screen, or item shown in this video frame in one clear sentence. If it's damaged or torn, describe the defect. If it's a payment receipt, extract the transaction ID."
            visualSummary = await analyzeImage(base64Thumb, 'image/jpeg', prompt, groqApiKey)
        } catch (visErr: any) {
            console.warn(`[VIDEO PROCESSOR]: Keyframe visual analysis warning: ${visErr.message}`)
        }
    }

    // 2. Audio Speech-to-Text Transcription via Groq Whisper (Only for lightweight videos <= 60s & <= 20MB)
    if (!isLongOrHeavyVideo && videoBuffer && videoBuffer.length > 0) {
        let apiKey = groqApiKey || process.env.GROQ_API_KEY
        if (!apiKey) {
            try {
                apiKey = await getApiKey('groq_api_key', 'groqApiKey')
            } catch {
                apiKey = ''
            }
        }

        if (apiKey) {
            try {
                const safeMime = mimeType || 'video/mp4'
                let ext = 'mp4'
                if (safeMime.includes('webm')) ext = 'webm'
                else if (safeMime.includes('mov') || safeMime.includes('quicktime')) ext = 'mov'
                else if (safeMime.includes('ogg')) ext = 'ogg'

                const formData = new FormData()
                const blob = new Blob([new Uint8Array(videoBuffer)], { type: safeMime })
                formData.append('file', blob, `video_audio.${ext}`)
                formData.append('model', 'whisper-large-v3')
                formData.append('prompt', 'Customer Bengali (বাংলা), Banglish, or English speech in e-commerce video unboxing or product inquiry.')

                const whisperRes = await $fetch<any>('https://api.groq.com/openai/v1/audio/transcriptions', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`
                    },
                    body: formData,
                    timeout: 15000
                })

                if (whisperRes && whisperRes.text) {
                    audioTranscript = whisperRes.text.trim()
                }
            } catch (audioErr: any) {
                console.warn(`[VIDEO PROCESSOR]: Audio transcription notice: ${audioErr?.message || audioErr}`)
            }
        }
    }

    // 3. Heuristic Defect / Complaint Detection
    const mergedCorpus = `${safeCaption} ${visualSummary} ${audioTranscript}`.toLowerCase()
    const defectKeywords = [
        'defect', 'damaged', 'broken', 'torn', 'chera', 'chera peyechi', 'nosto',
        'wrong size', 'bhul size', 'shilai khula', 'rong jole', 'problem',
        'chera kapod', 'fata', 'kharap', 'faulty', 'stain', 'dag lagano', 'কমপ্লেইন', 'ছেঁড়া', 'নষ্ট', 'সমস্যা'
    ]
    const isDefectOrComplaint = defectKeywords.some(kw => mergedCorpus.includes(kw))

    // 4. Payment Screen / TrxID Heuristic
    const trxMatch = mergedCorpus.match(/(?:trx|trxid|transaction|trnx)\s*[:#=\-]?\s*([A-Za-z0-9]{8,14})/i) ||
                     mergedCorpus.match(/\b(bk[0-9a-z]{8,10}|ng[0-9a-z]{8,10})\b/i)
    const isPaymentProof = Boolean(trxMatch || mergedCorpus.includes('bkash') || mergedCorpus.includes('nagad') || mergedCorpus.includes('payment successful'))
    const extractedTrxId = trxMatch ? trxMatch[1] : undefined

    // 5. Determine if human review is needed
    const requiresHumanReview = isLongOrHeavyVideo || isDefectOrComplaint

    // 6. Synthesize Combined Text for Orchestrator
    const parts: string[] = []
    if (isLongOrHeavyVideo) {
        parts.push(`[Customer uploaded long video (${duration ? `${duration}s` : 'large size'})]`)
    }
    if (visualSummary) parts.push(`[Video Visual Content: ${visualSummary}]`)
    if (audioTranscript) parts.push(`[Customer Spoken Voice: "${audioTranscript}"]`)
    if (safeCaption) parts.push(safeCaption)

    const combinedText = parts.length > 0
        ? parts.join(' ')
        : (safeCaption || 'User sent a video.')

    return {
        visualSummary,
        audioTranscript,
        combinedText,
        isDefectOrComplaint,
        isPaymentProof,
        isLongOrHeavyVideo,
        requiresHumanReview,
        extractedTrxId
    }
}
