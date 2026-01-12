import React from 'react'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

import CardRenderer from '@/components/card/CardRenderer'

import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { LanguageProvider } from '@/components/language/LanguageProvider'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params

  /* ───────── CARD ───────── */
  const { data: card, error } = await supabaseServer
    .from('cards')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
  return (
    <pre style={{ padding: 24, whiteSpace: 'pre-wrap' }}>
      {JSON.stringify(
        {
          message: error.message,
          details: (error as any).details,
          hint: (error as any).hint,
          slug,
        },
        null,
        2
      )}
    </pre>
  )
}
if (!card) notFound()


  /* ───────── BLOCKS ───────── */
  const { data: blocksData } = await supabaseServer
    .from('card_blocks')
    .select('*')
    .eq('card_id', card.id)
    .eq('enabled', true)
    .order('order', { ascending: true })

  const blocks = blocksData ?? []

  return (
  <LanguageProvider>
    <ThemeProvider theme={card.theme}>
      <CardRenderer card={card} blocks={blocks} showTranslations={false} fullBleed={false} />
    </ThemeProvider>
  </LanguageProvider>
)

}
