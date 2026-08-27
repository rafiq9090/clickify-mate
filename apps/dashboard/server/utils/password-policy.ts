export function normalizeEmail(value: unknown) {
  const email = String(value || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email address is required.' })
  }
  return email
}

export function assertStrongPassword(value: unknown) {
  const password = String(value || '')
  if (password.length < 12 || password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be between 12 and 128 characters.' })
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must include uppercase, lowercase, number, and symbol characters.'
    })
  }
  return password
}
