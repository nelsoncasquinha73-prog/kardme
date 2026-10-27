import { requireCardOrderAdmin } from '@/lib/requireCardOrderAdmin'
export const runtime = 'nodejs'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = await requireCardOrderAdmin(_req)
  if (denied) return denied

  try {
    const { slug } = await params

    const { data: order, error } = await supabaseAdmin
      .from('card_orders')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    const zip = new JSZip()

    const addImage = async (url: string, name: string) => {
      const parsed = new URL(url)

      const storageOrigin = new URL(
        process.env.NEXT_PUBLIC_SUPABASE_URL!
      ).origin

      if (
        parsed.origin !== storageOrigin ||
        !parsed.pathname.startsWith('/storage/v1/object/public/card-orders/')
      ) {
        throw new Error(`Origem de imagem não autorizada: ${name}`)
      }

      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        throw new Error(
          `Falha ao descarregar ${name}: HTTP ${response.status}`
        )
      }

      const contentType = response.headers
        .get('content-type')
        ?.split(';')[0]
        .toLowerCase() || ''

      const ext = imageExtensions[contentType]

      if (!ext) {
        throw new Error(`Formato não suportado em ${name}: ${contentType}`)
      }

      const buffer = await response.arrayBuffer()

      if (buffer.byteLength === 0) {
        throw new Error(`Ficheiro vazio: ${name}`)
      }

      zip.file(`${name}.${ext}`, buffer)
    }

    if (order.foto_perfil) {
      await addImage(order.foto_perfil, 'foto-perfil')
    }

    if (Array.isArray(order.fotos_galeria)) {
      for (let i = 0; i < order.fotos_galeria.length; i++) {
        await addImage(
          order.fotos_galeria[i],
          `galeria-${String(i + 1).padStart(2, '0')}`
        )
      }
    }

    const details = {
      nome: order.nome,
      empresa: order.empresa,
      cargo: order.cargo,
      email: order.email,
      telefone: order.telefone,
      whatsapp: order.whatsapp,
      instagram: order.instagram,
      facebook: order.facebook,
      tiktok: order.tiktok,
      linkedin: order.linkedin,
      youtube: order.youtube,
      website: order.website,
      outros_links: order.outros_links,
      bio: order.bio,
      slogan: order.slogan,
      cores_preferidas: order.cores_preferidas,
      notas_estilo: order.notas_estilo,
    }

    zip.file('dados-do-cartao.json', JSON.stringify(details, null, 2))

    const zipBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
    })

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition':
          `attachment; filename="pedido-${slug}-completo.zip"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Erro ao criar ZIP:', err)

    return NextResponse.json(
      { error: 'Não foi possível gerar o ZIP completo.' },
      { status: 500 }
    )
  }
}
