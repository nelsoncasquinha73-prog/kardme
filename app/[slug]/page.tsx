import React from 'react'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

import CardPreview from '@/components/theme/CardPreview'
import MobileCardFrame from '@/components/theme/MobileCardFrame'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { migrateCardBg, type CardBg } from '@/lib/cardBg'
import { bgToCssString } from '@/lib/bgToCss'
import '@/styles/card-frame.css'
import '@/styles/card-preview.css'
import TrackingWrapper from '@/components/TrackingWrapper'
import FloatingActions from "@/components/public/FloatingActions"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
} as const

const RESERVED_SLUGS = new Set(['reset-password', 'forgot-password', 'login', 'dashboard', 'api', 'templates'])

type Props = {
  params: Promise<{ slug: string }>
}

function bgToCss(bg: CardBg | undefined | null) {
  return bgToCssString(bg) ?? 'transparent'
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  const { data: card } = await supabaseServer
    .from('cards')
    .select('id, theme, title')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!card) {
    return {
      title: 'Kardme',
      description: 'Cartão digital',
    }
  }

  // Buscar o bloco de perfil para obter avatar e nome
  const { data: profileBlock } = await supabaseServer
    .from('card_blocks')
    .select('settings')
    .eq('card_id', card.id)
    .eq('type', 'profile')
    .eq('enabled', true)
    .single()

  const profileSettings = profileBlock?.settings as any
  const name = profileSettings?.name?.text || card.title || 'Cartão Digital'
  const jobTitle = profileSettings?.profession?.text || ''
  const avatarUrl = profileSettings?.avatar?.image
  const description = jobTitle ? `${name} - ${jobTitle}` : name

  const rawBg = card?.theme?.background
  const v1 = migrateCardBg(rawBg)

  const color = (() => {
    if (v1.base.kind === 'solid') {
      return v1.base.color ?? '#000000'
    }

    if (v1.base.kind === 'gradient') {
      const stops = v1.base.stops ?? [{ color: '#000000', pos: 0 }]
      return stops[0]?.color ?? '#000000'
    }

    return v1.browserBarColor ?? '#000000'
  })()

  const baseUrl = 'https://kardme.com'

  return {
    title: `${name} | Kardme`,
    description,
    manifest: `/api/manifest/${slug}`,
    other: {
      "theme-color": color,
    },
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: color },
      { media: "(prefers-color-scheme: dark)", color: color },
    ],
    metadataBase: new URL(baseUrl),
    colorScheme: 'dark',
    openGraph: {
      title: `${name} | Kardme`,
      description,
      url: `${baseUrl}/${slug}`,
      siteName: 'Kardme',
      type: 'profile',
      ...(avatarUrl && {
        images: [
          {
            url: avatarUrl,
            width: 400,
            height: 400,
            alt: name,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary',
      title: `${name} | Kardme`,
      description,
      ...(avatarUrl && { images: [avatarUrl] }),
    },
  }
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params

  if (RESERVED_SLUGS.has(slug)) notFound()

  const { data: card, error } = await supabaseServer
    .from('cards')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error || !card) notFound()

  const { data: blocksData, error: blocksError } = await supabaseServer
    .from('card_blocks')
    .select('*')
    .eq('card_id', card.id)
    .eq('enabled', true)
    .order('order', { ascending: true })

  if (blocksError) notFound()

  const blocks = blocksData ?? []
  const cardBgV1 = migrateCardBg(card?.theme?.background)
  const isImageBg = cardBgV1.base.kind === 'image'
  const bgCss = isImageBg ? 'transparent' : bgToCss(card?.theme?.background)

  // Extrair dados para vCard
  const profileBlock = blocks.find((b: any) => b.type === "profile")
  const contactBlock = blocks.find((b: any) => b.type === "contact")
  const socialBlock = blocks.find((b: any) => b.type === "social")
  const infoBlock = blocks.find((b: any) => b.type === "info_utilities")
  
  const profileSettings = profileBlock?.settings || {}
  const contactSettings = contactBlock?.settings || {}
  const socialSettings = socialBlock?.settings || {}
  const infoSettings = infoBlock?.settings || {}
  
  // Extrair contactos (items é um objeto com phone, email, whatsapp, telegram)
  const contactItems = contactSettings.items || {}
  const phones = [contactItems.phone?.value].filter(Boolean) as string[]
  const emails = [contactItems.email?.value].filter(Boolean) as string[]
  const website = contactItems.website?.value
  
  // Extrair redes sociais (items é um objeto por rede)
  const socialItems = socialSettings.items || {}
  const socialLinks = Object.entries(socialItems)
    .filter(([_, item]: [string, any]) => item?.url)
    .map(([type, item]: [string, any]) => ({ type, url: item.url }))
  
  // Extrair localização do infoBlock (items é um array)
  const infoItems = infoSettings.items || []
  const addressItem = infoItems.find((i: any) => i.type === "address" && i.enabled)
  const address = addressItem?.value || ""
  
  const vCardData = {
    name: profileSettings.name?.text || card.title,
    profession: profileSettings.profession?.text,
    company: profileSettings.company?.text,
    avatar: profileSettings.avatar?.image,
    phones,
    emails,
    website,
    address,
    socialLinks,
  }
  
  const cardUrl = `https://kardme.com/${slug}`

  const floatingActions = card?.theme?.floatingActions || {}

  const barColor = cardBgV1.browserBarColor ?? "#000000"

  return (
    <>
      <style>{`html, body { background-color: ${barColor} !important; }`}</style>
      <TrackingWrapper cardId={card.id}>
        <div style={{ minHeight: "100dvh", width: "100%", backgroundColor: barColor, paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div style={{ minHeight: "100dvh", width: "100%", maxWidth: "420px", margin: "0 auto" }}>
            <LanguageProvider>
              <ThemeProvider theme={card.theme}>
                <CardPreview
                  card={card}
                  blocks={blocks}
                  showTranslations={false}
                  fullBleed={true}
                  cardBg={cardBgV1}
                />
                <FloatingActions
                  cardUrl={cardUrl}
                  cardTitle={card.title}
                  cardId={card.id}
                  settings={floatingActions}
                />
              </ThemeProvider>
            </LanguageProvider>
          </div>
        </div>
      </TrackingWrapper>
    </>
  )
}
