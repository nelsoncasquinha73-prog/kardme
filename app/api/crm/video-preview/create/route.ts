import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing env vars')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const { video_url, thumbnail_url, title, broadcast_id } = await req.json()
    const userId = req.headers.get('x-user-id')

    if (!video_url) {
      return NextResponse.json({ error: 'video_url obrigatório' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminSupabase()

    const { data, error } = await supabaseAdmin
      .from('email_video_previews')
      .insert({
        user_id: userId,
        video_url,
        thumbnail_url: thumbnail_url || null,
        title: title || null,
        broadcast_id: broadcast_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[VIDEO-PREVIEW-CREATE] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[VIDEO-PREVIEW-CREATE]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar preview' },
      { status: 500 }
    )
  }
}
