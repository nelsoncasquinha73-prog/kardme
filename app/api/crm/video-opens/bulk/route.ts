import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { leadIds } = await req.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds array required' }, { status: 400 });
    }

    // Fetch all video opens for these leads
    const { data, error } = await supabase
      .from('email_video_opens')
      .select('lead_id')
      .in('lead_id', leadIds);

    if (error) throw error;

    // Count by lead_id
    const counts = new Map<string, number>();
    data?.forEach((row: any) => {
      counts.set(row.lead_id, (counts.get(row.lead_id) || 0) + 1);
    });

    // Return as object { leadId: count }
    const result: Record<string, number> = {};
    leadIds.forEach(id => {
      result[id] = counts.get(id) || 0;
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[VIDEO_OPENS_BULK_ERROR]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
