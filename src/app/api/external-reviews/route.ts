import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/external-reviews?slug=xxx
 * Returns cached external review data for a paddle.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("external_reviews")
    .select("rating, review_count, source_name, source_url")
    .eq("paddle_slug", slug)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    rating: data.rating,
    count: data.review_count,
    sourceName: data.source_name,
    sourceUrl: data.source_url,
  });
}
