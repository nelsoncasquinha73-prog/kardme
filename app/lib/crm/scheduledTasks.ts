import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ScheduledEmailTask {
  user_id: string
  title: string
  email_subject: string
  email_body: string
  email_recipient?: string
  lead_id?: string
  due_at: string // ISO timestamp
  attachments?: Array<{ filename: string; mimeType: string; base64: string }>
  email_source_type?: 'new' | 'broadcast' | 'email_template'
  email_source_id?: string
}

export async function createScheduledEmailTask(task: ScheduledEmailTask): Promise<string> {
  const { data, error } = await supabase
    .from('scheduled_tasks')
    .insert([
      {
        user_id: task.user_id,
        title: task.title,
        email_subject: task.email_subject,
        email_body: task.email_body,
        email_recipient: task.email_recipient,
        lead_id: task.lead_id,
        due_at: task.due_at,
        attachments: task.attachments || null,
        email_source_type: task.email_source_type,
        email_source_id: task.email_source_id,
        send_status: 'pending',
      },
    ])
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function getScheduledTask(taskId: string) {
  const { data, error } = await supabase
    .from('scheduled_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error) throw error
  return data
}
