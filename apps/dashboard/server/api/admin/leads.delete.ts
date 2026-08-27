export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const body = await readBody(event)
  const client = useSupabaseAdmin()
  
  if (!body.id) return { success: false, error: 'Message ID is required' }
  
  try {
     const { error } = await client
        .from('leads')
        .delete()
        .eq('id', body.id)
     
     if (error) {
         return { success: false, error: 'Failed to delete message' }
     }
     
     return { success: true }
  } catch (err) {
     return { success: false, error: (err as Error).message }
  }
})
