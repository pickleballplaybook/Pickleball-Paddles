import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { processPendingLog } from "@/lib/autoReply/processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/auto-reply/retry
 * Body: { log_id: "uuid" }
 *
 * Retries the reply + DM for an existing log row. Useful when a token
 * expired or Meta returned a transient error and you want to re-fire
 * after fixing the issue.
 *
 * Step 6 will gate this behind admin auth. For now it's open in dev.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    // TODO Step 6: auth check
  }

  const body = await req.json().catch(() => ({}));
  const logId = body?.log_id;
  if (!logId) {
    return NextResponse.json({ error: "log_id required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Reset status fields so the processor will re-attempt
  await supabase
    .from("auto_reply_logs")
    .update({
      reply_status: "pending",
      reply_error: null,
      dm_status: "pending",
      dm_error: null,
    })
    .eq("id", logId);

  try {
    const result = await processPendingLog(supabase, logId);
    const { data: finalLog } = await supabase
      .from("auto_reply_logs")
      .select("id, reply_status, reply_error, dm_status, dm_error")
      .eq("id", logId)
      .single();
    return NextResponse.json({ ok: true, result, final: finalLog });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
