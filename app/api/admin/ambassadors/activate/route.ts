import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { ambassadorId, durationMonths, reason } = await req.json()

    if (!ambassadorId || !durationMonths) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabaseAdmin
      .from('ambassadors')
      .update({
        subscription_status: 'active',
        is_active: true,
        activated_at: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
        activated_by: 'admin',
        admin_grant_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ambassadorId)
      .select()
      .single()

    if (error) {
      console.error('Error activating ambassador:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error in activate ambassador:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
