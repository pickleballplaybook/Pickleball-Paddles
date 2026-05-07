import type { SupabaseClient } from "@supabase/supabase-js";
import { getConnection } from "./connections";
import {
  replyToInstagramComment,
  replyToFacebookComment,
  sendInstagramPrivateReply,
  sendFacebookPrivateReply,
} from "./metaSender";
import { renderTemplate } from "./matcher";

export type LogRow = {
  id: string;
  campaign_id: string;
  platform: "instagram" | "facebook" | "youtube";
  post_id: string | null;
  comment_id: string;
  commenter_id: string | null;
  commenter_username: string | null;
  comment_text: string | null;
  matched_keyword: string | null;
  reply_status: string;
  dm_status: string;
};

/**
 * Process a single pending log row.
 *
 * Loads the campaign, looks up the connection token, fires the public reply,
 * fires the DM, and updates the log row with the outcome of each.
 *
 * If the platform connection isn't set up yet, the row is marked failed with
 * "no connection configured" - which is exactly what we'll see until Step 7
 * adds the OAuth flow.
 */
export async function processPendingLog(
  supabase: SupabaseClient,
  logId: string
): Promise<{ replyOk: boolean; dmOk: boolean; reason?: string }> {
  // 1) Load the log + campaign together
  const { data: log, error: logErr } = await supabase
    .from("auto_reply_logs")
    .select("*, campaign:auto_reply_campaigns(*)")
    .eq("id", logId)
    .single();

  if (logErr || !log) {
    console.error("[processor] log not found:", logId, logErr);
    return { replyOk: false, dmOk: false, reason: "log not found" };
  }

  const platform = log.platform as "instagram" | "facebook" | "youtube";
  const campaign = (log as any).campaign;
  if (!campaign) {
    await markFailed(supabase, logId, "campaign was deleted");
    return { replyOk: false, dmOk: false, reason: "campaign was deleted" };
  }

  // YouTube doesn't go through this processor - poller handles it
  if (platform === "youtube") {
    return { replyOk: false, dmOk: false, reason: "youtube goes through poller" };
  }

  // 2) Resolve the connection (access token)
  const conn = await getConnection(supabase, platform);
  if (!conn) {
    await supabase
      .from("auto_reply_logs")
      .update({
        reply_status: "failed",
        reply_error: "no connection configured for this platform",
        dm_status: "failed",
        dm_error: "no connection configured for this platform",
      })
      .eq("id", logId);
    return {
      replyOk: false,
      dmOk: false,
      reason: "no connection configured - finish OAuth setup (Step 7)",
    };
  }

  // 3) Render templates with the commenter's name
  const replyText = renderTemplate(campaign.reply_text, {
    name: log.commenter_username || "",
  });
  const dmText = renderTemplate(campaign.dm_text, {
    name: log.commenter_username || "",
  });

  // ---------------------------------------------------------------------
  // Step A: post the public reply
  // ---------------------------------------------------------------------
  let replyOk = false;
  if (replyText.trim().length > 0) {
    const replyResult =
      platform === "instagram"
        ? await replyToInstagramComment({
            commentId: log.comment_id,
            message: replyText,
            accessToken: conn.access_token,
          })
        : await replyToFacebookComment({
            commentId: log.comment_id,
            message: replyText,
            pageAccessToken: conn.access_token,
          });

    if (replyResult.ok) {
      replyOk = true;
      await supabase
        .from("auto_reply_logs")
        .update({ reply_status: "sent", reply_id: replyResult.id, reply_error: null })
        .eq("id", logId);
    } else {
      await supabase
        .from("auto_reply_logs")
        .update({
          reply_status: "failed",
          reply_error: `${replyResult.error}${
            replyResult.code ? ` (code ${replyResult.code})` : ""
          }`,
        })
        .eq("id", logId);
    }
  } else {
    await supabase
      .from("auto_reply_logs")
      .update({ reply_status: "skipped", reply_error: "empty reply text" })
      .eq("id", logId);
  }

  // ---------------------------------------------------------------------
  // Step B: send the DM (if campaign has dm_text)
  // ---------------------------------------------------------------------
  let dmOk = false;
  if (!dmText || dmText.trim().length === 0) {
    await supabase
      .from("auto_reply_logs")
      .update({ dm_status: "skipped", dm_error: "no dm text on campaign" })
      .eq("id", logId);
  } else {
    let dmResult;
    if (platform === "instagram") {
      // For IG we need the IG Business Account ID. Stored in metadata
      // when OAuth completes (Step 7). Fall back to account_id if missing.
      const igBusinessAccountId =
        conn.metadata?.ig_business_account_id || conn.account_id;
      dmResult = await sendInstagramPrivateReply({
        igBusinessAccountId,
        commentId: log.comment_id,
        message: dmText,
        ctaLink: campaign.cta_link,
        accessToken: conn.access_token,
      });
    } else {
      // facebook
      const pageId = conn.page_id || conn.account_id;
      dmResult = await sendFacebookPrivateReply({
        pageId,
        commentId: log.comment_id,
        message: dmText,
        ctaLink: campaign.cta_link,
        pageAccessToken: conn.access_token,
      });
    }

    if (dmResult.ok) {
      dmOk = true;
      await supabase
        .from("auto_reply_logs")
        .update({ dm_status: "sent", dm_id: dmResult.id, dm_error: null })
        .eq("id", logId);
    } else {
      await supabase
        .from("auto_reply_logs")
        .update({
          dm_status: "failed",
          dm_error: `${dmResult.error}${
            dmResult.code ? ` (code ${dmResult.code})` : ""
          }`,
        })
        .eq("id", logId);
    }
  }

  return { replyOk, dmOk };
}

async function markFailed(
  supabase: SupabaseClient,
  logId: string,
  reason: string
) {
  await supabase
    .from("auto_reply_logs")
    .update({
      reply_status: "failed",
      reply_error: reason,
      dm_status: "failed",
      dm_error: reason,
    })
    .eq("id", logId);
}
