import { getAmbassadorBySlugPublic } from '@/lib/ambassadors/ambassadorServiceServer'

export default async function Head({ params }: { params: { slug: string } }) {
  const slug = params.slug

  let ambassador: any = null
  try {
    ambassador = await getAmbassadorBySlugPublic(slug)
  } catch (e) {}

  const title = ambassador?.name ? `${ambassador.name} — Kardme` : 'Kardme'
  const appTitle = ambassador?.name || 'Kardme'

  return (
    <>
      <title>{title}</title>
      <meta name="application-name" content={appTitle} />
      <meta name="apple-mobile-web-app-title" content={appTitle} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* iOS Home Screen icon */}
      <link rel="apple-touch-icon" href={`/emb/${slug}/apple-touch-icon.png`} />

      {/* (Opcional) Ajuda alguns casos de cache */}
      <link rel="icon" href={`/emb/${slug}/apple-touch-icon.png`} />
    </>
  )
}
