import { defineEventHandler, readBody, createError } from 'h3'
import { requireDashboardRole } from '../../utils/auth-session'
import { listCatalogForUser, replaceCatalogForUser } from '../../utils/catalog-store'

export default defineEventHandler(async (event) => {
  const user = await requireDashboardRole(event, ['owner', 'admin', 'manager'])

  if (event.method === 'GET') return listCatalogForUser(user.id)

  if (event.method === 'POST') {
    const body = await readBody(event)
    if (!Array.isArray(body)) {
      throw createError({ statusCode: 400, statusMessage: 'Inventory must be an array of products.' })
    }
    if (body.length > 500) {
      throw createError({ statusCode: 413, statusMessage: 'A catalog update can contain at most 500 products.' })
    }
    const inventory = await replaceCatalogForUser(user.id, body)
    return { success: true, message: 'Catalog synchronized successfully.', inventory }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed.' })
})
