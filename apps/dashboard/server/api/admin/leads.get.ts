export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const client = useSupabaseAdmin()
  
  try {
     const { data: messages, error } = await client
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
     
     if (error) {
         return { success: false, error: error?.message || error, messages: [] }
     }
     
     return { success: true, messages: messages || [] }
  } catch (err) {
     return { success: false, error: (err as Error).message, messages: [] }
  }
})
