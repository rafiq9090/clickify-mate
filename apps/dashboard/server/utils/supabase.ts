import { queryPg, getMongo } from './db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-in-prod-9988'

export const useSupabaseAdmin = () => {
  return {
    auth: {
      getUser: async (token?: string) => {
        if (!token) {
          return { data: { user: null }, error: new Error('No token provided') }
        }
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any
          return { data: { user: { id: decoded.id, email: decoded.email } }, error: null }
        } catch (e: any) {
          return { data: { user: null }, error: e }
        }
      }
    },
    from: (table: string): any => {
      let action = 'select'
      let queryData: any = null
      let filters: any[] = []
      let orderVal: any = null
      let limitVal: number | null = null
      let rangeVal: { from: number; to: number } | null = null
      let singleVal = false
      let maybeSingleVal = false
      let countOption: string | null = null
      let onConflictVal: string | null = null

      const builder = {
        select: (fields = '*', options?: { count?: string }) => {
          if (action === 'select') {
            action = 'select'
          }
          if (options?.count) {
            countOption = options.count
          }
          return builder
        },
        insert: (data: any) => {
          action = 'insert'
          queryData = data
          return builder
        },
        update: (data: any) => {
          action = 'update'
          queryData = data
          return builder
        },
        upsert: (data: any, options?: { onConflict?: string }) => {
          action = 'upsert'
          queryData = data
          if (options?.onConflict) {
            onConflictVal = options.onConflict
          }
          return builder
        },
        delete: () => {
          action = 'delete'
          return builder
        },
        eq: (column: string, value: any) => {
          filters.push({ type: 'eq', column, value })
          return builder
        },
        neq: (column: string, value: any) => {
          filters.push({ type: 'neq', column, value })
          return builder
        },
        in: (column: string, values: any[]) => {
          filters.push({ type: 'in', column, values })
          return builder
        },
        gte: (column: string, value: any) => {
          filters.push({ type: 'gte', column, value })
          return builder
        },
        lte: (column: string, value: any) => {
          filters.push({ type: 'lte', column, value })
          return builder
        },
        gt: (column: string, value: any) => {
          filters.push({ type: 'gt', column, value })
          return builder
        },
        lt: (column: string, value: any) => {
          filters.push({ type: 'lt', column, value })
          return builder
        },
        is: (column: string, value: any) => {
          filters.push({ type: 'is', column, value })
          return builder
        },
        not: (column: string, op: string, value: any) => {
          filters.push({ type: 'not', column, op, value })
          return builder
        },
        filter: (column: string, op: string, value: any) => {
          if (op === 'eq') filters.push({ type: 'eq', column, value })
          else if (op === 'neq') filters.push({ type: 'neq', column, value })
          else if (op === 'is') filters.push({ type: 'is', column, value })
          else if (op === 'in') filters.push({ type: 'in', column, values: value })
          else filters.push({ type: op, column, value })
          return builder
        },
        or: (filterString: string) => {
          filters.push({ type: 'or', value: filterString })
          return builder
        },
        ilike: (column: string, value: any) => {
          filters.push({ type: 'ilike', column, value })
          return builder
        },
        range: (from: number, to: number) => {
          rangeVal = { from, to }
          return builder
        },
        order: (column: string, options?: { ascending?: boolean }) => {
          orderVal = { column, ascending: options?.ascending !== false }
          return builder
        },
        limit: (value: number) => {
          limitVal = value
          return builder
        },
        single: () => {
          singleVal = true
          return builder
        },
        maybeSingle: () => {
          maybeSingleVal = true
          return builder
        },
        then: async (onFulfilled?: any, onRejected?: any) => {
          try {
            const res = await executeQuery({
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
            if (onFulfilled) return onFulfilled(res)
            return res
          } catch (err: any) {
            const formattedErr = { data: null, error: err.message || err, count: 0 }
            if (onRejected) return onRejected(formattedErr)
            return formattedErr
          }
        }
      }
      return builder
    }
  }
}

function formatColumnExpr(col: string): string {
  if (!col) return '""'
  if (col.includes('->>')) {
    const parts = col.split('->>')
    return `("${parts[0].trim()}"->>'${parts[1].trim()}')`
  }
  if (col.includes('->')) {
    const parts = col.split('->')
    return `("${parts[0].trim()}"->'${parts[1].trim()}')`
  }
  return `"${col}"`
}

// Global executor mapping queries to PostgreSQL or MongoDB
export async function executeQuery(query: {
  table: string
  action: string
  queryData?: any
  filters: any[]
  orderVal?: any
  limitVal?: number | null
  rangeVal?: { from: number; to: number } | null
  singleVal?: boolean
  maybeSingleVal?: boolean
  countOption?: string | null
  onConflictVal?: string | null
}) {
  const { table, action, queryData, filters, orderVal, limitVal, rangeVal, singleVal, maybeSingleVal, countOption, onConflictVal } = query

  // Route chat_history to MongoDB
  if (table === 'chat_history') {
    const { db } = await getMongo()
    const collection = db.collection('chat_history')

    // Translate filters to MongoDB query object
    const mongoQuery: any = {}
    for (const f of filters) {
      if (f.type === 'eq') {
        mongoQuery[f.column] = f.value
      } else if (f.type === 'in') {
        mongoQuery[f.column] = { $in: f.values || f.value }
      } else if (f.type === 'gte') {
        mongoQuery[f.column] = { $gte: f.value }
      } else if (f.type === 'lt') {
        mongoQuery[f.column] = { $lt: f.value }
      }
    }

    if (action === 'select') {
      let cursor = collection.find(mongoQuery)
      if (orderVal) {
        cursor = cursor.sort({ [orderVal.column]: orderVal.ascending ? 1 : -1 })
      }
      if (rangeVal) {
        cursor = cursor.skip(rangeVal.from).limit(rangeVal.to - rangeVal.from + 1)
      } else if (limitVal) {
        cursor = cursor.limit(limitVal)
      }
      const data = await cursor.toArray()
      const mappedData = data.map(item => ({
        ...item,
        id: item._id.toString()
      }))

      if (singleVal || maybeSingleVal) {
        return { data: mappedData[0] || null, error: null }
      }
      return { data: mappedData, error: null }
    }

    if (action === 'insert') {
      const docs = Array.isArray(queryData) ? queryData : [queryData]
      const docsToInsert = docs.map(d => ({
        created_at: new Date(),
        ...d
      }))
      const res = await collection.insertMany(docsToInsert)
      const inserted = docsToInsert.map((d, index) => ({
        ...d,
        id: res.insertedIds[index]?.toString()
      }))
      return { data: Array.isArray(queryData) ? inserted : inserted[0], error: null }
    }

    if (action === 'update') {
      await collection.updateMany(mongoQuery, { $set: queryData })
      return { data: queryData, error: null }
    }

    if (action === 'delete') {
      await collection.deleteMany(mongoQuery)
      return { data: null, error: null }
    }

    if (action === 'upsert') {
      const docs = Array.isArray(queryData) ? queryData : [queryData]
      for (const doc of docs) {
        const idFilter = doc.id ? { _id: doc.id } : mongoQuery
        await collection.updateOne(idFilter, { $set: doc }, { upsert: true })
      }
      return { data: queryData, error: null }
    }

    return { data: null, error: new Error(`Unsupported MongoDB action: ${action}`) }
  }

  // Route all other tables to PostgreSQL
  let sql = ''
  let values: any[] = []
  let paramIndex = 1

  const buildWhereClause = () => {
    if (!filters || filters.length === 0) return ''
    const clauses: string[] = []
    for (const f of filters) {
      const colExpr = f.column ? formatColumnExpr(f.column) : ''
      if (f.type === 'eq') {
        clauses.push(`${colExpr} = $${paramIndex++}`)
        values.push(f.value)
      } else if (f.type === 'neq') {
        clauses.push(`${colExpr} != $${paramIndex++}`)
        values.push(f.value)
      } else if (f.type === 'in') {
        clauses.push(`${colExpr} = ANY($${paramIndex++})`)
        values.push(f.values || f.value)
      } else if (f.type === 'gte') {
        clauses.push(`${colExpr} >= $${paramIndex++}`)
        values.push(f.value)
      } else if (f.type === 'lte') {
        clauses.push(`${colExpr} <= $${paramIndex++}`)
        values.push(f.value)
      } else if (f.type === 'gt') {
        clauses.push(`${colExpr} > $${paramIndex++}`)
        values.push(f.value)
      } else if (f.type === 'lt') {
        clauses.push(`${colExpr} < $${paramIndex++}`)
        values.push(f.value)
      } else if (f.type === 'is') {
        if (f.value === null) {
          clauses.push(`${colExpr} IS NULL`)
        } else {
          clauses.push(`${colExpr} IS ${f.value}`)
        }
      } else if (f.type === 'not') {
        if (f.op === 'is' && f.value === null) {
          clauses.push(`${colExpr} IS NOT NULL`)
        } else if (f.op === 'eq') {
          clauses.push(`${colExpr} != $${paramIndex++}`)
          values.push(f.value)
        }
      } else if (f.type === 'ilike') {
        clauses.push(`${colExpr} ILIKE $${paramIndex++}`)
        values.push(f.value)
      } else if (f.type === 'or') {
        const orParts = (f.value || '').split(',').map((p: string) => p.trim()).filter(Boolean)
        const orClauses: string[] = []
        for (const part of orParts) {
          const match = part.match(/^([^.]+)\.(eq|neq|ilike|like)\.(.*)$/)
          if (match) {
            const cExpr = formatColumnExpr(match[1])
            const op = match[2].toUpperCase()
            orClauses.push(`${cExpr} ${op} $${paramIndex++}`)
            values.push(match[3])
          }
        }
        if (orClauses.length > 0) {
          clauses.push(`(${orClauses.join(' OR ')})`)
        }
      }
    }
    return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
  }

  if (action === 'select') {
    const where = buildWhereClause()
    let orderBy = ''
    if (orderVal) {
      orderBy = `ORDER BY ${formatColumnExpr(orderVal.column)} ${orderVal.ascending ? 'ASC' : 'DESC'}`
    }
    let limitStr = ''
    if (rangeVal) {
      const offset = rangeVal.from || 0
      const limit = rangeVal.to - rangeVal.from + 1
      limitStr = `LIMIT ${limit} OFFSET ${offset}`
    } else if (limitVal) {
      limitStr = `LIMIT ${limitVal}`
    }

    sql = `SELECT * FROM public."${table}" ${where} ${orderBy} ${limitStr}`
    const dbRes = await queryPg(sql, values)
    const rows = dbRes.rows

    let totalCount = rows.length
    if (countOption === 'exact') {
      try {
        const countSql = `SELECT COUNT(*) as count FROM public."${table}" ${where}`
        const countRes = await queryPg(countSql, values.slice(0, paramIndex - 1))
        totalCount = parseInt(countRes.rows[0]?.count || '0', 10)
      } catch (countErr) {
        console.warn('[DB COUNT WARN]:', countErr)
      }
    }

    if (singleVal) {
      if (rows.length === 0) {
        throw new Error('No rows found')
      }
      return { data: rows[0], error: null, count: 1 }
    }
    if (maybeSingleVal) {
      return { data: rows[0] || null, error: null, count: rows.length ? 1 : 0 }
    }
    return { data: rows, error: null, count: totalCount }
  }

  if (action === 'insert') {
    const isArray = Array.isArray(queryData)
    const items = isArray ? queryData : [queryData]
    if (items.length === 0) {
      return { data: isArray ? [] : null, error: null }
    }

    const columns = Object.keys(items[0]).filter(k => k !== 'id')
    const valueClauses: string[] = []

    for (const item of items) {
      const itemParams: string[] = []
      for (const col of columns) {
        itemParams.push(`$${paramIndex++}`)
        values.push(item[col])
      }
      valueClauses.push(`(${itemParams.join(', ')})`)
    }

    sql = `INSERT INTO public."${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${valueClauses.join(', ')} RETURNING *`
    const dbRes = await queryPg(sql, values)
    return { data: isArray ? dbRes.rows : dbRes.rows[0], error: null }
  }

  if (action === 'update') {
    const columns = Object.keys(queryData)
    const setClauses: string[] = []
    for (const col of columns) {
      setClauses.push(`"${col}" = $${paramIndex++}`)
      values.push(queryData[col])
    }

    const where = buildWhereClause()
    sql = `UPDATE public."${table}" SET ${setClauses.join(', ')} ${where} RETURNING *`
    const dbRes = await queryPg(sql, values)
    if (singleVal) {
      if (dbRes.rows.length === 0) throw new Error('No rows found')
      return { data: dbRes.rows[0], error: null }
    }
    if (maybeSingleVal) {
      return { data: dbRes.rows[0] || null, error: null }
    }
    return { data: dbRes.rows, error: null }
  }

  if (action === 'delete') {
    const where = buildWhereClause()
    sql = `DELETE FROM public."${table}" ${where} RETURNING *`
    const dbRes = await queryPg(sql, values)
    if (singleVal) {
      if (dbRes.rows.length === 0) throw new Error('No rows found')
      return { data: dbRes.rows[0], error: null }
    }
    if (maybeSingleVal) {
      return { data: dbRes.rows[0] || null, error: null }
    }
    return { data: dbRes.rows, error: null }
  }

  if (action === 'upsert') {
    const isArray = Array.isArray(queryData)
    const items = isArray ? queryData : [queryData]
    if (items.length === 0) {
      return { data: isArray ? [] : null, error: null }
    }

    const columns = Object.keys(items[0])
    const conflictCols = onConflictVal ? onConflictVal.split(',').map(c => c.trim()) : ['id']

    const valueClauses: string[] = []
    for (const item of items) {
      const itemParams: string[] = []
      for (const col of columns) {
        itemParams.push(`$${paramIndex++}`)
        values.push(item[col])
      }
      valueClauses.push(`(${itemParams.join(', ')})`)
    }

    const updateCols = columns.filter(c => !conflictCols.includes(c))
    const updateSet = updateCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')

    sql = `
      INSERT INTO public."${table}" (${columns.map(c => `"${c}"`).join(', ')})
      VALUES ${valueClauses.join(', ')}
      ON CONFLICT (${conflictCols.map(c => `"${c}"`).join(', ')})
      DO ${updateCols.length > 0 ? `UPDATE SET ${updateSet}` : 'NOTHING'}
      RETURNING *
    `
    const dbRes = await queryPg(sql, values)
    if (singleVal) {
      if (dbRes.rows.length === 0) throw new Error('No rows found')
      return { data: dbRes.rows[0], error: null }
    }
    if (maybeSingleVal) {
      return { data: dbRes.rows[0] || null, error: null }
    }
    return { data: isArray ? dbRes.rows : dbRes.rows[0], error: null }
  }

  return { data: null, error: new Error(`Unsupported Postgres action: ${action}`) }
}