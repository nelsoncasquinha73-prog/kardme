import { supabase } from '@/lib/supabaseClient'

export async function uploadEmailImage(
  userId: string,
  file: File
): Promise<{ url: string; path: string }> {
  if (!file) throw new Error('Ficheiro não selecionado')

  // Validar tipo de ficheiro
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Apenas JPEG, PNG, GIF e WebP são permitidos')
  }

  // Validar tamanho (máx 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ficheiro muito grande (máx 5MB)')
  }

  // Gerar nome único
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `email-${userId}-${timestamp}-${random}.${extension}`
  const filePath = `email-images/${fileName}`

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

export async function deleteEmailImage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('card-assets')
    .remove([filePath])

  if (error) {
    console.error('Erro ao apagar imagem:', error)
    throw new Error(`Erro ao apagar imagem: ${error.message}`)
  }
}
