export default defineEventHandler(async (event) => {
  const client = useSupabaseAdmin()
  
  try {
     const { data: messages, error } = await client
        .from('leads')
        .select('*')
        .eq('source', 'contact_form')
        .order('created_at', { ascending: false })
     
     if (error) {
         return { success: false, error: 'Failed to access leads table', messages: [] }
     }
     
     return { success: true, messages: messages || [] }
  } catch (err) {
     return { success: false, error: (err as Error).message, messages: [] }
  }
})
