import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendGmail, isMailbox, validAttachments } from '@/lib/server/gmailTransport'
import { canSendMarketing, getOwnedLead, ownsCard } from '@/lib/server/emailAuthorization'

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1]
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data.user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    const userId = data.user.id
    const payload = await request.json().catch(() => null)
    const { leadId, cardId, subject, body, templateId, attachments = [] } = payload || {}
    if (typeof leadId !== 'string' || typeof subject !== 'string' || !subject.trim() ||
        /[\r\n]/.test(subject) || typeof body !== 'string' || !body.trim() ||
        (cardId != null && typeof cardId !== 'string') ||
        (templateId != null && typeof templateId !== 'string') ||
        !validAttachments(attachments)) {
      return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
    }

    const lead = await getOwnedLead(userId, leadId)
    if (!lead || (cardId && !(await ownsCard(userId, cardId)))) {
      return NextResponse.json({ error: 'Lead ou cartão indisponível' }, { status: 404 })
    }
    const recipientEmail = lead.email?.trim()
    if (!isMailbox(recipientEmail) || lead.marketing_opt_in !== true ||
        !(await canSendMarketing(userId, recipientEmail))) {
      return NextResponse.json({ error: 'Destinatário sem autorização válida' }, { status: 403 })
    }

    let ownedTemplateId: string | undefined
    if (templateId && !templateId.startsWith('default-')) {
      const { data: template } = await supabaseAdmin.from('email_templates').select('id')
        .eq('id', templateId).eq('user_id', userId).maybeSingle()
      if (!template) return NextResponse.json({ error: 'Modelo indisponível' }, { status: 404 })
      ownedTemplateId = template.id
    }

    const messageId = await sendGmail({
      userId, leadId: lead.id, recipientEmail, subject, body, templateId: ownedTemplateId, attachments,
    })
    return NextResponse.json({ success: true, messageId })
  } catch {
    return NextResponse.json({ error: 'Não foi possível enviar o email' }, { status: 500 })
  }
}
