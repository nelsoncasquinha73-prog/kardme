import { Language } from './LanguageProvider'

export const LANGUAGES: {
  code: Language
  label: string
  native: string
}[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'pt-pt', label: 'Português', native: 'Português (PT)' },
  { code: 'pt-br', label: 'Português', native: 'Português (BR)' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
]
