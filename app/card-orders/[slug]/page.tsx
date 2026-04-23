import { Suspense } from 'react'
import CardOrderWizard from '@/components/CardOrderWizard'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export default async function CardOrderPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: order } = await supabaseAdmin
    .from('card_orders')
    .select('*')
    .eq('slug', slug)
    .single()

  return (
    <Suspense fallback={<div>A carregar...</div>}>
      <CardOrderWizard slug={slug} initialOrder={order} />
    </Suspense>
  )
}
