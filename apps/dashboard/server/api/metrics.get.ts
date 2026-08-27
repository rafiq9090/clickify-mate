export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  const memory = process.memoryUsage()
  return [
    '# HELP clickify_dashboard_up Whether the dashboard process is running.',
    '# TYPE clickify_dashboard_up gauge',
    'clickify_dashboard_up 1',
    '# HELP clickify_process_resident_memory_bytes Resident memory used by the dashboard process.',
    '# TYPE clickify_process_resident_memory_bytes gauge',
    `clickify_process_resident_memory_bytes ${memory.rss}`,
    '# HELP clickify_process_uptime_seconds Dashboard process uptime.',
    '# TYPE clickify_process_uptime_seconds counter',
    `clickify_process_uptime_seconds ${process.uptime()}`,
    ''
  ].join('\n')
})
