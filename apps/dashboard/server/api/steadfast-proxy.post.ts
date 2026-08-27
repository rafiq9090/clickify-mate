import { defineEventHandler, readBody, createError } from 'h3'
import { requireDashboardRole } from '../utils/auth-session'

interface LeadData {
  id: string
  data?: {
    user_id?: string
    customer?: string
    collected_details?: {
      name?: string
      phone?: string
      address?: string
      payment_method?: string
    }
    order?: string
    tracking_code?: string
    consignment_id?: string
    delivery_status?: string
  }
}

interface SteadyfastCreateOrderPayload {
  invoice: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  cod_amount: number
  alternative_phone?: string
  recipient_email?: string
  notes?: string
  item_description?: string
  total_lot?: number
  delivery_type?: number
}

// Parse order string to extract price/amount
function parseOrderAmount(orderString: string): number {
  if (!orderString) return 0
  const priceMatches = orderString.match(/[\d]+/g)
  if (priceMatches && priceMatches.length > 0) {
    const lastMatch = priceMatches[priceMatches.length - 1] || ''
    const lastNumber = parseInt(lastMatch)

    return isNaN(lastNumber) ? 0 : lastNumber
  }
  return 0
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireDashboardRole(event, ['owner', 'admin', 'manager'])
    const body = await readBody(event)
    const { lead_ids } = body

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or empty lead_ids array'
      })
    }

    // Initialize Supabase Admin
    const supabase = useSupabaseAdmin()

    // 1. Fetch targeted leads data records
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .in('id', lead_ids)
      .eq('data->>user_id', user.id)

    if (fetchError || !leads || leads.length !== new Set(lead_ids).size) {
      throw createError({
        statusCode: 404,
        statusMessage: 'One or more orders were not found for this shop.'
      })
    }

    // 2. RESILIENT CREDENTIAL EXTRACTION: Database Lookups with Request Body Fallbacks
    let configRow = null

    // Try looking up credentials from the database if user_id exists
    const { data: foundConfig } = await supabase
      .from('agent_configs')
      .select('agent_behavior')
      .eq('user_id', user.id)
      .maybeSingle()

    if (foundConfig?.agent_behavior) {
      configRow = foundConfig
    }

    // Credentials are server-owned. Never accept merchant secrets from a browser request.
    const activeApiKey = configRow?.agent_behavior?.steadfast_api_key
    const activeSecretKey = configRow?.agent_behavior?.steadfast_secret_key

    if (!activeApiKey || !activeSecretKey) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized configuration state: Valid Steadfast API credentials could not be resolved from database configuration rows or request payload parameters.'
      })
    }

    // 3. Map leads metrics formatting array blocks
    const steadfastOrders = leads.map((lead: LeadData) => {
      const leadData = lead.data || {}
      const details = leadData.collected_details || {}

      const invoice = `INV-${lead.id.slice(0, 8)}-${Date.now().toString().slice(-6)}`
      const recipientName = details.name || leadData.customer || `Customer-${lead.id}`
      const recipientPhone = details.phone || '01700000000'
      const recipientAddress = details.address || 'Dhaka, Bangladesh'
      const codAmount = parseOrderAmount(leadData.order || '')

      const payload: SteadyfastCreateOrderPayload = {
        invoice,
        recipient_name: recipientName.substring(0, 100),
        recipient_phone: recipientPhone.replace(/\D/g, '').slice(-11),
        recipient_address: recipientAddress.substring(0, 250),
        cod_amount: Math.max(codAmount, 0),
        notes: `Order: ${leadData.order?.substring(0, 100) || 'N/A'}`,
        item_description: 'Product order',
        delivery_type: 0
      }

      return { lead_id: lead.id, existingData: leadData, payload }
    })

    // 4. Fire sequential pipeline processing requests
    const results = []
    const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1'

    for (const { lead_id, existingData, payload } of steadfastOrders) {
      try {
        if (!payload.recipient_phone || payload.recipient_phone.length < 10) {
          throw new Error(`Invalid target customer phone identifier formatting rule checked: ${payload.recipient_phone}`)
        }

        const response = await $fetch<any>(
          `${STEADFAST_BASE_URL}/create_order`,
          {
            method: 'POST',
            headers: {
              'Api-Key': activeApiKey.trim(),
              'Secret-Key': activeSecretKey.trim(),
              'Content-Type': 'application/json'
            },
            body: payload
          }
        )

        // API checks validation standard success mapping blocks
        if ((response?.status === 200 || response?.status === 'success') && response?.consignment) {
          results.push({
            success: true,
            lead_id,
            tracking_code: response.consignment.tracking_code,
            consignment_id: response.consignment.consignment_id,
            status: response.consignment.status,
            message: 'Order created successfully'
          })

          // DEEP MERGE SAFE DATABASE MERGE EXECUTION STRATEGY
          const freshlyMergedDataBlock = {
            ...existingData,
            tracking_code: response.consignment.tracking_code,
            consignment_id: response.consignment.consignment_id,
            delivery_status: response.consignment.status
          }

          await supabase
            .from('leads')
            .update({ data: freshlyMergedDataBlock })
            .eq('id', lead_id)
        } else {
          results.push({
            success: false,
            lead_id,
            status: 'error',
            message: response?.message || 'Unknown processing response error from Steadfast API gateway'
          })
        }
      } catch (err: any) {
        console.error(`[STEADFAST API METRIC BREAKDOWN] Lead context tracking hash error ${lead_id}:`, err.message)
        results.push({
          success: false,
          lead_id,
          status: 'error',
          message: err.message || 'Failed to communicate with Steadfast API Gateway endpoints'
        })
      }
    }

    return {
      success: results.some(r => r.success),
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    }
  } catch (error: any) {
    console.error('[STEADFAST PROXY EXCEPTION FATAL CRASH]:', error.message)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Internal Steadfast automated proxy system integration failed'
    })
  }
})
