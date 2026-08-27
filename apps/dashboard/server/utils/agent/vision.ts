import { getApiKey } from '../settings'

/**
 * Enterprise Vision & Multi-Modal Processing Subsystem
 * Analyzes customer-submitted photos (products, receipts, screenshots)
 * Primary: NVIDIA NIM (meta/llama-3.2-11b-vision-instruct)
 * Fallback 1: Google Gemini Flash Vision
 * Fallback 2: Groq Vision Models
 */

export async function analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    groqApiKey?: string
): Promise<string> {
    if (!imageBase64) return ''

    const safeMime = mimeType || 'image/jpeg'

    // 1. Primary: NVIDIA NIM Vision (Fast TensorRT Acceleration)
    try {
        const nvidiaKey = process.env.NVIDIA_API_KEY || await getApiKey('nvidia_api_key', 'nvidiaApiKey')
        if (nvidiaKey && nvidiaKey.startsWith('nvapi-')) {
            const res = await $fetch<any>('https://integrate.api.nvidia.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${nvidiaKey}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    model: 'meta/llama-3.2-11b-vision-instruct',
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
                    max_tokens: 150,
                    temperature: 0.1
                },
                timeout: 12000
            })

            const content = res.choices?.[0]?.message?.content || ''
            if (content && content.trim().length > 0) {
                return content.trim()
            }
        }
    } catch (nvdErr: any) {
        console.warn(`[VISION WARNING]: NVIDIA vision primary failed (${nvdErr?.data?.error?.message || nvdErr.message}). Trying fallback...`)
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

    // 3. Fallback: Groq Vision Models
    if (groqApiKey) {
        for (const model of ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview']) {
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
                        max_tokens: 150
                    },
                    timeout: 10000
                })

                const content = res.choices?.[0]?.message?.content || ''
                if (content && content.trim().length > 0) {
                    return content.trim()
                }
            } catch (err: any) {
                // Ignore groq 400 deprecations
            }
        }
    }

    return ''
}
