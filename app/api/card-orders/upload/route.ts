import { requireCardOrderAccess } from '@/lib/requireCardOrderAccess'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import convert from 'heic-convert'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const MAX_SIZE = 5 * 1024 * 1024

function detectImage(bytes: Uint8Array) {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) return { mime: 'image/jpeg', ext: 'jpg' }

  if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10]
      .every((v, i) => bytes[i] === v)
  ) return { mime: 'image/png', ext: 'png' }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) return { mime: 'image/webp', ext: 'webp' }

  return null
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const file = formData.get('file')
    const slug = formData.get('slug')
    const type = formData.get('type')

    if (
      !(file instanceof File) ||
      typeof slug !== 'string' ||
      typeof type !== 'string' ||
      !slug ||
      !['perfil', 'galeria'].includes(type)
    ) {
      return NextResponse.json(
        { error: 'Pedido ou ficheiro inválido' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(slug)) {
      return NextResponse.json(
        { error: 'Identificador inválido' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('card_orders')
      .select('id, status')
      .eq('slug', slug)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    const denied = await requireCardOrderAccess(req, slug)
    if (denied) return denied

    if (order.status !== 'rascunho') {
      return NextResponse.json(
        { error: 'Este pedido já não aceita fotografias' },
        { status: 409 }
      )
    }

    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'A imagem deve ter até 5 MB' },
        { status: 400 }
      )
    }

    const inputBytes = new Uint8Array(await file.arrayBuffer())
    const originalName = file.name.toLowerCase()
    const isHeic =
      /\.(heic|heif)$/.test(originalName) ||
      ['image/heic', 'image/heif', 'image/heic-sequence',
       'image/heif-sequence'].includes(file.type.toLowerCase())

    let bytes: Uint8Array
    let detected: { mime: string; ext: string } | null

    if (isHeic) {
      try {
        const converted = await convert({
          buffer: Buffer.from(inputBytes),
          format: 'JPEG',
          quality: 0.85,
        })

        bytes = new Uint8Array(Buffer.from(converted))
        detected = detectImage(bytes)

        if (!detected || detected.mime !== 'image/jpeg') {
          throw new Error('Invalid converted JPEG')
        }
      } catch {
        return NextResponse.json(
          { error: 'Não foi possível converter esta imagem HEIC/HEIF. Experimenta guardá-la como JPEG.' },
          { status: 400 }
        )
      }
    } else {
      bytes = inputBytes
      detected = detectImage(bytes)

      if (!detected || file.type !== detected.mime) {
        return NextResponse.json(
          { error: 'Utiliza uma imagem JPEG, PNG, WebP ou HEIC/HEIF válida' },
          { status: 400 }
        )
      }
    }

    // Validar novamente os bytes e limitar dimensões para evitar
    // imagens malformadas ou excessivamente grandes.
    try {
      const sharp = (await import('sharp')).default
      const metadata = await sharp(bytes, {
        limitInputPixels: 40_000_000,
        failOn: 'error',
      }).metadata()

      if (
        !metadata.width ||
        !metadata.height ||
        metadata.width * metadata.height > 40_000_000
      ) {
        throw new Error('Invalid image dimensions')
      }
    } catch {
      return NextResponse.json(
        { error: 'O ficheiro não contém uma imagem válida ou suportada' },
        { status: 400 }
      )
    }

    const filename = `${slug}/${type}/${randomUUID()}.${detected.ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('card-orders')
      .upload(filename, bytes, {
        contentType: detected.mime,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: 'Não foi possível enviar a imagem' },
        { status: 500 }
      )
    }

    const { data } = supabaseAdmin.storage
      .from('card-orders')
      .getPublicUrl(filename)

    return NextResponse.json({
      ok: true,
      url: data.publicUrl,
      path: filename,
    })
  } catch (error) {
    console.error('Erro no upload de pedido:', error)

    return NextResponse.json(
      { error: 'Erro interno ao enviar a imagem' },
      { status: 500 }
    )
  }
}
