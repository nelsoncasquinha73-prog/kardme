import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireCardOrderAdmin } from '@/lib/requireCardOrderAdmin'

export const runtime = 'nodejs'

type Context = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: Context) {
  const denied = await requireCardOrderAdmin(req)
  if (denied) return denied

  const { id } = await context.params

  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

  let body: { active?: unknown }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  if (typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('card_order_teams')
    .update({ active: body.active })
    .eq('id', id)
    .select('id, name, active')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar equipa.' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Equipa não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ team: data })
}

export async function DELETE(req: NextRequest, context: Context) {
  const denied = await requireCardOrderAdmin(req)
  if (denied) return denied

  const { id } = await context.params

  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

  const { count, error: countError } = await supabaseAdmin
    .from('card_order_team_requests')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', id)

  if (countError) {
    return NextResponse.json({ error: 'Erro ao verificar inscrições.' }, { status: 500 })
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Esta equipa tem inscrições. Desativa-a para preservar os pedidos.' },
      { status: 409 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('card_order_teams')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: 'Não foi possível eliminar a equipa.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json({ error: 'Equipa não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
