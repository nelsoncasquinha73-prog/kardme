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
    .select('theme')
    .eq('slug', slug)
    .eq('published', true)
    .single()

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

    // image: usa cor default
    return '#000000'
  })()

  return {
    themeColor: color,
    colorScheme: 'dark',
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


  return (
    <TrackingWrapper cardId={card.id}>
      <MobileCardFrame background={bgCss}>
        <LanguageProvider>
          <ThemeProvider theme={card.theme}>
            <CardPreview
              card={card}
              blocks={blocks}
              showTranslations={false}
              fullBleed={false}
              cardBg={cardBgV1}
            />
          </ThemeProvider>
        </LanguageProvider>
      </MobileCardFrame>
    </TrackingWrapper>
  )
}
