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
    return new NextResponse(htmlPage('Erro', '', 'Email não fornecido.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const decodedEmail = decodeURIComponent(email)

  // Verificar se já está unsubscribed
  const supabase = getAdminSupabase()
  let isUnsubscribed = false

  if (broadcastId) {
    const { data: broadcast } = await supabase
      .from('email_broadcasts')
      .select('user_id')
      .eq('id', broadcastId)
      .single()

    if (broadcast?.user_id) {
      const { data: unsub } = await supabase
        .from('email_unsubscribes')
        .select('id')
        .eq('email', decodedEmail)
        .eq('user_id', broadcast.user_id)
        .single()
      isUnsubscribed = !!unsub
    }
  }

  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/email/unsubscribe?broadcastId=${broadcastId}&email=${encodeURIComponent(decodedEmail)}`

  return new NextResponse(
    htmlPage(
      'Preferências de Email',
      decodedEmail,
      isUnsubscribed
        ? 'Já não estás subscrito a esta lista de emails.'
        : 'Gere as tuas preferências de email abaixo.',
      isUnsubscribed ? undefined : unsubscribeUrl
    ),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function htmlPage(title: string, email: string, message: string, unsubscribeUrl?: string) {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Kardme</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1e293b; border-radius: 16px; padding: 48px 32px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
    h1 { color: #fff; font-size: 24px; margin: 0 0 8px 0; }
    .email { color: #3b82f6; font-size: 14px; margin: 0 0 24px 0; }
    p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
    .logo { font-size: 28px; font-weight: 700; color: #3b82f6; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 12px 32px; background: #ef4444; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .btn:hover { background: #dc2626; }
    a.back { color: #3b82f6; text-decoration: none; font-size: 14px; display: block; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Kardme</div>
    <h1>${title}</h1>
    ${email ? `<p class="email">${email}</p>` : ''}
    <p>${message}</p>
    ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" class="btn">Cancelar subscrição</a>` : ''}
    <a href="https://www.kardme.com" class="back">Voltar ao site</a>
  </div>
</body>
</html>`
}
