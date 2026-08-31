import { defineEventHandler } from 'h3'
import { getBlogsFromFirestore } from '../../utils/firebase'

export default defineEventHandler(async () => {
  try {
    const blogs = await getBlogsFromFirestore()
    return {
      success: true,
      blogs
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      blogs: []
    }
  }
})
