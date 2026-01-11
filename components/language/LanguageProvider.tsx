'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type Language =
  | 'en'
  | 'pt'
  | 'pt-br'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'ar'

type LanguageContextType = {
  lang: Language
  setLang: (l: Language) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

const LanguageContext =
  createContext<LanguageContextType | null>(null)

/* ───────────── DICIONÁRIOS BASE ───────────── */

const DICTS: Record<Language, Record<string, string>> = {
  en: {
    edit_card: 'Edit card',
    theme: 'Theme',
    save: 'Save',
    background: 'Background',
    surface: 'Cards',
    text: 'Text',
    primary: 'Actions',
    language: 'Language',

    // ✅ COMMON
    'common.copy': 'Copy',
    'common.open': 'Open',
  },

  pt: {
    edit_card: 'Editar cartão',
    theme: 'Tema',
    save: 'Guardar',
    background: 'Fundo',
    surface: 'Cartões',
    text: 'Texto',
    primary: 'Ações',
    language: 'Idioma',

    // ✅ COMMON
    'common.copy': 'Copiar',
    'common.open': 'Abrir',
  },

  'pt-br': {
    edit_card: 'Editar cartão',
    theme: 'Tema',
    save: 'Salvar',
    background: 'Fundo',
    surface: 'Cartões',
    text: 'Texto',
    primary: 'Ações',
    language: 'Idioma',

    // ✅ COMMON
    'common.copy': 'Copiar',
    'common.open': 'Abrir',
  },

  es: {
    edit_card: 'Editar tarjeta',
    theme: 'Tema',
    save: 'Guardar',
    background: 'Fondo',
    surface: 'Tarjetas',
    text: 'Texto',
    primary: 'Acciones',
    language: 'Idioma',

    // ✅ COMMON
    'common.copy': 'Copiar',
    'common.open': 'Abrir',
  },

  fr: {
    edit_card: 'Modifier la carte',
    theme: 'Thème',
    save: 'Enregistrer',
    background: 'Fond',
    surface: 'Cartes',
    text: 'Texte',
    primary: 'Actions',
    language: 'Langue',

    // ✅ COMMON
    'common.copy': 'Copier',
    'common.open': 'Ouvrir',
  },

  de: {
    edit_card: 'Karte bearbeiten',
    theme: 'Design',
    save: 'Speichern',
    background: 'Hintergrund',
    surface: 'Karten',
    text: 'Text',
    primary: 'Aktionen',
    language: 'Sprache',

    // ✅ COMMON
    'common.copy': 'Kopieren',
    'common.open': 'Öffnen',
  },

  it: {
    edit_card: 'Modifica carta',
    theme: 'Tema',
    save: 'Salva',
    background: 'Sfondo',
    surface: 'Carte',
    text: 'Testo',
    primary: 'Azioni',
    language: 'Lingua',

    // ✅ COMMON
    'common.copy': 'Copia',
    'common.open': 'Apri',
  },

  ar: {
    edit_card: 'تعديل البطاقة',
    theme: 'المظهر',
    save: 'حفظ',
    background: 'الخلفية',
    surface: 'البطاقات',
    text: 'النص',
    primary: 'الإجراءات',
    language: 'اللغة',

    // ✅ COMMON
    'common.copy': 'نسخ',
    'common.open': 'فتح',
  },
}

/* ───────────── PROVIDER ───────────── */

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode
  initialLang?: Language
}) {
  const [lang, setLangState] = useState<Language>(
    initialLang || 'en'
  )

  // RTL automático
  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

  function setLang(l: Language) {
    setLangState(l)
    localStorage.setItem('kardme_lang', l)
  }

  // prioridade: localStorage > initialLang
  useEffect(() => {
    const stored = localStorage.getItem(
      'kardme_lang'
    ) as Language | null
    if (stored) setLangState(stored)
  }, [])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      dir,
      t: (key: string) =>
        DICTS[lang]?.[key] ??
        DICTS.en[key] ??
        key,
    }),
    [lang]
  )

  return (
    <LanguageContext.Provider value={value}>
      <div dir={dir} lang={lang}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

/* ───────────── HOOK ───────────── */

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    )
  }
  return ctx
}
