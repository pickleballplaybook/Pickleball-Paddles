import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  findMatchingCampaign,
  userAlreadyTriggered,
  type Platform,
} from "@/lib/autoReply/matcher";
import { processPendingLog } from "@/lib/autoReply/processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/meta/test
 *
 * Dev-only endpoint that simulates a Meta webhook event AND runs the
 * processor (reply + DM attempt). Disabled in production.
 *
 * Pass ?dryRun=1 to only match + log without trying to send.
 *
 * Example:
 *   curl -X POST http://localhost:3003/api/webhooks/meta/test \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *       "platform": "instagram",
 *       "post_id": "TEST_POST",
 *       "comment_id": "TEST_C_001",
 *       "commenter_id": "user_123",
 *       "commenter_username": "testuser",
 *       "comment_text": "Hey can I get the coral?"
 *     }'
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("disabled in production", { status: 403 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  const body = await req.json();
  const platform = body.platform as Platform;
  const supabase = getSupabaseAdmin();

  const match = await findMatchingCampaign(supabase, {
    platform,
    postId: body.post_id,
    commentText: body.comment_text,
  });

  if (!match) {
    return NextResponse.json({
      matched: false,
      reason: "no campaign matched the keyword/post",
    });
  }

  const { campaign, matchedKeyword } = match;

  if (campaign.match_once_per_user) {
    const did = await userAlreadyTriggered(
      supabase,
      campaign.id,
      platform,
      body.commenter_id
    );
    if (did) {
      return NextResponse.json({
        matched: true,
        skipped: true,
        reason: "user already triggered this campaign",
        campaign: campaign.name,
      });
    }
  }

  const { data, error } = await supabase
    .from("auto_reply_logs")
    .insert({
      campaign_id: campaign.id,
      platform,
      post_id: body.post_id,
      comment_id: body.comment_id,
      commenter_id: body.commenter_id,
      commenter_username: body.commenter_username,
      comment_text: body.comment_text,
      matched_keyword: matchedKeyword,
      reply_status: "pending",
      dm_status: platform === "youtube" ? "not_applicable" : "pending",
    })
    .select()
    .single();

  if (error) {
    if ((error as any).code === "23505") {
      return NextResponse.json({
        matched: true,
        skipped: true,
        reason: "duplicate comment_id - already logged",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Run the actual sender unless dry run
  let processed: any = null;
  if (!dryRun && platform !== "youtube") {
    try {
      processed = await processPendingLog(supabase, data.id);
    } catch (err: any) {
      processed = { error: String(err?.message || err) };
    }
  }

  // Re-fetch the log to show updated statuses in the response
  const { data: finalLog } = await supabase
    .from("auto_reply_logs")
    .select(
      "id, reply_status, reply_error, dm_status, dm_error"
    )
    .eq("id", data.id)
    .single();

  return NextResponse.json({
    matched: true,
    logged: true,
    campaign: campaign.name,
    matched_keyword: matchedKeyword,
    log_id: data.id,
    processed,
    final: finalLog,
  });
}
