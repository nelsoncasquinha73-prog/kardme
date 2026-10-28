import { requireCardOrderAccess } from '@/lib/requireCardOrderAccess'
import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const messages: Record<string, {
  subject: string
  title: string
  greeting: string
  received: string
  next: string
  signature: string
}> = {
  'pt-PT': {
    subject: 'Kardme - Pedido recebido com sucesso',
    title: 'Obrigado por escolheres a Kardme!',
    greeting: 'Olá',
    received: 'Recebemos o teu pedido para criar o cartão digital.',
    next: 'A nossa equipa irá analisar os dados e contactar-te se precisar de mais informações.',
    signature: 'Até breve, equipa Kardme',
  },
  it: {
    subject: 'Kardme - Richiesta ricevuta con successo',
    title: 'Grazie per aver scelto Kardme!',
    greeting: 'Ciao',
    received: 'Abbiamo ricevuto la tua richiesta per creare il tuo biglietto digitale.',
    next: 'Il nostro team esaminerà i dati e ti contatterà se avrà bisogno di ulteriori informazioni.',
    signature: 'A presto, il team Kardme',
  },
  en: {
    subject: 'Kardme - Your request has been received',
    title: 'Thank you for choosing Kardme!',
    greeting: 'Hello',
    received: 'We have received your digital business card request.',
    next: 'Our team will review your details and contact you if further information is needed.',
    signature: 'See you soon, the Kardme team',
  },
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]!)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const denied = await requireCardOrderAccess(req, slug)
    if (denied) return denied

    const body = await req.json().catch(() => ({}))
    const supportedLanguages = [
      'pt-PT', 'pt-BR', 'en', 'it', 'de', 'es', 'fr', 'ar',
    ]
    const language = supportedLanguages.includes(body?.language)
      ? body.language
      : 'pt-PT'

    const { data: order, error } = await supabaseAdmin
      .from('card_orders')
      .update({
        status: 'submetido',
        submitted_at: new Date().toISOString(),
        language,
        email_status: 'a_enviar',
        email_error: null,
      })
      .eq('slug', slug)
      .eq('status', 'rascunho')
      .select('*')
      .single()

    if (error || !order) {
      console.error('CARD_ORDER_SUBMIT_ERROR:', error?.message)
      return NextResponse.json(
        { error: 'Não foi possível submeter o pedido.' },
        { status: 400 }
      )
    }

    let emailSent = false

    try {
      const message = messages[language] || messages.en
      const name = escapeHtml(order.nome)

      const result = await sendEmail({
        to: order.email,
        subject: message.subject,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1f2937;line-height:1.7">
            <h2>${message.title}</h2>
            <p>${message.greeting} ${name},</p>
            <p>${message.received}</p>
            <p>${message.next}</p>
            <p>${message.signature}</p>
          </div>
        `,
      })

      const resendId = result.data?.id || null

      const { error: trackingError } = await supabaseAdmin
        .from('card_orders')
        .update({
          email_status: 'enviado',
          email_sent_at: new Date().toISOString(),
          email_error: null,
          email_resend_id: resendId,
        })
        .eq('slug', slug)

      if (trackingError) {
        console.error('EMAIL_TRACKING_ERROR:', trackingError.message)
      }

      emailSent = true
    } catch (emailError) {
      const errorMessage = emailError instanceof Error
        ? emailError.message
        : 'Erro desconhecido no envio do email'

      console.error('CARD_ORDER_CONFIRMATION_EMAIL_ERROR:', errorMessage)

      const { error: trackingError } = await supabaseAdmin
        .from('card_orders')
        .update({
          email_status: 'erro',
          email_error: errorMessage.slice(0, 1000),
        })
        .eq('slug', slug)

      if (trackingError) {
        console.error('EMAIL_TRACKING_ERROR:', trackingError.message)
      }
    }

    return NextResponse.json({
      ok: true,
      emailSent,
    })
  } catch (error) {
    console.error('CARD_ORDER_SUBMIT_ERROR:', error)
    return NextResponse.json(
      { error: 'Erro interno ao submeter o pedido.' },
      { status: 500 }
    )
  }
}
