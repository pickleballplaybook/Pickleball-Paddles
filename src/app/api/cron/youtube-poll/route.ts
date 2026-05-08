import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { pollChannel } from "@/lib/youtube/poller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/youtube-poll?secret=...
 *
 * Hit by cron-job.org every 5 minutes. Polls all active YouTube
 * connections for new comments and processes them.
 */
export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: connections, error } = await supabase
    .from("social_connections")
    .select("id, account_id, account_name, access_token, refresh_token, token_expires_at")
    .eq("platform", "youtube")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const conn of connections || []) {
    try {
      const r = await pollChannel(conn as any);
      results.push({ account: conn.account_name, ...r });
    } catch (err: any) {
      results.push({ account: conn.account_name, error: err.message });
    }
  }

  return NextResponse.json({
    polled_at: new Date().toISOString(),
    connections_checked: connections?.length || 0,
    results,
  });
}
