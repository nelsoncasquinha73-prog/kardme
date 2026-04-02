import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

// Validar token de cron (segurança)
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
    // Validar token
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminSupabase()

    // 1. Buscar tarefas pendentes de email que venceram
    const now = new Date().toISOString()
    const { data: pendingTasks, error: fetchError } = await supabase
      .from('lead_tasks')
      .select('*, leads(id, name, email)')
      .eq('status', 'open')
      .eq('action_type', 'email')
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
        if (!lead || !lead.email) {
          console.warn(`[cron] Task ${task.id}: no lead email found`)
          failed++
          continue
        }

        // Enviar email
        const result = await sendEmail({
          to: lead.email,
          subject: task.email_subject || task.title,
          html: task.email_body || task.description || '',
        })

        const messageId = (result as any)?.id || null

        // 3. Registar execução bem-sucedida
        await supabase.from('task_execution_log').insert({
          task_id: task.id,
          user_id: task.user_id,
          success: true,
          message_id: messageId,
        })

        // 4. Marcar tarefa como done
        await supabase
          .from('lead_tasks')
          .update({
            status: 'done',
            done_at: now,
            sent_at: now,
            send_status: 'sent',
          })
          .eq('id', task.id)

        executed++
        console.log(`[cron] Task ${task.id} executed successfully`)
      } catch (err: any) {
        failed++
        console.error(`[cron] Task ${task.id} failed:`, err)

        // Registar erro
        await supabase.from('task_execution_log').insert({
          task_id: task.id,
          user_id: task.user_id,
          success: false,
          error_message: err?.message || String(err),
        })

        // Atualizar task com erro
        await supabase
          .from('lead_tasks')
          .update({
            send_status: 'failed',
            send_error: err?.message || 'Unknown error',
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
