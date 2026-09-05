import { queryPg } from '../db'
import { decrypt } from '../encryption'

export async function notifyCustomerPaymentResult(
  orderId: string,
  type: 'payment_success' | 'payment_failed',
  details?: { failureReason?: string; checkoutUrl?: string }
) {
  try {
    const orderRes = await queryPg(
      `SELECT id, data FROM public.leads WHERE id = $1 LIMIT 1`,
      [orderId]
    )
    const order = orderRes.rows[0]
    if (!order) return

    const data = order.data || {}
    const agentId = data.agent_id
    const customerId = data.customer
    const platform = (data.platform || 'messenger').toLowerCase()
    const lang = data.language || 'bn'

    if (!agentId || !customerId) return

    // Prevent duplicate notifications for the same event
    if (type === 'payment_success' && data.payment_success_notified) return
    if (type === 'payment_failed' && data.payment_failed_notified) return

    const agentRes = await queryPg(
      `SELECT id, platform, external_id, encrypted_token, is_active FROM public.agent_configs WHERE id = $1 LIMIT 1`,
      [agentId]
    )
    const agent = agentRes.rows[0]
    if (!agent || !agent.encrypted_token) return

    const token = await decrypt(agent.encrypted_token)
    if (!token) return

    const orderNumber = data.invoice_number || data.id || orderId
    const productName = data.product || data.sku || (lang === 'en' ? 'Product' : 'পণ্য')
    const itemTotal = Number(data.price || 0) * Number(data.quantity || 1)
    const deliveryFee = Number(data.delivery_fee || 0)
    const totalAmount = Number(data.total || itemTotal + deliveryFee)
    const customerName = data.name || (lang === 'en' ? 'Customer' : 'গ্রাহক')
    const phone = data.phone || ''
    const address = data.address || ''
    const paymentMethod = String(data.payment_method || data.payment_provider || 'Online Payment').toUpperCase()
    const trxId = data.trx_id || ''

    let messageText = ''

    if (type === 'payment_success') {
      if (lang === 'en') {
        messageText = [
          `🎉 Congratulations! Your payment of ৳${totalAmount} has been verified successfully.`,
          ``,
          `🧾 Order Receipt / Invoice:`,
          `━━━━━━━━━━━━━━━━━━━━`,
          `📦 Order ID: #${orderNumber}`,
          `🛍️ Product: ${productName}`,
          data.color ? `🎨 Color: ${data.color}` : '',
          data.size ? `📏 Size: ${data.size}` : '',
          `🔢 Quantity: ${data.quantity || 1} pcs`,
          `💰 Item Price: ৳${itemTotal}`,
          `🚚 Delivery Fee: ৳${deliveryFee}`,
          `💵 Total Paid: ৳${totalAmount}`,
          `💳 Payment Method: ${paymentMethod}`,
          trxId ? `🔖 Transaction ID: ${trxId}` : '',
          `━━━━━━━━━━━━━━━━━━━━`,
          `👤 Customer Name: ${customerName}`,
          `📞 Mobile Number: ${phone}`,
          `📍 Delivery Address: ${address}`,
          `━━━━━━━━━━━━━━━━━━━━`,
          `🚚 Your parcel is being processed for fast delivery. Thank you for shopping with us!`
        ].filter(Boolean).join('\n')
      } else {
        messageText = [
          `🎉 অভিনন্দন! আপনার ৳${totalAmount} পেমেন্ট সফলভাবে যাচাই হয়েছে।`,
          ``,
          `🧾 অর্ডার রিসিট / মেমো:`,
          `━━━━━━━━━━━━━━━━━━━━`,
          `📦 অর্ডার আইডি: #${orderNumber}`,
          `🛍️ পণ্য: ${productName}`,
          data.color ? `🎨 কালার: ${data.color}` : '',
          data.size ? `📏 সাইজ: ${data.size}` : '',
          `🔢 পরিমাণ: ${data.quantity || 1} টি`,
          `💰 পণ্যের মূল্য: ৳${itemTotal}`,
          `🚚 ডেলিভারি চার্জ: ৳${deliveryFee}`,
          `💵 সর্বমোট পরিশোধিত: ৳${totalAmount}`,
          `💳 পেমেন্ট পদ্ধতি: ${paymentMethod}`,
          trxId ? `🔖 ট্রানজেকশন আইডি: ${trxId}` : '',
          `━━━━━━━━━━━━━━━━━━━━`,
          `👤 গ্রাহকের নাম: ${customerName}`,
          `📞 মোবাইল নম্বর: ${phone}`,
          `📍 ডেলিভারি ঠিকানা: ${address}`,
          `━━━━━━━━━━━━━━━━━━━━`,
          `🚚 আপনার পার্সেলটি দ্রুত ডেলিভারি করার জন্য প্রসেস করা হচ্ছে। আমাদের শপ থেকে কেনাকাটা করার জন্য ধন্যবাদ!`
        ].filter(Boolean).join('\n')
      }
    } else {
      const isCancelled = String(details?.failureReason || '').toLowerCase().includes('cancel')
      let checkoutUrl = details?.checkoutUrl
      if (!checkoutUrl) {
        const attemptRes = await queryPg(
          `SELECT checkout_url FROM public.payment_attempts WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [orderId]
        )
        checkoutUrl = attemptRes.rows[0]?.checkout_url
      }

      if (lang === 'en') {
        messageText = [
          `⚠️ Payment Notice:`,
          `Your online payment could not be completed${isCancelled ? ' (Cancelled)' : ''}.`,
          ``,
          `📦 Order ID: #${orderNumber}`,
          `💵 Total Amount: ৳${totalAmount}`,
          checkoutUrl ? `🔗 Payment Link: ${checkoutUrl}` : '',
          ``,
          `If you prefer Cash on Delivery (COD) instead, simply reply "COD" and we will confirm your order immediately!`
        ].filter(Boolean).join('\n')
      } else {
        messageText = [
          `⚠️ পেমেন্ট নোটিশ:`,
          `আপনার অনলাইন পেমেন্টটি সম্পন্ন হতে পারেনি${isCancelled ? ' (বাতিল করা হয়েছে)' : ''}।`,
          ``,
          `📦 অর্ডার আইডি: #${orderNumber}`,
          `💵 সর্বমোট বিল: ৳${totalAmount}`,
          checkoutUrl ? `🔗 পেমেন্ট লিংক: ${checkoutUrl}` : '',
          ``,
          `আপনি যদি ক্যাশ অন ডেলিভারি (COD)-তে নিতে চান, তবে শুধু "COD" লিখে রিপ্লাই দিন, আমরা সাথে সাথে আপনার অর্ডারটি কনফার্ম করে দেব!`
        ].filter(Boolean).join('\n')
      }
    }

    // Deliver message across supported platforms
    await sendCustomerDirectMessage({
      platform: agent.platform || platform,
      token,
      customerId,
      text: messageText,
      agentExternalId: agent.external_id
    })

    // Mark as notified on lead data
    const flagKey = type === 'payment_success' ? 'payment_success_notified' : 'payment_failed_notified'
    await queryPg(
      `UPDATE public.leads
          SET data = jsonb_set(data, $2, 'true'::jsonb, true)
        WHERE id = $1`,
      [orderId, `{${flagKey}}`]
    )

    // Log to chat_history
    await queryPg(
      `INSERT INTO public.chat_history (
         agent_id, user_external_id, role, content, tokens_used, customer_name, created_at
       ) VALUES ($1,$2,'assistant',$3,0,$4,now())`,
      [agent.id, customerId, messageText, customerName]
    )
  } catch (err: any) {
    console.error(`[PAYMENT NOTIFICATION ERROR] (Order ${orderId}):`, err?.message || err)
  }
}

async function sendCustomerDirectMessage(args: {
  platform: string
  token: string
  customerId: string
  text: string
  agentExternalId?: string
}) {
  const p = (args.platform || 'messenger').toLowerCase()
  if (p === 'telegram') {
    await $fetch(`https://api.telegram.org/bot${args.token}/sendMessage`, {
      method: 'POST',
      body: {
        chat_id: args.customerId,
        text: args.text
      }
    })
  } else if (p === 'whatsapp') {
    await $fetch(`https://graph.facebook.com/v21.0/${args.agentExternalId || 'me'}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.token}`,
        'Content-Type': 'application/json'
      },
      body: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: args.customerId,
        type: 'text',
        text: { body: args.text }
      }
    })
  } else {
    // Facebook Messenger / Instagram
    await $fetch(`https://graph.facebook.com/v21.0/me/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.token}`,
        'Content-Type': 'application/json'
      },
      body: {
        recipient: { id: args.customerId },
        message: { text: args.text }
      }
    })
  }
}
