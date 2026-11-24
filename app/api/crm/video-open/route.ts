import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendGmail } from '@/lib/server/gmailTransport'
import { getOwnedLead, ownsCard } from '@/lib/server/emailAuthorization'

function escapeHtml(value: string | null) {
  return (value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export async function POST(request: Request) {
  try {
    const { previewId, leadId, broadcastId } = await request.json().catch(() => ({})) || {}
    if (typeof previewId !== 'string' || typeof leadId !== 'string' ||
        (broadcastId != null && typeof broadcastId !== 'string')) {
      return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
    }

    const { data: preview } = await supabaseAdmin.from('email_video_previews')
      .select('user_id, broadcast_id').eq('id', previewId).maybeSingle()
    const lead = preview && await getOwnedLead(preview.user_id, leadId)
    if (!preview || !lead) return NextResponse.json({ error: 'Evento indisponível' }, { status: 404 })

    let campaign
    if (broadcastId) {
      const { data } = await supabaseAdmin.from('email_broadcasts')
        .select('subject, html_content, notify_on_video_opens, sender_card_id')
        .eq('id', broadcastId).eq('user_id', preview.user_id).maybeSingle()
      const blocks = data?.html_content?.blocks
      const linked = preview.broadcast_id === broadcastId ||
        (!preview.broadcast_id && Array.isArray(blocks) && blocks.some(block => block?.content?.previewId === previewId))
      const { data: recipient } = await supabaseAdmin.from('email_broadcast_recipients')
        .select('lead_id').eq('broadcast_id', broadcastId).eq('lead_id', lead.id)
        .eq('status', 'sent').limit(1).maybeSingle()
      if (!data || !linked || !recipient ||
          (data.sender_card_id && !(await ownsCard(preview.user_id, data.sender_card_id)))) return NextResponse.json({ error: 'Evento indisponível' }, { status: 404 })
      campaign = data
    } else if (preview.broadcast_id) {
      return NextResponse.json({ error: 'Evento indisponível' }, { status: 404 })
    }

    const { error } = await supabaseAdmin.from('email_video_opens').insert({
      preview_id: previewId, lead_id: lead.id, broadcast_id: broadcastId || null,
      opened_at: new Date().toISOString(), user_id: preview.user_id,
    })
    if (error) return NextResponse.json({ error: 'Erro ao registar evento' }, { status: 500 })

    if (campaign?.notify_on_video_opens) {
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: recent, error: recentError } = await supabaseAdmin.from('email_video_open_notifications')
        .select('id').eq('broadcast_id', broadcastId).eq('lead_id', lead.id)
        .gt('sent_at', cutoff).limit(1).maybeSingle()
      if (!recent && !recentError) {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(preview.user_id)
        if (user?.email) {
          await sendGmail({
            userId: preview.user_id, leadId: lead.id, recipientEmail: user.email,
            subject: `Video aberto: ${lead.name || ''}`.replace(/[\r\n]/g, ' '),
            body: `<p>Olá,</p><p><strong>${escapeHtml(lead.name)}</strong> (${escapeHtml(lead.email)}) abriu o vídeo da sua campanha <strong>"${escapeHtml(campaign.subject)}"</strong> às ${new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}.</p><p><a href="https://kardme.com/dashboard/crm?lead=${encodeURIComponent(lead.id)}">Ver lead</a></p>`,
          })
          await supabaseAdmin.from('email_video_open_notifications').insert({
            broadcast_id: broadcastId, lead_id: lead.id, sent_at: new Date().toISOString(),
          })
        }
      }
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar evento' }, { status: 500 })
  }
}
