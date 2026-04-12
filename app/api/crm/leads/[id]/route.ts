import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !lead || lead.user_id !== user.id) {
      return NextResponse.json({ error: 'Lead não encontrada' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('leads')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        zone: body.zone,
        marketing_opt_in: body.marketing_opt_in,
        lead_type_id: body.lead_type_id,
        lead_source: body.lead_source,
        country: body.country,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
