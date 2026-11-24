import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { lead_id, slug, prize_label } = await req.json()
    if (typeof lead_id !== 'string' || !lead_id || typeof slug !== 'string' || !slug ||
        typeof prize_label !== 'string' || !prize_label) {
      return NextResponse.json({ error: 'Campos em falta' }, { status: 400 })
    }

    const { data: magnet } = await supabaseAdmin
      .from('lead_magnets')
      .select('id, user_id, title')
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('magnet_type', 'wheel')
      .single()

    if (!magnet) return NextResponse.json({ error: 'Magnet não encontrado' }, { status: 404 })

    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('id', lead_id)
      .eq('user_id', magnet.user_id)
      .eq('lead_magnet_id', magnet.id)
      .single()

    if (!lead) return NextResponse.json({ error: 'Lead não encontrada' }, { status: 404 })

    const { error } = await supabaseAdmin.from('lead_activities').insert([{
      lead_id,
      user_id: magnet.user_id,
      type: 'wheel_winner',
      title: `🏆 Ganhou prémio na roleta: ${prize_label}`,
      meta: { magnet_id: magnet.id, magnet_title: magnet.title, prize_label },
    }])

    if (error) return NextResponse.json({ error: 'Erro ao registar resultado' }, { status: 500 })
    return NextResponse.json({ ok: true, emailSent: false })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
