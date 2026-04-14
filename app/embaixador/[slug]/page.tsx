import { redirect } from 'next/navigation'

export default function LegacyAmbassadorRedirect({ params }: { params: { slug: string } }) {
  redirect(`/emb/${params.slug}`)
}
