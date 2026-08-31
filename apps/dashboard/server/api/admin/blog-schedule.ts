import { requireAdminSession } from '../../utils/auth-session'
import { getBlogScheduleFromFirestore, saveBlogScheduleToFirestore } from '../../utils/firebase'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  // GET — return current schedule config
  if (event.method === 'GET') {
    const config = await getBlogScheduleFromFirestore()
    return { success: true, config }
  }

  // POST — save schedule config
  if (event.method === 'POST') {
    const body = await readBody(event)
    const { enabled, blogsPerDay, runHour } = body || {}

    const numBlogs = Number(blogsPerDay)
    const numHour = Number(runHour)

    if (isNaN(numBlogs) || numBlogs < 1 || numBlogs > 20) {
      throw createError({ statusCode: 400, statusMessage: 'blogsPerDay must be between 1 and 20' })
    }
    if (isNaN(numHour) || numHour < 0 || numHour > 23) {
      throw createError({ statusCode: 400, statusMessage: 'runHour must be between 0 and 23' })
    }

    const saved = await saveBlogScheduleToFirestore({
      enabled: Boolean(enabled),
      blogsPerDay: Math.round(numBlogs),
      runHour: Math.round(numHour)
    })

    if (!saved) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to save schedule to Firebase' })
    }

    return { 
      success: true, 
      config: {
        enabled: Boolean(enabled),
        blogsPerDay: Math.round(numBlogs),
        runHour: Math.round(numHour)
      } 
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
