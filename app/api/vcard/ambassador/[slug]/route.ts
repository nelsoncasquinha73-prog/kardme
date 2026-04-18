import { getAmbassadorBySlugPublic } from '@/lib/ambassadors/ambassadorServiceServer'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const ambassador = await getAmbassadorBySlugPublic(slug)

    if (!ambassador) {
      return new Response('Ambassador not found', { status: 404 })
    }

    // Gerar vCard
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${ambassador.name || 'Embaixador'}`,
    ]

    if (ambassador.email) lines.push(`EMAIL:${ambassador.email}`)
    if (ambassador.phone) lines.push(`TEL:${ambassador.phone}`)
    if (ambassador.avatar_url) lines.push(`PHOTO;VALUE=URI:${ambassador.avatar_url}`)
    if (ambassador.bio) lines.push(`NOTE:${ambassador.bio.replace(/\n/g, '\\n')}`)

    lines.push(`URL:https://kardme.com/emb/${slug}`)
    lines.push(`UID:${ambassador.id}@kardme.com`)
    lines.push('END:VCARD')

    const vcard = lines.join('\r\n')

    return new Response(vcard, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${ambassador.name || 'ambassador'}.vcf"`,
      },
    })
  } catch (error) {
    console.error('[vcard ambassador] Error:', error)
    return new Response('Error generating vCard', { status: 500 })
  }
}
