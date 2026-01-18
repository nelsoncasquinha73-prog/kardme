'use client'

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

  const { bgCss, bgOpacity } = bgToCss(card.theme?.background)

  const pageBg =
    bgOpacity >= 1 ? bgCss : `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0)), ${bgCss}`

  // Moldura do telemóvel (igual ao preview)
  const phoneW = 420
  const phoneH = 880
  const phoneRadius = 56
  const frameBorder = 10
  const bezel = 16
  const phonePadding = frameBorder + bezel

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

        background: pageBg,
      }}
    >
      <div
        style={{
          width: phoneW,
          height: phoneH,
          borderRadius: phoneRadius,
          background: '#0b0f19',
          border: `${frameBorder}px solid rgba(255,255,255,0.10)`,
          boxShadow: '0 30px 90px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.10)',
          position: 'relative',
          padding: phonePadding,
          boxSizing: 'border-box',
        }}
      >
        {/* Side shine */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: phoneRadius,
            pointerEvents: 'none',
            background:
              'linear-gradient(120deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 35%, rgba(255,255,255,0.00) 60%)',
            mixBlendMode: 'overlay',
            opacity: 0.55,
          }}
        />

        {/* Top bezel accent */}
        <div
          style={{
            position: 'absolute',
            top: frameBorder + 6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 140,
            height: 3,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.10)',
            pointerEvents: 'none',
          }}
        />

        {/* Bottom bezel accent */}
        <div
          style={{
            position: 'absolute',
            bottom: frameBorder + 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 2,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Screen */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: phoneRadius - phonePadding,
            background: bgCss,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <LanguageProvider>
            <ThemeProvider theme={card.theme}>
              <CardPreview
                card={card}
                blocks={blocks}
                showTranslations={false}
                fullBleed
                cardBg={card.theme.background}
              />
            </ThemeProvider>
          </LanguageProvider>
        </div>
      </div>
    </div>
  )
}
