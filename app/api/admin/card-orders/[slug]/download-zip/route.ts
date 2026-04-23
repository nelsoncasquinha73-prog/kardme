import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Erro ao baixar ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    // Fetch pedido
    const { data: order, error } = await supabaseAdmin
      .from('card_orders')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Criar ZIP
    const zip = new JSZip()

    // Adicionar foto de perfil
    if (order.foto_perfil) {
      try {
        const perfil = await downloadFile(order.foto_perfil)
        const ext = order.foto_perfil.split('.').pop() || 'jpg'
        zip.file(`perfil.${ext}`, perfil)
      } catch (err) {
        console.error('Erro ao baixar foto de perfil:', err)
      }
    }

    // Adicionar galeria
    if (order.fotos_galeria && Array.isArray(order.fotos_galeria)) {
      const galeraFolder = zip.folder('galeria')
      for (let i = 0; i < order.fotos_galeria.length; i++) {
        try {
          const foto = await downloadFile(order.fotos_galeria[i])
          const ext = order.fotos_galeria[i].split('.').pop() || 'jpg'
          galeraFolder?.file(`foto-${i + 1}.${ext}`, foto)
        } catch (err) {
          console.error(`Erro ao baixar foto ${i + 1}:`, err)
        }
      }
    }

    // Gerar ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="pedido-${slug}-fotos.zip"`,
      },
    })
  } catch (err: any) {
    console.error('Erro ao criar ZIP:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
