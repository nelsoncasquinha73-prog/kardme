import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkCRMProActive } from '@/lib/crm/crmProGate'
import { parseCSV, mapCSVRowToLead } from '@/lib/crm/csv'
import {
  CSV_DECLARATION_VERSION,
  CSV_DECLARATION_TEXT,
} from '@/lib/crm/csvImportDeclaration'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, cardId, csvText, declarationAccepted, declarationVersion } = body

    if (!userId || !cardId || !csvText) {
      return NextResponse.json(
        { error: 'userId, cardId e csvText são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar a identidade do utilizador autenticado
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token)

    if (authError || !authData?.user || authData.user.id !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    // A declaração deve ser aceite explicitamente em cada importação.
    if (
      declarationAccepted !== true ||
      declarationVersion !== CSV_DECLARATION_VERSION
    ) {
      return NextResponse.json(
        { error: 'É obrigatório aceitar a declaração de responsabilidade.' },
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

    // Guardar a aceitação antes de iniciar a importação.
    const { data: declaration, error: declarationError } = await supabaseAdmin
      .from('crm_csv_import_declarations')
      .insert({
        user_id: userId,
        card_id: cardId,
        declaration_version: CSV_DECLARATION_VERSION,
        declaration_text: CSV_DECLARATION_TEXT,
      })
      .select('id')
      .single()

    if (declarationError || !declaration) {
      console.error('Erro ao registar declaração:', declarationError)
      return NextResponse.json(
        { error: 'Não foi possível registar a declaração. Importação cancelada.' },
        { status: 500 }
      )
    }

    // Consultar contactos existentes no cartão
    const existingLeads: Array<{ email: string | null; phone: string | null }> = []
    const pageSize = 500

    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabaseAdmin
        .from('leads')
        .select('email, phone')
        .eq('card_id', cardId)
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error('Erro ao consultar contactos existentes:', error)

        const { error: auditError } = await supabaseAdmin
          .from('crm_csv_import_declarations')
          .update({ status: 'interrupted' })
          .eq('id', declaration.id)

        if (auditError) {
          console.error('Erro ao registar interrupção CSV:', auditError)
        }

        return NextResponse.json(
          { error: 'Não foi possível verificar os contactos existentes. Importação cancelada.' },
          { status: 500 }
        )
      }

      existingLeads.push(...(data || []))

      if (!data || data.length < pageSize) break
    }

    const normalizePhone = (value: string | null | undefined) => {
      let digits = (value || '').replace(/\D/g, '')

      // Remover prefixo internacional 00
      if (digits.startsWith('00')) {
        digits = digits.slice(2)
      }

      // Normalizar números portugueses com indicativo +351
      if (digits.startsWith('351') && digits.length === 12) {
        digits = digits.slice(3)
      }

      return digits
    }

    const seenEmails = new Set<string>()
    const seenPhones = new Set<string>()

    for (const lead of existingLeads || []) {
      const email = (lead.email || '').trim().toLowerCase()
      const phone = normalizePhone(lead.phone)

      if (email) seenEmails.add(email)
      if (phone) seenPhones.add(phone)
    }

    const newLeads = parsedLeads.filter(lead => {
      const email = lead.email.trim().toLowerCase()
      const phone = normalizePhone(lead.phone)

      if (
        (email && seenEmails.has(email)) ||
        (phone && seenPhones.has(phone))
      ) {
        return false
      }

      if (email) seenEmails.add(email)
      if (phone) seenPhones.add(phone)

      return true
    })

    const duplicates = parsedLeads.length - newLeads.length

    if (newLeads.length === 0) {
      const { error: auditError } = await supabaseAdmin
        .from('crm_csv_import_declarations')
        .update({ duplicate_count: duplicates, status: 'completed' })
        .eq('id', declaration.id)

      if (auditError) {
        console.error('Erro ao atualizar auditoria CSV:', auditError)
        return NextResponse.json(
          { error: 'Não foi possível finalizar o registo da importação.' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { imported: 0, duplicates, failed: 0, message: 'Todas as leads já existem' },
        { status: 200 }
      )
    }

    // Prepare insert data
    const leadsToInsert = newLeads.map(lead => ({
      card_id: cardId,
      user_id: userId,
      name: lead.name,
      email: lead.email || null,
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

      // Guardar o progresso após cada lote.
      const { error: progressError } = await supabaseAdmin
        .from('crm_csv_import_declarations')
        .update({
          imported_count: imported,
          duplicate_count: duplicates,
          failed_count: failed,
        })
        .eq('id', declaration.id)

      if (progressError) {
        console.error('Erro ao guardar progresso CSV:', progressError)
        return NextResponse.json(
          {
            error: 'Importação interrompida: não foi possível guardar o progresso da auditoria.',
            imported,
            duplicates,
            failed,
          },
          { status: 500 }
        )
      }
    }

    const { error: auditError } = await supabaseAdmin
      .from('crm_csv_import_declarations')
      .update({
        imported_count: imported,
        duplicate_count: duplicates,
        failed_count: failed,
        status: failed > 0 ? 'completed_with_errors' : 'completed',
      })
      .eq('id', declaration.id)

    if (auditError) {
      console.error('Erro ao atualizar auditoria CSV:', auditError)
      return NextResponse.json(
        {
          error: 'Contactos processados, mas ocorreu um erro ao atualizar o registo de auditoria.',
          imported,
          duplicates,
          failed,
        },
        { status: 500 }
      )
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
