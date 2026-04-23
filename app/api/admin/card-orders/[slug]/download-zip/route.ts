import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: order, error: orderError } = await supabaseAdmin
    .from('card_orders')
    .select('*')
    .eq('slug', slug)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  const zip = new JSZip()

  // Adiciona foto de perfil
  if (order.foto_perfil) {
    try {
      const response = await fetch(order.foto_perfil)
      const buffer = await response.arrayBuffer()
      zip.file('foto-perfil.jpg', buffer)
    } catch (err) {
      console.error('Erro ao baixar foto de perfil:', err)
    }
  }

  // Adiciona fotos da galeria
  if (order.fotos_galeria && Array.isArray(order.fotos_galeria)) {
    for (let i = 0; i < order.fotos_galeria.length; i++) {
      try {
        const response = await fetch(order.fotos_galeria[i])
        const buffer = await response.arrayBuffer()
        zip.file(`galeria-${i + 1}.jpg`, buffer)
      } catch (err) {
        console.error(`Erro ao baixar foto ${i + 1}:`, err)
      }
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="pedido-${slug}-fotos.zip"`,
    },
  })
}
