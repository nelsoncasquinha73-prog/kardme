import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
  const from = process.env.RESEND_FROM || 'Kardme <onboarding@resend.dev>'

  return resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  })
}
