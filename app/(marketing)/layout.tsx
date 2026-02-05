'use client'

import '@/styles/landing-page.css'
import { LanguageProvider } from '@/components/language/LanguageProvider'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="landingRoot">
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
        />
        {children}
      </div>
    </LanguageProvider>
  )
}
