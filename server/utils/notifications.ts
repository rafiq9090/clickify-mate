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
