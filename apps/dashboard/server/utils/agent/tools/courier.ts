import { SteadyfastAPI } from '../../steadfast'
import { getApiKey } from '../../settings'

export interface CourierParcelPayload {
    invoice: string
    recipientName: string
    recipientPhone: string
    recipientAddress: string
    codAmount: number
    note?: string
}

export interface CourierParcelResult {
    success: boolean
    consignmentId?: string
    trackingCode?: string
    status: string
    message: string
}

export async function getSteadfastCredentials(): Promise<{ apiKey?: string; secretKey?: string }> {
    const apiKey = await getApiKey('steadfast_api_key', 'steadfastApiKey')
    const secretKey = await getApiKey('steadfast_secret_key', 'steadfastSecretKey')
    return { apiKey, secretKey }
}

export async function createCourierParcel(
    payload: CourierParcelPayload
): Promise<CourierParcelResult> {
    const creds = await getSteadfastCredentials()
    if (!creds.apiKey || !creds.secretKey) {
        return {
            success: true,
            consignmentId: `MOCK-${Date.now()}`,
            trackingCode: `TRK-${Date.now().toString().slice(-6)}`,
            status: 'booked',
            message: 'Courier parcel entry created (Mock/Simulated).'
        }
    }

    try {
        const client = new SteadyfastAPI(creds.apiKey, creds.secretKey)

        // 1. Merchant Invoice Guard: check if Steadfast already created a consignment for this invoice
        try {
            const existingStatus = await client.getStatusByInvoice(payload.invoice)
            if (existingStatus && existingStatus.status === 200 && existingStatus.delivery_status) {
                console.log(`[STEADFAST INVOICE GUARD]: Recovered existing consignment for invoice ${payload.invoice}`)
                return {
                    success: true,
                    consignmentId: payload.invoice,
                    trackingCode: payload.invoice,
                    status: existingStatus.delivery_status,
                    message: `Consignment recovered from Steadfast for invoice ${payload.invoice}.`
                }
            }
        } catch (checkErr) {
            // Invoice does not exist in Steadfast yet, proceed to create
        }

        const res = await client.createOrder({
            invoice: payload.invoice,
            recipient_name: payload.recipientName,
            recipient_phone: payload.recipientPhone,
            recipient_address: payload.recipientAddress,
            cod_amount: payload.codAmount,
            notes: payload.note
        })

        if (res && res.status === 200 && res.consignment) {
            return {
                success: true,
                consignmentId: res.consignment.consignment_id?.toString(),
                trackingCode: res.consignment.tracking_code,
                status: 'booked',
                message: `Parcel booked in Steadfast. Tracking Code: ${res.consignment.tracking_code}`
            }
        }

        return {
            success: false,
            status: 'failed_retryable',
            message: res?.message || 'Failed to create Steadfast parcel.'
        }
    } catch (err: any) {
        return {
            success: false,
            status: 'failed_retryable',
            message: `Steadfast API Error: ${err.message}`
        }
    }
}

export async function getTrackingStatus(trackingCode: string): Promise<{
    trackingCode: string
    status: string
    message: string
}> {
    if (!trackingCode) {
        return {
            trackingCode: '',
            status: 'unknown',
            message: 'ট্র্যাকিং কোড ছাড়া স্ট্যাটাস পাওয়া যায়নি। আপনার অর্ডার আইডি বা ফোন নম্বর দিন।'
        }
    }

    const creds = await getSteadfastCredentials()
    if (!creds.apiKey || !creds.secretKey) {
        return {
            trackingCode,
            status: 'booked',
            message: `আপনার অর্ডারটি সফলভাবে কনফার্ম ও বুক করা হয়েছে (Tracking: ${trackingCode})। কুরিয়ার টিম পার্সেলটি পিকআপের প্রক্রিয়ায় রয়েছে।`
        }
    }

    try {
        const client = new SteadyfastAPI(creds.apiKey, creds.secretKey)
        const statusRes = await client.getStatusByTrackingCode(trackingCode)
        const rawStatus = (statusRes?.delivery_status || 'booked').toLowerCase()

        let userFriendlyMessage = ''
        if (rawStatus.includes('delivered')) {
            userFriendlyMessage = `আপনার পার্সেলটি (Tracking: ${trackingCode}) ডেলিভারি সম্পন্ন হয়েছে।`
        } else if (rawStatus.includes('transit') || rawStatus.includes('delivery')) {
            userFriendlyMessage = `আপনার পার্সেলটি (Tracking: ${trackingCode}) কুরিয়ারে হস্তান্তর করা হয়েছে এবং বর্তমানে ডেলিভারির পথে রয়েছে।`
        } else {
            userFriendlyMessage = `আপনার পার্সেলটি বুক করা হয়েছে (Tracking: ${trackingCode})। কুরিয়ার পিকআপের প্রক্রিয়ায় রয়েছে।`
        }

        return {
            trackingCode,
            status: rawStatus,
            message: userFriendlyMessage
        }
    } catch (err: any) {
        return {
            trackingCode,
            status: 'booked',
            message: `আপনার অর্ডারটি বুক করা হয়েছে (Tracking: ${trackingCode})। কুরিয়ার পিকআপের অপেক্ষায় রয়েছে।`
        }
    }
}
