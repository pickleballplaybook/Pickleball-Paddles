import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getValidAccessToken, type YoutubeConnection } from "./tokenRefresh";
import { findMatchingCampaign } from "@/lib/autoReply/matcher";

const YT_API = "https://www.googleapis.com/youtube/v3";

// Polling tunables. Conservative defaults to stay well under YouTube's
// 10,000/day quota.
const VIDEOS_PER_POLL = 5;
const COMMENTS_PER_VIDEO = 20;

interface YoutubeComment {
  id: string;
  authorChannelId: string;
  authorDisplayName: string;
  text: string;
  videoId: string;
}

/**
 * Poll a single YouTube channel for new comments.
 * Returns count of comments processed.
 */
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

  // Step 1: get the channel's recent uploads.
  const videosRes = await fetch(
    `${YT_API}/search?part=id&channelId=${conn.account_id}&maxResults=${VIDEOS_PER_POLL}&order=date&type=video`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!videosRes.ok) {
    const txt = await videosRes.text();
    errors.push(`videos fetch failed: ${txt.slice(0, 200)}`);
    return { videos_checked, comments_found, matches, errors };
  }
  const videosData = (await videosRes.json()) as {
    items: Array<{ id: { videoId: string } }>;
  };
  const videoIds = videosData.items.map((v) => v.id.videoId);

  // Step 2: for each video, get recent comments and process.
  for (const videoId of videoIds) {
    videos_checked++;

    // Find existing poll state for this video.
    const { data: state, error: stateErr } = await supabase
      .from("youtube_poll_state")
      .select("last_comment_id")
      .eq("channel_id", conn.account_id)
      .eq("video_id", videoId)
      .maybeSingle();
    console.log(`[poll-state] channel=${conn.account_id} video=${videoId} state=${JSON.stringify(state)} err=${stateErr?.message || 'null'}`);
    const lastCommentId = state?.last_comment_id;

    const commentsRes = await fetch(
      `${YT_API}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${COMMENTS_PER_VIDEO}&order=time`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!commentsRes.ok) {
      const txt = await commentsRes.text();
      // Non-fatal; some videos disable comments.
      errors.push(`video ${videoId} comments fetch failed: ${txt.slice(0, 100)}`);
      continue;
    }
    const commentsData = (await commentsRes.json()) as {
      items?: Array<{
        id: string;
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

    // YouTube returns newest first. Process only ones newer than lastCommentId.
    let newComments: YoutubeComment[] = comments;
    if (lastCommentId) {
      const idx = comments.findIndex((c) => c.id === lastCommentId);
      if (idx >= 0) {
        newComments = comments.slice(0, idx);
      }
    }
console.log(`[poll] video=${videoId} stored_last=${lastCommentId} fetched_first=${comments[0]?.id} idx_match=${lastCommentId ? comments.findIndex(c => c.id === lastCommentId) : 'no_state'} new=${newComments.length}`);   
 comments_found += newComments.length;
console.log(`[v2-state] state=${JSON.stringify(state)} err=${stateErr?.message || 'null'}`);

    // Process newest first - reverse so oldest gets the earliest reply.
    for (const c of newComments.reverse()) {
      try {
        const matched = await processComment(c, conn, accessToken);
        if (matched) matches++;
      } catch (err: any) {
        errors.push(`comment ${c.id} processing failed: ${err.message}`);
      }
    }

    // Update poll state - mark the newest comment as last seen.
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
  }

  return { videos_checked, comments_found, matches, errors };
}

/**
 * Process one new YouTube comment - check if it matches any campaign,
 * post a reply if so, log the result.
 */
async function processComment(
  comment: YoutubeComment,
  conn: YoutubeConnection,
  accessToken: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Dedup check - have we already processed this comment ID?
  const { data: existing } = await supabase
    .from("auto_reply_logs")
    .select("id")
    .eq("platform", "youtube")
    .eq("comment_id", comment.id)
    .maybeSingle();
  if (existing) return false;

  // Run matcher.
  const match = await findMatchingCampaign(supabase, {
    platform: "youtube",
    postId: comment.videoId,
    commentText: comment.text,
  });
  if (!match) {
    // Log skipped (no match) but with reply_status="skipped" so we don't re-attempt.
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

  // Post the reply.
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
    dm_status: "skipped", // YouTube has no DMs
    dm_error: "youtube_no_dm",
  });

  return replyStatus === "sent";
}
// cache-buster 1778248399
