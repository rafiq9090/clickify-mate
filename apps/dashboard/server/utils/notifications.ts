export const sendAdminAlert = async (subject: string, message: string) => {
    const config = useRuntimeConfig()
    const resendKey = process.env.RESEND_API_KEY || config.public.resendApiKey
    const adminEmail = process.env.ADMIN_EMAIL || 'your-email@example.com'

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
                from: 'AI Agent Alert <alerts@resend.dev>',
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
    const from = process.env.AUTH_EMAIL_FROM || 'Clickify Mate <auth@resend.dev>'
    if (!resendKey) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Password reset email delivery is not configured.')
        }
        console.info(`[AUTH DEV]: Password reset code for ${email}: ${code}`)
        return
    }

    await $fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
        },
        body: {
            from,
            to: email,
            subject: 'Your Clickify Mate password reset code',
            html: `<p>Your password reset code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:3px">${escapeHtml(code)}</p><p>This code expires in 15 minutes. If you did not request it, ignore this email.</p>`
        }
    })
}
