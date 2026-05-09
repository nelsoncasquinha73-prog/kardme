import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminSupabase()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
        // Call /api/send-email with correct payload
        const sendRes = await fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: task.user_id,
            leadId: task.lead_id,
            recipientEmail: task.email_recipient,
            subject: task.email_subject,
            body: task.email_body,
            templateId: task.email_template_id,
            attachments: task.attachments || [],
            fromName: task.email_source_type === 'broadcast' ? 'Kardme' : undefined,
          }),
        })

        if (!sendRes.ok) {
          const errorText = await sendRes.text()
          throw new Error(`Send failed: ${sendRes.status} ${errorText}`)
        }

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
  return NextResponse.json({
    ok: true,
    message: 'Cron endpoint for bulk email sending. Use POST to trigger.',
  })
}
