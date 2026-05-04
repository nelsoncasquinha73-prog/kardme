import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  const { data: magnet, error } = await supabaseAdmin
    .from('lead_magnets')
    .select('file_url, is_active')
    .eq('slug', slug)
    .single()

  if (error || !magnet || magnet.is_active === false || !magnet.file_url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const url = (magnet.file_url || '').trim()
  return NextResponse.redirect(url, 302)
}
