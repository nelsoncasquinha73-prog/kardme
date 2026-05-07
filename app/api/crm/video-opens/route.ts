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
    const { data, error } = await supabase
      .from('email_video_opens')
      .select(`
        id,
        preview_id,
        opened_at,
        created_at,
        broadcast_id,
        email_broadcasts(subject)
      `)
      .eq('lead_id', leadId)
      .order('opened_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      count: data?.length || 0,
      opens: data || [],
    });
  } catch (err: any) {
    console.error('[VIDEO_OPENS_ERROR]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
