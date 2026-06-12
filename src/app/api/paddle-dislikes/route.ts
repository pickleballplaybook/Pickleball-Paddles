/**
 * GET /api/paddle-dislikes
 *
 * Returns the total dislike count per paddle_id from the paddle_dislikes
 * table. Direct mirror of /api/paddle-hearts. If the table doesn't exist yet
 * (migration hasn't been run), this returns an empty array instead of 500
 * so the UI degrades gracefully — thumbs-down counts show 0 until the
 * Supabase migration is applied, but nothing breaks.
 *
 * Response: { slug: string, dislikes: number }[]
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export interface PaddleDislikeCount {
  slug: string;
  dislikes: number;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("paddle_dislikes")
      .select("paddle_id");

    if (error) {
      // Most common reason for an error here is the table not existing yet.
      // Don't 500 — return empty so the UI keeps rendering thumbs-down with
      // a 0 count instead of breaking.
      console.warn("[paddle-dislikes] Supabase error (likely missing table):", error.message);
      return NextResponse.json([], {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      counts.set(row.paddle_id, (counts.get(row.paddle_id) ?? 0) + 1);
    }

    const result: PaddleDislikeCount[] = Array.from(counts.entries()).map(
      ([slug, dislikes]) => ({ slug, dislikes })
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[paddle-dislikes] unexpected:", err);
    return NextResponse.json([], { status: 200 });
  }
}
