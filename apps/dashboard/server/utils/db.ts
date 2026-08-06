import pg from 'pg'
import { MongoClient } from 'mongodb'

// Read database URLs from environment or use local Docker defaults
const POSTGRES_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/clickify_mate'
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:adminpassword@localhost:27017/clickify_mate?authSource=admin'

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
