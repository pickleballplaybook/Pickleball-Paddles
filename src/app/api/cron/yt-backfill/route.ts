import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getValidAccessToken, type YoutubeConnection } from "@/lib/youtube/tokenRefresh";
import { findMatchingCampaign } from "@/lib/autoReply/matcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const YT_API = "https://www.googleapis.com/youtube/v3";

/**
 * GET /api/cron/yt-backfill?secret=...&days=7
 *
 * One-shot backfill: walk all videos, find unanswered keyword-matching
 * comments from the last N days, post replies. DELETE THIS FILE after use.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const headerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (
    querySecret !== process.env.CRON_SECRET &&
    headerSecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const days = parseInt(url.searchParams.get("days") || "7", 10);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const supabase = getSupabaseAdmin();
  const { data: connections } = await supabase
    .from("social_connections")
    .select("id, account_id, account_name, access_token, refresh_token, token_expires_at")
    .eq("platform", "youtube")
    .eq("is_active", true);

  if (!connections || connections.length === 0) {
    return NextResponse.json({ error: "no active youtube connections" }, { status: 404 });
  }

  const summary: any[] = [];

  for (const conn of connections) {
    const accessToken = await getValidAccessToken(conn as YoutubeConnection);

    // Get all videos for this channel from the cache
    const { data: videos } = await supabase
      .from("youtube_videos_cache")
      .select("video_id")
      .eq("channel_id", (conn as any).account_id)
      .eq("comments_disabled", false);

    if (!videos || videos.length === 0) {
      summary.push({ channel: conn.account_name, error: "no videos in cache" });
      continue;
    }

    // Get already-replied comment_ids so we don't double-reply
    const { data: existingLogs } = await supabase
      .from("auto_reply_logs")
      .select("comment_id")
      .eq("platform", "youtube")
      .eq("reply_status", "sent");
    const alreadyReplied = new Set((existingLogs || []).map((l: any) => l.comment_id));

    let videosScanned = 0;
    let commentsScanned = 0;
    let matched = 0;
    let replied = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const v of videos) {
      videosScanned++;
      const videoId = v.video_id;

      // Fetch up to 100 most recent comments per video
      const res = await fetch(
        `${YT_API}/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&order=time`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) {
        const txt = await res.text();
        if (res.status === 403 && txt.includes("commentsDisabled")) continue;
        errors.push(`video ${videoId}: ${txt.slice(0, 100)}`);
        continue;
      }
      const data = (await res.json()) as any;

      for (const thread of data.items || []) {
        const tlc = thread.snippet.topLevelComment;
        const commentId = tlc.id;
        const commentText = tlc.snippet.textOriginal as string;
        const publishedAt = new Date(tlc.snippet.publishedAt);

        // Only consider comments newer than cutoff
        if (publishedAt < cutoff) continue;
        commentsScanned++;

        // Skip if we already replied
        if (alreadyReplied.has(commentId)) continue;

        // Match against active campaigns
        const match = await findMatchingCampaign(supabase, {
          platform: "youtube",
          postId: videoId,
          commentText,
        });
        if (!match) continue;
        matched++;

        // Post the reply
        let replyStatus = "sent";
        let replyError: string | null = null;
        try {
          const replyRes = await fetch(`${YT_API}/comments?part=snippet`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              snippet: {
                parentId: commentId,
                textOriginal: match.campaign.reply_text,
              },
            }),
          });
          if (!replyRes.ok) {
            throw new Error((await replyRes.text()).slice(0, 200));
          }
          replied++;
        } catch (err: any) {
          replyStatus = "failed";
          replyError = err.message;
          failed++;
        }

        // Log the result
        await supabase.from("auto_reply_logs").insert({
          campaign_id: match.campaign.id,
          platform: "youtube",
          comment_id: commentId,
          post_id: videoId,
          commenter_id: tlc.snippet.authorChannelId?.value || "unknown",
          commenter_username: tlc.snippet.authorDisplayName,
          comment_text: commentText,
          matched_keyword: match.matchedKeyword,
          reply_status: replyStatus,
          reply_error: replyError,
          dm_status: "skipped",
          dm_error: "youtube_no_dm",
        });

        alreadyReplied.add(commentId);

        // Tiny delay to avoid rate-limit hammering
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    summary.push({
      channel: conn.account_name,
      videos_scanned: videosScanned,
      comments_scanned: commentsScanned,
      matched,
      replied,
      failed,
      errors: errors.slice(0, 10),
    });
  }

  return NextResponse.json({
    backfill_completed_at: new Date().toISOString(),
    days_back: days,
    summary,
  });
}
