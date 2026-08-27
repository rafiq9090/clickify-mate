import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  requireAdminSession(event)
  const client = useSupabaseAdmin()

  try {
     // Fetch Daily Usage
     const { data: dailyUsage, error: dailyErr } = await client
        .from('token_usage_by_day')
        .select('*')
        .limit(30)

     if (dailyErr) throw dailyErr

     // Fetch Weekly Usage
     const { data: weeklyUsage, error: weeklyErr } = await client
        .from('token_usage_by_week')
        .select('*')
        .limit(52)

     if (weeklyErr) throw weeklyErr

     // Fetch Monthly Usage
     const { data: monthlyUsage, error: monthlyErr } = await client
        .from('token_usage_by_month')
        .select('*')
        .limit(12)

     if (monthlyErr) throw monthlyErr

     // Fetch Feature Usage
     const { data: featureUsage, error: featureErr } = await client
        .from('token_usage_by_feature')
        .select('*')

     if (featureErr) throw featureErr

     // Fetch Session Usage
     const { data: sessionUsage, error: sessionErr } = await client
        .from('token_usage_by_session')
        .select('*')
        .limit(50)

     if (sessionErr) throw sessionErr

     // Calculate Today / Yesterday totals
     const startOfToday = new Date()
     startOfToday.setUTCHours(0, 0, 0, 0)

     const startOfYesterday = new Date(startOfToday)
     startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1)

     const { data: todayStats } = await client
        .from('token_usage')
        .select('total_tokens')
        .gte('created_at', startOfToday.toISOString())

     const { data: yesterdayStats } = await client
        .from('token_usage')
        .select('total_tokens')
        .gte('created_at', startOfYesterday.toISOString())
        .lt('created_at', startOfToday.toISOString())

     const todayTokens = todayStats?.reduce((sum: number, r: { total_tokens?: number }) => sum + (r.total_tokens || 0), 0) || 0
     const yesterdayTokens = yesterdayStats?.reduce((sum: number, r: { total_tokens?: number }) => sum + (r.total_tokens || 0), 0) || 0

     // Calculate total from database sum for all-time
     const { data: allTimeStats } = await client
        .from('token_usage')
        .select('total_tokens')

     const allTimeTokens = allTimeStats?.reduce((sum: number, r: { total_tokens?: number }) => sum + (r.total_tokens || 0), 0) || 0

     return {
         success: true,
         stats: {
             todayTokens,
             yesterdayTokens,
             allTimeTokens,
             dailyUsage: dailyUsage || [],
             weeklyUsage: weeklyUsage || [],
             monthlyUsage: monthlyUsage || [],
             featureUsage: featureUsage || [],
             sessionUsage: sessionUsage || []
         }
     }
  } catch (err: any) {
     console.error('[TOKEN STATS API ERROR]:', err)
     return {
         success: false,
         error: err.message || 'Failed to retrieve token statistics'
     }
  }
})

