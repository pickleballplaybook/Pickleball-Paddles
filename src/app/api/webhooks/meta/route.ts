import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  findMatchingCampaign,
  userAlreadyTriggered,
  type Platform,
} from "@/lib/autoReply/matcher";
import { processPendingLog } from "@/lib/autoReply/processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET - webhook verification handshake from Meta
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!expected) {
    console.error("[meta webhook] META_WEBHOOK_VERIFY_TOKEN not set");
    return new NextResponse("server misconfigured", { status: 500 });
  }

  if (mode === "subscribe" && token === expected) {
    console.log("[meta webhook] verification OK");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[meta webhook] verification FAILED", { mode, token });
  return new NextResponse("forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST - actual webhook events
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";

  if (!verifySignature(rawBody, signature)) {
    console.warn("[meta webhook] bad signature");
    return new NextResponse("invalid signature", { status: 403 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("invalid json", { status: 400 });
  }

  // Always 200 fast - Meta retries on non-200 and we don't want duplicates.
  try {
    await processPayload(payload);
  } catch (err) {
    console.error("[meta webhook] processing error:", err);
  }

  return new NextResponse("ok", { status: 200 });
}

// ---------------------------------------------------------------------------
function verifySignature(rawBody: string, signatureHeader: string): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[meta webhook] META_APP_SECRET not set");
    return false;
  }
  if (!signatureHeader.startsWith("sha256=")) return false;
  const provided = signatureHeader.slice("sha256=".length);
  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
type MetaWebhookPayload = {
  object: "instagram" | "page";
  entry: Array<{
    id: string;
    time: number;
    changes?: Array<{ field: string; value: any }>;
    messaging?: Array<any>;
  }>;
};

async function processPayload(payload: MetaWebhookPayload) {
  const platform: Platform =
    payload.object === "instagram" ? "instagram" : "facebook";

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "comments") continue;
      const v = change.value || {};
      const evt = normalizeCommentEvent(platform, entry.id, v);
      if (!evt) continue;
      await handleComment(evt);
    }
  }
}

type CommentEvent = {
  platform: Platform;
  pageOrIgAccountId: string;
  postId: string;
  commentId: string;
  commenterId: string;
  commenterUsername: string;
  commenterName: string;
  commentText: string;
};

function normalizeCommentEvent(
  platform: Platform,
  entryId: string,
  v: any
): CommentEvent | null {
  if (platform === "instagram") {
    if (!v?.id || !v?.text) return null;
    return {
      platform,
      pageOrIgAccountId: entryId,
      postId: v.media?.id || "",
      commentId: v.id,
      commenterId: v.from?.id || "",
      commenterUsername: v.from?.username || "",
      commenterName: v.from?.username || "",
      commentText: v.text,
    };
  }
  // facebook
  if (v.item !== "comment" || v.verb !== "add") return null;
  if (!v.comment_id || !v.message) return null;
  return {
    platform: "facebook",
    pageOrIgAccountId: entryId,
    postId: v.post_id || "",
    commentId: v.comment_id,
    commenterId: v.from?.id || "",
    commenterUsername: v.from?.name || "",
    commenterName: v.from?.name || "",
    commentText: v.message,
  };
}

async function handleComment(evt: CommentEvent) {
  const supabase = getSupabaseAdmin();

  const match = await findMatchingCampaign(supabase, {
    platform: evt.platform,
    postId: evt.postId,
    commentText: evt.commentText,
  });

  if (!match) return;

  const { campaign, matchedKeyword } = match;

  if (campaign.match_once_per_user) {
    const did = await userAlreadyTriggered(
      supabase,
      campaign.id,
      evt.platform,
      evt.commenterId
    );
    if (did) return;
  }

  // Insert log row. Unique (platform, comment_id) prevents double-processing
  // on Meta retries.
  const { data: logRow, error: insertErr } = await supabase
    .from("auto_reply_logs")
    .insert({
      campaign_id: campaign.id,
      platform: evt.platform,
      post_id: evt.postId,
      comment_id: evt.commentId,
      commenter_id: evt.commenterId,
      commenter_username: evt.commenterUsername,
      comment_text: evt.commentText,
      matched_keyword: matchedKeyword,
      reply_status: "pending",
      dm_status: "pending",
    })
    .select()
    .single();

  if (insertErr) {
    if ((insertErr as any).code === "23505") {
      console.log("[meta webhook] dedup: comment already logged", evt.commentId);
    } else {
      console.error("[meta webhook] log insert failed:", insertErr);
    }
    return;
  }

  console.log("[meta webhook] MATCH ✓", {
    log_id: logRow.id,
    campaign: campaign.name,
    keyword: matchedKeyword,
  });

  // 🆕 Step 4: actually fire the reply + DM
  try {
    const result = await processPendingLog(supabase, logRow.id);
    console.log("[meta webhook] processed", { log_id: logRow.id, ...result });
  } catch (err) {
    console.error("[meta webhook] processor error:", err);
  }
}
