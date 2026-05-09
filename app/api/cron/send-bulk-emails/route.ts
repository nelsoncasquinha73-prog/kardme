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

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminSupabase()
    const { searchParams } = new URL(req.url)

    if (searchParams.get('schema') === '1') {
      const { data, error } = await supabase.rpc('kardme_information_schema_columns', {
        table_name_input: 'scheduled_tasks',
      })

      // fallback se a RPC não existir
      if (error) {
        return NextResponse.json(
          {
            ok: false,
            message:
              'RPC kardme_information_schema_columns não existe. Usa o Supabase SQL editor para correr: SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = \'scheduled_tasks\' ORDER BY ordinal_position;',
            error: error.message,
          },
          { status: 200 }
        )
      }

      return NextResponse.json({ ok: true, table: 'scheduled_tasks', columns: data || [] })
    }

    return NextResponse.json({ ok: true, message: 'Cron endpoint. Use POST to process tasks.' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminSupabase()

    // TODO: implement real sending
    const { data: tasks, error: tasksError } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10)

    if (tasksError) throw tasksError
    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ ok: true, message: 'No pending tasks', processed: 0 })
    }

    let processed = 0
    for (const task of tasks) {
      try {
        const { error: updateError } = await supabase
          .from('scheduled_tasks')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', task.id)

        if (updateError) throw updateError
        processed++
      } catch (err) {
        console.error(`Failed to process task ${task.id}:`, err)
        await supabase.from('scheduled_tasks').update({ status: 'failed' }).eq('id', task.id)
      }
    }

    return NextResponse.json({ ok: true, message: 'Processed tasks', processed })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
