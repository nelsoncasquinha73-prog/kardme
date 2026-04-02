import { supabase } from '@/lib/supabaseClient'

export type ScheduledTask = {
  id: string
  user_id: string
  title: string
  email_subject: string
  email_body: string
  email_recipient: string | null
  email_template_id: string | null
  lead_id: string | null
  lead: { name: string } | null
  due_at: string
  send_status: 'pending' | 'sent' | 'failed'
  send_error: string | null
  created_at: string
  updated_at: string
}

type ScheduledTaskRow = {
  id: string
  user_id: string
  title: string
  email_subject: string
  email_body: string
  email_recipient: string | null
  email_template_id: string | null
  lead_id: string | null
  lead: { name: string }[] | { name: string } | null
  due_at: string
  send_status: 'pending' | 'sent' | 'failed'
  send_error: string | null
  created_at: string
  updated_at: string
}

export async function getScheduledTasks(
  userId: string,
  filters?: { send_status?: 'pending' | 'sent' | 'failed' }
): Promise<ScheduledTask[]> {
  try {
    let query = supabase
      .from('scheduled_tasks')
      .select(
        `
        id,
        user_id,
        title,
        email_subject,
        email_body,
        email_recipient,
        email_template_id,
        lead_id,
        lead:leads(name),
        due_at,
        send_status,
        send_error,
        created_at,
        updated_at
      `
      )
      .eq('user_id', userId)

    if (filters?.send_status) {
      query = query.eq('send_status', filters.send_status)
    }

    query = query.order('due_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar scheduled tasks:', error)
      return []
    }

    const normalized: ScheduledTask[] = ((data || []) as ScheduledTaskRow[]).map((task) => ({
      ...task,
      lead: Array.isArray(task.lead) ? task.lead[0] ?? null : task.lead ?? null,
    }))

    return normalized
  } catch (err) {
    console.error('Erro ao carregar scheduled tasks:', err)
    return []
  }
}

export async function getTasksStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select('send_status')
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao carregar stats:', error)
      return { pending: 0, sent: 0, failed: 0 }
    }

    const tasks = data || []
    return {
      pending: tasks.filter((t) => t.send_status === 'pending').length,
      sent: tasks.filter((t) => t.send_status === 'sent').length,
      failed: tasks.filter((t) => t.send_status === 'failed').length,
    }
  } catch (err) {
    console.error('Erro ao carregar stats:', err)
    return { pending: 0, sent: 0, failed: 0 }
  }
}

export async function cancelScheduledTask(taskId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('scheduled_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (err) {
    console.error('Erro ao cancelar tarefa:', err)
    throw err
  }
}

export async function rescheduleTask(taskId: string, userId: string, newDueAt: string) {
  try {
    const { error } = await supabase
      .from('scheduled_tasks')
      .update({ due_at: newDueAt, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (err) {
    console.error('Erro ao reagendar tarefa:', err)
    throw err
  }
}

export async function duplicateTask(taskId: string, userId: string, newDueAt: string) {
  try {
    const { data: originalTask, error: fetchError } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    const { title, email_subject, email_body, email_recipient, email_template_id, lead_id } =
      originalTask

    const { error: insertError } = await supabase.from('scheduled_tasks').insert({
      user_id: userId,
      title: `${title} (Cópia)`,
      email_subject,
      email_body,
      email_recipient,
      email_template_id,
      lead_id,
      due_at: newDueAt,
      send_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) throw insertError
  } catch (err) {
    console.error('Erro ao duplicar tarefa:', err)
    throw err
  }
}
