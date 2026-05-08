/**
 * GET  /api/views?slug=X&type=Y  → { count: N }
 * POST /api/views  { slug, type } → { count: N }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const type = req.nextUrl.searchParams.get("type") ?? "paddle";

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
