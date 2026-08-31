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
                subject: 'Clickify Mate Password Recovery Code',
                html: `
                  <div style="font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background-color: #E0D8EB;">
                    <div style="max-width: 460px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; padding: 36px 32px; box-shadow: 0 10px 30px rgba(52, 31, 55, 0.08); border: 1px solid #D8CEE6;">
                      <div style="text-align: center; margin-bottom: 28px;">
                        <h1 style="color: #341F37; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Clickify Mate</h1>
                        <p style="color: #6e5873; font-size: 13px; margin-top: 6px; font-weight: 500;">Account Security & Recovery</p>
                      </div>
                      
                      <p style="color: #2b172e; font-size: 15px; line-height: 1.6; margin: 0 0 10px 0;">Hello,</p>
                      <p style="color: #4b364e; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">You requested a password reset for your Clickify Mate account. Enter this 12-character recovery code in your browser to proceed:</p>
                      
                      <div style="margin: 24px 0; padding: 18px 24px; background-color: #F9F5FF; border: 1.5px solid #D8CEE6; border-radius: 14px; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #341F37; text-align: center;">
                        ${escapeHtml(code)}
                      </div>
                      
                      <p style="color: #8a758f; font-size: 12px; text-align: center; margin: 28px 0 0 0; line-height: 1.5;">
                        This recovery code expires in 15 minutes.<br>
                        If you did not request this, you can safely ignore this email.
                      </p>
                    </div>
                  </div>
                `
            }
        })
    } catch (err: any) {
        if (err?.data?.statusCode === 403 || err?.statusCode === 403) {
            console.warn(`[RESEND SANDBOX]: Free Resend sandbox can only send to your account email (islamrafiq9090@gmail.com). To send to other recipients (${email}), verify your domain at resend.com/domains.`)
        } else {
            console.error(`[PASSWORD RESET ERROR]: Failed to send email via Resend:`, err?.data || err?.message || err)
        }
    }
}
