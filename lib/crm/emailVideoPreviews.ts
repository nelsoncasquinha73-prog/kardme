import { supabase } from '@/lib/supabaseClient'

export interface EmailVideoPreview {
  id: string
  user_id: string
  broadcast_id?: string | null
  video_url: string
  thumbnail_url?: string | null
  title?: string | null
  description?: string | null
  cta_text?: string | null
  cta_url?: string | null
  view_count?: number
  click_count?: number
  created_at?: string
  updated_at?: string
}

export async function createEmailVideoPreview(
  userId: string,
  data: {
    broadcast_id?: string | null
    video_url: string
    thumbnail_url?: string | null
    title?: string | null
    description?: string | null
    cta_text?: string | null
    cta_url?: string | null
  }
) {
  const { data: result, error } = await supabase
    .from('email_video_previews')
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar video preview:', error)
    throw new Error(error.message)
  }

  return result as EmailVideoPreview
}

export async function getEmailVideoPreview(id: string) {
  const { data, error } = await supabase
    .from('email_video_previews')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar video preview:', error)
    throw new Error(error.message)
  }

  return data as EmailVideoPreview
}

export async function incrementVideoPreviewView(id: string) {
  const { error } = await supabase.rpc('increment_email_video_preview_view', {
    preview_id: id,
  })

  if (error) {
    console.error('Erro ao incrementar views:', error)
  }
}

export async function incrementVideoPreviewClick(id: string) {
  const { error } = await supabase.rpc('increment_email_video_preview_click', {
    preview_id: id,
  })

  if (error) {
    console.error('Erro ao incrementar clicks:', error)
  }
}

export async function getVideoOpensByLead(previewId: string) {
  const { data, error } = await supabase
    .from('email_video_opens')
    .select(`
      id,
      lead_id,
      opened_at,
      duration_seconds,
      clicked_cta,
      leads(id, name, email)
    `)
    .eq('preview_id', previewId)
    .order('opened_at', { ascending: false })

  if (error) {
    console.error('Erro ao obter opens:', error)
    return []
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    leadId: item.lead_id,
    leadName: item.leads?.name || 'Sem nome',
    leadEmail: item.leads?.email || 'Sem email',
    openedAt: item.opened_at,
    durationSeconds: item.duration_seconds,
    clickedCta: item.clicked_cta,
  }))
}

export async function getVideoOpenStats(previewId: string) {
  const { data, error } = await supabase
    .from('email_video_opens')
    .select('id, clicked_cta')
    .eq('preview_id', previewId)

  if (error) {
    console.error('Erro ao obter stats:', error)
    return { totalOpens: 0, totalClicks: 0, clickRate: '0' }
  }

  const totalOpens = data?.length || 0
  const totalClicks = data?.filter((d) => d.clicked_cta).length || 0
  const clickRate = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : '0'

  return { totalOpens, totalClicks, clickRate }
}
