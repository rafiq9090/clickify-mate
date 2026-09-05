import { executeQuery } from '../utils/supabase'
import { queryPg } from '../utils/db'
import { requireDashboardUser } from '../utils/auth-session'

type TableRule = {
  actions: string[]
  columns: string[]
  writable: string[]
}

const TABLE_RULES: Record<string, TableRule> = {
  agent_configs: {
    actions: ['select', 'update', 'delete'],
    columns: ['id', 'user_id', 'name', 'platform', 'external_id', 'is_active', 'created_at', 'updated_at'],
    writable: ['name', 'knowledge', 'product_images', 'agent_behavior', 'is_active', 'updated_at']
  },
  leads: {
    actions: ['select', 'insert', 'update', 'delete'],
    columns: [
      'id', 'created_at', 'updated_at', 'email', 'source', 'short_id', 'data->>user_id', 'data->>payment_transaction_id',
      'data->>trx_id', 'data->>payment_status', 'data->>is_paid', 'data->>payment_method',
      'data->>platform', 'data->>customer', 'data->>name', 'data->>phone', 'data->>address',
      'data->>order', 'data->>status', 'data->>invoice_number', 'data->>total', 'data->>price'
    ],
    writable: ['email', 'source', 'data']
  },
  user_api_keys: {
    actions: ['select', 'insert', 'delete'],
    columns: ['id', 'user_id', 'name', 'created_at', 'updated_at'],
    writable: ['user_id', 'key_value', 'name']
  },
  chat_history: {
    actions: ['select'],
    columns: ['id', 'agent_id', 'user_external_id', 'role', 'created_at'],
    writable: []
  }
}

const FILTER_TYPES = new Set(['eq', 'neq', 'in', 'gte', 'lte', 'gt', 'lt', 'is', 'not', 'ilike', 'or'])
const SIMPLE_IDENTIFIER = /^[a-z_][a-z0-9_]*(?:->>[a-z_][a-z0-9_]*)?$/i

function validateColumn(rule: TableRule, column: unknown) {
  const value = String(column || '')
  if (!SIMPLE_IDENTIFIER.test(value) || !rule.columns.includes(value)) {
    throw createError({ statusCode: 400, statusMessage: `Query column '${value}' is not allowed.` })
  }
  return value
}

function validateOrFilter(rule: TableRule, value: unknown) {
  const input = String(value || '')
  if (input.length > 1000) throw createError({ statusCode: 400, statusMessage: 'Search filter is too long.' })
  for (const part of input.split(',').map(item => item.trim()).filter(Boolean)) {
    const isNullMatch = part.match(/^([^.]+)\.(not\.is\.null|is\.not\.null|is\.null)$/i)
    if (isNullMatch) {
      validateColumn(rule, isNullMatch[1])
      continue
    }
    const match = part.match(/^([^.]+)\.(eq|neq|ilike|like|gt|gte|lt|lte)\.(.*)$/i)
    if (!match) throw createError({ statusCode: 400, statusMessage: 'Search filter is invalid.' })
    validateColumn(rule, match[1])
  }
}

function validateFilters(rule: TableRule, input: unknown) {
  const filters = Array.isArray(input) ? input.map(item => ({ ...item })) : []
  if (filters.length > 20) throw createError({ statusCode: 400, statusMessage: 'Too many query filters.' })
  for (const filter of filters) {
    if (!FILTER_TYPES.has(filter.type)) throw createError({ statusCode: 400, statusMessage: 'Query filter is not allowed.' })
    if (filter.type === 'or') validateOrFilter(rule, filter.value)
    else {
      validateColumn(rule, filter.column)
      const inValues = filter.values || filter.value
      if (filter.type === 'in' && (!Array.isArray(inValues) || inValues.length > 100)) {
        throw createError({ statusCode: 400, statusMessage: 'IN filter values are invalid.' })
      }
      if (filter.type === 'is' && filter.value !== null && typeof filter.value !== 'boolean') {
        throw createError({ statusCode: 400, statusMessage: 'IS filters only support null or boolean values.' })
      }
      if (filter.type === 'not' && !(
        (filter.op === 'is' && (filter.value === null || typeof filter.value === 'boolean'))
        || filter.op === 'eq'
      )) {
        throw createError({ statusCode: 400, statusMessage: 'NOT filter is invalid.' })
      }
    }
  }
  return filters
}

function validateWrite(rule: TableRule, input: unknown) {
  const items = Array.isArray(input) ? input : [input]
  if (items.length > 100) throw createError({ statusCode: 400, statusMessage: 'Too many records in one request.' })
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw createError({ statusCode: 400, statusMessage: 'Write payload is invalid.' })
    }
    for (const key of Object.keys(item)) {
      if (!rule.writable.includes(key)) {
        throw createError({ statusCode: 400, statusMessage: `Field '${key}' cannot be written through this endpoint.` })
      }
    }
  }
  return input
}

function replaceOwnershipFilter(filters: any[], column: string, userId: string) {
  const safe = filters.filter(filter => filter.column !== column)
  safe.push({ type: 'eq', column, value: userId })
  return safe
}

function sanitizeResult(table: string, result: any) {
  const clean = (row: any) => {
    if (!row || typeof row !== 'object') return row
    const copy = { ...row }
    if (table === 'agent_configs') delete copy.encrypted_token
    return copy
  }
  if (Array.isArray(result.data)) result.data = result.data.map(clean)
  else result.data = clean(result.data)
  return result
}

export default defineEventHandler(async (event) => {
  const user = await requireDashboardUser(event)
  const body = await readBody(event)
  const table = String(body?.table || '')
  const action = String(body?.action || '')
  const rule = TABLE_RULES[table]

  if (!rule || !rule.actions.includes(action)) {
    throw createError({ statusCode: 403, statusMessage: 'This database operation is not exposed to the dashboard.' })
  }

  let filters = validateFilters(rule, body?.filters)
  let queryData = body?.queryData
  if (action !== 'select' && action !== 'delete') queryData = validateWrite(rule, queryData)

  if (body?.orderVal) validateColumn(rule, body.orderVal.column)
  const limitVal = Math.min(Math.max(Number(body?.limitVal || 0), 0), 100) || null
  const rangeVal = body?.rangeVal ? {
    from: Math.max(Number(body.rangeVal.from || 0), 0),
    to: Math.min(Math.max(Number(body.rangeVal.to || 0), 0), 9999)
  } : null
  if (rangeVal && rangeVal.to - rangeVal.from > 99) rangeVal.to = rangeVal.from + 99

  if (table === 'agent_configs') {
    filters = replaceOwnershipFilter(filters, 'user_id', user.id)
  } else if (table === 'leads') {
    filters = replaceOwnershipFilter(filters, 'data->>user_id', user.id)
    if (action === 'insert' || action === 'update') {
      const attachOwner = (item: any) => ({ ...item, data: { ...(item.data || {}), user_id: user.id } })
      queryData = Array.isArray(queryData) ? queryData.map(attachOwner) : attachOwner(queryData)
    }
  } else if (table === 'user_api_keys') {
    filters = replaceOwnershipFilter(filters, 'user_id', user.id)
    if (action === 'insert') {
      const attachOwner = (item: any) => ({ ...item, user_id: user.id })
      queryData = Array.isArray(queryData) ? queryData.map(attachOwner) : attachOwner(queryData)
    }
  } else if (table === 'chat_history') {
    const ownedAgents = await queryPg('SELECT id FROM public.agent_configs WHERE user_id = $1', [user.id])
    const ids = ownedAgents.rows.map(row => String(row.id))
    filters = filters.filter(filter => filter.column !== 'agent_id')
    filters.push({ type: 'in', column: 'agent_id', values: ids.length ? ids : ['00000000-0000-0000-0000-000000000000'] })
  }

  try {
    const result = await executeQuery({
      table,
      action,
      queryData,
      filters,
      orderVal: body?.orderVal,
      limitVal,
      rangeVal,
      singleVal: Boolean(body?.singleVal),
      maybeSingleVal: Boolean(body?.maybeSingleVal),
      countOption: body?.countOption === 'exact' ? 'exact' : null,
      onConflictVal: null
    })
    if (result.error) throw createError({ statusCode: 400, statusMessage: String(result.error.message || result.error) })
    return sanitizeResult(table, {
      data: result.data,
      error: null,
      count: result.count ?? (Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0)
    })
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('[DASHBOARD DB QUERY]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Database operation failed.' })
  }
})
