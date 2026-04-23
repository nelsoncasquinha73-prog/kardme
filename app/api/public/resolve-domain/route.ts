import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function jsonOk(slug: string | null) {
  return NextResponse.json({ success: true, slug });
}

function jsonErr(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hostRaw = (searchParams.get("host") || "").trim().toLowerCase();
    const host = hostRaw.split(":")[0];

    if (!host) return jsonErr("host é obrigatório", 400);

    // ✅ DEV: localhost nunca deve tentar resolver domínio custom
    if (host === "localhost" || host.endsWith(".localhost")) {
      return jsonOk(null);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      // Não rebentar o app por config — apenas não resolve domínio
      return jsonOk(null);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: domainRow, error: domErr } = await supabaseAdmin
      .from("custom_domains")
      .select("card_id")
      .eq("domain", host)
      .maybeSingle();

    if (domErr) return jsonErr(domErr.message, 500);
    if (!domainRow?.card_id) return jsonOk(null);

    const { data: card, error: cardErr } = await supabaseAdmin
      .from("cards")
      .select("slug")
      .eq("id", domainRow.card_id)
      .maybeSingle();

    if (cardErr) return jsonErr(cardErr.message, 500);

    return jsonOk(card?.slug || null);
  } catch (err: any) {
    return jsonErr(err?.message || "Erro desconhecido", 500);
  }
}
