import { supabase } from '@/lib/supabaseClient'

const MAX_VIDEO_SIZE_MB = 50
const ALLOWED_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'ogg']

export async function uploadCardVideo(params: { cardId: string; file: File }) {
  const { cardId, file } = params

  // Validar tamanho
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > MAX_VIDEO_SIZE_MB) {
    throw new Error(`Vídeo muito grande (${sizeMB.toFixed(1)}MB). Máximo: ${MAX_VIDEO_SIZE_MB}MB`)
  }

  // Validar extensão
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Formato não suportado. Use: ${ALLOWED_EXTENSIONS.join(', ')}`)
  }

  const fileName = `${crypto.randomUUID()}.${ext}`
  const path = `cards/${cardId}/videos/${fileName}`

  const { error: uploadError } = await supabase.storage.from('card-assets').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('card-assets').getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}
