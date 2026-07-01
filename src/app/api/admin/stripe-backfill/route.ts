import { NextRequest } from "next/server";
import { syncStripeMirror } from "@/lib/stripeMirrorSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Pro caps function timeout at 300s. Hobby caps at 60s — if you're on
// hobby and have >6000 subs, the backfill may need to be split into chunks.
export const maxDuration = 300;

/**
 * POST /api/admin/stripe-backfill
 * -------------------------------
 * Admin-triggered full mirror re-sync from Stripe. Delegates to the
 * shared syncStripeMirror() helper (also used by the nightly cron at
 * /api/cron/stripe-mirror-sync). Admin-gated by the shorts_auth
 * cookie via src/middleware.ts.
 *
 * Query params:
 *   ?since=YYYY-MM-DD   (optional) — only backfill subs created on/after this
 *                       date. Useful for re-syncing after a known gap.
 */

export async function POST(req: NextRequest) {
  const sinceParam = req.nextUrl.searchParams.get("since");
  const sinceUnix = sinceParam ? Math.floor(new Date(sinceParam).getTime() / 1000) : undefined;
  const result = await syncStripeMirror({ sinceUnix });
  return Response.json(result);
}
