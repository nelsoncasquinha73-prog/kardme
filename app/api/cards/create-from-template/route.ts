import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

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
    const { templateId, slug: rawSlug } = await request.json()

    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json({ success: false, error: 'templateId é obrigatório' }, { status: 400 })
    }
    if (!rawSlug || typeof rawSlug !== 'string') {
      return NextResponse.json({ success: false, error: 'slug é obrigatório' }, { status: 400 })
    }

    const slug = slugify(rawSlug)
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug inválido' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !anonKey || !serviceRole) {
      return NextResponse.json({ success: false, error: 'Env vars do Supabase em falta' }, { status: 500 })
    }

    // 1) Ler user autenticado via cookies do request (SSR)
    const supabaseAuth = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // Nesta route não precisamos de setar cookies
        },
      },
    })

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData?.user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    const userId = userData.user.id

    // 2) Admin client (Service Role) para inserir sem RLS chatear
    const supabaseAdmin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    })

    // 3) Validar slug único
    const { data: existing } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing?.id) {
      return NextResponse.json({ success: false, error: 'Slug já existe' }, { status: 409 })
    }

    // 4) Buscar template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('cards')
      .select('id, theme, title')
      .eq('id', templateId)
      .eq('is_template', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    // 5) Criar novo cartão
    const { data: newCard, error: insertError } = await supabaseAdmin
      .from('cards')
      .insert({
        user_id: userId,
        slug,
        is_template: false,
        published: false,
        theme: template.theme,
        title: template.title ?? null,
        template_id: template.id,
      })
      .select()
      .single()

    if (insertError || !newCard) {
      return NextResponse.json(
        { success: false, error: insertError?.message || 'Erro ao criar cartão' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, card: newCard })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Erro interno' },
      { status: 500 }
    )
  }
}
