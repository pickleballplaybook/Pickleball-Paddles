import { NextRequest, NextResponse } from "next/server";
import { syncSubstackFeed } from "@/lib/substackSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/sync-substack
 * -----------------------------
 * One-shot manual trigger for the Substack → newsletter_posts mirror.
 * Same underlying function as the cron; separate route so you can hit
 * it from the browser without wrestling with a query-string secret
 * (admin gate via shorts_auth cookie in middleware).
 */
export async function POST(_req: NextRequest) {
  const result = await syncSubstackFeed();
  return NextResponse.json(result);
}
