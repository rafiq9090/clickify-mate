import type { AgentContext } from './agent_types'

export interface CustomerMemoryRecord {
    customerId: string
    preferredColor?: string
    preferredSize?: string
    preferredLanguage?: string
    totalOrders: number
    lastActive: string
}

const customerMemoryCache = new Map<string, CustomerMemoryRecord>()

function memoryKey(agentId: string, channel: string, customerId: string): string {
    return `${agentId}:${channel}:${customerId}`
}

export function getCustomerMemory(agentId: string, channel: string, customerId: string): CustomerMemoryRecord | undefined {
    return customerMemoryCache.get(memoryKey(agentId, channel, customerId))
}

export function updateCustomerMemory(
    agentId: string,
    channel: string,
    customerId: string,
    updates: Partial<CustomerMemoryRecord>
): CustomerMemoryRecord {
    const key = memoryKey(agentId, channel, customerId)
    const existing = customerMemoryCache.get(key) || {
        customerId,
        totalOrders: 0,
        lastActive: new Date().toISOString()
    }

    const updated = {
        ...existing,
        ...updates,
        lastActive: new Date().toISOString()
    }

    customerMemoryCache.set(key, updated)
    return updated
}
