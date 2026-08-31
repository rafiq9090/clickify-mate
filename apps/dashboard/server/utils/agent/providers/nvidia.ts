import type { AgentModelProvider, GenerateOptions, ToolCallingOptions, ModelResult } from './types'
import type { AgentToolCall } from '../agent_types'
import { getApiKey } from '../../settings'

export class NvidiaModelProvider implements AgentModelProvider {
    name = 'nvidia'
    private defaultModel = 'nvidia/llama-3.1-nemotron-70b-instruct'
    private fallbackModels = [
        'nvidia/llama-3.1-nemotron-70b-instruct',
        'meta/llama-3.1-70b-instruct',
        'meta/llama-3.1-405b-instruct',
        'mistralai/mixtral-8x22b-instruct-v0.1',
        'meta/llama3-70b-instruct',
        'meta/llama-3.3-70b-instruct'
    ]

    private async getNvidiaKey(): Promise<string> {
        const envKey = process.env.NVIDIA_API_KEY
        if (envKey && envKey.startsWith('nvapi-')) return envKey
        const dbKey = await getApiKey('nvidia_api_key', 'nvidiaApiKey')
        if (dbKey && dbKey.startsWith('nvapi-')) return dbKey
        throw new Error('NVIDIA API Key is missing. Please configure NVIDIA_API_KEY.')
    }

    async generate(options: GenerateOptions): Promise<ModelResult> {
        const apiKey = await this.getNvidiaKey()
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

            try {
                const res = await $fetch<any>('https://integrate.api.nvidia.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
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
                    provider: 'nvidia'
                }
            } catch (err: any) {
                lastErr = err
                // Continue trying remaining models in the list
                continue
            }
        }

        throw new Error(`NVIDIA NIM API Error: ${lastErr?.data?.error?.message || lastErr?.message || 'All models failed'}`)
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
            throw new Error(`Failed to parse structured JSON response from NVIDIA: ${e.message}`)
        }
    }

    async runWithTools(options: ToolCallingOptions): Promise<ModelResult> {
        const apiKey = await this.getNvidiaKey()
        const model = options.model || this.defaultModel

        const formattedTools = options.tools.map(t => ({
            type: 'function',
            function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters
            }
        }))

        const body: any = {
            model,
            messages: options.messages,
            temperature: options.temperature ?? 0.1,
            max_tokens: options.maxTokens ?? 1024,
            tools: formattedTools,
            tool_choice: 'auto'
        }

        try {
            const res = await $fetch<any>('https://integrate.api.nvidia.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body,
                timeout: 15000
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
                model,
                provider: 'nvidia'
            }
        } catch (err: any) {
            throw new Error(`NVIDIA Tool Calling Error: ${err.message}`)
        }
    }
}
