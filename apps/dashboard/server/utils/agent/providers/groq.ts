import type { AgentModelProvider, GenerateOptions, ToolCallingOptions, ModelResult, ModelMessage } from './types'
import type { AgentToolCall } from '../agent_types'
import { getApiKeyList } from '../../settings'

export class GroqModelProvider implements AgentModelProvider {
    name = 'groq'
    private defaultModel = 'qwen/qwen3.6-27b'
    private fallbackModels = ['qwen/qwen3.6-27b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b']

    async generate(options: GenerateOptions): Promise<ModelResult> {
        const keys = await getApiKeyList('groq_api_key', 'groqApiKey')
        if (keys.length === 0) {
            throw new Error('Groq API Key is missing. Please configure groq_api_key in settings.')
        }

        const modelsToTry = options.model
            ? [options.model, ...this.fallbackModels.filter(m => m !== options.model)]
            : this.fallbackModels

        let lastErr: any = null
        for (const currentModel of modelsToTry) {
            const body: any = {
                model: currentModel,
                messages: options.messages,
                temperature: options.temperature ?? 0.2,
                max_tokens: options.maxTokens ?? 1024
            }
            if (options.responseFormat) {
                body.response_format = options.responseFormat
            }

            for (let i = 0; i < keys.length; i++) {
                try {
                    const res = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${keys[i]}`,
                            'Content-Type': 'application/json'
                        },
                        body,
                        timeout: 15000
                    })

                    const choice = res.choices?.[0]
                    const usage = res.usage || {}

                    return {
                        text: choice?.message?.content || '',
                        finishReason: choice?.finish_reason,
                        promptTokens: usage.prompt_tokens || 0,
                        completionTokens: usage.completion_tokens || 0,
                        totalTokens: usage.total_tokens || 0,
                        model: currentModel,
                        provider: 'groq'
                    }
                } catch (err: any) {
                    lastErr = err
                    if (err?.status === 429) {
                        // Rate limited on this model/key, continue to next
                        continue
                    }
                }
            }
        }

        throw new Error(`Groq API Error: ${lastErr?.message || 'Failed after trying all models and keys'}`)
    }

    async generateStructured<T>(options: GenerateOptions & { schema?: any }): Promise<{ data: T; usage: { totalTokens: number } }> {
        const res = await this.generate({
            ...options,
            responseFormat: { type: 'json_object' }
        })

        try {
            const parsed = JSON.parse(res.text) as T
            return { data: parsed, usage: { totalTokens: res.totalTokens } }
        } catch (e: any) {
            const match = res.text.match(/\{[\s\S]*\}/)
            if (match) {
                const parsed = JSON.parse(match[0]) as T
                return { data: parsed, usage: { totalTokens: res.totalTokens } }
            }
            throw new Error(`Failed to parse structured JSON response from Groq: ${e.message}`)
        }
    }

    async runWithTools(options: ToolCallingOptions): Promise<ModelResult> {
        const keys = await getApiKeyList('groq_api_key', 'groqApiKey')
        if (keys.length === 0) {
            throw new Error('Groq API Key is missing.')
        }

        const modelsToTry = options.model
            ? [options.model, ...this.fallbackModels.filter(m => m !== options.model)]
            : this.fallbackModels

        const formattedTools = options.tools.map(t => ({
            type: 'function',
            function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters
            }
        }))

        let lastErr: any = null
        for (const currentModel of modelsToTry) {
            const body: any = {
                model: currentModel,
                messages: options.messages,
                temperature: options.temperature ?? 0.1,
                max_tokens: options.maxTokens ?? 1024,
                tools: formattedTools,
                tool_choice: 'auto'
            }

            for (let i = 0; i < keys.length; i++) {
                try {
                    const res = await $fetch<any>('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${keys[i]}`,
                            'Content-Type': 'application/json'
                        },
                        body,
                        timeout: 20000
                    })

                    const choice = res.choices?.[0]
                    const message = choice?.message
                    const usage = res.usage || {}

                    const parsedToolCalls: AgentToolCall[] = []
                    if (Array.isArray(message?.tool_calls)) {
                        for (const tc of message.tool_calls) {
                            try {
                                const args = typeof tc.function.arguments === 'string'
                                    ? JSON.parse(tc.function.arguments)
                                    : tc.function.arguments
                                parsedToolCalls.push({
                                    id: tc.id,
                                    name: tc.function.name,
                                    arguments: args
                                })
                            } catch (parseErr) {
                                parsedToolCalls.push({
                                    id: tc.id,
                                    name: tc.function.name,
                                    arguments: {}
                                })
                            }
                        }
                    }

                    return {
                        text: message?.content || '',
                        toolCalls: parsedToolCalls.length > 0 ? parsedToolCalls : undefined,
                        finishReason: choice?.finish_reason,
                        promptTokens: usage.prompt_tokens || 0,
                        completionTokens: usage.completion_tokens || 0,
                        totalTokens: usage.total_tokens || 0,
                        model: currentModel,
                        provider: 'groq'
                    }
                } catch (err: any) {
                    lastErr = err
                    if (err?.status === 429) {
                        // Rate limited on this model/key, continue to next
                        continue
                    }
                }
            }
        }

        throw new Error(`Groq Tool Calling Error: ${lastErr?.message || 'Failed'}`)
    }
}
