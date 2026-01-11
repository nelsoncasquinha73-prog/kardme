'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { LANGUAGES, Language, LanguageCode } from './languages'
import {
  detectBrowserLanguage,
  detectLanguageByIP,
} from './detectLanguage'

type LanguageContextType = {
  language: Language
  setLanguage: (code: LanguageCode) => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [language, setLanguageState] = useState<Language>(
    LANGUAGES[0]
  )

  // 🔁 Set + persist
  function setLanguage(code: LanguageCode) {
    const lang = LANGUAGES.find(l => l.code === code)
    if (!lang) return

    setLanguageState(lang)
    localStorage.setItem('kardme_lang', code)

    // RTL support
    document.documentElement.lang = code
    document.documentElement.dir = lang.dir
  }

  // 🌍 Init
  useEffect(() => {
    const saved = localStorage.getItem('kardme_lang') as LanguageCode | null

    if (saved) {
      setLanguage(saved)
      return
    }

    ;(async () => {
      const ipLang = await detectLanguageByIP()
      setLanguage(ipLang)
    })()
  }, [])

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    )
  }
  return ctx
}
