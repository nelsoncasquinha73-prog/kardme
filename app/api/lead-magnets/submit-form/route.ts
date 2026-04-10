import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { lead_magnet_id, responses } = await request.json()
    const supabase = supabaseServer

    const { data, error } = await supabase
      .from('lead_magnet_responses')
      .insert({
        lead_magnet_id,
        responses,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
