import { redirect } from 'next/navigation'

export default async function LegacyAmbassadorRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/emb/${slug}`)
}
