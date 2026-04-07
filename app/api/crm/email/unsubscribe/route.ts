import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing env vars')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const broadcastId = searchParams.get('broadcastId')

  if (!email) {
    return new NextResponse(htmlPage('Erro', 'Email não fornecido.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const supabase = getAdminSupabase()

  // Buscar o user_id do broadcast
  let userId: string | null = null
  if (broadcastId) {
    const { data: broadcast } = await supabase
      .from('email_broadcasts')
      .select('user_id')
      .eq('id', broadcastId)
      .single()
    userId = broadcast?.user_id || null
  }

  // Inserir unsubscribe
  const { error } = await supabase
    .from('email_unsubscribes')
    .upsert({
      email: decodeURIComponent(email),
      user_id: userId,
      reason: 'unsubscribe_link',
      unsubscribed_at: new Date().toISOString(),
    }, { onConflict: 'email,user_id' })

  if (error) {
    console.error('Unsubscribe error:', error)
    return new NextResponse(htmlPage('Erro', 'Ocorreu um erro. Tente novamente.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  return new NextResponse(
    htmlPage('Subscrição removida', 'O teu email foi removido com sucesso. Não receberás mais emails desta lista.'),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function htmlPage(title: string, message: string) {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Kardme</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1e293b; border-radius: 16px; padding: 48px 32px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
    h1 { color: #fff; font-size: 24px; margin: 0 0 16px 0; }
    p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
    .logo { font-size: 28px; font-weight: 700; color: #3b82f6; margin-bottom: 24px; }
    a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Kardme</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://www.kardme.com">Voltar ao site</a>
  </div>
</body>
</html>`
}
