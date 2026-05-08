/**
 * GET /api/reactions
 *
 * Returns all heart rows from paddle_hearts, aggregated by paddle_id.
 * Used server-side by TrendingSection to compute time-decay trending scores
 * across ALL users.
 *
 * Response: { [paddleId]: { paddleId, totalHearts, lastHeart } }
 */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export interface AggregatedHeart {
  paddleId:    string;
  totalHearts: number;
  lastHeart:   string; // ISO timestamp
}

export async function GET() {
  const { data, error } = await supabase
    .from("paddle_hearts")
    .select("paddle_id, created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const agg = new Map<string, { total: number; last: string }>();
  for (const row of data ?? []) {
    const entry = agg.get(row.paddle_id) ?? { total: 0, last: "" };
    entry.total += 1;
    if (!entry.last || row.created_at > entry.last) entry.last = row.created_at;
    agg.set(row.paddle_id, entry);
  }

  const result: Record<string, AggregatedHeart> = {};
  Array.from(agg.entries()).forEach(([paddleId, { total, last }]) => {
    result[paddleId] = { paddleId, totalHearts: total, lastHeart: last };
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
