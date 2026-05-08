export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET /api/paddle-ratings?paddleId=xxx
export async function GET(req: NextRequest) {
  const paddleId = req.nextUrl.searchParams.get("paddleId");
  if (!paddleId) {
    return NextResponse.json({ error: "paddleId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("paddle_ratings")
    .select("stars")
    .eq("paddle_id", paddleId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = data?.length ?? 0;
  const average = count > 0
    ? data.reduce((sum, r) => sum + r.stars, 0) / count
    : 0;

  return NextResponse.json({ average, count }, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/paddle-ratings  { paddleId, stars }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { paddleId, stars } = body;

  if (!paddleId || typeof stars !== "number" || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Use IP + user-agent as anonymous identifier (no auth required)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  const userKey = Buffer.from(`${ip}|${ua}`).toString("base64").slice(0, 64);

  // Upsert: one rating per user per paddle
  const { error } = await supabase
    .from("paddle_ratings")
    .upsert(
      { paddle_id: paddleId, user_key: userKey, stars },
      { onConflict: "paddle_id,user_key" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return updated summary
  const { data } = await supabase
    .from("paddle_ratings")
    .select("stars")
    .eq("paddle_id", paddleId);

  const count = data?.length ?? 0;
  const average = count > 0
    ? data!.reduce((sum, r) => sum + r.stars, 0) / count
    : 0;

  return NextResponse.json({ average, count });
}
