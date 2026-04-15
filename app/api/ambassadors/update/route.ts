import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body || {}
    console.log("[api/ambassadors/update] Received body:", body)
    console.log("[api/ambassadors/update] updateData:", updateData)

    if (!id) {
      return NextResponse.json({ error: 'Missing ambassador id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ambassadors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[api/ambassadors/update] supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    console.log("[api/ambassadors/update] Returning data:", data)

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[api/ambassadors/update] exception:', err)
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 })
  }
}
