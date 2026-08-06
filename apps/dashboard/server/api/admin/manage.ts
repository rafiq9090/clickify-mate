import { clearSettingsCache } from '../../utils/settings'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const action = query.action
  const supabase = useSupabaseAdmin()

  // Fetching all data from Supabase
  if (action === 'get_all') {
    const results = await Promise.all([
      supabase.from('templates').select('*').order('id'),
      supabase.from('trends').select('*').order('id'),
      supabase.from('navigation').select('*').order('id'),
      supabase.from('ads').select('*').order('id'),
      supabase.from('blogs').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('*').limit(1).maybeSingle()
    ])

    const [tRes, trRes, nRes, aRes, bRes, sRes] = results

    // Redact sensitive keys from settings before returning
    const rawSettings = sRes.data || {}
    const sensitiveKeys = ['groq_api_key', 'gemini_api_key', 'tinyurl_api_token', 'supabase_service_role_key']
    const safeSettings = { ...rawSettings }
    for (const key of sensitiveKeys) {
      if (safeSettings[key] && typeof safeSettings[key] === 'string' && safeSettings[key].length > 4) {
        safeSettings[key] = '••••••••' + safeSettings[key].slice(-4)
      }
    }

    return {
      success: true,
      templates: tRes.data || [],
      trends: trRes.data || [],
      navigation: nRes.data || [],
      ads: aRes.data || [],
      blog: bRes.data || [],
      settings: safeSettings
    }
  }

  // Updating whole collection (Saving)
  if (action === 'save_all') {
    const body = await readBody(event)
    const { collection, data } = body

    if (!collection || !data) {
      throw createError({ statusCode: 400, statusMessage: 'Collection and data are required' })
    }

    // Since we are replacing the whole state (like we did with JSON), 
    // we use upsert which handles both insert and update if IDs match.
    const table = collection === 'blog' ? 'blogs' : collection

    // EXCEPTION: "settings" table uses a single row with GENERATED ALWAYS ID.
    // If we include the ID in the upsert, Postgres will block it.
    // We use .update() here to modify the existing row without touching the identity col.
    let error;
    if (collection === 'settings' && data[0]) {
      const { id, created_at, ...sanitized } = data[0]
      const targetId = id || 1; // Force ID 1 if not present
      const result = await supabase.from('settings').upsert({ id: targetId, ...sanitized })
      clearSettingsCache()
      error = result.error
    } else {
      // Sanitize data by ensuring every record has an ID
      const sanitizedData = data.map((item: any) => {
        const { id, ...rest } = item;
        // If ID is missing or invalid, generate one here as a safety net
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

    return { success: true, message: `${collection} updated successfully in database` }
  }

  // Deleting a specific record from any table
  if (action === 'delete') {
    const queryData = getQuery(event)
    const { collection, id } = queryData

    if (!collection || !id) {
      throw createError({ statusCode: 400, statusMessage: 'Collection and ID are required' })
    }

    const table = collection === 'blog' ? 'blogs' : collection
    const { error } = await supabase.from(table as string).delete().eq('id', id);
    if (error) {
      throw createError({ statusCode: 500, statusMessage: `Failed to delete from ${collection}: ${error.message}` })
    }

    return { success: true, message: 'Deleted successfully' }
  }

  throw createError({ statusCode: 405, statusMessage: 'Action not allowed' })
})
