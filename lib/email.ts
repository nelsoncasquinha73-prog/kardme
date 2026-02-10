import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_CONFIG_ERROR: Missing RESEND_API_KEY')
    throw new Error('Missing RESEND_API_KEY')
  }
  
  const from = process.env.RESEND_FROM || 'Kardme <onboarding@resend.dev>'
  
  console.log('RESEND_SEND_ATTEMPT', {
    to: params.to,
    from,
    subject: params.subject,
  })

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    console.log('RESEND_SEND_SUCCESS', result)
    return result
  } catch (err: any) {
    console.error('RESEND_SEND_ERROR', {
      message: err?.message,
      statusCode: err?.statusCode,
      to: params.to,
    })
    throw err
  }
}
