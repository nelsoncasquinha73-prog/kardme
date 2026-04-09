/**
 * Optimiza URLs do Supabase Storage com transformações automáticas.
 * Supabase suporta: width, height, quality, resize (cover/contain/fill)
 * Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
 */

type ImageOptions = {
  width?: number
  quality?: number
  resize?: 'cover' | 'contain' | 'fill'
}

export function optimizeImageUrl(url: string | null | undefined, opts: ImageOptions = {}): string {
  if (!url) return ''

  // Só optimiza URLs do Supabase Storage
  if (!url.includes('.supabase.co/storage/v1/object/public/')) return url

  const { width = 800, quality = 75, resize = 'cover' } = opts

  // Converte /object/public/ para /render/v1/public/
  const optimizedUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  )

  const params = new URLSearchParams()
  if (width) params.set('width', String(width))
  if (quality) params.set('quality', String(quality))
  if (resize) params.set('resize', resize)

  return `${optimizedUrl}?${params.toString()}`
}

// Presets comuns
export const imgPresets = {
  avatar: (url: string) => optimizeImageUrl(url, { width: 200, quality: 80, resize: 'cover' }),
  gallery: (url: string) => optimizeImageUrl(url, { width: 800, quality: 75, resize: 'cover' }),
  galleryThumb: (url: string) => optimizeImageUrl(url, { width: 400, quality: 70, resize: 'cover' }),
  header: (url: string) => optimizeImageUrl(url, { width: 900, quality: 75, resize: 'cover' }),
  service: (url: string) => optimizeImageUrl(url, { width: 600, quality: 75, resize: 'cover' }),
  background: (url: string) => optimizeImageUrl(url, { width: 1200, quality: 70, resize: 'cover' }),
}
