import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireCardOrderAdmin } from '@/lib/requireCardOrderAdmin'

export const runtime = 'nodejs'

const LANGUAGES = [
  'pt-PT', 'pt-BR', 'en', 'it',
  'de', 'es', 'fr', 'ar',
]

export async function GET(req: NextRequest) {
  const denied = await requireCardOrderAdmin(req)
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('card_order_teams')
    .select('id, slug, name, default_language, active, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ teams: data || [] })
}

export async function POST(req: NextRequest) {
  const denied = await requireCardOrderAdmin(req)
  if (denied) return denied

  try {
    const body = await req.json()

    const name = String(body.name || '').trim()
    const slug = String(body.slug || '').trim().toLowerCase()
    const language = String(body.default_language || 'en')

    if (!name || name.length > 120) {
      return NextResponse.json(
        { error: 'Nome de equipa inválido.' },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
      return NextResponse.json(
        { error: 'Identificador inválido.' },
        { status: 400 }
      )
    }

    if (!LANGUAGES.includes(language)) {
      return NextResponse.json(
        { error: 'Idioma não suportado.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('card_order_teams')
      .insert({
        name,
        slug,
        default_language: language,
        active: true,
      })
      .select('id, slug, name, default_language, active, created_at')
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: error.code === '23505'
            ? 'Já existe uma equipa com este identificador.'
            : 'Não foi possível criar a equipa.',
        },
        { status: error.code === '23505' ? 409 : 500 }
      )
    }

    return NextResponse.json({ team: data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Pedido inválido.' },
      { status: 400 }
    )
  }
}
