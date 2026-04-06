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
