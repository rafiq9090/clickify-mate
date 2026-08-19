import type { AgentComplexity } from '../agent_types'
import type { AgentModelProvider } from './types'
import { GroqModelProvider } from './groq'
import { NvidiaModelProvider } from './nvidia'

const groqProvider = new GroqModelProvider()
const nvidiaProvider = new NvidiaModelProvider()

export interface ModelRoute {
    provider: AgentModelProvider | null
    providerName: 'groq' | 'nvidia' | 'rules'
    model?: string
    mode: 'RULES' | 'FAST' | 'AGENT' | 'REASONING' | 'REASONING_WITH_CRITIC'
}

export function chooseModelRoute(input: {
    complexity: AgentComplexity
    requiresVision?: boolean
    requiresDeepReasoning?: boolean
}): ModelRoute {
    const hasNvidia = Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.startsWith('nvapi-'))
    const fastProvider = (process.env.AGENT_FAST_PROVIDER as 'groq' | 'nvidia') || 'groq'
    const fastModel = process.env.AGENT_FAST_MODEL || 'qwen/qwen3.6-27b'
    const reasoningProvider = (process.env.AGENT_REASONING_PROVIDER as 'groq' | 'nvidia') || (hasNvidia ? 'nvidia' : 'groq')
    const reasoningModel = process.env.AGENT_REASONING_MODEL || (reasoningProvider === 'nvidia' ? 'meta/llama-3.3-70b-instruct' : 'qwen/qwen3.6-27b')

    switch (input.complexity) {
        case 'DETERMINISTIC':
            return {
                provider: null,
                providerName: 'rules',
                mode: 'RULES'
            }

        case 'SIMPLE':
            return {
                provider: groqProvider,
                providerName: 'groq',
                model: fastModel,
                mode: 'FAST'
            }

        case 'MEDIUM':
            return {
                provider: groqProvider,
                providerName: 'groq',
                model: 'qwen/qwen3.6-27b',
                mode: 'AGENT'
            }

        case 'COMPLEX':
            return {
                provider: reasoningProvider === 'nvidia' && hasNvidia ? nvidiaProvider : groqProvider,
                providerName: reasoningProvider === 'nvidia' && hasNvidia ? 'nvidia' : 'groq',
                model: reasoningModel,
                mode: 'REASONING'
            }

        case 'HIGH_RISK':
            return {
                provider: reasoningProvider === 'nvidia' && hasNvidia ? nvidiaProvider : groqProvider,
                providerName: reasoningProvider === 'nvidia' && hasNvidia ? 'nvidia' : 'groq',
                model: reasoningModel,
                mode: 'REASONING_WITH_CRITIC'
            }
    }
}

export function getProviderByName(name: 'groq' | 'nvidia'): AgentModelProvider {
    if (name === 'nvidia') return nvidiaProvider
    return groqProvider
}
