import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/meta/disconnect
 * Body: { platform: "instagram" | "facebook", account_id: string }
 *
 * Marks the connection inactive (we keep the row for audit/history).
 * The token stays in the DB but won't be picked up by getConnection().
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { platform, account_id } = body;
  if (!platform || !account_id) {
    return NextResponse.json(
      { error: "platform and account_id required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("social_connections")
    .update({ is_active: false })
    .eq("platform", platform)
    .eq("account_id", account_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
