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
    console.log('[VIDEO_OPEN_NOTIFY] Starting:', { broadcastId, leadId })

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

    console.log('[VIDEO_OPEN_NOTIFY] Broadcast:', { broadcast, bcastError })

    if (bcastError || !broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    // Se notificacao nao esta ativada, sair
    if (!broadcast.notify_on_video_opens) {
      console.log('[VIDEO_OPEN_NOTIFY] notify_on_video_opens is false, skipping')
      return NextResponse.json({ success: true })
    }

    // Verificar cooldown: última notificação nos últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentNotification } = await supabaseAdmin
      .from('email_video_open_notifications')
      .select('id')
      .eq('broadcast_id', broadcastId)
      .eq('lead_id', leadId)
      .gt('sent_at', fiveMinutesAgo)
      .limit(1)
      .single()

    if (recentNotification) {
      console.log('[VIDEO_OPEN_NOTIFY] Cooldown ativo, notificação não enviada')
      return NextResponse.json({ success: true, cooldown: true })
    }

    // Buscar lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('name, email')
      .eq('id', leadId)
      .single()

    console.log('[VIDEO_OPEN_NOTIFY] Lead:', { lead, leadError })

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Buscar user (remetente)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(broadcast.user_id)

    console.log('[VIDEO_OPEN_NOTIFY] User:', { user: user?.email, userError })

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verificar se Gmail está conectado
    const { data: gmailIntegration, error: gmailError } = await supabaseAdmin
      .from('user_integrations')
      .select('id, sender_email')
      .eq('user_id', broadcast.user_id)
      .eq('integration_type', 'gmail')
      .single()

    console.log('[VIDEO_OPEN_NOTIFY] Gmail integration:', { gmailIntegration, gmailError })

    if (gmailError || !gmailIntegration) {
      console.error('[VIDEO_OPEN_NOTIFY] Gmail not connected for user:', broadcast.user_id)
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 401 })
    }

    // Enviar email via /api/send-email
    console.log('[VIDEO_OPEN_NOTIFY] Calling /api/send-email...')
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
          <p><strong>${lead.name}</strong> (${lead.email}) abriu o vídeo da sua campanha <strong>"${broadcast.subject}"</strong> às ${new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}.</p>
          <p><a href="https://kardme.com/dashboard/crm?lead=${leadId}" style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Ver lead</a></p>
        `,
      }),
    })

    const responseText = await response.text()
    console.log('[VIDEO_OPEN_NOTIFY] /api/send-email response:', response.status, responseText)

    if (!response.ok) {
      console.error('[VIDEO_OPEN_NOTIFY] Erro ao enviar email:', response.status, responseText)
      return NextResponse.json({ error: 'Failed to send notification', details: responseText }, { status: 500 })
    }

    // Registar notificação na tabela nova
    await supabaseAdmin
      .from('email_video_open_notifications')
      .insert({
        broadcast_id: broadcastId,
        lead_id: leadId,
        sent_at: new Date().toISOString(),
      })

    console.log('[VIDEO_OPEN_NOTIFY] Notification recorded successfully')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[VIDEO_OPEN_NOTIFY] Erro:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
