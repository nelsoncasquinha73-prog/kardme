import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing env vars')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const { previewId, leadId, broadcastId } = await req.json()
    console.log('[VIDEO-OPEN] Received:', { previewId, leadId, broadcastId })

    if (!previewId || !leadId) {
      return NextResponse.json({ error: 'Missing previewId or leadId' }, { status: 400 })
    }

    const supabaseAdmin = getAdminSupabase()

    // Buscar user_id do preview
    const { data: preview, error: previewError } = await supabaseAdmin
      .from('email_video_previews')
      .select('user_id')
      .eq('id', previewId)
      .single()

    if (previewError || !preview) {
      console.error('[VIDEO-OPEN] Preview not found:', previewError)
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('email_video_opens')
      .insert({
        preview_id: previewId,
        lead_id: leadId,
        broadcast_id: broadcastId || null,
        opened_at: new Date().toISOString(),
        user_id: preview.user_id,
      })

    if (error) {
      console.error('[VIDEO-OPEN] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[VIDEO-OPEN] Insert successful, broadcastId:', broadcastId)

    // Disparar notificação por email (não bloquear resposta)
    if (broadcastId) {
      console.log('[VIDEO-OPEN] Calling video-open-notify...')
      const notifyUrl = new URL('/api/crm/video-open-notify', req.url)
      console.log('[VIDEO-OPEN] Notify URL:', notifyUrl.toString())
      
      fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broadcastId, leadId }),
      })
        .then(async (r) => {
          console.log('[VIDEO-OPEN] Notify response status:', r.status)
          if (!r.ok) {
            const t = await r.text()
            console.error('[VIDEO-OPEN] notify failed:', r.status, t)
          } else {
            console.log('[VIDEO-OPEN] Notify sent successfully')
          }
        })
        .catch((e) => console.error('[VIDEO-OPEN] notify error:', e))
    } else {
      console.log('[VIDEO-OPEN] No broadcastId, skipping notify')
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[VIDEO-OPEN] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
