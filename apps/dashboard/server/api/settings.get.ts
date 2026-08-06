// server/api/settings.get.ts

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseAdmin()

  try {
    const results = await Promise.all([
      supabase.from('templates').select('*').order('id'),
      supabase.from('trends').select('*').order('id'),
      supabase.from('navigation').select('*').order('id'),
      supabase.from('ads').select('*').order('id'),
      supabase.from('blogs').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('*').limit(1).maybeSingle()
    ])

    const [tRes, trRes, nRes, aRes, bRes, sRes] = results

    // Whitelist only safe public settings properties to return
    const rawSettings = sRes.data || {}
    const safeSettings = {
      site_name: rawSettings.site_name || 'Clickify Mate',
      adsense_pub_id: rawSettings.adsense_pub_id || '',
      adsense_code: rawSettings.adsense_code || '',
      google_analytics_id: rawSettings.google_analytics_id || '',
      google_search_console_id: rawSettings.google_search_console_id || '',
      bing_webmaster_id: rawSettings.bing_webmaster_id || '',
      yandex_webmaster_id: rawSettings.yandex_webmaster_id || ''
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
  } catch (error: any) {
    console.error('[Public Settings Fetch Error]:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch settings',
      templates: [],
      trends: [],
      navigation: [],
      ads: [],
      blog: [],
      settings: { site_name: 'Clickify Mate', adsense_pub_id: '', adsense_code: '' }
    }
  }
})
