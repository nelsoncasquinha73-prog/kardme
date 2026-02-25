import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

function escapeVCardValue(value: string) {
  return String(value)
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

function safeFilename(name: string) {
  // Remove chars perigosos para headers/filename e limita tamanho
  const cleaned = String(name)
    .replace(/[\r\n"]/g, '')
    .replace(/[<>:*?/\\|]+/g, '-')
    .trim()

  const base = cleaned || 'contacto'
  return base.slice(0, 80)
}

async function imageToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const imageType = contentType.includes('png') ? 'PNG' : 'JPEG'

    return `PHOTO;ENCODING=b;TYPE=${imageType}:${base64}`
  } catch {
    return null
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params

    const { data: card, error: cardError } = await supabaseServer
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const { data: blocks, error: blocksErr } = await supabaseServer
      .from('card_blocks')
      .select('*')
      .eq('card_id', cardId)
      .eq('enabled', true)

    if (blocksErr) {
      // não rebenta o vcard; seguimos com o que temos
      console.error('[vcard] blocks error', blocksErr)
    }

    const blockList = blocks || []

    const profileBlock = blockList.find((b: any) => b.type === 'profile')
    const contactBlock = blockList.find((b: any) => b.type === 'contact')
    const socialBlock = blockList.find((b: any) => b.type === 'social')

    const profileSettings = profileBlock?.settings || {}
    const contactSettings = contactBlock?.settings || {}
    const socialSettings = socialBlock?.settings || {}

    const contactItems = contactSettings.items || {}
    const phones = [contactItems.phone?.value].filter(Boolean)
    const emails = [contactItems.email?.value].filter(Boolean)

    const socialItems = socialSettings.items || {}
    const socialLinks = Object.entries(socialItems)
      .filter(([_, item]: [string, any]) => item?.url)
      .map(([type, item]: [string, any]) => ({ type, url: item.url }))

    const rawName = profileSettings.name?.text || card.title || 'Contacto'
    const rawProfession = profileSettings.profession?.text
    const rawCompany = profileSettings.company?.text
    const avatar = profileSettings.avatar?.image

    const slug = card.slug || ''
    const cardUrl = slug ? `https://kardme.com/${slug}` : 'https://kardme.com'

    const name = escapeVCardValue(rawName)
    const profession = rawProfession ? escapeVCardValue(rawProfession) : null
    const company = rawCompany ? escapeVCardValue(rawCompany) : null

    const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0']

    // Nome
    if (rawName) {
      lines.push(`FN:${name}`)

      const nameParts = String(rawName).trim().split(/\s+/).filter(Boolean)
      if (nameParts.length > 1) {
        const lastName = escapeVCardValue(nameParts.pop() as string)
        const firstName = escapeVCardValue(nameParts.join(' '))
        lines.push(`N:${lastName};${firstName};;;`)
      } else {
        lines.push(`N:${escapeVCardValue(rawName)};;;;`)
      }
    }

    if (profession) lines.push(`TITLE:${profession}`)
    if (company) lines.push(`ORG:${company}`)

    // Avatar
    if (avatar) {
      const photoLine = await imageToBase64(avatar)
      if (photoLine) lines.push(photoLine)
    }

    // Telefones
    phones.forEach((phone: string, index: number) => {
      const type = index === 0 ? 'CELL' : 'WORK'
      lines.push(`TEL;TYPE=${type}:${escapeVCardValue(phone)}`)
    })

    // Emails
    emails.forEach((email: string, index: number) => {
      const type = index === 0 ? 'INTERNET' : 'WORK'
      lines.push(`EMAIL;TYPE=${type}:${escapeVCardValue(email)}`)
    })

    lines.push(`URL:${escapeVCardValue(cardUrl)}`)

    socialLinks.forEach((link: { type: string; url: string }) => {
      const socialType = String(link.type || 'OTHER').toUpperCase()
      lines.push(`X-SOCIALPROFILE;TYPE=${escapeVCardValue(socialType)}:${escapeVCardValue(link.url)}`)
    })

    lines.push(`NOTE:${escapeVCardValue('Cartão digital: ' + cardUrl)}`)
    lines.push('END:VCARD')

    const vCard = lines.join('\r\n')

    // Track save_contact (não bloqueia)
    try {
      await supabaseServer.from('card_events').insert({
        card_id: cardId,
        event_type: 'save_contact',
      })
    } catch {}

    const filename = safeFilename(rawName)

    const bytes = new TextEncoder().encode(vCard)

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': buildContentDisposition(filename),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('[vcard] fatal error', err)
    return NextResponse.json({ error: 'Failed to generate vCard' }, { status: 500 })
  }
}


function buildContentDisposition(rawBaseName: string) {
  // ASCII fallback avoids ByteString errors in headers (emoji/unicode)
  const fallback = 'contact.vcf'

  // RFC 5987 filename* (UTF-8 percent-encoded)
  const base = (rawBaseName || 'contact').trim() || 'contact'
  const encoded = encodeURIComponent(base)
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}.vcf`
}
