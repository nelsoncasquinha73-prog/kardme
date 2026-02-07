'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function LanguageProviderClient({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const [lang, setLang] = useState<string | null>(null)

  useEffect(() => {
    const urlLang = searchParams.get('lang')
    if (urlLang) {
      localStorage.setItem('language', urlLang)
      // Força reload para aplicar a língua
      window.location.reload()
    }
  }, [searchParams])

  return <>{children}</>
}
