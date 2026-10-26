import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization') || ''

    if (!authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const token = authorization.slice(7).trim()

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token)

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('academy_tutorials')
      .select('id, title, description, category, youtube_url, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao carregar os tutoriais' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { tutorials: data || [] },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('[academy/tutorials]', error)

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
