import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params

  // Buscar o cartão
  const { data: card, error: cardError } = await supabaseServer
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single()

  if (cardError || !card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  // Buscar os blocos
  const { data: blocks } = await supabaseServer
    .from('card_blocks')
    .select('*')
    .eq('card_id', cardId)
    .eq('enabled', true)

  const blockList = blocks || []

  // Extrair dados dos blocos
  const profileBlock = blockList.find((b: any) => b.type === 'profile')
  const contactBlock = blockList.find((b: any) => b.type === 'contact')
  const socialBlock = blockList.find((b: any) => b.type === 'social')

  const profileSettings = profileBlock?.settings || {}
  const contactSettings = contactBlock?.settings || {}
  const socialSettings = socialBlock?.settings || {}

  // Extrair contactos
  const contactItems = contactSettings.items || {}
  const phones = [contactItems.phone?.value].filter(Boolean)
  const emails = [contactItems.email?.value].filter(Boolean)

  // Extrair redes sociais
  const socialItems = socialSettings.items || {}
  const socialLinks = Object.entries(socialItems)
    .filter(([_, item]: [string, any]) => item?.url)
    .map(([type, item]: [string, any]) => ({ type, url: item.url }))

  // Dados do vCard
  const name = profileSettings.name?.text || card.title || 'Contacto'
  const profession = profileSettings.profession?.text
  const company = profileSettings.company?.text
  const avatar = profileSettings.avatar?.image
  const cardUrl = `https://kardme.com/${card.slug}`

  // Gerar vCard
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
  ]

  // Nome
  if (name) {
    lines.push(`FN:${name}`)
    const nameParts = name.split(' ')
    if (nameParts.length > 1) {
      const lastName = nameParts.pop()
      const firstName = nameParts.join(' ')
      lines.push(`N:${lastName};${firstName};;;`)
    } else {
      lines.push(`N:${name};;;;`)
    }
  }

  // Profissão
  if (profession) {
    lines.push(`TITLE:${profession}`)
  }

  // Empresa
  if (company) {
    lines.push(`ORG:${company}`)
  }

  // Avatar/Foto
  if (avatar) {
    lines.push(`PHOTO;VALUE=URI:${avatar}`)
  }

  // Telefones
  phones.forEach((phone: string, index: number) => {
    if (phone) {
      const type = index === 0 ? 'CELL' : 'WORK'
      lines.push(`TEL;TYPE=${type}:${phone}`)
    }
  })

  // Emails
  emails.forEach((email: string, index: number) => {
    if (email) {
      const type = index === 0 ? 'INTERNET' : 'WORK'
      lines.push(`EMAIL;TYPE=${type}:${email}`)
    }
  })

  // URL do cartão digital
  lines.push(`URL:${cardUrl}`)

  // Redes sociais
  socialLinks.forEach((link: { type: string; url: string }) => {
    if (link.url) {
      const socialType = link.type?.toUpperCase() || 'OTHER'
      lines.push(`X-SOCIALPROFILE;TYPE=${socialType}:${link.url}`)
    }
  })

  // Nota
  lines.push(`NOTE:Cartão digital: ${cardUrl}`)

  lines.push('END:VCARD')

  const vCard = lines.join('\r\n')

  // Retornar como ficheiro .vcf
  return new NextResponse(vCard, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}.vcf"`,
    },
  })
}
