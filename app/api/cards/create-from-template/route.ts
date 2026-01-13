import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
})

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

    if (!templateId) {
      return NextResponse.json({ success: false, error: 'templateId é obrigatório' }, { status: 400 })
    }
    if (!rawSlug) {
      return NextResponse.json({ success: false, error: 'slug é obrigatório' }, { status: 400 })
    }

    const slug = slugify(rawSlug)
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug inválido' }, { status: 400 })
    }

    const accessToken = request.cookies.get('sb-access-token')?.value
    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    supabaseAuth.setAuth(accessToken)
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const userId = userData.user.id

    // Validar slug único
    const { data: existing } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing?.id) {
      return NextResponse.json({ success: false, error: 'Slug já existe' }, { status: 409 })
    }

    // Buscar template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('id', templateId)
      .eq('is_template', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    // Criar novo cartão referenciando o template (sem copiar blocos)
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
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
