import { MetadataRoute } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

export default async function manifest({ params }: { params: Promise<{ slug: string }> }): Promise<MetadataRoute.Manifest> {
  const { slug } = await params

  const { data: card } = await supabaseServer
    .from('cards')
    .select('id')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!card) {
    return {
      name: 'Kardme',
      short_name: 'Kardme',
      description: 'Cartões digitais inteligentes',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3b82f6',
      icons: [
        {
          src: '/favicon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
    }
  }

  return {
    name: 'Kardme',
    short_name: 'Kardme',
    description: 'Cartão digital',
    start_url: `/${slug}`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: `/${slug}/apple-touch-icon.png`,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
}
