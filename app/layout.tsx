import type { Metadata } from "next"
import {
  Geist,
  Geist_Mono,
  Inter,
  Poppins,
  Montserrat,
  Roboto,
  Open_Sans,
  Lato,
  Nunito,
  Playfair_Display,
  Dancing_Script,
} from "next/font/google"

import "./globals.css"
import "@/styles/tokens.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// === Fonts para o editor (FONT_OPTIONS) ===
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
})

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
})

const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" })

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
})

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" })

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" })

export const metadata: Metadata = {
  title: "Kardme",
  description: "Cartões digitais inteligentes",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt"
      className={[
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        poppins.variable,
        montserrat.variable,
        roboto.variable,
        openSans.variable,
        lato.variable,
        nunito.variable,
        playfair.variable,
        dancing.variable,
      ].join(" ")}
    >
      <body className="antialiased">{children}</body>
    </html>
  )
}
