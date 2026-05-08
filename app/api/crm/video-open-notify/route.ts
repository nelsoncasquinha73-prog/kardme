import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const { broadcastId, leadId } = await req.json()
    console.log('[VIDEO_OPEN_NOTIFY] payload', { broadcastId, leadId })

    if (!broadcastId || !leadId) {
      return NextResponse.json({ error: 'Missing broadcastId or leadId' }, { status: 400 })
    }

    const supabaseAdmin = getAdminSupabase()

    // Buscar broadcast
    const { data: broadcast, error: bcastError } = await supabaseAdmin
      .from('email_broadcasts')
      .select('id, subject, notify_on_video_opens, user_id')
      .eq('id', broadcastId)
      .single()

    if (bcastError || !broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    // Se notificacao nao esta ativada, sair
    console.log('[VIDEO_OPEN_NOTIFY] broadcast found', { id: broadcast.id, notify: broadcast.notify_on_video_opens, user_id: broadcast.user_id, subject: broadcast.subject })

    if (!broadcast.notify_on_video_opens) {
      return NextResponse.json({ success: true })
    }

    // Buscar lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('name, email')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Buscar user (remetente)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(broadcast.user_id)

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Enviar email via /api/send-email
    console.log('[VIDEO_OPEN_NOTIFY] sending email to', user.email, 'subject:', `Video aberto: ${lead.name}`)
    const response = await fetch(new URL('/api/send-email', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: broadcast.user_id,
        leadId: leadId,
        recipientEmail: user.email,
        subject: `Video aberto: ${lead.name}`,
        body: `
          <p>Olá,</p>
          <p><strong>${lead.name}</strong> (${lead.email}) abriu o vídeo da sua campanha <strong>"${broadcast.subject}"</strong> às ${new Date().toLocaleString('pt-PT')}.</p>
          <p><a href="https://kardme.com/dashboard/crm" style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Ver detalhes</a></p>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[VIDEO_OPEN_NOTIFY] Erro ao enviar email:', error)
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[VIDEO_OPEN_NOTIFY] Erro:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
