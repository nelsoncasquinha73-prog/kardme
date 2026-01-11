'use client'

import { useState } from 'react'
import { useLanguage, Language } from './LanguageProvider'

const LANGUAGES: {
  code: Language
  label: string
}[] = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português (PT)' },
  { code: 'pt-br', label: 'Português (BR)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ar', label: 'العربية' },
]

export default function LanguageDropdown() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)

  const current = LANGUAGES.find(l => l.code === lang)

  return (
    <div style={{ position: 'relative' }}>
      {/* BOTÃO */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.05)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        🌍 {current?.label || lang}
      </button>

      {/* MENU */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            overflow: 'hidden',
            zIndex: 1000,
            minWidth: 200,
          }}
        >
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code)
                setOpen(false)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                border: 'none',
                background:
                  l.code === lang
                    ? 'rgba(255,255,255,0.08)'
                    : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
