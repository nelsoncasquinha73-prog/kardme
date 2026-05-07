import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('leadId');

  if (!leadId) {
    return NextResponse.json({ error: 'leadId required' }, { status: 400 });
  }

  try {
    // Buscar aberturas de vídeo
    const { data: opens, error: opensError } = await supabase
      .from('email_video_opens')
      .select('id, preview_id, opened_at, created_at, broadcast_id')
      .eq('lead_id', leadId)
      .order('opened_at', { ascending: false });

    if (opensError) throw opensError;

    // Para cada abertura, buscar o assunto do broadcast
    const enrichedOpens = await Promise.all(
      (opens || []).map(async (open: any) => {
        if (!open.broadcast_id) return open;
        
        const { data: broadcast } = await supabase
          .from('email_broadcasts')
          .select('subject')
          .eq('id', open.broadcast_id)
          .single();
        
        return {
          ...open,
          email_broadcasts: broadcast ? { subject: broadcast.subject } : null,
        };
      })
    );

    console.log('[VIDEO_OPENS_API] leadId:', leadId, 'opens count:', enrichedOpens?.length);

    return NextResponse.json({
      count: enrichedOpens?.length || 0,
      opens: enrichedOpens || [],
    });
  } catch (err: any) {
    console.error('[VIDEO_OPENS_ERROR]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
