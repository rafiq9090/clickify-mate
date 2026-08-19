import { getApiKey } from '../settings'

/**
 * Enterprise Vision & Multi-Modal Processing Subsystem
 * Analyzes customer-submitted photos (products, receipts, screenshots)
 * with multi-tier fallback (Groq Llama 3.2 Vision -> Gemini Flash).
 */

export async function analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    groqApiKey?: string
): Promise<string> {
    if (!imageBase64) return ''

    const safeMime = mimeType || 'image/jpeg'
    const visionModels = ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview']

    // 1. Try Groq Vision Models
    if (groqApiKey) {
        for (const model of visionModels) {
            try {
                const res = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${groqApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: {
                        model,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: prompt },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: `data:${safeMime};base64,${imageBase64}`
                                        }
                                    }
                                ]
                            }
                        ],
                        temperature: 0.2,
                        max_tokens: 300
                    },
                    timeout: 10000
                })

                const content = res.choices?.[0]?.message?.content || ''
                if (content && content.trim().length > 0) {
                    return content.trim()
                }
            } catch (err: any) {
                console.warn(`[VISION WARNING]: Groq model ${model} failed (${err.status || err.message}). Trying next...`)
            }
        }
    }

    // 2. Fallback: Google Gemini Vision
    try {
        const geminiKey = await getApiKey('gemini_api_key', 'geminiApiKey')
        if (geminiKey) {
            const geminiRes = await $fetch<any>(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: safeMime,
                                        data: imageBase64
                                    }
                                }
                            ]
                        }
                    ]
                },
                timeout: 10000
            })

            const candidate = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text
            if (candidate && candidate.trim().length > 0) {
                return candidate.trim()
            }
        }
    } catch (geminiErr: any) {
        console.warn(`[VISION WARNING]: Gemini vision fallback error: ${geminiErr.message}`)
    }

    return ''
}
