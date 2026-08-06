export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = useSupabaseAdmin()
  
  const { session_id, path, tool_used, time_increment, ip_address, city, country, os, browser, device } = body
  
  if (!session_id) return { success: false, error: 'missing session' }

  // Check if table exists by doing a dummy query, if it fails, we gracefully return so standard app doesn't crash
  try {
     const { data: existing, error } = await client.from('visitors').select('*').eq('session_id', session_id).maybeSingle()
     
     if (error) {
         return { success: false, error: 'Table access failed', details: error }
     }

     let tools = []
     let totalTime = (time_increment || 5)
     
      const payload: any = {
         current_path: path,
         last_active_at: new Date().toISOString()
      }

      if (ip_address) payload.ip_address = ip_address
      if (city) payload.city = city
      if (country) payload.country = country
      if (os) payload.os = os
      if (browser) payload.browser = browser

     let dbResult;
     if (existing) {
        tools = existing.tools_used || []
        if (tool_used && !tools.includes(tool_used)) tools.push(tool_used)
        totalTime = (existing.time_spent_seconds || 0) + (time_increment || 5)
        
        payload.tools_used = tools
        payload.time_spent_seconds = totalTime
        
        dbResult = await client.from('visitors').update(payload).eq('session_id', session_id)
     } else {
        if (tool_used) tools.push(tool_used)
        payload.session_id = session_id
        payload.tools_used = tools
        payload.time_spent_seconds = totalTime
        
        dbResult = await client.from('visitors').insert(payload)
     }

     if (dbResult.error) {
         return { success: false, error: 'Database persistence failed', details: dbResult.error }
     }

     return { success: true }
  } catch (err) {
     return { success: false, error: (err as any).message || 'Tracking failed', fullError: err }
  }
})
