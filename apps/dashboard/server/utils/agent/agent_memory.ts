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

export function getCustomerMemory(customerId: string): CustomerMemoryRecord | undefined {
    return customerMemoryCache.get(customerId)
}

export function updateCustomerMemory(
    customerId: string,
    updates: Partial<CustomerMemoryRecord>
): CustomerMemoryRecord {
    const existing = customerMemoryCache.get(customerId) || {
        customerId,
        totalOrders: 0,
        lastActive: new Date().toISOString()
    }

    const updated = {
        ...existing,
        ...updates,
        lastActive: new Date().toISOString()
    }

    customerMemoryCache.set(customerId, updated)
    return updated
}
