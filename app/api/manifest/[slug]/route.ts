import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params

  // Tenta fetch de card primeiro
  const { data: card } = await supabaseServer
    .from('cards')
    .select('id, title')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  // Se não encontrar card, tenta ambassador
  let ambassador = null
  if (!card) {
    const { data: ambassadorData } = await supabaseServer
      .from('ambassadors')
      .select('id, name, avatar_url')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
    
    ambassador = ambassadorData
  }

  // Se não encontrou nada, retorna manifest genérico
  if (!card && !ambassador) {
    const manifest = {
      name: 'Kardme',
      short_name: 'Kardme',
      description: 'Cartões digitais inteligentes',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3b82f6',
      icons: [{ src: '/favicon-192.png', sizes: '192x192', type: 'image/png' }],
    }
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  // Se for card
  if (card) {
    const manifest = {
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

  // Se for ambassador
  if (ambassador) {
    const icons = ambassador.avatar_url
      ? [
          { src: ambassador.avatar_url, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
        ]
      : [{ src: '/favicon-192.png', sizes: '192x192', type: 'image/png' }]

    const manifest = {
      name: ambassador.name || 'Kardme',
      short_name: ambassador.name || 'Kardme',
      description: 'Cartão de embaixador',
      start_url: `/emb/${slug}`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#8B5CF6',
      icons,
    }
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }
}
