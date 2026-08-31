import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

let dbInstance: Firestore | null = null
let cachedOAuthToken: string | null = null
let tokenExpiresAt = 0
let clockSkewSec = 0

// ---------------- SERVICE ACCOUNT RESOLVER ----------------

function getServiceAccount(): any | null {
  const candidatePaths = [
    path.resolve(process.cwd(), 'clickify-mate-ai-firebase-adminsdk-fbsvc-54dff48873.json'),
    path.resolve(process.cwd(), 'apps', 'dashboard', 'clickify-mate-ai-firebase-adminsdk-fbsvc-54dff48873.json'),
    path.resolve(process.cwd(), '..', 'clickify-mate-ai-firebase-adminsdk-fbsvc-54dff48873.json'),
    path.resolve(process.cwd(), '..', 'apps', 'dashboard', 'clickify-mate-ai-firebase-adminsdk-fbsvc-54dff48873.json')
  ]

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8')
        return JSON.parse(raw)
      } catch { /* try next */ }
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    } catch { /* ignore */ }
  }

  return null
}

// ---------------- CLOCK-SKEW COMPENSATED OAUTH TOKEN ----------------

async function getSkewCompensatedOAuthToken(): Promise<string | null> {
  if (cachedOAuthToken && Date.now() < tokenExpiresAt) {
    return cachedOAuthToken
  }

  const sa = getServiceAccount()
  if (!sa || !sa.private_key || !sa.client_email) {
    return null
  }

  // Detect time skew between local machine and Google servers
  try {
    const googleRes = await fetch('https://www.google.com')
    const dateHeader = googleRes.headers.get('date')
    if (dateHeader) {
      const googleDate = new Date(dateHeader)
      clockSkewSec = Math.floor((Date.now() - googleDate.getTime()) / 1000)
    }
  } catch {
    // If google.com check fails, default to existing skew or 0
  }

  const nowSec = Math.floor(Date.now() / 1000) - clockSkewSec
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const claimSet = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
    exp: nowSec + 3600,
    iat: nowSec - 10
  })).toString('base64url')

  const sign = crypto.createSign('RSA-SHA256')
  sign.update(`${header}.${claimSet}`)
  const signature = sign.sign(sa.private_key, 'base64url')
  const jwt = `${header}.${claimSet}.${signature}`

  try {
    const res = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })
    const data: any = await res.json()
    if (data.access_token) {
      cachedOAuthToken = data.access_token
      tokenExpiresAt = Date.now() + 3000 * 1000 // Cache for 50 min
      return cachedOAuthToken
    }
    console.error('⚠️ [Firebase Auth] OAuth error:', data)
  } catch (err: any) {
    console.error('⚠️ [Firebase Auth] Token fetch failed:', err.message)
  }

  return null
}

// ---------------- REST HELPERS (FALLBACK FOR CLOCK DRIFT) ----------------

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) fields[key] = { nullValue: null }
    else if (typeof val === 'boolean') fields[key] = { booleanValue: val }
    else if (typeof val === 'number') {
      if (Number.isInteger(val)) fields[key] = { integerValue: String(val) }
      else fields[key] = { doubleValue: val }
    }
    else if (typeof val === 'string') fields[key] = { stringValue: val }
    else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(v => {
            if (typeof v === 'object' && v !== null) return { stringValue: JSON.stringify(v) }
            return { stringValue: String(v) }
          })
        }
      }
    }
    else if (typeof val === 'object') fields[key] = { stringValue: JSON.stringify(val) }
  }
  return fields
}

function fromFirestoreDoc(doc: any): any {
  if (!doc || !doc.fields) return null
  const out: Record<string, any> = {}
  for (const [key, val] of Object.entries<any>(doc.fields)) {
    if (val.stringValue !== undefined) {
      try {
        if (val.stringValue.startsWith('{') || val.stringValue.startsWith('[')) {
          out[key] = JSON.parse(val.stringValue)
        } else {
          out[key] = val.stringValue
        }
      } catch {
        out[key] = val.stringValue
      }
    }
    else if (val.integerValue !== undefined) out[key] = parseInt(val.integerValue, 10)
    else if (val.doubleValue !== undefined) out[key] = val.doubleValue
    else if (val.booleanValue !== undefined) out[key] = val.booleanValue
    else if (val.nullValue !== undefined) out[key] = null
    else if (val.arrayValue?.values) {
      out[key] = val.arrayValue.values.map((v: any) => {
        const s = v.stringValue ?? (typeof v === 'object' ? v : String(v))
        if (typeof s === 'string' && (s.startsWith('{') || s.startsWith('['))) {
          try { return JSON.parse(s) } catch { return s }
        }
        return s
      })
    }
  }
  return out
}

async function restSetDoc(collection: string, docId: string, data: Record<string, any>): Promise<boolean> {
  const token = await getSkewCompensatedOAuthToken()
  const sa = getServiceAccount()
  if (!token || !sa) return false

  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}/${encodeURIComponent(docId)}`
  const fields = toFirestoreFields(data)

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  })
  const resData: any = await res.json()
  return Boolean(resData.name)
}

async function restGetDoc(collection: string, docId: string): Promise<any | null> {
  const token = await getSkewCompensatedOAuthToken()
  const sa = getServiceAccount()
  if (!token || !sa) return null

  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}/${encodeURIComponent(docId)}`
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.status === 404) return null
  const data: any = await res.json()
  const parsed = fromFirestoreDoc(data)
  if (parsed) parsed.id = docId
  return parsed
}

async function restListDocs(collection: string): Promise<any[]> {
  const token = await getSkewCompensatedOAuthToken()
  const sa = getServiceAccount()
  if (!token || !sa) return []

  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}?pageSize=100`
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.status === 404) return []
  const data: any = await res.json()
  if (!data.documents || !Array.isArray(data.documents)) return []

  return data.documents.map((d: any) => {
    const docId = d.name ? d.name.split('/').pop() : ''
    const parsed = fromFirestoreDoc(d) || {}
    parsed.id = docId
    return parsed
  })
}

async function restDeleteDoc(collection: string, docId: string): Promise<boolean> {
  const token = await getSkewCompensatedOAuthToken()
  const sa = getServiceAccount()
  if (!token || !sa) return false

  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}/${encodeURIComponent(docId)}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return res.ok || res.status === 404
}

// ---------------- FIRESTORE ADMIN SDK INITIALIZER ----------------

export function getFirestoreDb(): Firestore | null {
  if (dbInstance) return dbInstance

  try {
    const apps = getApps()
    if (apps.length > 0) {
      dbInstance = getFirestore()
      return dbInstance
    }

    const serviceAccount = getServiceAccount()
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || 'clickify-mate-ai'
      })
      dbInstance = getFirestore()
      console.log('🔥 [Firebase] Successfully initialized Firebase Admin & Firestore')
      return dbInstance
    }
  } catch (err: any) {
    console.warn('⚠️ [Firebase] Could not initialize Firebase Admin SDK:', err.message)
  }

  return null
}

// ---------------- BLOGS CRUD ----------------

export async function saveBlogToFirestore(blog: any): Promise<boolean> {
  const docId = blog.slug || blog.id || `post-${Date.now()}`
  const payload = {
    id: docId,
    ...blog,
    updated_at: new Date().toISOString()
  }

  try {
    const db = getFirestoreDb()
    if (db) {
      await db.collection('blogs').doc(docId).set(payload, { merge: true })
      return true
    }
  } catch { /* try REST */ }

  return restSetDoc('blogs', docId, payload)
}

export async function getBlogsFromFirestore(): Promise<any[]> {
  try {
    const db = getFirestoreDb()
    if (db) {
      const snapshot = await db.collection('blogs').orderBy('created_at', 'desc').get()
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    }
  } catch { /* try REST */ }

  const list = await restListDocs('blogs')
  list.sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0
    const db = b.created_at ? new Date(b.created_at).getTime() : 0
    return db - da
  })
  return list
}

export async function getBlogBySlugFromFirestore(slug: string): Promise<any | null> {
  if (!slug) return null
  try {
    const db = getFirestoreDb()
    if (db) {
      const doc = await db.collection('blogs').doc(slug).get()
      if (doc.exists) return { id: doc.id, ...doc.data() }
    }
  } catch { /* try REST */ }

  return restGetDoc('blogs', slug)
}

export async function deleteBlogFromFirestore(docIdOrSlug: string): Promise<boolean> {
  if (!docIdOrSlug) return false
  try {
    const db = getFirestoreDb()
    if (db) {
      await db.collection('blogs').doc(docIdOrSlug).delete()
      return true
    }
  } catch { /* try REST */ }

  return restDeleteDoc('blogs', docIdOrSlug)
}

// ---------------- CONTACT INQUIRIES CRUD ----------------

export async function saveContactInquiryToFirestore(inquiry: any): Promise<boolean> {
  const docId = `inq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const payload = {
    ...inquiry,
    created_at: new Date().toISOString()
  }

  try {
    const db = getFirestoreDb()
    if (db) {
      const docRef = await db.collection('contact_inquiries').add(payload)
      return Boolean(docRef.id)
    }
  } catch { /* try REST */ }

  return restSetDoc('contact_inquiries', docId, payload)
}

export async function getContactInquiriesFromFirestore(): Promise<any[]> {
  try {
    const db = getFirestoreDb()
    if (db) {
      const snapshot = await db.collection('contact_inquiries').orderBy('created_at', 'desc').get()
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    }
  } catch { /* try REST */ }

  const list = await restListDocs('contact_inquiries')
  list.sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0
    const db = b.created_at ? new Date(b.created_at).getTime() : 0
    return db - da
  })
  return list
}

export async function deleteContactInquiryFromFirestore(id: string): Promise<boolean> {
  if (!id) return false
  try {
    const db = getFirestoreDb()
    if (db) {
      await db.collection('contact_inquiries').doc(id).delete()
      return true
    }
  } catch { /* try REST */ }

  return restDeleteDoc('contact_inquiries', id)
}

// ---------------- AUTHOR PROFILE CRUD ----------------

export async function saveAuthorProfileToFirestore(profile: {
  author_name: string
  author_role: string
  author_photo: string
}): Promise<boolean> {
  const payload = {
    ...profile,
    updated_at: new Date().toISOString()
  }

  try {
    const db = getFirestoreDb()
    if (db) {
      await db.collection('admin_profiles').doc('default_author').set(payload, { merge: true })
      return true
    }
  } catch { /* try REST */ }

  return restSetDoc('admin_profiles', 'default_author', payload)
}

export async function getAuthorProfileFromFirestore(): Promise<{
  author_name: string
  author_role: string
  author_photo: string
} | null> {
  try {
    const db = getFirestoreDb()
    if (db) {
      const doc = await db.collection('admin_profiles').doc('default_author').get()
      if (doc.exists) {
        const data = doc.data() as any
        return {
          author_name: data.author_name || '',
          author_role: data.author_role || '',
          author_photo: data.author_photo || ''
        }
      }
    }
  } catch { /* try REST */ }

  const doc = await restGetDoc('admin_profiles', 'default_author')
  if (doc) {
    return {
      author_name: doc.author_name || '',
      author_role: doc.author_role || '',
      author_photo: doc.author_photo || ''
    }
  }
  return null
}

// ---------------- BLOG DAILY SCHEDULER CONFIG ----------------

export interface BlogScheduleConfig {
  enabled: boolean
  blogsPerDay: number   // 1-20
  runHour: number       // 0-23 (UTC hour to trigger)
  last_run_date: string // YYYY-MM-DD of the last batch executed
  updated_at?: string
}

const SCHEDULER_DEFAULT: BlogScheduleConfig = {
  enabled: false,
  blogsPerDay: 1,
  runHour: 9,
  last_run_date: ''
}

export async function saveBlogScheduleToFirestore(config: Partial<BlogScheduleConfig>): Promise<boolean> {
  const payload = {
    ...config,
    updated_at: new Date().toISOString()
  }

  try {
    const db = getFirestoreDb()
    if (db) {
      await db.collection('scheduler').doc('blog_daily').set(payload, { merge: true })
      return true
    }
  } catch { /* try REST */ }

  return restSetDoc('scheduler', 'blog_daily', payload)
}

export async function getBlogScheduleFromFirestore(): Promise<BlogScheduleConfig> {
  try {
    const db = getFirestoreDb()
    if (db) {
      const doc = await db.collection('scheduler').doc('blog_daily').get()
      if (doc.exists) {
        return { ...SCHEDULER_DEFAULT, ...(doc.data() as any) }
      }
    }
  } catch { /* try REST */ }

  const doc = await restGetDoc('scheduler', 'blog_daily')
  if (doc) {
    return { ...SCHEDULER_DEFAULT, ...doc }
  }
  return { ...SCHEDULER_DEFAULT }
}

// ---------------- ANALYTICS ROLLUPS (FIREBASE FIRESTORE: 1Y / 2Y TIME-SERIES) ----------------

export async function saveAnalyticsDailyRollup(dateStr: string, rollupData: Record<string, any>): Promise<boolean> {
  const payload = {
    ...rollupData,
    date: dateStr,
    updated_at: new Date().toISOString()
  }
  try {
    const db = getFirestoreDb()
    if (db) {
      await db.collection('analytics_daily').doc(dateStr).set(payload, { merge: true })
      return true
    }
  } catch { /* try REST */ }

  return restSetDoc('analytics_daily', dateStr, payload)
}

export async function getAnalyticsDailyRollups(): Promise<any[]> {
  try {
    const db = getFirestoreDb()
    if (db) {
      const snap = await db.collection('analytics_daily').orderBy('date', 'desc').limit(90).get()
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }
  } catch { /* try REST */ }

  return restListDocs('analytics_daily')
}

export async function saveAnalyticsMonthlyRollup(monthStr: string, rollupData: Record<string, any>): Promise<boolean> {
  const payload = {
    ...rollupData,
    month: monthStr,
    updated_at: new Date().toISOString()
  }
  try {
    const db = getFirestoreDb()
    if (db) {
      await db.collection('analytics_monthly').doc(monthStr).set(payload, { merge: true })
      return true
    }
  } catch { /* try REST */ }

  return restSetDoc('analytics_monthly', monthStr, payload)
}

export async function getAnalyticsMonthlyRollups(): Promise<any[]> {
  try {
    const db = getFirestoreDb()
    if (db) {
      const snap = await db.collection('analytics_monthly').orderBy('month', 'desc').limit(24).get()
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }
  } catch { /* try REST */ }

  return restListDocs('analytics_monthly')
}

// ---------------- USER FEEDBACK & ISSUES (STORED IN FIREBASE FIRESTORE) ----------------

export async function saveUserFeedbackToFirestore(feedbackData: Record<string, any>): Promise<any> {
  const docId = feedbackData.id || `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const payload = {
    ...feedbackData,
    id: docId,
    status: feedbackData.status || 'open',
    created_at: feedbackData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  try {
    const db = getFirestoreDb()
    if (db) {
      await db.collection('user_feedback').doc(docId).set(payload, { merge: true })
      return { success: true, id: docId, data: payload }
    }
  } catch {
    // Graceful fallback to REST engine
  }

  const saved = await restSetDoc('user_feedback', docId, payload)
  return { success: saved, id: docId, data: payload }
}

export async function deleteUserFeedbackFromFirestore(docId: string): Promise<boolean> {
  try {
    const db = getFirestoreDb()
    if (db) {
      await db.collection('user_feedback').doc(docId).delete()
      return true
    }
  } catch {
    // Graceful fallback to REST engine
  }

  return restDeleteDoc('user_feedback', docId)
}

export async function getUserFeedbackListFromFirestore(userEmail?: string): Promise<any[]> {
  try {
    const db = getFirestoreDb()
    if (db) {
      let query: any = db.collection('user_feedback').orderBy('created_at', 'desc').limit(100)
      if (userEmail) {
        query = query.where('user_email', '==', userEmail)
      }
      const snap = await query.get()
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    }
  } catch {
    // Graceful fallback to REST engine
  }

  const all = await restListDocs('user_feedback')
  if (userEmail) {
    return all.filter(item => item.user_email === userEmail)
  }
  return all
}
