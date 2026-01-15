import React from 'react'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

import CardRenderer from '@/components/card/CardRenderer'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { LanguageProvider } from '@/components/language/LanguageProvider'

import '@/styles/card-preview.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RESERVED_SLUGS = new Set(['reset-password', 'forgot-password', 'login', 'dashboard', 'api', 'templates'])

type Props = {
  params: Promise<{ slug: string }>
}

type CardBg =
  | { mode: 'solid'; color: string; opacity?: number }
  | { mode: 'gradient'; from: string; to: string; angle?: number; opacity?: number }

function bgToCss(bg: CardBg | undefined | null) {
  if (!bg) return { bgCss: 'transparent', bgOpacity: 1 }

  const bgCss =
    bg.mode === 'solid'
      ? bg.color
      : `linear-gradient(${bg.angle ?? 180}deg, ${bg.from}, ${bg.to})`

  const bgOpacity = typeof bg.opacity === 'number' ? bg.opacity : 1
  return { bgCss, bgOpacity }
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

  const { bgCss, bgOpacity } = bgToCss(card.theme?.background)

  return (
    <div
      className="card-preview"
      style={{
        // ✅ fundo global do cartão no público
        background: bgCss,
        opacity: bgOpacity,

        // ✅ garantir que cobre a página toda
        minHeight: '100vh',
      }}
    >
      <LanguageProvider>
        <ThemeProvider theme={card.theme}>
          <CardRenderer card={card} blocks={blocks} showTranslations={false} fullBleed={false} />
        </ThemeProvider>
      </LanguageProvider>
    </div>
  )
}
