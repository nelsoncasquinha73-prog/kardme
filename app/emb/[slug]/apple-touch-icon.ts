import { ImageResponse } from 'next/og'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default async function Icon({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Buscar o embaixador
  const { data: ambassador } = await supabaseServer
    .from('ambassadors')
    .select('id, avatar_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!ambassador) {
    // Fallback: favicon genérico
    const response = await fetch('https://kardme.com/apple-icon.png')
    return response
  }

  if (ambassador.avatar_url) {
    // Se tiver avatar, faz redirect para o avatar
    const response = await fetch(ambassador.avatar_url)
    return response
  }

  // Fallback: favicon genérico
  const response = await fetch('https://kardme.com/apple-icon.png')
  return response
}
