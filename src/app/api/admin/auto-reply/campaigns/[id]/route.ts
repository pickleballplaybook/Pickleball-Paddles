import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("auto_reply_campaigns")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json({ campaign: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  // Only update fields that were provided (PATCH semantics)
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.keywords !== undefined) {
    updates.keywords = body.keywords.map((k: string) => k.toLowerCase().trim()).filter(Boolean);
  }
  if (body.platforms !== undefined) updates.platforms = body.platforms;
  if (body.target_mode !== undefined) updates.target_mode = body.target_mode;
  if (body.target_post_ids !== undefined) updates.target_post_ids = body.target_post_ids;
  if (body.reply_text !== undefined) updates.reply_text = body.reply_text;
  if (body.dm_text !== undefined) updates.dm_text = body.dm_text || null;
  if (body.cta_link !== undefined) updates.cta_link = body.cta_link || null;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.starts_at !== undefined) updates.starts_at = body.starts_at || null;
  if (body.ends_at !== undefined) updates.ends_at = body.ends_at || null;
  if (body.match_once_per_user !== undefined) updates.match_once_per_user = body.match_once_per_user;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("auto_reply_campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaign: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("auto_reply_campaigns")
    .delete()
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
