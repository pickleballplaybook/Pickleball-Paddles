import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Diagnostic: dump the YouTube social_connections row(s) (token values masked)
// + the GOOGLE_* env state, so we can compare what's stored vs what's being
// used at refresh time.
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("social_connections")
    .select("id, account_id, account_name, is_active, created_at, updated_at, token_expires_at, access_token, refresh_token, metadata")
    .eq("platform", "youtube")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []).map((r: any) => ({
    id: r.id,
    account_id: r.account_id,
    account_name: r.account_name,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
    token_expires_at: r.token_expires_at,
    access_token_len: r.access_token?.length || 0,
    access_token_first10: r.access_token?.slice(0, 10) || "",
    refresh_token_len: r.refresh_token?.length || 0,
    refresh_token_first10: r.refresh_token?.slice(0, 10) || "",
    metadata: r.metadata,
  }));

  const env = {
    GOOGLE_CLIENT_ID_first15: process.env.GOOGLE_CLIENT_ID?.slice(0, 15) || "(empty)",
    GOOGLE_CLIENT_ID_last10: process.env.GOOGLE_CLIENT_ID?.slice(-10) || "",
    GOOGLE_CLIENT_ID_len: process.env.GOOGLE_CLIENT_ID?.length || 0,
    GOOGLE_CLIENT_SECRET_first6: process.env.GOOGLE_CLIENT_SECRET?.slice(0, 6) || "(empty)",
    GOOGLE_CLIENT_SECRET_len: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || "(empty)",
  };

  return NextResponse.json({ rows, env });
}
