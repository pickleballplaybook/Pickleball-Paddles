/**
 * GET /api/views/weighted?days=30 → { "<slug>": <weightedScore>, ... }
 *
 * Aggregates page_views rows for `page_type=paddle` within the given window,
 * applies the same recency decay used for hearts (getHeartWeight), and returns
 * a per-slug weighted total. Replaces the all-time cumulative counts that
 * /api/views returns when used for the Trending surfaces — without that
 * windowing, paddles that have been on the site longest dominate every
 * "trending" ranking even when nobody is currently looking at them.
 *
 * Output is a plain { slug: number } map. Slugs with zero views in window are
 * omitted (callers can default to 0).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getHeartWeight } from "@/lib/trending";

// Hard cap so a runaway query can't try to pull months of view rows. At
// observed traffic (~1–3k views/week) 30 days * 4 = 120 days max bounds the
// raw rowcount comfortably under 20k.
const MAX_DAYS = 120;
// Supabase PostgREST default cap is 1000; raise it explicitly. If we ever blow
// past this in production we'll need to paginate, but at current traffic we're
// not close.
const ROW_LIMIT = 50000;

export async function GET(req: NextRequest) {
  const daysParam = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysParam) && daysParam > 0
    ? Math.min(daysParam, MAX_DAYS)
    : 30;
  const type = req.nextUrl.searchParams.get("type") ?? "paddle";

  const cutoffIso = new Date(Date.now() - days * 86400000).toISOString();

  const { data, error } = await supabase
    .from("page_views")
    .select("slug, created_at")
    .eq("page_type", type)
    .gte("created_at", cutoffIso)
    .limit(ROW_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const weighted: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!row.slug) continue;
    weighted[row.slug] = (weighted[row.slug] ?? 0) + getHeartWeight(row.created_at);
  }

  return NextResponse.json(weighted);
}
