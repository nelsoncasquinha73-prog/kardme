export function parseVideoLink(url: string): { type: 'youtube' | 'vimeo' | 'upload'; id?: string } {
  if (!url) return { type: 'upload' }

  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (youtubeMatch) {
    return { type: 'youtube', id: youtubeMatch[1] }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] }
  }

  // Upload direto
  return { type: 'upload' }
}

export function generateThumbnailFromVideoUrl(url: string, userId: string): Promise<string | null> {
  if (!url) return Promise.resolve(null)

  const videoInfo = parseVideoLink(url)

  if (videoInfo.type === 'youtube' && videoInfo.id) {
    return fetchYoutubeThumbnail(videoInfo.id)
  }

  if (videoInfo.type === 'vimeo' && videoInfo.id) {
    return fetchVimeoThumbnail(videoInfo.id)
  }

  return Promise.resolve(null)
}

async function fetchYoutubeThumbnail(videoId: string): Promise<string | null> {
  const qualities = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault']

  for (const quality of qualities) {
    const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (res.ok) return url
    } catch (e) {
      // continue
    }
  }

  return null
}

async function fetchVimeoThumbnail(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`)
    if (res.ok) {
      const data = await res.json()
      return data[0]?.thumbnail_large || data[0]?.thumbnail_medium || null
    }
  } catch (e) {
    console.error('Erro ao buscar thumbnail Vimeo:', e)
  }
  return null
}
