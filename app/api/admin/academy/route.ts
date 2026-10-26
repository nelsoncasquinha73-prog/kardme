import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

async function authorize(req: NextRequest) {
  const header = req.headers.get('authorization') || ''

  if (!header.startsWith('Bearer ')) {
    return { error: 'Não autenticado', status: 401 }
  }

  const token = header.slice(7).trim()
  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    return { error: 'Sessão inválida', status: 401 }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { error: 'Sem permissões', status: 403 }
  }

  return { error: null, status: 200 }
}

function validYoutubeUrl(value: unknown) {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()

    if (url.protocol !== 'https:') return false

    if (host === 'youtu.be') {
      return /^\/[a-zA-Z0-9_-]{11}$/.test(url.pathname)
    }

    if (host === 'youtube.com' || host === 'www.youtube.com') {
      return /^[a-zA-Z0-9_-]{11}$/.test(
        url.searchParams.get('v') || ''
      )
    }

    return false
  } catch {
    return false
  }
}

function validate(body: any) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string'
    ? body.description.trim() : ''
  const category = typeof body.category === 'string'
    ? body.category.trim() : ''
  const youtube_url = typeof body.youtube_url === 'string'
    ? body.youtube_url.trim() : ''

  if (!title || title.length > 180) return null
  if (description.length > 2000) return null
  if (!category || category.length > 100) return null
  if (!validYoutubeUrl(youtube_url)) return null

  const sort_order = Number(body.sort_order ?? 0)
  if (!Number.isInteger(sort_order) || sort_order < 0 || sort_order > 100000) {
    return null
  }

  if (typeof body.is_published !== 'boolean') return null

  return {
    title,
    description,
    category,
    youtube_url,
    sort_order,
    is_published: body.is_published,
    updated_at: new Date().toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await supabaseAdmin
    .from('academy_tutorials')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Erro ao carregar tutoriais' }, { status: 500 })
  }

  return NextResponse.json({ tutorials: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json().catch(() => null)
  const values = body && validate(body)

  if (!values) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('academy_tutorials')
    .insert(values)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao criar tutorial' }, { status: 500 })
  }

  return NextResponse.json({ tutorial: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await authorize(req)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json().catch(() => null)
  const id = body?.id
  const values = body && validate(body)

  if (
    typeof id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
    !values
  ) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('academy_tutorials')
    .update(values)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar tutorial' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Tutorial não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ tutorial: data })
}

export async function DELETE(req: NextRequest) {
  const auth = await authorize(req)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const id = new URL(req.url).searchParams.get('id')

  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('academy_tutorials')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Erro ao eliminar tutorial' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Tutorial não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
