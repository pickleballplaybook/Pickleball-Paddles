import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getValidAccessToken, type YoutubeConnection } from "@/lib/youtube/tokenRefresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const YT_API = "https://www.googleapis.com/youtube/v3";

/**
 * GET /api/cron/yt-refresh-videos?secret=...
 *
 * Fetches the FULL uploads playlist for every active YouTube connection
 * and upserts every video_id into youtube_videos_cache. Run this on a
 * daily schedule via cron-job.org.
 */
export async function GET(req: NextRequest) {
  const querySecret = new URL(req.url).searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const headerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (
    querySecret !== process.env.CRON_SECRET &&
    headerSecret !== process.env.CRON_SECRET
  ) {
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

  const results: Array<{ channel: string; videos_added: number; total_videos: number; error?: string }> = [];

  for (const conn of connections || []) {
    try {
      const r = await refreshChannelVideos(conn as YoutubeConnection);
      results.push({ channel: conn.account_name, ...r });
    } catch (err: any) {
      results.push({ channel: conn.account_name, videos_added: 0, total_videos: 0, error: err.message });
    }
  }

  return NextResponse.json({
    refreshed_at: new Date().toISOString(),
    connections_checked: connections?.length || 0,
    results,
  });
}

async function refreshChannelVideos(conn: YoutubeConnection): Promise<{
  videos_added: number;
  total_videos: number;
  hot_videos?: number;
  cold_videos?: number;
}> {
  const accessToken = await getValidAccessToken(conn);
  const supabase = getSupabaseAdmin();

  // Use search.list with channelId — YouTube's playlistItems.list returns
  // a spurious `playlistNotFound` on the channel's uploads playlist for
  // some accounts (reproducible bug on Brand-account-owned channels) even
  // when the playlist exists publicly. search.list bypasses this.
  // Cost: 100 quota units per page (vs 1 for playlistItems) — we only
  // refresh once a day, so well within the 10k/day quota.
  const allVideoIds: string[] = [];
  let pageToken: string | undefined = undefined;
  let pages = 0;
  const MAX_PAGES = 10; // 10 pages × 50 results = 500 videos, plenty

  do {
    const url = new URL(`${YT_API}/search`);
    url.searchParams.set("part", "id");
    url.searchParams.set("channelId", conn.account_id);
    url.searchParams.set("type", "video");
    url.searchParams.set("order", "date");
    url.searchParams.set("maxResults", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`search fetch failed (status ${res.status}): ${(await res.text()).slice(0, 600)}`);
    }
    const data = (await res.json()) as {
      items: Array<{ id: { videoId?: string } }>;
      nextPageToken?: string;
    };
    for (const item of data.items || []) {
      if (item.id?.videoId) allVideoIds.push(item.id.videoId);
    }
    pageToken = data.nextPageToken;
    pages++;
  } while (pageToken && pages < MAX_PAGES);

  // Step 3: insert any new videos, then assign tiers.
  // The most recent HOT_COUNT uploads become 'hot' (polled every minute),
  // everything else becomes 'cold' (polled slowly throughout the day).
  const HOT_COUNT = 20;

  // Insert any new videos (allVideoIds is in upload order, newest first)
  const newRows = allVideoIds.map((video_id) => ({
    channel_id: conn.account_id,
    video_id,
  }));

  let videos_added = 0;
  if (newRows.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from("youtube_videos_cache")
      .upsert(newRows, { onConflict: "channel_id,video_id", ignoreDuplicates: true })
      .select("video_id");
    if (insertErr) throw new Error(`insert failed: ${insertErr.message}`);
    videos_added = inserted?.length || 0;
  }

  // Mark the newest HOT_COUNT as hot, rest as cold
  const hotIds = allVideoIds.slice(0, HOT_COUNT);
  const coldIds = allVideoIds.slice(HOT_COUNT);

  if (hotIds.length > 0) {
    const { error: hotErr } = await supabase
      .from("youtube_videos_cache")
      .update({ tier: "hot" })
      .eq("channel_id", conn.account_id)
      .in("video_id", hotIds);
    if (hotErr) throw new Error(`hot tier update failed: ${hotErr.message}`);
  }

  if (coldIds.length > 0) {
    // Demote any previously-hot videos that have aged out
    const { error: coldErr } = await supabase
      .from("youtube_videos_cache")
      .update({ tier: "cold" })
      .eq("channel_id", conn.account_id)
      .in("video_id", coldIds);
    if (coldErr) throw new Error(`cold tier update failed: ${coldErr.message}`);
  }

  return {
    videos_added,
    total_videos: allVideoIds.length,
    hot_videos: hotIds.length,
    cold_videos: coldIds.length,
  };
}
