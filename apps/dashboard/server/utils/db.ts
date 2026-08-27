import pg from 'pg'
import { MongoClient } from 'mongodb'

function databaseUrl(name: 'DATABASE_URL' | 'MONGODB_URL', developmentFallback: string) {
  const configured = process.env[name]
  if (configured) return configured
  if (process.env.NODE_ENV === 'production') throw new Error(`${name} is required in production.`)
  return developmentFallback
}

const POSTGRES_URL = databaseUrl('DATABASE_URL', 'postgresql://postgres@localhost:5432/clickify_mate')
const MONGODB_URL = databaseUrl('MONGODB_URL', 'mongodb://localhost:27017/clickify_mate')

// Extend global namespace to cache pools in development HMR
declare global {
  var __pgPool: pg.Pool | undefined
  var __mongoClient: MongoClient | undefined
}

// Initialize PostgreSQL Connection Pool
if (!globalThis.__pgPool) {
  globalThis.__pgPool = new pg.Pool({
    connectionString: POSTGRES_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
}
const pool = globalThis.__pgPool!

export async function queryPg(text: string, params?: any[]) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  return res
}

export async function withPgTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Initialize MongoDB Client
if (!globalThis.__mongoClient) {
  globalThis.__mongoClient = new MongoClient(MONGODB_URL, {
    maxPoolSize: 20,
    minPoolSize: 5,
  })
}
const mongoClient = globalThis.__mongoClient!
let isMongoConnected = false

export async function getMongo() {
  if (!isMongoConnected) {
    await mongoClient.connect()
    isMongoConnected = true
  }
  const db = mongoClient.db()
  return { db, client: mongoClient }
}
