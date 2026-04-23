import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const slug = formData.get('slug') as string
    const type = formData.get('type') as 'perfil' | 'galeria' // perfil ou galeria

    if (!file || !slug || !type) {
      return NextResponse.json(
        { error: 'Ficheiro, slug e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de ficheiro
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Apenas imagens são permitidas' },
        { status: 400 }
      )
    }

    // Validar tamanho (máx 5MB por imagem)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Imagem muito grande (máx 5MB)' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const filename = `${slug}/${type}/${timestamp}-${randomId}-${file.name}`

    const { data, error } = await supabaseAdmin.storage
      .from('card-orders')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Gerar URL pública
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('card-orders').getPublicUrl(filename)

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      path: filename,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}
