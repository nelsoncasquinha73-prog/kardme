import React from 'react'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

import CardPreview from '@/components/theme/CardPreview'
import MobileCardFrame from '@/components/theme/MobileCardFrame'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import type { CardBg } from '@/lib/cardBg'
import { bgToCssString } from '@/lib/bgToCss'
import '@/styles/card-frame.css'
import '@/styles/card-preview.css'

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

    const bg = card?.theme?.background as CardBg | undefined

  const color = (() => {
    if (!bg) return '#000000'

    // v1
    if ((bg as any).version === 1) {
      const base = (bg as any).base
      if (base?.kind === 'solid') return base.color ?? '#000000'
      if (base?.kind === 'gradient') return (base.stops?.[0]?.color ?? '#000000')
      return '#000000'
    }

    // legacy
    if ((bg as any).mode === 'solid') return (bg as any).color ?? '#000000'
    if ((bg as any).mode === 'gradient') return (bg as any).from ?? '#000000'
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
  const bgCss = bgToCss(card?.theme?.background)

  return (
    <MobileCardFrame background={bgCss}>
      <LanguageProvider>
        <ThemeProvider theme={card.theme}>
          <CardPreview
            card={card}
            blocks={blocks}
            showTranslations={false}
            fullBleed={false}
            cardBg={card.theme?.background}
          />
        </ThemeProvider>
      </LanguageProvider>
    </MobileCardFrame>
  )
}
