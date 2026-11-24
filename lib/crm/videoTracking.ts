import { supabase } from '@/lib/supabaseClient'

export async function recordVideoOpen(
  previewId: string,
  leadId: string,
  userId?: string,
  broadcastId?: string | null
) {
  try {
    const response = await fetch('/api/crm/video-open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previewId, leadId, broadcastId }),
    })
    if (!response.ok) throw new Error('Erro ao registar abertura')
  } catch (err) {
    console.error('[VIDEO TRACKING] Erro:', err)
  }
}

export async function getVideoOpens(previewId: string) {
  try {
    const { data, error } = await supabase
      .from('email_video_opens')
      .select(`
        id,
        lead_id,
        opened_at,
        duration_seconds,
        clicked_cta,
        leads(name, email)
      `)
      .eq('preview_id', previewId)
      .order('opened_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('[VIDEO TRACKING] Erro ao obter opens:', err)
    return []
  }
}

export async function getVideoOpenStats(previewId: string) {
  try {
    const { data, error } = await supabase
      .from('email_video_opens')
      .select('id, clicked_cta')
      .eq('preview_id', previewId)

    if (error) throw error

    const totalOpens = data?.length || 0
    const totalClicks = data?.filter(d => d.clicked_cta).length || 0

    return {
      totalOpens,
      totalClicks,
      clickRate: totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : '0',
    }
  } catch (err) {
    console.error('[VIDEO TRACKING] Erro ao obter stats:', err)
    return { totalOpens: 0, totalClicks: 0, clickRate: '0' }
  }
}
