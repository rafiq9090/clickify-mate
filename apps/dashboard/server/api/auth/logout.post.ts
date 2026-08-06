export default defineEventHandler(async (event) => {
  setCookie(event, 'toolkit_user_auth', '', {
    maxAge: -1, // Delete cookie
    path: '/'
  })
  return { success: true }
})
