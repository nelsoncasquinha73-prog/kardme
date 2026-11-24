import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { canSendMarketing, getOwnedLead, isAuthorizedCron } from '@/lib/server/emailAuthorization'
import { sendGmail, validAttachments } from '@/lib/server/gmailTransport'

export async function POST(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (process.env.ENABLE_LEGACY_GMAIL_CRON !== 'true') {
    return NextResponse.json({ error: 'Executor legado por confirmar' }, { status: 503 })
  }

  try {
    const supabase = supabaseAdmin

    // Fetch pending tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('send_status', 'pending')
      .lte('due_at', new Date().toISOString())
      .limit(50)

    if (tasksError) throw tasksError
    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ ok: true, message: 'No pending tasks', processed: 0 })
    }

    let processed = 0
    let failed = 0

    for (const task of tasks) {
      try {
        const lead = await getOwnedLead(task.user_id, task.lead_id)
        const email = lead?.email?.trim()
        if (!lead || !email || lead.marketing_opt_in !== true || !(await canSendMarketing(task.user_id, email))) {
          throw new Error('Destinatário sem autorização válida')
        }
        const attachments = task.attachments ?? []
        if (!validAttachments(attachments)) throw new Error('Anexos inválidos')
        let templateId: string | undefined
        if (task.email_template_id && !task.email_template_id.startsWith('default-')) {
          const { data: template } = await supabase.from('email_templates').select('id')
            .eq('id', task.email_template_id).eq('user_id', task.user_id).maybeSingle()
          if (!template) throw new Error('Modelo indisponível')
          templateId = template.id
        }
        const messageId = await sendGmail({
          userId: task.user_id, leadId: lead.id, recipientEmail: email, subject: task.email_subject,
          body: task.email_body, templateId, attachments,
          fromName: task.email_source_type === 'broadcast' ? 'Kardme' : undefined,
        })
        if (!messageId) throw new Error('Entrega Gmail por reconciliar')

        // Mark as sent
        const { error: updateError } = await supabase
          .from('scheduled_tasks')
          .update({
            send_status: 'sent',
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        if (updateError) throw updateError
        processed++
      } catch (err: any) {
        failed++
        const errorMsg = err?.message || String(err)
        console.error(`Failed to send task ${task.id}:`, errorMsg)

        // Mark as failed with error message
        await supabase
          .from('scheduled_tasks')
          .update({
            send_status: 'failed',
            send_error: errorMsg.slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Cron completed',
      processed,
      failed,
      total: tasks.length,
    })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    ok: true,
    message: 'Cron endpoint for bulk email sending. Use POST to trigger.',
  })
}
