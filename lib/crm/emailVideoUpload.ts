import { supabase } from '@/lib/supabaseClient'

export async function uploadEmailVideo(
  userId: string,
  file: File
): Promise<{ url: string; path: string }> {
  if (!file) throw new Error('Ficheiro não selecionado')

  // Validar tipo de ficheiro
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Apenas MP4, WebM e MOV são permitidos')
  }

  // Validar tamanho (máx 50MB)
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Ficheiro muito grande (máx 50MB)')
  }

  // Gerar nome único
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop() || 'mp4'
  const fileName = `email-video-${userId}-${timestamp}-${random}.${extension}`
  const filePath = `email-videos/${fileName}`

  // Upload para Supabase Storage
  const { data, error } = await supabase.storage
    .from('card-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Erro ao fazer upload:', error)
    throw new Error(`Erro ao fazer upload: ${error.message}`)
  }

  // Gerar URL pública
  const { data: publicData } = supabase.storage
    .from('card-assets')
    .getPublicUrl(filePath)

  return {
    url: publicData.publicUrl,
    path: filePath,
  }
}

export async function deleteEmailVideo(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('card-assets')
    .remove([filePath])

  if (error) {
    console.error('Erro ao apagar vídeo:', error)
    throw new Error(`Erro ao apagar vídeo: ${error.message}`)
  }
}
