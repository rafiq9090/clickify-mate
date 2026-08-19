import jwt from 'jsonwebtoken'
import { executeQuery } from '../utils/supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-in-prod-9988'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { 
    table, 
    action, 
    queryData, 
    filters = [], 
    orderVal, 
    limitVal, 
    rangeVal,
    singleVal, 
    maybeSingleVal, 
    countOption, 
    onConflictVal 
  } = body || {}

  // Extract JWT token from header or cookie
  const authHeader = getRequestHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : getCookie(event, 'toolkit_user_auth')

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized. Please login.' })
  }

  try {
    // Verify JWT payload
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Row-level Security: enforce user_id restriction for user-owned agent configurations
    if (table === 'agent_configs') {
      const activeFilters = Array.isArray(filters) ? filters : []
      if (action === 'select' || action === 'delete' || action === 'update') {
        const userFilterIndex = activeFilters.findIndex((f: any) => f.column === 'user_id')
        if (userFilterIndex !== -1) {
          activeFilters[userFilterIndex].value = decoded.id
        } else {
          activeFilters.push({ type: 'eq', column: 'user_id', value: decoded.id })
        }
      } else if (action === 'insert' || action === 'upsert') {
        const injectUser = (item: any) => {
          item.user_id = decoded.id
        }
        if (Array.isArray(queryData)) {
          queryData.forEach(injectUser)
        } else if (queryData) {
          injectUser(queryData)
        }
      }
    }

    // Execute query against local PostgreSQL or MongoDB
    const result = await executeQuery({
      table,
      action,
      queryData,
      filters,
      orderVal,
      limitVal,
      rangeVal,
      singleVal,
      maybeSingleVal,
      countOption,
      onConflictVal
    })

    if (result.error) {
      return { data: null, error: { message: result.error }, count: 0 }
    }

    return {
      data: result.data,
      error: null,
      count: result.count !== undefined ? result.count : (Array.isArray(result.data) ? result.data.length : 0)
    }
  } catch (err: any) {
    console.error('[DB QUERY ENDPOINT EXCEPTION]:', err)
    throw createError({ statusCode: 401, statusMessage: 'Session expired or invalid.' })
  }
})
