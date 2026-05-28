import { getAmbassadorBySlugPublic } from '@/lib/ambassadors/ambassadorServiceServer'

async function photoLineFromUrl(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null

    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    const imageType =
      contentType.includes('png') ? 'PNG' :
      contentType.includes('webp') ? 'WEBP' :
      'JPEG'

    const buf = Buffer.from(await res.arrayBuffer())
    const base64 = buf.toString('base64')

    return `PHOTO;ENCODING=b;TYPE=${imageType}:${base64}`
  } catch {
    return null
  }
}

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

    const lines: string[] = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${ambassador.name || 'Embaixador'}`,
    ]

    if (ambassador.email) lines.push(`EMAIL:${ambassador.email}`)
    if (ambassador.phone) lines.push(`TEL:${ambassador.phone}`)

    if (ambassador.avatar_url) {
      const photoLine = await photoLineFromUrl(ambassador.avatar_url)
      if (photoLine) lines.push(photoLine)
    }

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
