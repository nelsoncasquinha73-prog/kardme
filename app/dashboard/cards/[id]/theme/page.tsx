import { supabaseServer } from '@/lib/supabaseServer'
import ThemePageClient from './ThemePageClient'
import '@/styles/card-preview.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{ id: string }>
}

export default async function ThemePage({ params }: Props) {
  const { id } = await params

  // 🔎 Card (server)
  const { data: card } = await supabaseServer
    .from('cards')
    .select('*')
    .eq('id', id)
    .single()

  if (!card) return null

  // 🔎 Blocks (server)
  const { data: blocks } = await supabaseServer
    .from('card_blocks')
    .select('*')
    .eq('card_id', id)
    .order('order', { ascending: true })

  return <ThemePageClient card={card} blocks={blocks || []} />
}
