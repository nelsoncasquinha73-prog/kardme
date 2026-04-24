import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Extensões permitidas para ficheiros (não imagens)
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'txt', 'csv']

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Missing x-user-id' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file || !type) {
      return NextResponse.json(
        { error: 'Ficheiro e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Se é ficheiro (não imagem), valida extensão
    if (type === 'file_url') {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `Extensão não permitida. Permitidas: ${ALLOWED_EXTENSIONS.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Se é imagem, valida tipo MIME
    if (type === 'capture_page_image') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Apenas imagens são permitidas' },
          { status: 400 }
        )
      }
    }

    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ficheiro muito grande (máx 10MB)' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop() || 'bin'
    const filename = `${userId}/${type}/${timestamp}-${randomId}.${ext}`

    const { data, error } = await supabaseAdmin.storage
      .from('card-orders')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('card-orders').getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (e: any) {
    console.error('lead-magnets/upload error:', e)
    return NextResponse.json(
      { error: e?.message || 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}
