import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params

  const { data: card } = await supabaseServer
    .from('cards')
    .select('id')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  const manifest = !card
    ? {
        name: 'Kardme',
        short_name: 'Kardme',
        description: 'Cartões digitais inteligentes',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3b82f6',
        icons: [{ src: '/favicon-192.png', sizes: '192x192', type: 'image/png' }],
      }
    : {
        name: 'Kardme',
        short_name: 'Kardme',
        description: 'Cartão digital',
        start_url: `/${slug}`,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3b82f6',
        icons: [
          { src: `/${slug}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
          { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
        ],
      }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
