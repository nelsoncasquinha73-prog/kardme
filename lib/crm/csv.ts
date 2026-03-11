/**
 * CSV utilities for CRM Pro import/export
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

/**
 * Parse CSV string into rows
 */
export function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: CSVRow = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || undefined
    })
    rows.push(row)
  }

  return rows
}

/**
 * Map CSV row to Lead object (with flexible column names)
 */
export function mapCSVRowToLead(row: CSVRow): ParsedLead | null {
  // Try common column name variations
  const nameCol = Object.keys(row).find(k => ['name', 'nome', 'full_name', 'fullname'].includes(k.toLowerCase()))
  const emailCol = Object.keys(row).find(k => ['email', 'e-mail'].includes(k.toLowerCase()))
  const phoneCol = Object.keys(row).find(k => ['phone', 'telefone', 'tel', 'mobile', 'celular'].includes(k.toLowerCase()))
  const zoneCol = Object.keys(row).find(k => ['zone', 'zona', 'city', 'cidade', 'location'].includes(k.toLowerCase()))
  const notesCol = Object.keys(row).find(k => ['notes', 'notas', 'comments', 'observações'].includes(k.toLowerCase()))
  const stepCol = Object.keys(row).find(k => ['step', 'stage', 'status', 'etapa'].includes(k.toLowerCase()))

  const name = row[nameCol || '']?.trim() || ''
  const email = row[emailCol || '']?.trim() || ''

  // Email is mandatory
  if (!email) return null

  return {
    name: name || email.split('@')[0], // fallback to email prefix
    email,
    phone: row[phoneCol || '']?.trim(),
    zone: row[zoneCol || '']?.trim(),
    notes: row[notesCol || '']?.trim(),
    step: row[stepCol || '']?.trim() || 'Novo',
  }
}

/**
 * Generate CSV from leads array
 */
export function generateCSV(leads: any[]): string {
  if (leads.length === 0) return ''

  const headers = ['Nome', 'Email', 'Telefone', 'Zona', 'Step', 'Marketing', 'Data', 'Notas']
  const rows = leads.map(lead => [
    lead.name || '',
    lead.email || '',
    lead.phone || '',
    lead.zone || '',
    lead.step || '',
    lead.marketing_opt_in ? 'Sim' : 'Não',
    new Date(lead.created_at).toLocaleDateString('pt-PT'),
    lead.notes || '',
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csv
}
