// Detecta e extrai info de links de vídeo (YouTube, Vimeo, upload)

export interface VideoLinkInfo {
  type: 'youtube' | 'vimeo' | 'upload' | 'unknown'
  videoId?: string
  thumbnailUrl?: string
  url: string
}

export function parseVideoLink(url: string): VideoLinkInfo {
  if (!url) return { type: 'unknown', url }

  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (youtubeMatch) {
    const videoId = youtubeMatch[1]
    return {
      type: 'youtube',
      videoId,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      url,
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    const videoId = vimeoMatch[1]
    return {
      type: 'vimeo',
      videoId,
      thumbnailUrl: `https://vimeo.com/api/v2/video/${videoId}.json`, // Nota: isto retorna JSON, precisamos de fetch
      url,
    }
  }

  // Upload (Supabase URL)
  if (url.includes('supabase') || url.includes('storage')) {
    return { type: 'upload', url }
  }

  return { type: 'unknown', url }
}

export async function getVimeoThumbnail(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`)
    const data = await res.json()
    return data[0]?.thumbnail_large || null
  } catch {
    return null
  }
}
