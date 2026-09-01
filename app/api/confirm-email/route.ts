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
    .select('id, email_confirmed_at')
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
  }

  return NextResponse.redirect(new URL('/lm/email-confirmado', url.origin))
}
