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

  // Buscar o cartão e o bloco de perfil
  const { data: card } = await supabaseServer
    .from('cards')
    .select('id')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!card) {
    // Fallback: rhino favicon
    const response = await fetch('https://kardme.com/apple-icon.png')
    return response
  }

  const { data: profileBlock } = await supabaseServer
    .from('card_blocks')
    .select('settings')
    .eq('card_id', card.id)
    .eq('type', 'profile')
    .eq('enabled', true)
    .single()

  const avatarUrl = profileBlock?.settings?.avatar?.image

  if (avatarUrl) {
    // Se tiver avatar, faz redirect para o avatar
    const response = await fetch(avatarUrl)
    return response
  }

  // Fallback: rhino favicon
  const response = await fetch('https://kardme.com/apple-icon.png')
  return response
}
