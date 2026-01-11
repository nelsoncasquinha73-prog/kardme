import { supabase } from '@/lib/supabaseClient'

type Kind = 'cover' | 'avatar' | 'gallery' | 'badge'

export async function uploadCardImage(params: {
  cardId: string
  file: File
  kind: Kind
}) {
  const { cardId, file, kind } = params

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'

  // Se quiseres permitir SVG para logos, mete 'svg' aqui.
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext) ? ext : 'jpg'

  const fileName = `${crypto.randomUUID()}.${safeExt}`

  const path =
    kind === 'gallery'
      ? `cards/${cardId}/gallery/${fileName}`
      : `cards/${cardId}/${kind}.${safeExt}`

  const { error: uploadError } = await supabase.storage
    .from('card-assets')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('card-assets').getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}
