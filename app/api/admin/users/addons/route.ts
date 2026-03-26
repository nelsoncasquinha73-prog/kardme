import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({}, { status: 400 })

    const { data } = await supabaseAdmin
      .from('user_addons')
      .select('crm_pro_active, crm_pro_expires_at')
      .eq('user_id', userId)
      .maybeSingle()

    return NextResponse.json({
      crm_pro_active: data?.crm_pro_active ?? false,
      crm_pro_expires_at: data?.crm_pro_expires_at ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({}, { status: 500 })
  }
}
