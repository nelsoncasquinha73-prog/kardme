import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }> | null
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
    attachmentsCount: params.attachments?.length || 0,
  })

  try {
    const emailPayload: any = {
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }

    // Adicionar anexos se existirem
    if (params.attachments && params.attachments.length > 0) {
      emailPayload.attachments = params.attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/octet-stream',
      }))
    }

    const result = await resend.emails.send(emailPayload)
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
