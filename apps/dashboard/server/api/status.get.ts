export default defineEventHandler(() => {
  return {
    status: 'operational',
    service: 'clickify-mate-dashboard',
    timestamp: new Date().toISOString()
  }
})
