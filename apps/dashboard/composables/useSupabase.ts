import { useCookie, useNuxtApp, useRuntimeConfig } from '#app'

export const useSupabase = () => {
  const nuxtApp = useNuxtApp()
  if (nuxtApp._supabase) {
    return nuxtApp._supabase
  }

  // Client-side cookie to track the JWT token
  const authToken = useCookie('toolkit_user_auth')

  const getUserFromToken = () => {
    const val = authToken.value
    if (!val) return null
    try {
      const base64Url = val.split('.')[1]
      if (!base64Url) return null
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        authToken.value = null
        return null
      }
      return {
        id: payload.id,
        email: payload.email,
        identities: [{ id: payload.id }]
      }
    } catch (e) {
      return null
    }
  }

  const queryBuilder = (table: string) => {
    let action = 'select'
    let queryData: any = null
    let filters: any[] = []
    let orderVal: any = null
    let limitVal: number | null = null
    let singleVal = false
    let maybeSingleVal = false
    let countOption: string | null = null

    const builder = {
      select: (fields = '*', options?: { count?: string }) => {
        if (action === 'select') {
          action = 'select'
        }
        if (options?.count) {
          countOption = options.count
        }
        return builder
      },
      insert: (data: any) => {
        action = 'insert'
        queryData = data
        return builder
      },
      update: (data: any) => {
        action = 'update'
        queryData = data
        return builder
      },
      upsert: (data: any, options?: any) => {
        action = 'upsert'
        queryData = data
        return builder
      },
      delete: () => {
        action = 'delete'
        return builder
      },
      eq: (column: string, value: any) => {
        filters.push({ type: 'eq', column, value })
        return builder
      },
      in: (column: string, values: any[]) => {
        filters.push({ type: 'in', column, values })
        return builder
      },
      gte: (column: string, value: any) => {
        filters.push({ type: 'gte', column, value })
        return builder
      },
      lt: (column: string, value: any) => {
        filters.push({ type: 'lt', column, value })
        return builder
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        orderVal = { column, ascending: options?.ascending !== false }
        return builder
      },
      limit: (value: number) => {
        limitVal = value
        return builder
      },
      single: () => {
        singleVal = true
        return builder
      },
      maybeSingle: () => {
        maybeSingleVal = true
        return builder
      },
      then: async (onFulfilled?: any, onRejected?: any) => {
        try {
          const res: any = await $fetch('/api/db-query', {
            method: 'POST',
            body: {
              table,
              action,
              queryData,
              filters,
              orderVal,
              limitVal,
              singleVal,
              maybeSingleVal,
              countOption
            },
            headers: {
              Authorization: `Bearer ${authToken.value || ''}`
            }
          })
          if (onFulfilled) return onFulfilled(res)
          return res
        } catch (err: any) {
          const formattedErr = { data: null, error: err.data?.message || err.message || err, count: 0 }
          if (onRejected) return onRejected(formattedErr)
          return formattedErr
        }
      }
    }

    return builder
  }

  const mockClient = {
    from: queryBuilder,
    auth: {
      getUser: async () => {
        const user = getUserFromToken()
        return { data: { user }, error: user ? null : new Error('No session') }
      },
      getSession: async () => {
        const user = getUserFromToken()
        return { data: { session: user ? { user, access_token: authToken.value } : null }, error: null }
      },
      signUp: async ({ email, password }: any) => {
        try {
          const res: any = await $fetch('/api/auth/signup', {
            method: 'POST',
            body: { email, password }
          })
          if (res.success) {
            authToken.value = res.token
            const user = getUserFromToken()
            return { data: { user, session: { access_token: res.token, user } }, error: null }
          }
          return { data: null, error: new Error(res.error || 'Signup failed') }
        } catch (err: any) {
          return { data: null, error: new Error(err.data?.message || err.message || 'Signup failed') }
        }
      },
      signInWithPassword: async ({ email, password }: any) => {
        try {
          const res: any = await $fetch('/api/auth/login', {
            method: 'POST',
            body: { email, password }
          })
          if (res.success) {
            authToken.value = res.token
            const user = getUserFromToken()
            return { data: { user, session: { access_token: res.token, user } }, error: null }
          }
          return { data: null, error: new Error(res.error || 'Login failed') }
        } catch (err: any) {
          return { data: null, error: new Error(err.data?.message || err.message || 'Login failed') }
        }
      },
      signOut: async () => {
        authToken.value = null
        await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
        return { error: null }
      },
      resetPasswordForEmail: async (email: string) => {
        console.log(`[LOCAL DEV AUTH]: Password reset requested for ${email}. Seeded recovery code: '123456'`)
        return { data: {}, error: null }
      },
      verifyOtp: async ({ email, token }: any) => {
        if (token === '123456') {
          const dummyUser = { id: '00000000-0000-0000-0000-000000000000', email }
          return { data: { user: dummyUser, session: { access_token: 'dummy', user: dummyUser } }, error: null }
        }
        return { data: null, error: new Error('Invalid OTP') }
      },
      updateUser: async ({ password }: any) => {
        try {
          const res: any = await $fetch('/api/auth/update-password', {
            method: 'POST',
            body: { password },
            headers: {
              Authorization: `Bearer ${authToken.value || ''}`
            }
          })
          return { data: { user: getUserFromToken() }, error: res.success ? null : new Error(res.error) }
        } catch (err: any) {
          return { data: null, error: new Error(err.message) }
        }
      },
      signInWithOAuth: async () => {
        const dummyToken = 'dummy-oauth-token'
        authToken.value = dummyToken
        window.location.href = '/'
        return { data: {}, error: null }
      },
      onAuthStateChange: (callback: any) => {
        const user = getUserFromToken()
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user, access_token: authToken.value } : null)
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    }
  }

  nuxtApp._supabase = mockClient
  return mockClient
}
