import { generateThumbnailWithPlayButton } from './videoThumbnailGenerator'
import { uploadEmailImage } from './emailImageUpload'

export async function generateThumbnailFromVideoUrl(
  videoUrl: string,
  userId: string
): Promise<string | null> {
  try {
    // 1. Buscar a imagem original (thumbnail)
    let imageUrl: string | null = null

    // YouTube
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (youtubeMatch) {
      const videoId = youtubeMatch[1]
      imageUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }

    // Vimeo (precisa de fetch)
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      const videoId = vimeoMatch[1]
      try {
        const res = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`)
        const data = await res.json()
        imageUrl = data[0]?.thumbnail_large || null
      } catch {
        return null
      }
    }

    if (!imageUrl) return null

    // 2. Fazer download da imagem
    const imgRes = await fetch(imageUrl)
    const blob = await imgRes.blob()
    const file = new File([blob], `thumbnail-${Date.now()}.jpg`, { type: 'image/jpeg' })

    // 3. Gerar thumbnail com play button
    const thumbnailFile = await generateThumbnailWithPlayButton(file, '#10b981')
    if (!thumbnailFile || thumbnailFile.size === 0) return null

    // 4. Upload da thumbnail final
    const { url } = await uploadEmailImage(userId, thumbnailFile)
    return url
  } catch (error) {
    console.error('[THUMBNAIL] erro ao gerar de URL:', error)
    return null
  }
}
