export const sendAdminAlert = async (subject: string, message: string) => {
    const config = useRuntimeConfig()
    const resendKey = process.env.RESEND_API_KEY || (config.public as any)?.resendApiKey
    const adminEmail = process.env.ADMIN_EMAIL || 'islamrafiq9090@gmail.com'

    console.error(`[ADMIN ALERT]: ${subject} - ${message}`)

    if (!resendKey || !adminEmail || adminEmail.includes('example.com')) {
        console.warn('[MAILER]: Admin Email or Resend Key not configured. Skipping email.')
        return
    }

    try {
        await $fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
            },
            body: {
                from: 'Clickify Mate <onboarding@resend.dev>',
                to: adminEmail,
                subject: `🚨 SYSTEM ALERT: ${subject}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ff4444; border-radius: 8px;">
                        <h2 style="color: #ff4444;">System Error Detected</h2>
                        <p><strong>Error Type:</strong> ${subject}</p>
                        <p><strong>Details:</strong> ${message}</p>
                        <p style="margin-top: 20px; font-size: 12px; color: #666;">
                            This is an automated alert from your AI Toolkit. Please check your dashboard.
                        </p>
                    </div>
                `
            }
        })
        console.log('[MAILER]: Admin alert email sent successfully.')
    } catch (err: any) {
        console.error('[MAILER ERROR]: Failed to send alert email:', err.message)
    }
}

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

export async function sendPasswordResetEmail(email: string, code: string) {
    const resendKey = process.env.RESEND_API_KEY
    const from = process.env.AUTH_EMAIL_FROM || 'Clickify Mate <onboarding@resend.dev>'

    if (!resendKey) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Password reset email delivery is not configured.')
        }
        console.info(`[AUTH DEV]: Password reset code for ${email}: ${code}`)
        return
    }

    try {
        const response: any = await $fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
            },
            body: {
                from,
                to: email,
                subject: '🚀 Clickify Mate Password Recovery Code',
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; background: #fafafa;">
                    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f0f0f0;">
                      <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #6366f1; font-size: 24px; margin: 0; font-weight: 800;">Clickify Mate</h1>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Account Security & Recovery</p>
                      </div>
                      
                      <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello,</p>
                      <p style="color: #374151; font-size: 15px; line-height: 1.5;">You requested a password reset for your Clickify Mate account. Enter this 12-character recovery code in your browser:</p>
                      
                      <div style="margin: 28px 0; padding: 18px 24px; background: #f5f3ff; border: 2px dashed #a78bfa; border-radius: 12px; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #4338ca; text-align: center;">
                        ${escapeHtml(code)}
                      </div>
                      
                      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                        This recovery code expires in 15 minutes.<br>
                        If you did not request this, you can safely ignore this email.
                      </p>
                    </div>
                  </div>
                `
            }
        })
        console.log(`[PASSWORD RESET]: Email successfully dispatched via Resend to ${email} (ID: ${response?.id})`)
    } catch (err: any) {
        console.error(`[PASSWORD RESET ERROR]: Failed to send email via Resend:`, err?.data || err?.message || err)
    }
}
