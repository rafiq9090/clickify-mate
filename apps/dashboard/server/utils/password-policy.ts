export function normalizeEmail(value: unknown) {
  const email = String(value || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email address is required.' })
  }
  return email
}

export function assertStrongPassword(value: unknown) {
  const password = String(value || '')
  if (password.length < 8 || password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters long.' })
  }
  return password
}
