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
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '32px 20px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.5)',
          backgroundColor: '#0a0a0a',
        }}>
          <p style={{ marginBottom: '12px' }}>© 2026 Kardme. Todos os direitos reservados.</p>
          <p>
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.6)', marginRight: '24px', textDecoration: 'none' }}>
              Política de Privacidade
            </a>
            <a href="/terms" style={{ color: 'rgba(255,255,255,0.6)', marginRight: '24px', textDecoration: 'none' }}>
              Termos e Condições
            </a>
            <a href="mailto:admin@kardme.com" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              Contacto
            </a>
          </p>
        </footer>
      </div>
    </LanguageProvider>
  )
}
