'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { detectLanguageByIP } from '@/components/i18n/detectLanguage'

// Importar traduções
import en from '@/locales/en.json'
import pt from '@/locales/pt.json'
import ptBr from '@/locales/pt-br.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import de from '@/locales/de.json'
import it from '@/locales/it.json'
import ar from '@/locales/ar.json'

export type Language = 'en' | 'pt' | 'pt-br' | 'es' | 'fr' | 'de' | 'it' | 'ar'

type TranslationDict = Record<string, Record<string, string>>

const DICTS: Record<Language, TranslationDict> = {
  en,
  pt,
  'pt-br': ptBr,
  es,
  fr,
  de,
  it,
  ar,
}

type LanguageContextType = {
  lang: Language
  setLang: (l: Language) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const SUPPORTED_LANGS = Object.keys(DICTS) as Language[]
const DEFAULT_LANG: Language = 'en'

function isSupported(l: any): l is Language {
  return SUPPORTED_LANGS.includes(l)
}

// Função para obter tradução com suporte a chaves aninhadas (ex: "common.save")
function getTranslation(dict: TranslationDict, key: string, fallbackDict: TranslationDict): string {
  const parts = key.split('.')
  
  if (parts.length === 2) {
    const [section, subKey] = parts
    const value = dict[section]?.[subKey]
    if (value) return value
    
    // Fallback para inglês
    const fallbackValue = fallbackDict[section]?.[subKey]
    if (fallbackValue) return fallbackValue
  }
  
  // Chave simples (retrocompatibilidade)
  for (const section of Object.values(dict)) {
    if (section[key]) return section[key]
  }
  
  // Fallback inglês para chave simples
  for (const section of Object.values(fallbackDict)) {
    if (section[key]) return section[key]
  }
  
  return key
}

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode
  initialLang?: Language
}) {
  const [lang, setLangState] = useState<Language>(initialLang || DEFAULT_LANG)

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

  function setLang(l: Language) {
    const next = isSupported(l) ? l : DEFAULT_LANG
    setLangState(next)
    try {
      localStorage.setItem('kardme_lang', next)
    } catch {}
  }

  useEffect(() => {
    let cancelled = false

    const normalizeLangCode = (code: string): Language => {
      const c = code.toLowerCase()
      if (c === 'pt-br' || c === 'pt_br') return 'pt-br'
      if (c.startsWith('pt')) return 'pt'
      if (c.startsWith('es')) return 'es'
      if (c.startsWith('fr')) return 'fr'
      if (c.startsWith('de')) return 'de'
      if (c.startsWith('it')) return 'it'
      if (c.startsWith('ar')) return 'ar'
      if (c.startsWith('en')) return 'en'
      return 'en'
    }

    const stored = (() => {
      try {
        return localStorage.getItem('kardme_lang') as Language | null
      } catch {
        return null
      }
    })()

    if (stored && isSupported(stored)) {
      setLangState(stored)
      return
    }

    ;(async () => {
      try {
        const ipLang = await detectLanguageByIP()
        const candidate = normalizeLangCode(ipLang)
        const next = isSupported(candidate) ? candidate : DEFAULT_LANG
        if (!cancelled) {
          setLangState(next)
          try {
            localStorage.setItem('kardme_lang', next)
          } catch {}
        }
      } catch {
        if (!cancelled) setLangState(DEFAULT_LANG)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      dir,
      t: (key: string) => getTranslation(DICTS[lang], key, DICTS.en),
    }),
    [lang, dir]
  )

  return (
    <LanguageContext.Provider value={value}>
      <div dir={dir} lang={lang} style={{ background: 'inherit', minHeight: '100vh' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return ctx
}
