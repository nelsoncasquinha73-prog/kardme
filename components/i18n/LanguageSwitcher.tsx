'use client'

import { useLanguage } from './LanguageProvider'
import { LANGUAGES } from './languages'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <select
      value={language.code}
      onChange={e => setLanguage(e.target.value as any)}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        border: '1px solid #ddd',
        fontSize: 14,
        background: '#fff',
        cursor: 'pointer',
      }}
    >
      {LANGUAGES.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  )
}
