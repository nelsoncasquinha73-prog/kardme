import { NextRequest, NextResponse } from 'next/server'
import { isMailbox, openGmail, buildRawEmail, validAttachments } from '@/lib/server/gmailTransport'
import { canSendMarketing, getOwnedLead } from '@/lib/server/emailAuthorization'
import { processEmailTemplate } from '@/lib/processEmailTemplate'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('[SEND-BROADCAST] Missing env vars', { hasUrl: !!url, hasServiceKey: !!serviceKey })
    throw new Error('Missing env vars')
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function addLeadIdToVideoLinks(htmlBody: string, leadId: string): string {
  // Replace {{leadId}} placeholder with actual leadId
  return htmlBody.replace(/\{\{leadId\}\}/g, leadId)
}

// Substitui {{nome}} e outros placeholders pelo dados reais do lead
function replacePlaceholders(html: string, name: string | null, email?: string): string {
  const firstName = name ? name.split(' ')[0] : ''
  const emailVal = email || ''
  return html
    .replace(/\{\{nome\}\}/gi, firstName)
    .replace(/\{\{name\}\}/gi, firstName)
    .replace(/\{\{primeiro_nome\}\}/gi, firstName)
    .replace(/\{nome\}/gi, firstName)
    .replace(/\{email\}/gi, emailVal)
}

export async function POST(req: NextRequest) {
  try {
    const { userId, broadcastId, recipients, subject, htmlBody, recipientLeadIds, attachments, legacy } = await req.json()

    if (!userId || !broadcastId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (typeof subject !== 'string' || !subject.trim() || /[\r\n]/.test(subject) || typeof htmlBody !== 'string' || !htmlBody.trim()) {
      return NextResponse.json({ error: 'Subject and htmlBody required' }, { status: 400 })
    }

    if (!validAttachments(attachments ?? [])) {
      return NextResponse.json({ error: 'Anexos inválidos' }, { status: 400 })
    }
    const supabaseAdmin = getAdminSupabase()

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authData?.user || authData.user.id !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { data: ownedBroadcast, error: broadcastError } = await supabaseAdmin
      .from('email_broadcasts')
      .select('id, sender_card_id')
      .eq('id', broadcastId)
      .eq('user_id', userId)
      .single()

    if (broadcastError || !ownedBroadcast) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    let senderName: string | null = null
    if (ownedBroadcast.sender_card_id) {
      const { data: card } = await supabaseAdmin.from('cards').select('name, title')
        .eq('id', ownedBroadcast.sender_card_id).eq('user_id', userId).maybeSingle()
      if (!card) return NextResponse.json({ error: 'Cartão indisponível' }, { status: 404 })
      senderName = card.name || card.title || null
    }
    let templateId: string | null = null
    if (legacy?.templateId && typeof legacy.templateId === 'string' && !legacy.templateId.startsWith('default-')) {
      const { data: template } = await supabaseAdmin.from('email_templates').select('id')
        .eq('id', legacy.templateId).eq('user_id', userId).maybeSingle()
      if (!template) return NextResponse.json({ error: 'Modelo indisponível' }, { status: 404 })
      templateId = template.id
    }
    const gmail = await openGmail(userId)

    let sent = 0
    let failed = 0
    const errors: string[] = []
    const attempted = new Set<string>()

    for (let i = 0; i < recipients.length; i++) {
      const requestedEmail = recipients[i]
      const leadId = recipientLeadIds?.[i] || null
      let recipientEmail = ''

      try {
        if (!isMailbox(requestedEmail)) continue
        const pattern = requestedEmail.toLowerCase().replace(/[\\%_]/g, '\\$&')
        const { data: reference, error: referenceError } = await supabaseAdmin.from('leads')
          .select('id').eq('user_id', userId).ilike('email', pattern).limit(1).maybeSingle()
        if (referenceError) throw referenceError
        const lead = reference ? await getOwnedLead(userId, leadId || reference.id) : null
        if (!lead || !isMailbox(lead.email?.trim()) || lead.email.trim().toLowerCase() !== requestedEmail.toLowerCase()) continue
        recipientEmail = lead.email.trim()
        const leadName = lead.name

        if (lead.marketing_opt_in !== true || !(await canSendMarketing(userId, recipientEmail))) continue

        const normalizedEmail = recipientEmail.toLowerCase()
        if (attempted.has(normalizedEmail)) continue
        attempted.add(normalizedEmail)

        let personalizedHtmlBody = legacy
          ? processEmailTemplate(htmlBody, { nome: leadName, email: recipientEmail })
            .replace('</body>', '<p><a href="{UNSUBSCRIBE_URL}">Cancelar subscrição</a></p></body>')
          : replacePlaceholders(htmlBody, leadName, recipientEmail)

        // 2. Adicionar lead_id aos links de vídeo
        if (leadId) {
          personalizedHtmlBody = addLeadIdToVideoLinks(personalizedHtmlBody, leadId)
        }

        // 3. Substituir URLs de unsubscribe
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/email/unsubscribe?broadcastId=${broadcastId}&email=${encodeURIComponent(recipientEmail)}`
        const managePreferencesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/email/preferences?broadcastId=${broadcastId}&email=${encodeURIComponent(recipientEmail)}`

        personalizedHtmlBody = personalizedHtmlBody
          .replace('{UNSUBSCRIBE_URL}', unsubscribeUrl)
          .replace('{MANAGE_PREFERENCES_URL}', managePreferencesUrl)

        const deliveredSubject = legacy ? subject.replace('{nome}', () => leadName || '').replace(/[\r\n]/g, ' ') : subject
        const raw = buildRawEmail({ fromEmail: gmail.senderEmail, fromName: senderName, to: recipientEmail,
          subject: deliveredSubject, htmlBody: personalizedHtmlBody, unsubscribeUrl, attachments })
        const messageId = await gmail.sendRaw(raw)
        console.log(`[SUCCESS] Email sent to ${recipientEmail}, messageId: ${messageId}`)

        const insertPayload: Record<string, any> = { broadcast_id: broadcastId, email: recipientEmail, status: 'sent' }
        if (leadId) insertPayload.lead_id = leadId

        const { error: insertError } = await supabaseAdmin
          .from('email_broadcast_recipients')
          .insert(insertPayload)

        if (insertError) {
          console.error(`[DB INSERT FAILED] ${recipientEmail}: ${insertError.message}`)
          errors.push(`${recipientEmail}: DB insert failed - ${insertError.message}`)
        } else {
          console.log(`[DB INSERT OK] ${recipientEmail}`)
        }

        if (legacy && leadId) {
          const { error } = await supabaseAdmin.from('message_history').insert({
            user_id: userId, lead_id: leadId, recipient_email: recipientEmail,
            subject: deliveredSubject, body: personalizedHtmlBody, template_id: templateId,
            message_id: messageId, sent_at: new Date().toISOString(),
          })
          if (error) console.error('[SEND-BROADCAST] Failed to record legacy message history', error.code)
        }

        // Registar atividade no CRM (scheduled_task como histórico)
        if (leadId) {
          const { error: taskError } = await supabaseAdmin.from('scheduled_tasks').insert({
            user_id: userId,
            lead_id: leadId,
            title: `📧 Email enviado: ${subject}`,
            email_subject: subject,
            email_body: personalizedHtmlBody,
            email_recipient: recipientEmail,
            due_at: new Date().toISOString(),
            send_status: 'sent',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            attachments: [],
          })
          if (taskError) {
            console.error(`[TASK INSERT FAILED] ${recipientEmail}: ${taskError.message}`)
          }

          // Registar também em lead_activities para aparecer no histórico
          await supabaseAdmin.from('lead_activities').insert({
            lead_id: leadId,
            user_id: userId,
            type: 'email_sent',
            title: `📧 Email enviado: ${subject}`,
            meta: { broadcastId, email: recipientEmail },
            created_at: new Date().toISOString(),
          })
        }

        sent++
      } catch (err: any) {
        failed++
        const errMsg = err?.message || String(err)
        console.error(`[FAILED] ${recipientEmail}: ${errMsg}`)
        errors.push(`${recipientEmail}: ${errMsg}`)
      }
    }

    const newStatus = sent > 0 ? 'sent' : 'draft'

    await supabaseAdmin
      .from('email_broadcasts')
      .update({ status: newStatus, sent_at: sent > 0 ? new Date().toISOString() : null, total_recipients: sent })
      .eq('id', broadcastId)

    if (sent === 0) {
      return NextResponse.json({ error: 'Nenhum email foi enviado', sent, failed, errors }, { status: 500 })
    }

    return NextResponse.json({ success: true, sent, failed, errors: errors.length > 0 ? errors : undefined })
  } catch (err: any) {
    console.error('Send broadcast error:', err)
    return NextResponse.json({ error: 'Failed to send broadcast', details: err?.message || String(err) }, { status: 500 })
  }
}
