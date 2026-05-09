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
}> {
  const errors: string[] = [];
  let videos_checked = 0;
  let comments_found = 0;
  let matches = 0;

  const accessToken = await getValidAccessToken(conn);
  const supabase = getSupabaseAdmin();

  // Fetch all state up front - JS filtering is more reliable than .eq().eq().
  const { data: allStateRows, error: stateErr } = await supabase
    .from("youtube_poll_state")
    .select("channel_id, video_id, last_comment_id");
  console.log(`[v2-rows] total_rows=${allStateRows?.length ?? "null"} err=${stateErr?.message || "null"}`);

  // Dedup: per-poll set, populated lazily as we process each video below.
  // The real dedup is the per-video last_comment_id watermark in
  // youtube_poll_state plus the unique index on auto_reply_logs(platform, comment_id).
  // This Set just prevents double-processing within a single poll cycle.
  const seenCommentIds = new Set<string>();

  // Tiered poll: ALL hot videos (latest uploads, polled every minute)
  // PLUS a rotating slice of cold videos (older uploads, covered over 24h).
  const COLD_PER_POLL = 25; // ~65/min × 1440min = 93,600 polls/day - more than enough
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
    return { videos_checked, comments_found, matches, errors };
  }
  if (coldRes.error) {
    errors.push(`cold fetch failed: ${coldRes.error.message}`);
    return { videos_checked, comments_found, matches, errors };
  }

  const hotIds = (hotRes.data || []).map((v) => v.video_id);
  const coldIds = (coldRes.data || []).map((v) => v.video_id);
  const videoIds = [...hotIds, ...coldIds];

  if (videoIds.length === 0) {
    errors.push("no videos in youtube_videos_cache - run /api/cron/yt-refresh-videos first");
    return { videos_checked, comments_found, matches, errors };
  }


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

    // TEMP DEBUG: log first 3 comments fetched per hot video to see what API returns
    if (videoId === "PIrAY8ByL58") {
      console.log(`[v2-debug-${videoId}] watermark=${lastCommentId || "(none)"} fetched_count=${comments.length}`);
      for (const c of comments.slice(0, 5)) {
        console.log(`[v2-debug-${videoId}] id=${c.id} author=${c.authorDisplayName} text=${c.text.slice(0, 50)}`);
      }
    }

    let newComments: YoutubeComment[] = comments;
    if (lastCommentId) {
      const idx = comments.findIndex((c) => c.id === lastCommentId);
      if (idx >= 0) {
        newComments = comments.slice(0, idx);
      }
    }
      comments_found += newComments.length;

    for (const c of newComments.reverse()) {
      try {
        if (seenCommentIds.has(c.id)) {
                  continue;
        }
              const matched = await processComment(c, conn, accessToken, supabase);
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

  return { videos_checked, comments_found, matches, errors };
}

async function processComment(
  comment: YoutubeComment,
  conn: YoutubeConnection,
  accessToken: string,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<boolean> {
  const match = await findMatchingCampaign(supabase, {
    platform: "youtube",
    postId: comment.videoId,
    commentText: comment.text,
  });

  // Try to claim the comment by inserting a "pending" row first.
  // The unique index on (platform, comment_id) means this is our atomic dedup:
  // if we've already processed this comment, the insert fails with 23505 and
  // we bail out WITHOUT posting a duplicate reply to YouTube.
  const { data: claimed, error: claimErr } = await supabase
    .from("auto_reply_logs")
    .insert({
      campaign_id: match?.campaign.id ?? null,
      platform: "youtube",
      comment_id: comment.id,
      post_id: comment.videoId,
      commenter_id: comment.authorChannelId,
      commenter_username: comment.authorDisplayName,
      comment_text: comment.text,
      matched_keyword: match?.matchedKeyword ?? null,
      reply_status: match ? "pending" : "skipped",
      reply_error: match ? null : "no_keyword_match",
      dm_status: "skipped",
      dm_error: "youtube_no_dm",
    })
    .select()
    .single();

  if (claimErr) {
    if ((claimErr as any).code === "23505") {
      // Already processed - silent dedup, this is the happy path
      return false;
    }
    console.log(`[v2-claim-err] ${comment.id} -> code=${(claimErr as any).code} msg=${claimErr.message}`);
    return false;
  }

  // Not a keyword match - we logged the skip, we're done.
  if (!match) return false;

  // Post the reply to YouTube
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

  // Update the row with the actual reply result
  const { error: updateErr } = await supabase
    .from("auto_reply_logs")
    .update({
      reply_status: replyStatus,
      reply_error: replyError,
    })
    .eq("id", claimed.id);
  if (updateErr) {
    console.log(`[v2-update-err] ${comment.id} -> ${updateErr.message}`);
  }

  return replyStatus === "sent";
}
