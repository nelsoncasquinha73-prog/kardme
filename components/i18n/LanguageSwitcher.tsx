'use client'

import { useLanguage } from './LanguageProvider'

export default function LanguageSwitcher() {
  const { lang, setLang, available } = useLanguage()

  return (
    <select
      value={lang}
      onChange={e => setLang(e.target.value as any)}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        border: '1px solid #ddd',
        fontSize: 14,
        background: '#fff',
        cursor: 'pointer',
      }}
    >
      {Object.entries(available).map(([code, cfg]) => (
        <option key={code} value={code}>
          {cfg.label}
        </option>
      ))}
    </select>
  )
}
