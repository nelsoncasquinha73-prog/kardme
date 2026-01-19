import React from 'react'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

import CardPreview from '@/components/theme/CardPreview'
import MobileCardFrame from '@/components/theme/MobileCardFrame'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { LanguageProvider } from '@/components/language/LanguageProvider'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RESERVED_SLUGS = new Set(['reset-password', 'forgot-password', 'login', 'dashboard', 'api', 'templates'])

type Props = {
  params: Promise<{ slug: string }>
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

  const { data: blocks } = await supabaseServer
    .from('card_blocks')
    .select('*')
    .eq('card_id', card.id)
    .eq('enabled', true)
    .order('order', { ascending: true })

  return (
    <LanguageProvider>
      <ThemeProvider theme={card.theme}>
        <MobileCardFrame background={card.theme?.background?.color}>
          <CardPreview
            card={card}
            blocks={blocks ?? []}
            showTranslations={false}
            fullBleed={true}
            cardBg={card.theme?.background}
          />
        </MobileCardFrame>
      </ThemeProvider>
    </LanguageProvider>
  )
}
