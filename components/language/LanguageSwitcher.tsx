'use client'

import { useLanguage, Language } from './LanguageProvider'

const LANGS: {
  code: Language
  label: string
}[] = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'pt-br', label: 'Português (BR)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ar', label: 'العربية' },
]

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()

  return (
    <select
      value={lang}
      onChange={e => setLang(e.target.value as Language)}
      style={{
        padding: '6px 10px',
        borderRadius: 10,
        border: '1px solid rgba(0,0,0,0.15)',
        background: '#fff',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {LANGS.map(l => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  )
}
