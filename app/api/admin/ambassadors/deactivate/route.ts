import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { ambassadorId } = await req.json()

    if (!ambassadorId) {
      return NextResponse.json({ error: 'Missing ambassadorId' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('ambassadors')
      .update({
        subscription_status: 'inactive',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ambassadorId)
      .select()
      .single()

    if (error) {
      console.error('Error deactivating ambassador:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error in deactivate ambassador:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
