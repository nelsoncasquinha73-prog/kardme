import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import CardOrderWizard from '@/components/CardOrderWizard'
import { createClient } from '@supabase/supabase-js'
import { validateCardOrderAccess } from '@/lib/cardOrderAccess'

export const dynamic = 'force-dynamic'

export default async function CardOrderPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get(`card-order-${slug}`)?.value || ''

  const authorized = await validateCardOrderAccess(slug, token)

  if (!authorized) {
    notFound()
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: order, error } = await db
    .from('card_orders')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !order) {
    notFound()
  }

  const { data: teamRequest } = await db
    .from('card_order_team_requests')
    .select('language')
    .eq('order_id', order.id)
    .limit(1)
    .maybeSingle()

  const language = teamRequest?.language || 'pt-PT'

  return (
    <Suspense fallback={<div>A carregar...</div>}>
      <CardOrderWizard
        slug={slug}
        initialOrder={order}
        language={language}
      />
    </Suspense>
  )
}
