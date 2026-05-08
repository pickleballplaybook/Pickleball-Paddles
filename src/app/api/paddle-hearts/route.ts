/**
 * GET /api/paddle-hearts
 *
 * Returns the total heart count per paddle_id from the reactions table.
 * Filters only for 'heart' reactions (excludes dislikes).
 * 
 * Response: { slug: string, hearts: number }[]
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export interface PaddleHeartCount {
  slug: string;
  hearts: number;
}

export async function GET() {
  try {
    // Query all heart rows from paddle_hearts table
    const { data, error } = await supabase
      .from("paddle_hearts")
      .select("paddle_id");

    if (error) {
      console.error("[paddle-hearts] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate heart counts by paddle_id
    const heartMap = new Map<string, number>();
    for (const row of data ?? []) {
      const current = heartMap.get(row.paddle_id) ?? 0;
      heartMap.set(row.paddle_id, current + 1);
    }

    // Convert to response format
    const result: PaddleHeartCount[] = Array.from(heartMap.entries()).map(
      ([slug, hearts]) => ({ slug, hearts })
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[paddle-hearts] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
