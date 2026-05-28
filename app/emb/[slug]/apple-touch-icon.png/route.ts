import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'edge'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: ambassador, error } = await supabaseServer
    .from('ambassadors')
    .select('avatar_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const avatarUrl = ambassador?.avatar_url

  if (error || !avatarUrl) {
    return new Response('Not found', { status: 404 })
  }

  const res = await fetch(avatarUrl, { cache: 'no-store' })
  if (!res.ok) {
    return new Response('Not found', { status: 404 })
  }

  const contentType = res.headers.get('content-type') || 'image/png'
  const buf = await res.arrayBuffer()

  return new Response(buf, {
    status: 200,
    headers: {
      'content-type': contentType,
      // cache leve para iOS não ficar a bater sempre
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
