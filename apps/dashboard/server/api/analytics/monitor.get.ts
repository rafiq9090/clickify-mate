export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const client = useSupabaseAdmin()
  
  // Get visitors active within the last 30 minutes
  const activeWindow = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  
  try {
     const { data: visitors, error } = await client
        .from('visitors')
        .select('*')
        .gte('last_active_at', activeWindow)
        .order('last_active_at', { ascending: false })
     
     if (error) {
         return { success: false, error: 'Failed to access visitors table', visitors: [] }
     }
     
     return { success: true, visitors: visitors || [] }
  } catch (err) {
     return { success: false, error: (err as Error).message, visitors: [] }
  }
})
