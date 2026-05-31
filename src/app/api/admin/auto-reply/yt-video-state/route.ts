import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET ?video_id=<id> — returns the cache + poll-state row for a specific
// YouTube video, plus any auto_reply_logs rows referencing it. Diagnostic
// only: lets us tell whether a particular comment got polled, filtered,
// or never seen.
export async function GET(req: NextRequest) {
  const videoId = new URL(req.url).searchParams.get("video_id");
  if (!videoId) {
    return NextResponse.json({ error: "video_id required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();

  const [cacheRes, stateRes, logsRes] = await Promise.all([
    supabase
      .from("youtube_videos_cache")
      .select("*")
      .eq("video_id", videoId),
    supabase
      .from("youtube_poll_state")
      .select("*")
      .eq("video_id", videoId),
    supabase
      .from("auto_reply_logs")
      .select("id, created_at, commenter_username, comment_text, matched_keyword, reply_status, reply_error")
      .eq("platform", "youtube")
      .eq("post_id", videoId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return NextResponse.json({
    video_id: videoId,
    cache: cacheRes.data,
    poll_state: stateRes.data,
    logs: logsRes.data,
    errors: {
      cache: cacheRes.error?.message,
      state: stateRes.error?.message,
      logs: logsRes.error?.message,
    },
  });
}
