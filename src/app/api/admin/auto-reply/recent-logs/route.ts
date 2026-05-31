import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the 20 most recent auto_reply_logs rows including reply_error and
// dm_error — used to diagnose why replies aren't firing without needing a
// dedicated UI page. Gated by the same shorts_auth middleware.
export async function GET(_req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("auto_reply_logs")
    .select(
      "id, created_at, platform, post_id, comment_id, commenter_username, comment_text, matched_keyword, reply_status, reply_error, reply_id, dm_status, dm_error, dm_id"
    )
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ count: data?.length || 0, rows: data });
}
