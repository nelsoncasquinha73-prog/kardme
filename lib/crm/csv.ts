import Papa from 'papaparse'

/**
 * CSV utilities for CRM Pro import/export
 * Supports:
 * - comma or semicolon separator
 * - quoted headers/values ("Email")
 * - Portuguese/English header variants
 */

export interface CSVRow {
  [key: string]: string | undefined
}

export interface ParsedLead {
  name: string
  email: string
  phone?: string
  zone?: string
  notes?: string
  step?: string
}

function normalizeCSVHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, ' ')
    .trim()
}

export function parseCSV(csvText: string): CSVRow[] {
  const result = Papa.parse<string[]>(csvText.replace(/^\\uFEFF/, ''), {
    skipEmptyLines: 'greedy',
    delimiter: '',
  })

  if (result.errors.length > 0) {
    const firstError = result.errors[0]
    throw new Error(
      `CSV inválido na linha ${(firstError.row ?? 0) + 1}: ${firstError.message}`
    )
  }

  // Procurar a linha de cabeçalhos, ignorando títulos anteriores
  const knownHeaders = new Set([
    'name', 'nome', 'full name', 'fullname',
    'contact name', 'nome completo', 'first name',
    'primeiro nome', 'contacto',
    'email', 'e mail', 'email address',
    'endereco de email', 'endereco eletronico',
    'phone', 'telefone', 'tel', 'telemovel',
    'mobile', 'celular', 'phone number',
    'numero de telefone', 'numero de telemovel',
    'zone', 'zona', 'city', 'cidade',
    'localidade', 'location',
    'notes', 'notas', 'comentarios',
    'comments', 'observacoes', 'description',
    'step', 'stage', 'status', 'etapa'
  ])

  const headerIndex = result.data.findIndex(values => {
    const normalized = values.map(normalizeCSVHeader)
    const matches = normalized.filter(value => knownHeaders.has(value))
    const hasContactField = normalized.some(value =>
      ['email', 'e mail', 'telefone', 'telemovel', 'phone',
       'mobile', 'celular', 'tel', 'phone number',
       'numero de telefone', 'numero de telemovel'].includes(value)
    )
    return matches.length >= 2 && hasContactField
  })

  if (headerIndex === -1) {
    throw new Error('Não foi possível identificar os cabeçalhos do CSV')
  }

  const rawHeaders = result.data[headerIndex]
  const dataRows = result.data.slice(headerIndex + 1)

  if (dataRows.length === 0) return []

  const headers = rawHeaders.map(normalizeCSVHeader)

  return dataRows.map(values => {
    const row: CSVRow = {}

    headers.forEach((header, index) => {
      if (header) row[header] = (values[index] || '').trim()
    })

    return row
  })
}

function findKey(row: CSVRow, keys: string[]): string | null {
  const rowKeys = Object.keys(row)

  for (const key of keys) {
    const normalized = normalizeCSVHeader(key)
    const found = rowKeys.find(k => normalizeCSVHeader(k) === normalized)
    if (found) return found
  }

  return null
}

export function mapCSVRowToLead(row: CSVRow): ParsedLead | null {
  const nameKey = findKey(row, [
    'name', 'nome', 'full name', 'fullname',
    'contact name', 'nome completo', 'first name',
    'primeiro nome', 'contacto'
  ])

  const emailKey = findKey(row, [
    'email', 'e-mail', 'email address',
    'endereco de email', 'endereco eletronico'
  ])

  const phoneKey = findKey(row, [
    'phone', 'telefone', 'tel', 'telemovel',
    'mobile', 'celular', 'phone number',
    'numero de telefone', 'numero de telemovel'
  ])

  const zoneKey = findKey(row, [
    'zone', 'zona', 'city', 'cidade',
    'localidade', 'location'
  ])

  const notesKey = findKey(row, [
    'notes', 'notas', 'comentarios',
    'comments', 'observacoes', 'description'
  ])

  const stepKey = findKey(row, [
    'step', 'stage', 'status', 'etapa'
  ])

  const email = ((emailKey && row[emailKey]) || '').trim().toLowerCase()

  const phone = ((phoneKey && row[phoneKey]) || '').trim()
  const phoneDigits = phone.replace(/\D/g, '')

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validPhone = phoneDigits.length >= 7 && phoneDigits.length <= 15

  // Um contacto precisa de pelo menos um canal válido
  if (!validEmail && !validPhone) return null

  const name = ((nameKey && row[nameKey]) || '').trim()
    || (validEmail ? email.split('@')[0] : phone)

  const step = ((stepKey && row[stepKey]) || '').trim() || 'Novo'

  return {
    name,
    email: validEmail ? email : '',
    phone: validPhone ? phone : undefined,
    zone: zoneKey ? row[zoneKey]?.trim() : undefined,
    notes: notesKey ? row[notesKey]?.trim() : undefined,
    step,
  }
}

/**
 * Generate CSV from leads array
 */
export function generateCSV(leads: any[]): string {
  if (leads.length === 0) return ''

  type CustomFieldDescriptor = {
    key: string
    label: string
    header: string
  }

  const descriptors: CustomFieldDescriptor[] = []
  const knownKeys = new Set<string>()
  const usedHeaders = new Map<string, number>()

  const getCustomEntries = (customFields: any) => {
    if (!customFields) return []

    if (Array.isArray(customFields)) {
      return customFields.map((field, index) => [
        String(field?.id || field?.key || index),
        field,
      ] as [string, any])
    }

    if (typeof customFields === 'object') {
      return Object.entries(customFields) as [string, any][]
    }

    return []
  }

  // Descobrir todos os campos personalizados presentes nas leads
  for (const lead of leads) {
    for (const [key, field] of getCustomEntries(lead.custom_fields)) {
      if (knownKeys.has(key)) continue

      const label =
        typeof field === 'object' && field !== null
          ? String(field.label || key)
          : key

      const currentCount = usedHeaders.get(label) || 0
      const nextCount = currentCount + 1
      usedHeaders.set(label, nextCount)

      const header = nextCount === 1 ? label : `${label} (${nextCount})`

      descriptors.push({
        key,
        label,
        header,
      })

      knownKeys.add(key)
    }
  }

  const headers = [
    'Nome',
    'Email',
    'Telefone',
    'Zona',
    'Cartão',
    'Origem',
    'Step',
    'Marketing',
    'Mensagem',
    ...descriptors.map(field => field.header),
    'Notas',
    'Data',
  ]

  const getCustomValue = (
    customFields: any,
    descriptor: CustomFieldDescriptor
  ): string => {
    const entries = getCustomEntries(customFields)

    // Primeiro procurar pela chave original
    let match = entries.find(([key]) => key === descriptor.key)

    // Fallback pelo label
    if (!match) {
      match = entries.find(([, field]) => {
        if (!field || typeof field !== 'object') return false
        return String(field.label || '') === descriptor.label
      })
    }

    if (!match) return ''

    const field = match[1]

    if (field && typeof field === 'object' && 'value' in field) {
      const value = field.value

      if (Array.isArray(value)) {
        return value.join(', ')
      }

      if (value === null || value === undefined) {
        return ''
      }

      if (typeof value === 'object') {
        return JSON.stringify(value)
      }

      return String(value)
    }

    return field === null || field === undefined ? '' : String(field)
  }

  const rows = leads.map(lead => [
    lead.name || '',
    lead.email || '',
    lead.phone || '',
    lead.zone || '',
    lead.card_name || '',
    lead.lead_source || '',
    lead.step || '',
    lead.marketing_opt_in ? 'Sim' : 'Não',
    lead.message || '',

    ...descriptors.map(descriptor =>
      getCustomValue(lead.custom_fields, descriptor)
    ),

    lead.notes || '',
    lead.created_at
      ? new Date(lead.created_at).toLocaleDateString('pt-PT')
      : '',
  ])

  const csv = [headers, ...rows]
    .map(row =>
      row
        .map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n')

  // BOM UTF-8 para abrir corretamente no Excel
  return '\uFEFF' + csv
}

