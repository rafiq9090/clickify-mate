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
    const configuredPrimary = process.env.AGENT_PRIMARY_PROVIDER || process.env.AGENT_FAST_PROVIDER
    const fastProvider: 'groq' | 'nvidia' = configuredPrimary === 'groq'
        ? 'groq'
        : (hasNvidia ? 'nvidia' : 'groq')
    const fastModel = process.env.AGENT_FAST_MODEL || (fastProvider === 'nvidia'
        ? 'meta/llama-3.1-8b-instruct'
        : 'openai/gpt-oss-20b')
    const configuredReasoning = (process.env.AGENT_REASONING_PROVIDER as 'groq' | 'nvidia') || (hasNvidia ? 'nvidia' : 'groq')
    const reasoningProvider: 'groq' | 'nvidia' = configuredReasoning === 'nvidia' && hasNvidia ? 'nvidia' : 'groq'
    const reasoningModel = process.env.AGENT_REASONING_MODEL || (reasoningProvider === 'nvidia' ? 'meta/llama-3.1-8b-instruct' : 'openai/gpt-oss-20b')
    const selectedFastProvider = fastProvider === 'nvidia' && hasNvidia ? nvidiaProvider : groqProvider
    const selectedFastProviderName: 'groq' | 'nvidia' = fastProvider === 'nvidia' && hasNvidia ? 'nvidia' : 'groq'

    switch (input.complexity) {
        case 'DETERMINISTIC':
            return {
                provider: null,
                providerName: 'rules',
                mode: 'RULES'
            }

        case 'SIMPLE':
            return {
                provider: selectedFastProvider,
                providerName: selectedFastProviderName,
                model: fastModel,
                mode: 'FAST'
            }

        case 'MEDIUM':
            return {
                provider: selectedFastProvider,
                providerName: selectedFastProviderName,
                model: fastModel,
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
