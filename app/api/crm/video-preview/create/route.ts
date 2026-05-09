import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { createEmailVideoPreview } from '@/lib/crm/emailVideoPreviews'

export async function POST(req: NextRequest) {
  try {
    const { video_url, thumbnail_url, title } = await req.json()

    if (!video_url) {
      return NextResponse.json({ error: 'video_url obrigatório' }, { status: 400 })
    }

    // Obter user da sessão (via cookies)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Criar preview
    const preview = await createEmailVideoPreview(user.id, {
      video_url,
      thumbnail_url,
      title: title || 'Video',
    })

    return NextResponse.json(preview)
  } catch (error) {
    console.error('[VIDEO-PREVIEW-CREATE]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar preview' },
      { status: 500 }
    )
  }
}
