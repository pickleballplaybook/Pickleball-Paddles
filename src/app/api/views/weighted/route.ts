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
// Per-page row cap on Supabase queries. We paginate explicitly below to get
// the full window — if we just used .limit() without paging, Supabase would
// silently truncate the response at this size, dropping rows whose order is
// unspecified. We learned this the hard way: requests for /days=30 were
// returning the OLDEST 50k rows of the window and dropping the most-recent
// page_views — exactly the opposite of what a recency-weighted score wants.
const PAGE_SIZE = 1000;
// Across all pages combined. Bounds total query time and memory; if a window
// ever exceeds this we'll see it in the .length warning below.
const MAX_ROWS = 200000;

export async function GET(req: NextRequest) {
  const daysParam = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysParam) && daysParam > 0
    ? Math.min(daysParam, MAX_DAYS)
    : 30;
  const type = req.nextUrl.searchParams.get("type") ?? "paddle";

  const cutoffIso = new Date(Date.now() - days * 86400000).toISOString();

  // Paginate by created_at DESC so the most recent rows always come first.
  // If the dataset ever overflows MAX_ROWS, we lose the oldest rows (whose
  // recency weight is tiny anyway) instead of the most recent (whose weight
  // is exactly what we're trying to score on).
  const allRows: { slug: string; created_at: string }[] = [];
  let from = 0;
  while (from < MAX_ROWS) {
    const to = Math.min(from + PAGE_SIZE - 1, MAX_ROWS - 1);
    const { data, error } = await supabase
      .from("page_views")
      .select("slug, created_at")
      .eq("page_type", type)
      .gte("created_at", cutoffIso)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  if (allRows.length >= MAX_ROWS) {
    console.warn(`[views/weighted] hit MAX_ROWS cap of ${MAX_ROWS} for days=${days}; oldest rows truncated`);
  }

  const weighted: Record<string, number> = {};
  for (const row of allRows) {
    if (!row.slug) continue;
    weighted[row.slug] = (weighted[row.slug] ?? 0) + getHeartWeight(row.created_at);
  }

  return NextResponse.json(weighted);
}
