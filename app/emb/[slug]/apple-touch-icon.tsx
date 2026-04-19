import { ImageResponse } from 'next/og'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function Icon({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: ambassador } = await supabaseServer
    .from('ambassadors')
    .select('avatar_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const avatarUrl = ambassador?.avatar_url

  // Fallback simples (círculo com K)
  if (!avatarUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#8B5CF6',
            color: 'white',
            fontSize: 96,
            fontWeight: 800,
            borderRadius: 36,
          }}
        >
          K
        </div>
      ),
      size
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        <img
          src={avatarUrl}
          style={{
            width: 180,
            height: 180,
            objectFit: 'cover',
            borderRadius: 36,
          }}
        />
      </div>
    ),
    size
  )
}
