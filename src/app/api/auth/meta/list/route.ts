import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/meta/list
 *
 * Returns all active social_connections for the dashboard to display.
 * Tokens are NEVER returned - just public metadata.
 */
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("social_connections")
    .select(
      "id, platform, account_id, account_name, page_id, token_expires_at, metadata, is_active, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ connections: data || [] });
}
