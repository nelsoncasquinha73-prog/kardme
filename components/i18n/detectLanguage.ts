import { LANGUAGES, LanguageCode } from './languages'

export async function detectLanguageByIP(): Promise<LanguageCode> {
  try {
    // API simples e rápida (pode ser trocada depois)
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()

    const country = data?.country_code

    const match = LANGUAGES.find(lang =>
      lang.countries?.includes(country)
    )

    return match?.code || 'en'
  } catch {
    return 'en'
  }
}

export function detectBrowserLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return 'en'

  const lang = navigator.language

  if (lang.startsWith('pt-BR')) return 'pt-BR'
  if (lang.startsWith('pt')) return 'pt'
  if (lang.startsWith('es')) return 'es'
  if (lang.startsWith('fr')) return 'fr'
  if (lang.startsWith('de')) return 'de'
  if (lang.startsWith('it')) return 'it'
  if (lang.startsWith('ar')) return 'ar'

  return 'en'
}
