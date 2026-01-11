import type { Language } from '../i18n/languages'


export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', dir: 'ltr', countries: ['US', 'GB'] },
  { code: 'pt', label: 'Português', dir: 'ltr', countries: ['PT'] },
  { code: 'pt-BR', label: 'Português (Brasil)', dir: 'ltr', countries: ['BR'] },
  { code: 'es', label: 'Español', dir: 'ltr', countries: ['ES'] },
  { code: 'fr', label: 'Français', dir: 'ltr', countries: ['FR'] },
  { code: 'de', label: 'Deutsch', dir: 'ltr', countries: ['DE'] },
  { code: 'it', label: 'Italiano', dir: 'ltr', countries: ['IT'] },
  { code: 'ar', label: 'العربية', dir: 'rtl', countries: ['AE', 'SA'] },
]
