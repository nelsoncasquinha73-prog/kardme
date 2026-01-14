import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const { cardId, newSlugRaw } = await request.json()

    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json({ success: false, error: 'cardId é obrigatório' }, { status: 400 })
    }
    if (!newSlugRaw || typeof newSlugRaw !== 'string') {
      return NextResponse.json({ success: false, error: 'Slug é obrigatório' }, { status: 400 })
    }

    const newSlug = slugify(newSlugRaw)
    if (!newSlug) {
      return NextResponse.json({ success: false, error: 'Slug inválido' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json({ success: false, error: 'Env vars do Supabase em falta' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    })

    // Auth via Authorization header
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData?.user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    const userId = userData.user.id

    // Verificar se o cartão pertence a este user
    const { data: card, error: cardErr } = await supabaseAdmin
      .from('cards')
      .select('id, user_id')
      .eq('id', cardId)
      .single()

    if (cardErr || !card) {
      return NextResponse.json({ success: false, error: 'Cartão não encontrado' }, { status: 404 })
    }
    if (card.user_id !== userId) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    // Verificar slug único (excluindo o próprio cartão)
    const { data: existing } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('slug', newSlug)
      .neq('id', cardId)
      .maybeSingle()

    if (existing?.id) {
      return NextResponse.json({ success: false, error: 'Slug já existe' }, { status: 409 })
    }

    // Atualizar slug
    const { error: updateErr } = await supabaseAdmin
      .from('cards')
      .update({ slug: newSlug })
      .eq('id', cardId)

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, newSlug })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Erro interno' },
      { status: 500 }
    )
  }
}
