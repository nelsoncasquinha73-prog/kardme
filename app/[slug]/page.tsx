import React from 'react'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

import CardPreview from '@/components/theme/CardPreview'
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

export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  const { data: card } = await supabaseServer
    .from('cards')
    .select('theme')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  const bg = card?.theme?.background
  const color =
    bg?.mode === 'solid'
      ? (bg.color ?? '#000000')
      : (bg?.from ?? '#000000')

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

  return (
    <div
  className="card-preview"
  style={{
    minHeight: '100dvh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    boxSizing: 'border-box',
    paddingTop: 12,
    paddingLeft: 'max(16px, env(safe-area-inset-left))',
    paddingRight: 'max(16px, env(safe-area-inset-right))',
    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
    background: 'transparent',
  }}
>
  <div style={{ width: '100%', maxWidth: 480, boxSizing: 'border-box' }}>
    <LanguageProvider>
      <ThemeProvider theme={card.theme}>
        <CardPreview
          card={card}
          blocks={blocks}
          showTranslations={false}
          fullBleed={true}
          cardBg={card.theme.background}
        />
      </ThemeProvider>
    </LanguageProvider>
  </div>
</div>

  )
}
