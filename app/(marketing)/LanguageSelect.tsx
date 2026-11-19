'use client'

import { useLanguage, type Language } from '@/components/language/LanguageProvider'

const languages = {
  en: 'English',
  pt: 'Português (PT)',
  'pt-br': 'Português (BR)',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  ar: 'العربية',
} satisfies Record<Language, string>

export default function LanguageSelect() {
  const { lang, setLang } = useLanguage()

  return (
    <select value={lang} onChange={(event) => setLang(event.target.value as Language)}>
      {Object.entries(languages).map(([value, label]) => (
        <option key={value} value={value} lang={value}>{label}</option>
      ))}
    </select>
  )
}
