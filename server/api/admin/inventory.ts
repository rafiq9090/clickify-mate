import { defineEventHandler, readBody, createError } from 'h3'
import { getMockInventory, saveMockInventory } from '../../utils/mock_shop'

export default defineEventHandler(async (event) => {
    const method = event.method

    if (method === 'GET') {
        try {
            return getMockInventory()
        } catch (e: any) {
            throw createError({
                statusCode: 500,
                statusMessage: e.message || 'Failed to read mock inventory'
            })
        }
    }

    if (method === 'POST') {
        try {
            const body = await readBody(event)
            if (!Array.isArray(body)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Invalid inventory format, must be an array of products'
                })
            }
            saveMockInventory(body)
            return { success: true, message: 'Mock inventory updated successfully', inventory: body }
        } catch (e: any) {
            throw createError({
                statusCode: 500,
                statusMessage: e.message || 'Failed to update mock inventory'
            })
        }
    }
})
