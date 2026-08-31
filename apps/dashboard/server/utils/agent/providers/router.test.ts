import assert from 'node:assert/strict'
import test from 'node:test'
import { chooseModelRoute } from './router'

test('uses NVIDIA for simple and medium turns when an NVIDIA key is configured', () => {
    const originalKey = process.env.NVIDIA_API_KEY
    const originalPrimary = process.env.AGENT_PRIMARY_PROVIDER
    const originalFast = process.env.AGENT_FAST_PROVIDER
    try {
        process.env.NVIDIA_API_KEY = 'nvapi-test-key'
        delete process.env.AGENT_PRIMARY_PROVIDER
        delete process.env.AGENT_FAST_PROVIDER

        const simple = chooseModelRoute({ complexity: 'SIMPLE' })
        assert.equal(simple.providerName, 'nvidia')
        assert.equal(simple.model, 'nvidia/llama-3.1-nemotron-70b-instruct')
        assert.equal(chooseModelRoute({ complexity: 'MEDIUM' }).providerName, 'nvidia')
        assert.equal(chooseModelRoute({ complexity: 'COMPLEX' }).providerName, 'nvidia')
    } finally {
        if (originalKey === undefined) delete process.env.NVIDIA_API_KEY
        else process.env.NVIDIA_API_KEY = originalKey
        if (originalPrimary === undefined) delete process.env.AGENT_PRIMARY_PROVIDER
        else process.env.AGENT_PRIMARY_PROVIDER = originalPrimary
        if (originalFast === undefined) delete process.env.AGENT_FAST_PROVIDER
        else process.env.AGENT_FAST_PROVIDER = originalFast
    }
})

test('allows an explicit Groq override while keeping NVIDIA available', () => {
    const originalKey = process.env.NVIDIA_API_KEY
    const originalPrimary = process.env.AGENT_PRIMARY_PROVIDER
    try {
        process.env.NVIDIA_API_KEY = 'nvapi-test-key'
        process.env.AGENT_PRIMARY_PROVIDER = 'groq'
        assert.equal(chooseModelRoute({ complexity: 'SIMPLE' }).providerName, 'groq')
        assert.equal(chooseModelRoute({ complexity: 'MEDIUM' }).providerName, 'groq')
    } finally {
        if (originalKey === undefined) delete process.env.NVIDIA_API_KEY
        else process.env.NVIDIA_API_KEY = originalKey
        if (originalPrimary === undefined) delete process.env.AGENT_PRIMARY_PROVIDER
        else process.env.AGENT_PRIMARY_PROVIDER = originalPrimary
    }
})
