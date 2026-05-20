/**
 * GET  /api/views?slug=X&type=Y       → { count: N }
 * GET  /api/views?slugs=a,b,c&type=Y  → { "a": N, "b": N, "c": N }
 * POST /api/views  { slug, type }     → { count: N }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const slug  = req.nextUrl.searchParams.get("slug");
  const slugs = req.nextUrl.searchParams.get("slugs");
  const type  = req.nextUrl.searchParams.get("type") ?? "paddle";

  // Batch query: ?slugs=a,b,c
  if (slugs) {
    const slugList = slugs.split(",").filter(Boolean).slice(0, 50);
    if (slugList.length === 0) {
      return NextResponse.json({});
    }

    // Use individual count queries to avoid Supabase row limit truncation
    const counts: Record<string, number> = {};
    await Promise.all(
      slugList.map(async (s) => {
        const { count, error } = await supabase
          .from("page_views")
          .select("*", { count: "exact", head: true })
          .eq("slug", s)
          .eq("page_type", type);
        counts[s] = error ? 0 : (count ?? 0);
      })
    );

    return NextResponse.json(counts);
  }

  // Single query: ?slug=X
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const { count, error } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .eq("slug", slug)
    .eq("page_type", type);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const { slug, type = "paddle" } = await req.json();

  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("page_views")
    .insert({ slug, page_type: type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .eq("slug", slug)
    .eq("page_type", type);

  return NextResponse.json({ count: count ?? 0 });
}
