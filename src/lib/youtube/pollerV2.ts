import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getValidAccessToken, type YoutubeConnection } from "./tokenRefresh";
import { findMatchingCampaign } from "@/lib/autoReply/matcher";

const YT_API = "https://www.googleapis.com/youtube/v3";
const VIDEOS_PER_POLL = 5;
const COMMENTS_PER_VIDEO = 20;

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

  // Fetch ALL state rows ONCE up front - much cheaper than per-video query.
  const { data: allStateRows, error: stateErr } = await supabase
    .from("youtube_poll_state")
    .select("channel_id, video_id, last_comment_id");
  console.log(`[v2-rows] total_rows=${allStateRows?.length ?? 'null'} err=${stateErr?.message || 'null'} first=${JSON.stringify(allStateRows?.[0])}`);

  // Fetch recent video IDs from YouTube.
  const videosRes = await fetch(
    `${YT_API}/search?part=id&channelId=${conn.account_id}&maxResults=${VIDEOS_PER_POLL}&order=date&type=video`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!videosRes.ok) {
    const txt = await videosRes.text();
    errors.push(`videos fetch failed: ${txt.slice(0, 200)}`);
    return { videos_checked, comments_found, matches, errors };
  }
  const videosData = (await videosRes.json()) as { items: Array<{ id: { videoId: string } }> };
  const videoIds = videosData.items.map((v) => v.id.videoId);

  for (const videoId of videoIds) {
    videos_checked++;

    // In-memory state lookup (no second DB query needed).
    const stateRow = allStateRows?.find(
      (r) => r.channel_id === conn.account_id && r.video_id === videoId
    );
    const lastCommentId = stateRow?.last_comment_id;
    console.log(`[v2-state] vid=${videoId} found=${!!stateRow} lastCommentId=${lastCommentId}`);

    const commentsRes = await fetch(
      `${YT_API}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${COMMENTS_PER_VIDEO}&order=time`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!commentsRes.ok) {
      const txt = await commentsRes.text();
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

    let newComments: YoutubeComment[] = comments;
    if (lastCommentId) {
      const idx = comments.findIndex((c) => c.id === lastCommentId);
      if (idx >= 0) {
        newComments = comments.slice(0, idx);
      }
    }
    console.log(`[v2-result] vid=${videoId} fetched=${comments.length} new=${newComments.length} lastCommentId=${lastCommentId}`);
    comments_found += newComments.length;

    for (const c of newComments.reverse()) {
      try {
        const matched = await processComment(c, conn, accessToken);
        if (matched) matches++;
      } catch (err: any) {
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
  }

  return { videos_checked, comments_found, matches, errors };
}

async function processComment(
  comment: YoutubeComment,
  conn: YoutubeConnection,
  accessToken: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("auto_reply_logs")
    .select("id")
    .eq("platform", "youtube")
    .eq("comment_id", comment.id)
    .maybeSingle();
  if (existing) return false;

  const match = await findMatchingCampaign(supabase, {
    platform: "youtube",
    postId: comment.videoId,
    commentText: comment.text,
  });
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
