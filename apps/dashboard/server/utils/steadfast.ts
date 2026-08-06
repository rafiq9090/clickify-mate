/**
 * Steadfast Courier Integration Utilities
 * Handles direct API calls to Steadfast Courier (https://portal.packzy.com/api/v1)
 */

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

interface SteadyfastResponse {
  status: number
  message: string
  consignment?: {
    consignment_id: number
    invoice: string
    tracking_code: string
    recipient_name: string
    recipient_phone: string
    recipient_address: string
    cod_amount: number
    status: string
    created_at: string
    updated_at: string
  }
}

interface SteadyfastStatusResponse {
  status: number
  delivery_status: string
}

export class SteadyfastAPI {
  private baseUrl = 'https://portal.packzy.com/api/v1'
  private apiKey: string
  private secretKey: string

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey
    this.secretKey = secretKey
  }

  /**
   * Create a single order in Steadfast
   */
  async createOrder(payload: SteadyfastCreateOrderPayload): Promise<SteadyfastResponse> {
    try {
      const response = await $fetch<SteadyfastResponse>(`${this.baseUrl}/create_order`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json'
        },
        body: payload
      })

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Create Order:', error)
      throw new Error(`Failed to create order: ${error.message}`)
    }
  }

  /**
   * Get delivery status by consignment ID
   */
  async getStatusByConsignmentId(consignmentId: number): Promise<SteadyfastStatusResponse> {
    try {
      const response = await $fetch<SteadyfastStatusResponse>(
        `${this.baseUrl}/status_by_cid/${consignmentId}`,
        {
          method: 'GET',
          headers: {
            'Api-Key': this.apiKey,
            'Secret-Key': this.secretKey,
            'Content-Type': 'application/json'
          }
        }
      )

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Get Status by CID:', error)
      throw new Error(`Failed to get status: ${error.message}`)
    }
  }

  /**
   * Get delivery status by invoice ID
   */
  async getStatusByInvoice(invoice: string): Promise<SteadyfastStatusResponse> {
    try {
      const response = await $fetch<SteadyfastStatusResponse>(
        `${this.baseUrl}/status_by_invoice/${invoice}`,
        {
          method: 'GET',
          headers: {
            'Api-Key': this.apiKey,
            'Secret-Key': this.secretKey,
            'Content-Type': 'application/json'
          }
        }
      )

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Get Status by Invoice:', error)
      throw new Error(`Failed to get status: ${error.message}`)
    }
  }

  /**
   * Get delivery status by tracking code
   */
  async getStatusByTrackingCode(trackingCode: string): Promise<SteadyfastStatusResponse> {
    try {
      const response = await $fetch<SteadyfastStatusResponse>(
        `${this.baseUrl}/status_by_trackingcode/${trackingCode}`,
        {
          method: 'GET',
          headers: {
            'Api-Key': this.apiKey,
            'Secret-Key': this.secretKey,
            'Content-Type': 'application/json'
          }
        }
      )

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Get Status by Tracking Code:', error)
      throw new Error(`Failed to get status: ${error.message}`)
    }
  }

  /**
   * Get current account balance
   */
  async getBalance(): Promise<{ status: number; current_balance: number }> {
    try {
      const response = await $fetch<{ status: number; current_balance: number }>(
        `${this.baseUrl}/get_balance`,
        {
          method: 'GET',
          headers: {
            'Api-Key': this.apiKey,
            'Secret-Key': this.secretKey,
            'Content-Type': 'application/json'
          }
        }
      )

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Get Balance:', error)
      throw new Error(`Failed to get balance: ${error.message}`)
    }
  }

  /**
   * Create a return request
   */
  async createReturnRequest(
    consignmentIdOrInvoiceOrTrackingCode: string | number,
    reason?: string
  ): Promise<any> {
    try {
      const response = await $fetch<any>(`${this.baseUrl}/create_return_request`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json'
        },
        body: {
          consignment_id: typeof consignmentIdOrInvoiceOrTrackingCode === 'number' 
            ? consignmentIdOrInvoiceOrTrackingCode 
            : undefined,
          invoice: typeof consignmentIdOrInvoiceOrTrackingCode === 'string' 
            ? consignmentIdOrInvoiceOrTrackingCode 
            : undefined,
          tracking_code: typeof consignmentIdOrInvoiceOrTrackingCode === 'string' 
            ? consignmentIdOrInvoiceOrTrackingCode 
            : undefined,
          reason: reason || null
        }
      })

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Create Return Request:', error)
      throw new Error(`Failed to create return request: ${error.message}`)
    }
  }

  /**
   * Get all return requests
   */
  async getReturnRequests(): Promise<any> {
    try {
      const response = await $fetch<any>(`${this.baseUrl}/get_return_requests`, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json'
        }
      })

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Get Return Requests:', error)
      throw new Error(`Failed to get return requests: ${error.message}`)
    }
  }

  /**
   * Get single return request
   */
  async getReturnRequest(returnId: number): Promise<any> {
    try {
      const response = await $fetch<any>(`${this.baseUrl}/get_return_request/${returnId}`, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json'
        }
      })

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Get Return Request:', error)
      throw new Error(`Failed to get return request: ${error.message}`)
    }
  }

  /**
   * Get payments
   */
  async getPayments(): Promise<any> {
    try {
      const response = await $fetch<any>(`${this.baseUrl}/payments`, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json'
        }
      })

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Get Payments:', error)
      throw new Error(`Failed to get payments: ${error.message}`)
    }
  }

  /**
   * Get police stations
   */
  async getPoliceStations(): Promise<any> {
    try {
      const response = await $fetch<any>(`${this.baseUrl}/police_stations`, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json'
        }
      })

      return response
    } catch (error: any) {
      console.error('[STEADFAST API ERROR] Get Police Stations:', error)
      throw new Error(`Failed to get police stations: ${error.message}`)
    }
  }
}

/**
 * Helper function to create Steadfast API instance
 */
export function createSteadyfastAPI(apiKey: string, secretKey: string): SteadyfastAPI {
  return new SteadyfastAPI(apiKey, secretKey)
}
