import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireCardOrderAdmin } from '@/lib/requireCardOrderAdmin'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireCardOrderAdmin(req)
  if (denied) return denied

  try {
    const { id } = await params

    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) {
      return NextResponse.json(
        { error: 'Identificador inválido.' },
        { status: 400 }
      )
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('card_order_teams')
      .select('id, name, slug, default_language, active')
      .eq('id', id)
      .maybeSingle()

    if (teamError) {
      return NextResponse.json(
        { error: 'Erro ao consultar a equipa.' },
        { status: 500 }
      )
    }

    if (!team) {
      return NextResponse.json(
        { error: 'Equipa não encontrada.' },
        { status: 404 }
      )
    }

    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('card_order_team_requests')
      .select('id, order_id, name, email, phone, language, status, email_status, email_sent_at, created_at')
      .eq('team_id', id)
      .order('created_at', { ascending: false })
      .limit(500)

    if (requestsError) {
      console.error('TEAM_REQUESTS_ERROR:', requestsError.message)
      return NextResponse.json(
        { error: 'Erro ao consultar inscrições.' },
        { status: 500 }
      )
    }

    const orderIds = [...new Set(
      (requests || [])
        .map(item => item.order_id)
        .filter((value): value is string => typeof value === 'string')
    )]

    let orders: Array<{
      id: string
      slug: string
      status: string
      submitted_at: string | null
    }> = []

    if (orderIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('card_orders')
        .select('id, slug, status, submitted_at')
        .in('id', orderIds)

      if (error) {
        console.error('TEAM_ORDERS_ERROR:', error.message)
        return NextResponse.json(
          { error: 'Erro ao consultar estados dos cartões.' },
          { status: 500 }
        )
      }

      orders = data || []
    }

    const orderMap = new Map(orders.map(order => [order.id, order]))

    const items = (requests || []).map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      language: item.language,
      created_at: item.created_at,
      request_status: item.status,
      email_status: item.email_status,
      email_sent_at: item.email_sent_at,
      order: item.order_id
        ? orderMap.get(item.order_id) || null
        : null,
    }))

    return NextResponse.json({
      team,
      requests: items,
      total: items.length,
      hasMore: items.length === 500,
    })
  } catch (error) {
    console.error('TEAM_REQUESTS_API_ERROR:', error)
    return NextResponse.json(
      { error: 'Erro interno.' },
      { status: 500 }
    )
  }
}
