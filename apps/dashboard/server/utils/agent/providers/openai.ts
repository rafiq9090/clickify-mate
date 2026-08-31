import type { AgentModelProvider, GenerateOptions, ToolCallingOptions, ModelResult } from './types'
import type { AgentToolCall } from '../agent_types'
import { getApiKeyList } from '../../settings'

export class OpenAIModelProvider implements AgentModelProvider {
    name = 'openai'
    private defaultModel = 'gpt-4o-mini'
    private fallbackModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']

    async generate(options: GenerateOptions): Promise<ModelResult> {
        const keys = await getApiKeyList('openai_api_key', 'openaiApiKey')
        if (keys.length === 0) {
            throw new Error('OpenAI API Key is missing. Please configure openai_api_key in settings.')
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
                    const res = await $fetch<any>('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${keys[i]}`,
                            'Content-Type': 'application/json'
                        },
                        body,
                        timeout: 20000
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
                        provider: 'openai'
                    }
                } catch (err: any) {
                    lastErr = err
                    if (err?.status === 429) {
                        continue
                    }
                }
            }
        }

        throw new Error(`OpenAI API Error: ${lastErr?.message || 'Failed after trying all keys'}`)
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
            throw new Error(`Failed to parse structured JSON response from OpenAI: ${e.message}`)
        }
    }

    async runWithTools(options: ToolCallingOptions): Promise<ModelResult> {
        const keys = await getApiKeyList('openai_api_key', 'openaiApiKey')
        if (keys.length === 0) {
            throw new Error('OpenAI API Key is missing.')
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
            const body = {
                model: currentModel,
                messages: options.messages,
                tools: formattedTools,
                tool_choice: 'auto',
                temperature: options.temperature ?? 0.2,
                max_tokens: options.maxTokens ?? 1024
            }

            for (let i = 0; i < keys.length; i++) {
                try {
                    const res = await $fetch<any>('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${keys[i]}`,
                            'Content-Type': 'application/json'
                        },
                        body,
                        timeout: 20000
                    })

                    const message = res.choices?.[0]?.message
                    const usage = res.usage || {}

                    const toolCalls: AgentToolCall[] = (message?.tool_calls || []).map((tc: any) => {
                        let parsedArgs = {}
                        try {
                            parsedArgs = JSON.parse(tc.function.arguments)
                        } catch {
                            parsedArgs = {}
                        }
                        return {
                            tool: tc.function.name,
                            input: parsedArgs
                        }
                    })

                    return {
                        text: message?.content || '',
                        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                        finishReason: res.choices?.[0]?.finish_reason,
                        promptTokens: usage.prompt_tokens || 0,
                        completionTokens: usage.completion_tokens || 0,
                        totalTokens: usage.total_tokens || 0,
                        model: currentModel,
                        provider: 'openai'
                    }
                } catch (err: any) {
                    lastErr = err
                    if (err?.status === 429) continue
                }
            }
        }

        throw new Error(`OpenAI Tool Calling Error: ${lastErr?.message || 'Failed'}`)
    }
}
