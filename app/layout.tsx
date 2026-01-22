import type { Metadata, Viewport } from 'next'

import './globals.css'
import '@/styles/tokens.css'

// Importa as fontes locais via @fontsource
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/900.css'

import '@fontsource/nunito/400.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/900.css'

import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/900.css'

import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import '@fontsource/poppins/900.css'

export const metadata: Metadata = {
  title: 'Kardme',
  description: 'Cartões digitais inteligentes',

  // PWA
  manifest: '/manifest.webmanifest',

  // iOS "Adicionar ao ecrã principal"
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kardme',
  },

  // (Opcional mas recomendado)
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="pt" 
      className="dark" 
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="antialiased dark">{children}</body>
    </html>
  )
}

