import type { AgentComplexity } from '../agent_types'
import type { AgentModelProvider } from './types'
import { GroqModelProvider } from './groq'
import { NvidiaModelProvider } from './nvidia'
import { OpenAIModelProvider } from './openai'
import { DeepSeekModelProvider } from './deepseek'
import { KimiModelProvider } from './kimi'

const groqProvider = new GroqModelProvider()
const nvidiaProvider = new NvidiaModelProvider()
const openaiProvider = new OpenAIModelProvider()
const deepseekProvider = new DeepSeekModelProvider()
const kimiProvider = new KimiModelProvider()

export interface ModelRoute {
    provider: AgentModelProvider | null
    providerName: 'groq' | 'nvidia' | 'openai' | 'deepseek' | 'kimi' | 'rules'
    model?: string
    mode: 'RULES' | 'FAST' | 'AGENT' | 'REASONING' | 'REASONING_WITH_CRITIC'
}

export function chooseModelRoute(input: {
    complexity: AgentComplexity
    requiresVision?: boolean
    requiresDeepReasoning?: boolean
}): ModelRoute {
    const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_'))
    const hasNvidia = Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.startsWith('nvapi-'))
    const configuredPrimary = process.env.AGENT_PRIMARY_PROVIDER || process.env.AGENT_FAST_PROVIDER
    
    let fastProvider: 'groq' | 'nvidia' | 'openai' | 'deepseek' | 'kimi' = 'groq'
    if (configuredPrimary && ['groq', 'nvidia', 'openai', 'deepseek', 'kimi'].includes(configuredPrimary)) {
        fastProvider = configuredPrimary as any
    } else if (hasGroq) {
        fastProvider = 'groq'
    } else if (hasNvidia) {
        fastProvider = 'nvidia'
    }

    const fastModel = process.env.AGENT_FAST_MODEL || (fastProvider === 'groq'
        ? 'llama-3.3-70b-versatile'
        : (fastProvider === 'nvidia'
            ? 'nvidia/llama-3.1-nemotron-70b-instruct'
            : (fastProvider === 'openai' ? 'gpt-4o-mini' : (fastProvider === 'deepseek' ? 'deepseek-chat' : 'moonshot-v1-8k'))))

    const configuredReasoning = (process.env.AGENT_REASONING_PROVIDER as any) || (hasGroq ? 'groq' : (hasNvidia ? 'nvidia' : 'groq'))
    const reasoningProvider: 'groq' | 'nvidia' | 'openai' | 'deepseek' | 'kimi' = configuredReasoning
    const reasoningModel = process.env.AGENT_REASONING_MODEL || (reasoningProvider === 'groq' ? 'llama-3.3-70b-versatile' : 'nvidia/llama-3.1-nemotron-70b-instruct')

    const selectedFastProvider = getProviderByName(fastProvider)

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
                providerName: fastProvider,
                model: fastModel,
                mode: 'FAST'
            }

        case 'MEDIUM':
            return {
                provider: selectedFastProvider,
                providerName: fastProvider,
                model: fastModel,
                mode: 'AGENT'
            }

        case 'COMPLEX':
            return {
                provider: getProviderByName(reasoningProvider),
                providerName: reasoningProvider,
                model: reasoningModel,
                mode: 'REASONING'
            }

        case 'HIGH_RISK':
            return {
                provider: getProviderByName(reasoningProvider),
                providerName: reasoningProvider,
                model: reasoningModel,
                mode: 'REASONING_WITH_CRITIC'
            }
    }
}

export function getProviderByName(name: 'groq' | 'nvidia' | 'openai' | 'deepseek' | 'kimi' | string): AgentModelProvider {
    switch (name) {
        case 'nvidia':
            return nvidiaProvider
        case 'openai':
            return openaiProvider
        case 'deepseek':
            return deepseekProvider
        case 'kimi':
            return kimiProvider
        case 'groq':
        default:
            return groqProvider
    }
}
