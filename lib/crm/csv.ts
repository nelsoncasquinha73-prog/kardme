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

function stripQuotes(v: string): string {
  const t = (v ?? '').trim()
  if (!t) return ''
  // remove surrounding quotes if present
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).trim()
  }
  return t
}

function detectSeparator(headerLine: string): ',' | ';' {
  // naive but effective: choose the one that appears more
  const commas = (headerLine.match(/,/g) || []).length
  const semis = (headerLine.match(/;/g) || []).length
  return semis > commas ? ';' : ','
}

/**
 * Split a CSV line respecting simple quotes.
 * (Good enough for typical exports; not a full RFC parser.)
 */
function splitLine(line: string, sep: ',' | ';'): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      cur += ch
      continue
    }
    if (ch === sep && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out
}

/**
 * Parse CSV string into rows
 */
export function parseCSV(csvText: string): CSVRow[] {
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  const lines = text.split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const sep = detectSeparator(lines[0])
  const rawHeaders = splitLine(lines[0], sep).map(h => stripQuotes(h).toLowerCase())

  const rows: CSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const rawValues = splitLine(lines[i], sep)
    const row: CSVRow = {}
    rawHeaders.forEach((header, idx) => {
      row[header] = stripQuotes(rawValues[idx] ?? '')
    })
    rows.push(row)
  }
  return rows
}

function findKey(row: CSVRow, keys: string[]): string | null {
  const rowKeys = Object.keys(row).map(k => k.toLowerCase())
  for (const k of keys) {
    const idx = rowKeys.indexOf(k.toLowerCase())
    if (idx >= 0) return Object.keys(row)[idx]
  }
  return null
}

/**
 * Map CSV row to Lead object (with flexible column names)
 */
export function mapCSVRowToLead(row: CSVRow): ParsedLead | null {
  const nameKey = findKey(row, ['name', 'nome', 'full_name', 'fullname'])
  const emailKey = findKey(row, ['email', 'e-mail'])
  const phoneKey = findKey(row, ['phone', 'telefone', 'tel', 'telemovel', 'telemóvel', 'mobile', 'celular'])
  const zoneKey = findKey(row, ['zone', 'zona', 'city', 'cidade', 'localidade', 'location'])
  const notesKey = findKey(row, ['notes', 'notas', 'comentarios', 'comentários', 'comments', 'observacoes', 'observações'])
  const stepKey = findKey(row, ['step', 'stage', 'status', 'etapa'])

  const emailRaw = (emailKey ? row[emailKey] : '') || ''
  const email = emailRaw.trim().toLowerCase()

  if (!email) return null

  const nameRaw = (nameKey ? row[nameKey] : '') || ''
  const name = nameRaw.trim() || email.split('@')[0]

  const stepRaw = (stepKey ? row[stepKey] : '') || ''
  const step = stepRaw.trim() || 'Novo'

  return {
    name,
    email,
    phone: phoneKey ? row[phoneKey]?.trim() : undefined,
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

