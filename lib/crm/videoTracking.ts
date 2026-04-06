import { supabase } from '@/lib/supabaseClient'

export async function recordVideoOpen(
  previewId: string,
  leadId: string,
  userId?: string
) {
  try {
    // Se não temos userId, tentamos obter da sessão
    let finalUserId = userId
    if (!finalUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      finalUserId = user?.id
    }

    if (!finalUserId) {
      console.warn('[VIDEO TRACKING] Sem user_id, não registando abertura')
      return
    }

    const { error } = await supabase
      .from('email_video_opens')
      .insert({
        preview_id: previewId,
        lead_id: leadId,
        user_id: finalUserId,
        opened_at: new Date().toISOString(),
      })

    if (error) {
      console.error('[VIDEO TRACKING] Erro ao registar abertura:', error)
      return
    }

    console.log('[VIDEO TRACKING] Abertura registada:', { previewId, leadId })
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
