import React from 'react'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

// 🔹 BLOCKS
import HeaderBlock from '@/components/blocks/HeaderBlock'
import ProfileBlock from '@/components/blocks/ProfileBlock'
import GalleryBlock from '@/components/blocks/GalleryBlock'
import ContactBlock from '@/components/blocks/ContactBlock'
import LeadFormBlock from '@/components/blocks/LeadFormBlock'
import SocialBlock from '@/components/blocks/SocialBlock'
import DecorationsBlock from '@/components/blocks/DecorationBlock'

import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { LanguageProvider } from '@/components/language/LanguageProvider'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{
    slug: string
  }>
}

function toPx(v: any) {
  if (v === null || v === undefined || v === '') return undefined
  if (typeof v === 'number') return `${v}px`
  return v
}

function blockStyleFromJson(style: any): React.CSSProperties {
  const s = style || {}

  return {
    background: s.bgColor ?? undefined,
    color: s.textColor ?? undefined,

    borderStyle: s.borderWidth ? 'solid' : undefined,
    borderWidth: s.borderWidth ? toPx(s.borderWidth) : undefined,
    borderColor: s.lineColor ?? undefined,

    borderRadius: s.radius != null ? toPx(s.radius) : undefined,

    padding: s.padding != null ? toPx(s.padding) : undefined,
    margin: s.margin != null ? toPx(s.margin) : undefined,

    fontFamily: s.fontFamily ?? undefined,
  }
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params

  /* ───────── CARD ───────── */
  const { data: card, error } = await supabaseServer
    .from('cards')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !card) notFound()

  /* ───────── BLOCKS ───────── */
  const { data: blocksData } = await supabaseServer
    .from('card_blocks')
    .select('*')
    .eq('card_id', card.id)
    .eq('enabled', true)
    .order('order', { ascending: true })

  const blocks = blocksData ?? []
  const headerBlock = blocks.find(b => b.type === 'header') // ✅ NOVO

  return (
    <LanguageProvider>
      <ThemeProvider theme={card.theme}>
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--color-background)',
            padding: '32px 0 120px',
          }}
        >
          <main
            style={{
              maxWidth: 420,
              margin: '0 auto',
              padding: '0 16px',
            }}
          >
            <div
              style={{
                position: 'relative',
                background: 'var(--color-surface)',
                borderRadius: 32,
                padding: '24px 20px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 40,
                boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
              }}
            >
              {/* DECORATIONS (overlay) */}
              {blocks
                .filter(b => b.type === 'decorations')
                .map(b => (
                  <div
                    key={b.id}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      zIndex: 5,
                      ...blockStyleFromJson(b.style),
                    }}
                  >
                    <DecorationsBlock settings={b.settings} />
                  </div>
                ))}

              {blocks
                .filter(b => b.type !== 'decorations')
                .map(block => {
                  const wrapStyle: React.CSSProperties = {
                    position: 'relative',
                    zIndex: 10,
                    borderRadius: 18,
                    ...blockStyleFromJson(block.style),
                  }

                  switch (block.type) {
                    case 'header':
                      return (
                        <div key={block.id} style={wrapStyle}>
                          <HeaderBlock settings={block.settings} />
                        </div>
                      )

                    case 'profile':
                      return (
                        <div key={block.id} style={wrapStyle}>
                          <ProfileBlock
                            settings={block.settings}
                            headerSettings={headerBlock?.settings} // ✅ NOVO
                          />
                        </div>
                      )

                    case 'gallery':
                      return (
                        <div key={block.id} style={wrapStyle}>
                          <GalleryBlock settings={block.settings} />
                        </div>
                      )

                    case 'contact':
                      return (
                        <div key={block.id} style={wrapStyle}>
                          <ContactBlock settings={block.settings} />
                        </div>
                      )

                    case 'lead_form':
                      return (
                        <div key={block.id} style={wrapStyle}>
                          <LeadFormBlock
                            cardId={card.id}
                            settings={block.settings}
                          />
                        </div>
                      )

                    case 'social':
                      return (
                        <div key={block.id} style={wrapStyle}>
                          <SocialBlock settings={block.settings} />
                        </div>
                      )

                    default:
                      return null
                  }
                })}
            </div>
          </main>
        </div>
      </ThemeProvider>
    </LanguageProvider>
  )
}
