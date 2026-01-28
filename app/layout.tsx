import type { Metadata, Viewport } from 'next'

import './globals.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/styles/tokens.css'
import '@/styles/landing-page.css'

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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kardme',
  },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  )
}
