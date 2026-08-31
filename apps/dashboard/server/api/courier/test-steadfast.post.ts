import { defineEventHandler, readBody, createError } from 'h3'
import { requireDashboardRole } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const user = await requireDashboardRole(event, ['owner', 'admin', 'manager'])
  const body = await readBody(event)

  const apiKey = String(body?.apiKey || '').trim()
  const secretKey = String(body?.secretKey || '').trim()

  if (!apiKey || !secretKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Both Steadfast API Key and Secret Key are required.'
    })
  }

  try {
    const response = await $fetch<any>('https://portal.packzy.com/api/v1/get_balance', {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json'
      }
    })

    if (response?.status === 200) {
      return {
        success: true,
        balance: response.current_balance,
        message: `Steadfast connection verified! Current balance: ৳${response.current_balance !== undefined ? response.current_balance : 0}`
      }
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: response?.message || 'Invalid Steadfast API credentials'
      })
    }
  } catch (err: any) {
    console.error('[STEADFAST TEST ERROR]:', err?.message || err)
    const errorMsg = err?.data?.message || err?.data?.statusMessage || err?.message || 'Could not verify Steadfast API credentials'
    throw createError({
      statusCode: 400,
      statusMessage: `Steadfast Error: ${errorMsg}`
    })
  }
})
