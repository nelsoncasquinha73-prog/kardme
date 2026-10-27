import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()

    // Apenas os campos do formulário podem ser alterados.
    const allowedFields = [
      'nome', 'empresa', 'cargo', 'email', 'telefone',
      'whatsapp', 'instagram', 'facebook', 'tiktok',
      'linkedin', 'youtube', 'website', 'outros_links',
      'bio', 'slogan', 'foto_perfil', 'fotos_galeria',
      'cores_preferidas', 'notas_estilo',
    ]

    const payload = Object.fromEntries(
      allowedFields
        .filter(field => Object.prototype.hasOwnProperty.call(body, field))
        .map(field => [field, body[field]])
    )

    const { data, error } = await supabaseAdmin
      .from('card_orders')
      .update(payload)
      .eq('slug', slug)
      .eq('status', 'rascunho')
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, order: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
