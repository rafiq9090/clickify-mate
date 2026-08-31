import { defineEventHandler, getRouterParam, createError } from 'h3'
import { getBlogBySlugFromFirestore } from '../../utils/firebase'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug parameter is required' })
  }

  try {
    const blog = await getBlogBySlugFromFirestore(slug)
    if (!blog) {
      throw createError({ statusCode: 404, message: `Blog post '${slug}' not found in Firebase Firestore.` })
    }

    return {
      success: true,
      blog
    }
  } catch (err: any) {
    throw createError({ statusCode: err.statusCode || 500, message: err.message || 'Error fetching blog from Firestore' })
  }
})
