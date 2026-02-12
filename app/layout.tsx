import type { Metadata, Viewport } from 'next'

import './globals.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/styles/tokens.css'
import '@/styles/landing-page.css'

// === SANS-SERIF (Modernas) ===
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import '@fontsource/poppins/900.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import '@fontsource/montserrat/900.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource/roboto/900.css'
import '@fontsource/open-sans/400.css'
import '@fontsource/open-sans/600.css'
import '@fontsource/open-sans/700.css'
import '@fontsource/open-sans/800.css'
import '@fontsource/lato/400.css'
import '@fontsource/lato/700.css'
import '@fontsource/lato/900.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/nunito/900.css'
import '@fontsource/raleway/400.css'
import '@fontsource/raleway/600.css'
import '@fontsource/raleway/700.css'
import '@fontsource/raleway/800.css'
import '@fontsource/work-sans/400.css'
import '@fontsource/work-sans/600.css'
import '@fontsource/work-sans/700.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import '@fontsource/sora/400.css'
import '@fontsource/sora/600.css'
import '@fontsource/sora/700.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/quicksand/400.css'
import '@fontsource/quicksand/600.css'
import '@fontsource/quicksand/700.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/600.css'
import '@fontsource/rubik/700.css'
import '@fontsource/karla/400.css'
import '@fontsource/karla/600.css'
import '@fontsource/karla/700.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/josefin-sans/400.css'
import '@fontsource/josefin-sans/600.css'
import '@fontsource/josefin-sans/700.css'

// === SERIF (Elegantes) ===
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/800.css'
import '@fontsource/playfair-display/900.css'
import '@fontsource/merriweather/400.css'
import '@fontsource/merriweather/700.css'
import '@fontsource/merriweather/900.css'
import '@fontsource/lora/400.css'
import '@fontsource/lora/600.css'
import '@fontsource/lora/700.css'
import '@fontsource/cormorant/400.css'
import '@fontsource/cormorant/600.css'
import '@fontsource/cormorant/700.css'
import '@fontsource/libre-baskerville/400.css'
import '@fontsource/libre-baskerville/700.css'
import '@fontsource/crimson-text/400.css'
import '@fontsource/crimson-text/600.css'
import '@fontsource/crimson-text/700.css'
import '@fontsource/source-serif-pro/400.css'
import '@fontsource/source-serif-pro/600.css'
import '@fontsource/source-serif-pro/700.css'
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/600.css'
import '@fontsource/eb-garamond/700.css'
import '@fontsource/bitter/400.css'
import '@fontsource/bitter/600.css'
import '@fontsource/bitter/700.css'
import '@fontsource/spectral/400.css'
import '@fontsource/spectral/600.css'
import '@fontsource/spectral/700.css'
import '@fontsource/pt-serif/400.css'
import '@fontsource/pt-serif/700.css'

// === DISPLAY (Impacto) ===
import '@fontsource/oswald/400.css'
import '@fontsource/oswald/600.css'
import '@fontsource/oswald/700.css'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/anton/400.css'
import '@fontsource/archivo-black/400.css'
import '@fontsource/righteous/400.css'
import '@fontsource/passion-one/400.css'
import '@fontsource/passion-one/700.css'
import '@fontsource/russo-one/400.css'
import '@fontsource/alfa-slab-one/400.css'

// === HANDWRITING (Pessoais) ===
import '@fontsource/dancing-script/400.css'
import '@fontsource/dancing-script/700.css'
import '@fontsource/pacifico/400.css'
import '@fontsource/caveat/400.css'
import '@fontsource/caveat/700.css'
import '@fontsource/satisfy/400.css'
import '@fontsource/great-vibes/400.css'
import '@fontsource/sacramento/400.css'
import '@fontsource/kaushan-script/400.css'
import '@fontsource/lobster/400.css'
import '@fontsource/courgette/400.css'
import '@fontsource/permanent-marker/400.css'
import '@fontsource/shadows-into-light/400.css'
import '@fontsource/indie-flower/400.css'

// === MONOSPACE (Tech) ===
import '@fontsource/fira-code/400.css'
import '@fontsource/fira-code/600.css'
import '@fontsource/fira-code/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/source-code-pro/400.css'
import '@fontsource/source-code-pro/600.css'
import '@fontsource/source-code-pro/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource/ibm-plex-mono/700.css'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'

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
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
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
