import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hostRaw = (searchParams.get("host") || "").trim().toLowerCase();
    const host = hostRaw.split(":")[0];

    if (!host) {
      return NextResponse.json({ success: false, error: "host é obrigatório" }, { status: 400 });
    }

    const { data: domainRow, error: domErr } = await supabaseAdmin
      .from("custom_domains")
      .select("card_id")
      .eq("domain", host)
      .maybeSingle();

    if (domErr) return NextResponse.json({ success: false, error: domErr.message }, { status: 500 });
    if (!domainRow?.card_id) return NextResponse.json({ success: true, slug: null });

    const { data: card, error: cardErr } = await supabaseAdmin
      .from("cards")
      .select("slug")
      .eq("id", domainRow.card_id)
      .maybeSingle();

    if (cardErr) return NextResponse.json({ success: false, error: cardErr.message }, { status: 500 });

    return NextResponse.json({ success: true, slug: card?.slug || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Erro desconhecido" }, { status: 500 });
  }
}
