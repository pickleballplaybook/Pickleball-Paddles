export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

// GET /api/paddle-ratings?paddleId=xxx
export async function GET(req: NextRequest) {
  const paddleId = req.nextUrl.searchParams.get("paddleId");
  if (!paddleId) {
    return NextResponse.json({ error: "paddleId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("paddle_ratings")
    .select("stars, comment, created_at")
    .eq("paddle_id", paddleId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = data?.length ?? 0;
  const average = count > 0
    ? data.reduce((sum, r) => sum + r.stars, 0) / count
    : 0;

  // Return reviews that have comments
  const reviews = (data ?? [])
    .filter((r) => r.comment && r.comment.trim())
    .map((r) => ({ stars: r.stars, comment: r.comment, date: r.created_at }));

  return NextResponse.json({ average, count, reviews }, { headers: NO_CACHE });
}

// POST /api/paddle-ratings  { paddleId, stars, userKey, comment? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { paddleId, stars, userKey, comment } = body;

  if (!paddleId || typeof stars !== "number" || stars < 1 || stars > 5 || !userKey) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Upsert: one rating per userKey per paddle
  const { error } = await supabase
    .from("paddle_ratings")
    .upsert(
      {
        paddle_id: paddleId,
        user_key: userKey.slice(0, 64),
        stars,
        comment: (comment ?? "").slice(0, 500),
      },
      { onConflict: "paddle_id,user_key" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return updated summary
  const { data } = await supabase
    .from("paddle_ratings")
    .select("stars, comment, created_at")
    .eq("paddle_id", paddleId)
    .order("created_at", { ascending: false });

  const count = data?.length ?? 0;
  const average = count > 0
    ? data!.reduce((sum, r) => sum + r.stars, 0) / count
    : 0;

  const reviews = (data ?? [])
    .filter((r) => r.comment && r.comment.trim())
    .map((r) => ({ stars: r.stars, comment: r.comment, date: r.created_at }));

  return NextResponse.json({ average, count, reviews }, { headers: NO_CACHE });
}
