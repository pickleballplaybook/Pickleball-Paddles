import { NextRequest, NextResponse } from "next/server";
import { syncSubstackFeed } from "@/lib/substackSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/sync-substack?secret=...
 *
 * Cron target that mirrors https://pickleballplaybook.substack.com/feed
 * into the newsletter_posts Supabase table. Scheduled every 6 hours
 * via vercel.json — Substack itself only exposes the last ~20 posts
 * via RSS, so this catches new posts and any edits to existing ones.
 *
 * Same secret pattern as the other crons — accepted via ?secret=... or
 * Authorization: Bearer <CRON_SECRET> so Vercel Cron's built-in header
 * mode also works.
 */
export async function GET(req: NextRequest) {
  const querySecret = new URL(req.url).searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const headerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (
    querySecret !== process.env.CRON_SECRET &&
    headerSecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await syncSubstackFeed();
  return NextResponse.json(result);
}
