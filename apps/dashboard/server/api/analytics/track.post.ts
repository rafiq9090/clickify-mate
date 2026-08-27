export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = useSupabaseAdmin()
  
  const { session_id, path, tool_used, time_increment, ip_address, city, country, os, browser, device } = body
  
  if (!session_id || !/^[A-Za-z0-9_-]{8,100}$/.test(String(session_id))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid analytics session.' })
  }
  const safeText = (value: unknown, max: number) => String(value || '').slice(0, max)
  const safeIncrement = Math.min(Math.max(Number(time_increment || 5), 0), 300)

  // Check if table exists by doing a dummy query, if it fails, we gracefully return so standard app doesn't crash
  try {
     const { data: existing, error } = await client.from('visitors').select('*').eq('session_id', session_id).maybeSingle()
     
     if (error) {
         return { success: false, error: 'Table access failed', details: error }
     }

     let tools = []
     let totalTime = safeIncrement
     
      const payload: any = {
         current_path: safeText(path, 500),
         last_active_at: new Date().toISOString()
      }

      const requestIp = getRequestIP(event, { xForwardedFor: true })
      if (requestIp) payload.ip_address = safeText(requestIp, 64)
      if (city) payload.city = safeText(city, 100)
      if (country) payload.country = safeText(country, 100)
      if (os) payload.os = safeText(os, 100)
      if (browser) payload.browser = safeText(browser, 100)
      if (device) payload.device = safeText(device, 50)

     let dbResult;
     if (existing) {
        tools = existing.tools_used || []
        const safeTool = safeText(tool_used, 100)
        if (safeTool && !tools.includes(safeTool)) tools.push(safeTool)
        tools = tools.slice(-50)
        totalTime = Math.min((existing.time_spent_seconds || 0) + safeIncrement, 31_536_000)
        
        payload.tools_used = tools
        payload.time_spent_seconds = totalTime
        
        dbResult = await client.from('visitors').update(payload).eq('session_id', session_id)
     } else {
        if (tool_used) tools.push(safeText(tool_used, 100))
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
