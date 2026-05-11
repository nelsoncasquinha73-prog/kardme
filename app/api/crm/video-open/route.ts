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

    if (!previewId || !leadId) {
      return NextResponse.json({ error: 'Missing previewId or leadId' }, { status: 400 })
    }

    const supabaseAdmin = getAdminSupabase()

    const { data: preview, error: previewError } = await supabaseAdmin
      .from('email_video_previews')
      .select('user_id')
      .eq('id', previewId)
      .single()

    if (previewError || !preview) {
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

    // FIX: chamar notify de forma síncrona (serverless-safe)
    if (broadcastId) {
      try {
        const notifyResp = await fetch(new URL('/api/crm/video-open-notify', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ broadcastId, leadId }),
        })

        const txt = await notifyResp.text()
        if (!notifyResp.ok) {
          console.error('[VIDEO-OPEN] notify failed:', notifyResp.status, txt)
        } else {
          console.log('[VIDEO-OPEN] notify ok:', notifyResp.status, txt)
        }
      } catch (e) {
        console.error('[VIDEO-OPEN] notify error:', e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[VIDEO-OPEN] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
