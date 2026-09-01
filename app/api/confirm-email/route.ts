import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/lm/confirmacao-invalida', url.origin))
  }

  const supabase = supabaseAdmin

  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, user_id, card_id, email_confirmed_at')
    .eq('email_confirm_token', token)
    .maybeSingle()

  if (error || !lead) {
    return NextResponse.redirect(new URL('/lm/confirmacao-invalida', url.origin))
  }

  if (!lead.email_confirmed_at) {
    const { error: updErr } = await supabase
      .from('leads')
      .update({
        email_confirmed_at: new Date().toISOString(),
        email_confirm_token: null,
      })
      .eq('id', lead.id)

    if (updErr) {
      return NextResponse.redirect(new URL('/lm/confirmacao-invalida', url.origin))
    }


    // Registar atividade no CRM
    try {
      let ownerUserId = lead.user_id as string | null

      if (!ownerUserId && lead.card_id) {
        const { data: cardRow } = await supabase
          .from('cards')
          .select('user_id')
          .eq('id', lead.card_id)
          .maybeSingle()
        ownerUserId = (cardRow?.user_id as string | null) || null
      }

      if (ownerUserId) {
        const ip =
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          req.headers.get('x-real-ip') ||
          null
        const userAgent = req.headers.get('user-agent') || null

        await supabase.from('lead_activities').insert([
          {
            lead_id: lead.id,
            user_id: ownerUserId,
            type: 'email_confirmed',
            title: 'Email confirmado pelo lead',
            meta: { ip, user_agent: userAgent },
          },
        ])
      }
    } catch (e) {
      console.error('Erro ao registar lead_activities (email_confirmed):', e)
    }
  }

  return NextResponse.redirect(new URL('/lm/email-confirmado', url.origin))
}
