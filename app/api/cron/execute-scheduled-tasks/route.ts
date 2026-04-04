import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { processEmailTemplate } from '@/lib/processEmailTemplate'

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase config')
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminSupabase()

    // 1. Buscar tarefas agendadas pendentes que venceram
    const now = new Date().toISOString()
    const { data: pendingTasks, error: fetchError } = await supabase
      .from('scheduled_tasks')
      .select('*, leads(id, name, email)')
      .eq('send_status', 'pending')
      .lte('due_at', now)
      .limit(50)

    if (fetchError) {
      console.error('[cron] fetch error:', fetchError)
      return NextResponse.json({ error: 'Fetch failed', details: fetchError.message }, { status: 500 })
    }

    if (!pendingTasks || pendingTasks.length === 0) {
      return NextResponse.json({ success: true, executed: 0, message: 'No pending tasks' })
    }

    let executed = 0
    let failed = 0

    // 2. Executar cada tarefa
    for (const task of pendingTasks) {
      try {
        const lead = (task as any).leads
        const recipient = task.email_recipient || (lead?.email)

        if (!recipient) {
          console.warn(`[cron] Task ${task.id}: no email recipient found`)
          
          // Marcar como falhado
          await supabase
            .from('scheduled_tasks')
            .update({
              send_status: 'failed',
              send_error: 'No email recipient found',
              updated_at: now,
            })
            .eq('id', task.id)
          
          failed++
          continue
        }

        // NOVO: Processar template com variáveis
        const htmlBody = processEmailTemplate(task.email_body, {
          nome: lead?.name || '',
          email: lead?.email || '',
        })

        // Enviar email
        const result = await sendEmail({
          to: recipient,
          subject: task.email_subject,
          html: htmlBody,
        })

        // 3. Marcar como enviado
        await supabase
          .from('scheduled_tasks')
          .update({
            send_status: 'sent',
            updated_at: now,
          })
          .eq('id', task.id)

        executed++
        console.log(`[cron] Task ${task.id} executed successfully`)
      } catch (err: any) {
        failed++
        console.error(`[cron] Task ${task.id} failed:`, err)

        // Marcar como falhado com erro
        await supabase
          .from('scheduled_tasks')
          .update({
            send_status: 'failed',
            send_error: err?.message || 'Unknown error',
            updated_at: now,
          })
          .eq('id', task.id)
      }
    }

    return NextResponse.json({
      success: true,
      executed,
      failed,
      total: pendingTasks.length,
    })
  } catch (err: any) {
    console.error('[cron] Fatal error:', err)
    return NextResponse.json(
      { error: 'Fatal error', details: err?.message || String(err) },
      { status: 500 }
    )
  }
}
