import { useNuxtApp, useState } from '#app'

export const useSupabase = () => {
  const nuxtApp = useNuxtApp()
  if (nuxtApp._supabase) {
    return nuxtApp._supabase
  }

  const authUser = useState<any | null>('clickify-dashboard-user', () => null)
  let sessionLoaded = false
  let pendingRecovery: { email: string; token: string } | null = null

  const normalizeUser = (user: any) => user ? {
    ...user,
    identities: Array.isArray(user.identities) ? user.identities : [{ id: user.id }]
  } : null

  const refreshUser = async (force = false) => {
    if (sessionLoaded && !force) return authUser.value
    try {
      const response: any = await $fetch('/api/auth/session')
      authUser.value = normalizeUser(response?.user)
    } catch {
      authUser.value = null
    }
    sessionLoaded = true
    return authUser.value
  }

  const queryBuilder = (table: string) => {
    let action = 'select'
    let queryData: any = null
    let filters: any[] = []
    let orderVal: any = null
    let limitVal: number | null = null
    let rangeVal: { from: number; to: number } | null = null
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
      neq: (column: string, value: any) => {
        filters.push({ type: 'neq', column, value })
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
      lte: (column: string, value: any) => {
        filters.push({ type: 'lte', column, value })
        return builder
      },
      gt: (column: string, value: any) => {
        filters.push({ type: 'gt', column, value })
        return builder
      },
      lt: (column: string, value: any) => {
        filters.push({ type: 'lt', column, value })
        return builder
      },
      is: (column: string, value: any) => {
        filters.push({ type: 'is', column, value })
        return builder
      },
      not: (column: string, op: string, value: any) => {
        filters.push({ type: 'not', column, op, value })
        return builder
      },
      filter: (column: string, op: string, value: any) => {
        if (op === 'eq') filters.push({ type: 'eq', column, value })
        else if (op === 'neq') filters.push({ type: 'neq', column, value })
        else if (op === 'is') filters.push({ type: 'is', column, value })
        else if (op === 'in') filters.push({ type: 'in', column, values: value })
        else filters.push({ type: op, column, value })
        return builder
      },
      or: (filterString: string) => {
        filters.push({ type: 'or', value: filterString })
        return builder
      },
      ilike: (column: string, value: any) => {
        filters.push({ type: 'ilike', column, value })
        return builder
      },
      range: (from: number, to: number) => {
        rangeVal = { from, to }
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
              rangeVal,
              singleVal,
              maybeSingleVal,
              countOption
            },
            credentials: 'same-origin'
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
        const user = await refreshUser()
        return { data: { user }, error: user ? null : new Error('No session') }
      },
      getSession: async () => {
        const user = await refreshUser()
        return { data: { session: user ? { user } : null }, error: null }
      },
      signUp: async ({ email, password }: any) => {
        try {
          const res: any = await $fetch('/api/auth/signup', {
            method: 'POST',
            body: { email, password }
          })
          if (res.success) {
            authUser.value = normalizeUser(res.user)
            sessionLoaded = true
            return { data: { user: authUser.value, session: { user: authUser.value } }, error: null }
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
            authUser.value = normalizeUser(res.user)
            sessionLoaded = true
            return { data: { user: authUser.value, session: { user: authUser.value } }, error: null }
          }
          return { data: null, error: new Error(res.error || 'Login failed') }
        } catch (err: any) {
          return { data: null, error: new Error(err.data?.message || err.message || 'Login failed') }
        }
      },
      signOut: async () => {
        await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
        authUser.value = null
        sessionLoaded = true
        return { error: null }
      },
      resetPasswordForEmail: async (email: string) => {
        try {
          const data: any = await $fetch('/api/auth/request-password-reset', {
            method: 'POST',
            body: { email }
          })
          if (data?.developmentCode) console.info(`[AUTH DEV]: Reset code ${data.developmentCode}`)
          return { data, error: null }
        } catch (error: any) {
          return { data: null, error: new Error(error.data?.statusMessage || error.message || 'Reset request failed') }
        }
      },
      verifyOtp: async ({ email, token }: any) => {
        pendingRecovery = { email, token }
        return { data: { user: null, session: null }, error: null }
      },
      updateUser: async ({ password, current_password, currentPassword }: any) => {
        try {
          const endpoint = pendingRecovery ? '/api/auth/reset-password' : '/api/auth/update-password'
          const body = pendingRecovery
            ? { ...pendingRecovery, password }
            : { password, currentPassword: currentPassword || current_password }
          const res: any = await $fetch(endpoint, { method: 'POST', body })
          if (pendingRecovery) pendingRecovery = null
          if (endpoint.endsWith('update-password')) {
            authUser.value = null
            sessionLoaded = true
          }
          return { data: { user: authUser.value }, error: res.success ? null : new Error(res.error) }
        } catch (err: any) {
          return { data: null, error: new Error(err.data?.statusMessage || err.message) }
        }
      },
      signInWithOAuth: async () => {
        return { data: null, error: new Error('OAuth is not configured for this deployment.') }
      },
      onAuthStateChange: (callback: any) => {
        const user = authUser.value
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null)
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    }
  }

  nuxtApp._supabase = mockClient
  return mockClient
}
