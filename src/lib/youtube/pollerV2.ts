import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getValidAccessToken, type YoutubeConnection } from "./tokenRefresh";
import { findMatchingCampaign } from "@/lib/autoReply/matcher";

const YT_API = "https://www.googleapis.com/youtube/v3";
const VIDEOS_PER_POLL = 30;
const COMMENTS_PER_VIDEO = 100;

interface YoutubeComment {
  id: string;
  authorChannelId: string;
  authorDisplayName: string;
  text: string;
  videoId: string;
}

export async function pollChannel(conn: YoutubeConnection): Promise<{
  videos_checked: number;
  comments_found: number;
  matches: number;
  errors: string[];
  debug: string[];
}> {
  const errors: string[] = [];
  const debug: string[] = [];
  let videos_checked = 0;
  let comments_found = 0;
  let matches = 0;

  const accessToken = await getValidAccessToken(conn);
  debug.push(`[v2-token] account=${conn.account_name} channel=${conn.account_id} first=${accessToken.slice(0,25)} last=${accessToken.slice(-10)} len=${accessToken.length}`);
  const supabase = getSupabaseAdmin();

  // Fetch all state up front - JS filtering is more reliable than .eq().eq().
  const { data: allStateRows, error: stateErr } = await supabase
    .from("youtube_poll_state")
    .select("channel_id, video_id, last_comment_id");
  console.log(`[v2-rows] total_rows=${allStateRows?.length ?? "null"} err=${stateErr?.message || "null"}`);

  // Same for dedup logs - fetch once.
  const ytLogsRes = await supabase
    .from("auto_reply_logs")
    .select("comment_id, platform, created_at", { count: "exact" })
    .eq("platform", "youtube");
  const allYtLogs = ytLogsRes.data;
  const seenCommentIds = new Set((allYtLogs || []).map((l) => l.comment_id));
  debug.push(`[v2-logs] supabase_count=${ytLogsRes.count ?? "null"} data_len=${allYtLogs?.length ?? "null"} err=${ytLogsRes.error?.message || "none"} status=${ytLogsRes.status} url=${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  debug.push(`[v2-logs] firstThree=${JSON.stringify((allYtLogs || []).slice(0, 3))}`);
  debug.push(`[v2-logs] svc_key_first10=${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) || "missing"}`);

  // Tiered poll: ALL hot videos (latest uploads, polled every minute)
  // PLUS a rotating slice of cold videos (older uploads, covered over 24h).
  const COLD_PER_POLL = 65; // ~65/min × 1440min = 93,600 polls/day - more than enough
                           // to cycle through all cold videos every day.

  const [hotRes, coldRes] = await Promise.all([
    supabase
      .from("youtube_videos_cache")
      .select("video_id")
      .eq("channel_id", conn.account_id)
      .eq("comments_disabled", false)
      .eq("tier", "hot"),
    supabase
      .from("youtube_videos_cache")
      .select("video_id")
      .eq("channel_id", conn.account_id)
      .eq("comments_disabled", false)
      .eq("tier", "cold")
      .order("last_polled_at", { ascending: true, nullsFirst: true })
      .limit(COLD_PER_POLL),
  ]);

  if (hotRes.error) {
    errors.push(`hot fetch failed: ${hotRes.error.message}`);
    return { videos_checked, comments_found, matches, errors, debug };
  }
  if (coldRes.error) {
    errors.push(`cold fetch failed: ${coldRes.error.message}`);
    return { videos_checked, comments_found, matches, errors, debug };
  }

  const hotIds = (hotRes.data || []).map((v) => v.video_id);
  const coldIds = (coldRes.data || []).map((v) => v.video_id);
  const videoIds = [...hotIds, ...coldIds];

  if (videoIds.length === 0) {
    errors.push("no videos in youtube_videos_cache - run /api/cron/yt-refresh-videos first");
    return { videos_checked, comments_found, matches, errors, debug };
  }

  debug.push(`[v2-cache] hot=${hotIds.length} cold=${coldIds.length} total=${videoIds.length}`);

  for (const videoId of videoIds) {
    videos_checked++;

    const stateRow = allStateRows?.find(
      (r) => r.channel_id === conn.account_id && r.video_id === videoId
    );
    const lastCommentId = stateRow?.last_comment_id;

    const commentsRes = await fetch(
      `${YT_API}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${COMMENTS_PER_VIDEO}&order=time`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!commentsRes.ok) {
      const txt = await commentsRes.text();
      // commentsDisabled is permanent — flag it so we never re-poll
      if (commentsRes.status === 403 && txt.includes("commentsDisabled")) {
        await supabase.from("youtube_videos_cache").update({
          comments_disabled: true,
          last_polled_at: new Date().toISOString(),
        }).eq("channel_id", conn.account_id).eq("video_id", videoId);
        debug.push(`[v2-skip-disabled] ${videoId} marked comments_disabled`);
      } else {
        errors.push(`video ${videoId} comments fetch failed: ${txt.slice(0, 100)}`);
      }
      continue;
    }
    const commentsData = (await commentsRes.json()) as {
      items?: Array<{
        snippet: {
          topLevelComment: {
            id: string;
            snippet: {
              authorChannelId?: { value: string };
              authorDisplayName: string;
              textOriginal: string;
            };
          };
        };
      }>;
    };

    const comments: YoutubeComment[] = (commentsData.items || []).map((thread) => ({
      id: thread.snippet.topLevelComment.id,
      authorChannelId: thread.snippet.topLevelComment.snippet.authorChannelId?.value || "unknown",
      authorDisplayName: thread.snippet.topLevelComment.snippet.authorDisplayName,
      text: thread.snippet.topLevelComment.snippet.textOriginal,
      videoId,
    }));

    let newComments: YoutubeComment[] = comments;
    if (lastCommentId) {
      const idx = comments.findIndex((c) => c.id === lastCommentId);
      if (idx >= 0) {
        newComments = comments.slice(0, idx);
      }
    }
    debug.push(`[v2-result] vid=${videoId} fetched=${comments.length} new=${newComments.length} lastCommentId=${lastCommentId || "none"}`);
    comments_found += newComments.length;

    for (const c of newComments.reverse()) {
      try {
        if (seenCommentIds.has(c.id)) {
          debug.push(`[v2-skip] dedup hit for ${c.id}`);
          continue;
        }
        debug.push(`[v2-enter] processing ${c.id}`);
        const matched = await processComment(c, conn, accessToken, supabase, debug);
        if (matched) matches++;
        seenCommentIds.add(c.id);
      } catch (err: any) {
        console.log(`[v2-error] ${c.id} -> ${err.message}`);
        errors.push(`comment ${c.id} processing failed: ${err.message}`);
      }
    }

    if (comments.length > 0) {
      await supabase.from("youtube_poll_state").upsert(
        {
          channel_id: conn.account_id,
          video_id: videoId,
          last_comment_id: comments[0].id,
          last_polled_at: new Date().toISOString(),
        },
        { onConflict: "channel_id,video_id" }
      );
    }

    // Always mark polled in cache so we rotate through the full library
    await supabase.from("youtube_videos_cache").update({
      last_polled_at: new Date().toISOString(),
    }).eq("channel_id", conn.account_id).eq("video_id", videoId);
  }

  return { videos_checked, comments_found, matches, errors, debug };
}

async function processComment(
  comment: YoutubeComment,
  conn: YoutubeConnection,
  accessToken: string,
  supabase: ReturnType<typeof getSupabaseAdmin>,
  debug: string[]
): Promise<boolean> {
  debug.push(`[v2-process] comment=${comment.id} text="${comment.text.slice(0, 50)}"`);
  const match = await findMatchingCampaign(supabase, {
    platform: "youtube",
    postId: comment.videoId,
    commentText: comment.text,
    debug,
  });

  console.log(`[v2-process] comment=${comment.id} text="${comment.text.slice(0, 50)}" matched=${!!match}`);

  if (!match) {
    await supabase.from("auto_reply_logs").insert({
      platform: "youtube",
      comment_id: comment.id,
      post_id: comment.videoId,
      commenter_id: comment.authorChannelId,
      commenter_username: comment.authorDisplayName,
      comment_text: comment.text,
      reply_status: "skipped",
      reply_error: "no_keyword_match",
    });
    return false;
  }

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
          parentId: comment.id,
          textOriginal: match.campaign.reply_text,
        },
      }),
    });
    if (!replyRes.ok) {
      const txt = await replyRes.text();
      throw new Error(txt.slice(0, 200));
    }
  } catch (err: any) {
    replyStatus = "failed";
    replyError = err.message;
  }

  await supabase.from("auto_reply_logs").insert({
    campaign_id: match.campaign.id,
    platform: "youtube",
    comment_id: comment.id,
    post_id: comment.videoId,
    commenter_id: comment.authorChannelId,
    commenter_username: comment.authorDisplayName,
    comment_text: comment.text,
    matched_keyword: match.matchedKeyword,
    reply_status: replyStatus,
    reply_error: replyError,
    dm_status: "skipped",
    dm_error: "youtube_no_dm",
  });

  return replyStatus === "sent";
}
