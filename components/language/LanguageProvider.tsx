'use client'

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react'

import en from '@/locales/en.json'
import pt from '@/locales/pt.json'
import ptBr from '@/locales/pt-br.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import de from '@/locales/de.json'
import it from '@/locales/it.json'
import ar from '@/locales/ar.json'

export type Language = 'en' | 'pt' | 'pt-br' | 'es' | 'fr' | 'de' | 'it' | 'ar'
type TranslationDict = Record<string, any>

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  dir: 'ltr' | 'rtl'
  t: (key: string) => string
}

const SUPPORTED_LANGS: Language[] = ['en', 'pt', 'pt-br', 'es', 'fr', 'de', 'it', 'ar']
const DEFAULT_LANG: Language = 'en'

function isSupported(l: any): l is Language {
  return SUPPORTED_LANGS.includes(l)
}

// Função para obter tradução com suporte a chaves aninhadas (ex: "common.save" ou "fab.addToHomeScreen.title")
function getTranslation(dict: TranslationDict, key: string, fallbackDict: TranslationDict): string {
  const parts = key.split('.')
  
  // Navega pelos níveis de nesting
  let value: any = dict
  for (const part of parts) {
    value = value?.[part]
  }
  if (typeof value === 'string' && value) return value
  
  // Fallback para inglês
  let fallbackValue: any = fallbackDict
  for (const part of parts) {
    fallbackValue = fallbackValue?.[part]
  }
  if (typeof fallbackValue === 'string' && fallbackValue) return fallbackValue
  
  // Se nada encontrado, retorna a chave
  return key
}

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

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANG)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Detectar idioma do navegador
    const detectLanguageByIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        const countryCode = data.country_code?.toLowerCase()

        const langMap: Record<string, Language> = {
          pt: 'pt',
          br: 'pt-br',
          es: 'es',
          fr: 'fr',
          de: 'de',
          it: 'it',
          ae: 'ar',
          sa: 'ar',
          eg: 'ar',
        }

        const detectedLang = langMap[countryCode] || DEFAULT_LANG
        if (isSupported(detectedLang)) {
          setLangState(detectedLang)
          localStorage.setItem('language', detectedLang)
        }
      } catch (err) {
        console.error('Failed to detect language:', err)
      }
    }

    // Verificar localStorage primeiro
    const savedLang = localStorage.getItem('language')
    if (savedLang && isSupported(savedLang)) {
      setLangState(savedLang)
    } else {
      detectLanguageByIP()
    }
  }, [])

  const setLang = (newLang: Language) => {
    if (isSupported(newLang)) {
      setLangState(newLang)
      localStorage.setItem('language', newLang)
    }
  }

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

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
