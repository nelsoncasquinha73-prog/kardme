import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkCRMProActive } from '@/lib/crm/crmProGate'
import { generateCSV } from '@/lib/crm/csv'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const cardId = searchParams.get('cardId')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    if (!userId || !cardId) {
      return NextResponse.json(
        { error: 'userId e cardId são obrigatórios' },
        { status: 400 }
      )
    }

    // Check CRM Pro
    const hasCRMPro = await checkCRMProActive(userId)
    if (!hasCRMPro) {
      return NextResponse.json(
        { error: 'CRM Pro não está ativo' },
        { status: 403 }
      )
    }

    // Verify card belongs to user
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single()

    if (!card) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      )
    }

    // Fetch leads
    let query = supabaseAdmin
      .from('leads')
      .select('id, name, email, phone, zone, step, marketing_opt_in, notes, created_at')
      .eq('card_id', cardId)

    // Apply sort
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    const { data: leads, error } = await query

    if (error) throw error

    // Generate CSV
    const csv = generateCSV(leads || [])

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (err: any) {
    console.error('Export error:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao exportar' },
      { status: 500 }
    )
  }
}
