import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkCRMProActive } from '@/lib/crm/crmProGate'
import { parseCSV, mapCSVRowToLead } from '@/lib/crm/csv'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, cardId, csvText } = body

    if (!userId || !cardId || !csvText) {
      return NextResponse.json(
        { error: 'userId, cardId e csvText são obrigatórios' },
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

    // Parse CSV
    const csvRows = parseCSV(csvText)
    const parsedLeads = csvRows
      .map(row => mapCSVRowToLead(row))
      .filter(lead => lead !== null)

    if (parsedLeads.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma lead válida encontrada no CSV' },
        { status: 400 }
      )
    }

    // Dedupe by (card_id + email)
    const { data: existingEmails } = await supabaseAdmin
      .from('leads')
      .select('email')
      .eq('card_id', cardId)

    const existingEmailSet = new Set(existingEmails?.map(l => l.email) || [])
    const newLeads = parsedLeads.filter(lead => !existingEmailSet.has(lead.email))
    const duplicates = parsedLeads.length - newLeads.length

    if (newLeads.length === 0) {
      return NextResponse.json(
        { imported: 0, duplicates, failed: 0, message: 'Todas as leads já existem' },
        { status: 200 }
      )
    }

    // Prepare insert data
    const leadsToInsert = newLeads.map(lead => ({
      card_id: cardId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || null,
      zone: lead.zone || null,
      notes: lead.notes || null,
      step: lead.step || 'Novo',
      marketing_opt_in: false,
      consent_given: false,
      consent_version: 'import',
      contacted: false,
    }))

    // Insert in batches (200 at a time)
    let imported = 0
    let failed = 0

    for (let i = 0; i < leadsToInsert.length; i += 200) {
      const batch = leadsToInsert.slice(i, i + 200)
      const { error } = await supabaseAdmin
        .from('leads')
        .insert(batch)

      if (error) {
        console.error('Batch insert error:', error)
        failed += batch.length
      } else {
        imported += batch.length
      }
    }

    return NextResponse.json({
      imported,
      duplicates,
      failed,
      message: `${imported} leads importadas, ${duplicates} duplicadas, ${failed} falhadas`,
    })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao importar' },
      { status: 500 }
    )
  }
}
