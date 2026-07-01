import { NextRequest, NextResponse } from "next/server";
import { syncStripeMirror } from "@/lib/stripeMirrorSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/stripe-mirror-sync?secret=... (or Authorization: Bearer ...)
 *
 * Nightly Vercel Cron. Full paginated resync of Stripe subscriptions →
 * Supabase `subscription_mirror`. Guarantees no dropped webhook event
 * can leave the admin dashboard stale for more than ~24 hours.
 *
 * Origin: 2026-07-01 — antiquerugs@yahoo.com and josephivanbayot@gmail.com
 * both showed CANCELED on /admin/email but ACTIVE in Stripe. Some
 * subscription.updated events were never delivered/processed, and the
 * mirror had no way to self-heal until this cron.
 *
 * Vercel Cron authenticates by including its CRON_SECRET as either a
 * query param or Bearer token. Same pattern as sync-external-reviews.
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

  const result = await syncStripeMirror();
  return NextResponse.json({ ok: true, ...result });
}
