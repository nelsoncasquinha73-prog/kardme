import { headers } from 'next/headers'
import type { Language } from '@/components/language/LanguageProvider'

export async function detectLanguageFromIP(): Promise<Language> {
  const h = await headers()

  const country =
    h.get('x-vercel-ip-country') ||
    h.get('cf-ipcountry') ||
    'US'

  switch (country) {
    case 'PT':
      return 'pt'
    case 'BR':
      return 'pt-br'
    case 'ES':
    case 'MX':
    case 'AR':
      return 'es'
    case 'FR':
      return 'fr'
    case 'DE':
    case 'AT':
    case 'CH':
      return 'de'
    case 'IT':
      return 'it'
    case 'AE':
    case 'SA':
    case 'QA':
    case 'KW':
    case 'EG':
      return 'ar'
    default:
      return 'en'
  }
}
