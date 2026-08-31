import crypto from 'crypto'
import { clearSettingsCache } from '../../utils/settings'
import { requireAdminSession } from '../../utils/auth-session'
import { getBlogsFromFirestore, saveBlogToFirestore, deleteBlogFromFirestore } from '../../utils/firebase'

const COLLECTION_TABLES: Record<string, string> = {
  templates: 'templates',
  trends: 'trends',
  navigation: 'navigation',
  ads: 'ads',
  settings: 'settings'
}

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const query = getQuery(event)
  const action = query.action
  const supabase = useSupabaseAdmin()

  // Fetching all data
  if (action === 'get_all') {
    const results = await Promise.all([
      supabase.from('templates').select('*').order('id'),
      supabase.from('trends').select('*').order('id'),
      supabase.from('navigation').select('*').order('id'),
      supabase.from('ads').select('*').order('id'),
      getBlogsFromFirestore(), // EXCLUSIVELY FROM FIREBASE FIRESTORE
      supabase.from('settings').select('*').limit(1).maybeSingle()
    ])

    const [tRes, trRes, nRes, aRes, firestoreBlogs, sRes] = results

    // Redact sensitive keys from settings before returning
    const rawSettings = sRes.data || {}
    const sensitiveKeys = ['groq_api_key', 'nvidia_api_key', 'openai_api_key', 'deepseek_api_key', 'kimi_api_key', 'moonshot_api_key', 'gemini_api_key', 'tinyurl_api_token', 'supabase_service_role_key']
    const safeSettings = { ...rawSettings }
    for (const key of sensitiveKeys) {
      if (typeof safeSettings[key] === 'string' && safeSettings[key]) safeSettings[key] = '••••••••'
    }

    return {
      success: true,
      templates: tRes.data || [],
      trends: trRes.data || [],
      navigation: nRes.data || [],
      ads: aRes.data || [],
      blog: firestoreBlogs || [],
      settings: safeSettings
    }
  }

  // Updating whole collection (Saving)
  if (action === 'save_all') {
    const body = await readBody(event)
    const { collection, data } = body

    if (!collection || !Array.isArray(data) || data.length > 500) {
      throw createError({ statusCode: 400, statusMessage: 'Collection and data are required' })
    }

    // SPECIAL HANDLING: BLOGS STORED EXCLUSIVELY IN FIREBASE FIRESTORE
    if (collection === 'blog') {
      try {
        for (const blogItem of data) {
          await saveBlogToFirestore(blogItem)
        }
        return { success: true, count: data.length, target: 'firebase_firestore' }
      } catch (err: any) {
        console.error('[FIREBASE BLOG SAVE ERROR]:', err)
        throw createError({ statusCode: 500, statusMessage: `Failed to save blogs to Firebase: ${err.message}` })
      }
    }

    const table = COLLECTION_TABLES[collection]
    if (!table) throw createError({ statusCode: 400, statusMessage: 'Collection is not allowed' })

    // EXCEPTION: "settings" table uses a single row with GENERATED ALWAYS ID.
    let error;
    if (collection === 'settings' && data[0]) {
      const { id, created_at, ...sanitized } = data[0]
      const targetId = id || 1;
      const sensitiveKeys = ['groq_api_key', 'nvidia_api_key', 'openai_api_key', 'deepseek_api_key', 'kimi_api_key', 'moonshot_api_key', 'gemini_api_key', 'tinyurl_api_token', 'supabase_service_role_key']
      const { data: existing } = await supabase.from('settings').select('*').eq('id', targetId).maybeSingle()
      for (const key of sensitiveKeys) {
        const value = sanitized[key]
        if (typeof value === 'string' && value.startsWith('••••••••')) {
          if (existing?.[key]) sanitized[key] = existing[key]
          else delete sanitized[key]
        }
      }
      const result = await supabase.from('settings').upsert({ id: targetId, ...sanitized })
      clearSettingsCache()
      error = result.error
    } else {
      const sanitizedData = data.map((item: any) => {
        const { id, ...rest } = item;
        const finalId = (id && id !== 'null' && id !== '') ? id : crypto.randomUUID();
        return { id: finalId, ...rest };
      });

      const result = await supabase.from(table).upsert(sanitizedData)
      error = result.error
    }

    if (error) {
      console.error(`[DB SAVE ERROR]:`, error)
      throw createError({ statusCode: 500, statusMessage: `Failed to update ${collection}: ${error.message}` })
    }

    return { success: true }
  }

  // Deleting item
  if (action === 'delete') {
    const { collection, id } = query
    if (!collection || !id) {
      throw createError({ statusCode: 400, statusMessage: 'Collection and ID are required' })
    }

    // SPECIAL HANDLING: DELETE BLOG FROM FIREBASE FIRESTORE
    if (collection === 'blog') {
      const deleted = await deleteBlogFromFirestore(id as string)
      if (!deleted) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete blog from Firebase Firestore' })
      }
      return { success: true }
    }

    const table = COLLECTION_TABLES[collection as string]
    if (!table) throw createError({ statusCode: 400, statusMessage: 'Collection is not allowed' })

    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      console.error(`[DB DELETE ERROR]:`, error)
      throw createError({ statusCode: 500, statusMessage: `Failed to delete from ${collection}: ${error.message}` })
    }

    return { success: true }
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
})
