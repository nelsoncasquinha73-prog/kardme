export async function generateThumbnailFromVideoUrl(
  videoUrl: string,
  userId: string
): Promise<string | null> {
  try {
    let imageUrl: string | null = null

    // YouTube - tenta em cascata (maxres → sd → hq → mq)
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (youtubeMatch) {
      const videoId = youtubeMatch[1]
      const candidates = [
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      ]

      for (const c of candidates) {
        try {
          const r = await fetch(c, { method: 'GET' })
          if (r.ok) {
            imageUrl = c
            break
          }
        } catch {}
      }
    }

    // Vimeo
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

    return imageUrl
  } catch {
    return null
  }
}
