import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

export function normalizeWhatsAppPhone(phone?: string | null): string | null {
  const input = phone?.trim()
  if (!input || !/^\+?[\d\s().-]+$/.test(input)) return null

  const compact = input.replace(/[\s().-]/g, '')
  let international: string

  if (compact.startsWith('+')) {
    international = compact
  } else if (compact.startsWith('00')) {
    international = '+' + compact.slice(2)
  } else if (/^(351\d{9}|55\d{11})$/.test(compact)) {
    // The CRM already accepted these international formats without a plus sign.
    international = '+' + compact
  } else if (/^[29]\d{8}$/.test(compact)) {
    international = '+351' + compact
  } else {
    return null
  }

  if (!/^\+[1-9]\d{1,14}$/.test(international)) return null

  const parsed = parsePhoneNumberFromString(international, { extract: false })
  return parsed?.number === international && parsed.isValid() ? international : null
}

export function buildWhatsAppUrl(phone?: string | null, message = ''): string | null {
  const international = normalizeWhatsAppPhone(phone)
  if (!international) return null

  const url = `https://wa.me/${international.slice(1)}`
  return message ? `${url}?text=${encodeURIComponent(message)}` : url
}
