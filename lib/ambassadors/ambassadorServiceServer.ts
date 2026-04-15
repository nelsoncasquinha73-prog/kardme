import { supabaseServer } from '@/lib/supabaseServer'

export async function getAmbassadorBySlugPublic(slug: string) {
  // Usa supabaseServer (service role) para contornar RLS
  // Retorna APENAS campos públicos (seguro)
  const { data, error } = await supabaseServer
    .from('ambassadors')
    .select('id, user_id, name, email, phone, bio, slug, avatar_url, cover_url, avatar_settings, cover_settings, background_color, text_color, bio_color, font_family, is_published, stats_leads, custom_fields, default_fields, ambassador_type')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    console.error('[getAmbassadorBySlugPublic] Error:', error)
    return null
  }

  return data
}
