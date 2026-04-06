import { supabase } from '@/lib/supabaseClient'

export async function subscribeToVideoViews(
  userId: string,
  onNewView: (data: { previewId: string; timestamp: string; viewCount: number }) => void
) {
  const subscription = supabase
    .channel(`video-views:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'email_video_previews',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        onNewView({
          previewId: payload.new.id,
          timestamp: new Date().toLocaleTimeString('pt-PT'),
          viewCount: payload.new.view_count || 0,
        })
      }
    )
    .subscribe()

  return subscription
}

export async function getVideoStats(previewId: string) {
  const { data, error } = await supabase
    .from('email_video_previews')
    .select('id, view_count, click_count, created_at')
    .eq('id', previewId)
    .single()

  if (error) {
    console.error('Erro ao buscar stats:', error)
    return null
  }

  return data
}
