import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/auto-reply/campaigns
 * Returns all campaigns with derived stats (triggers_count, last_triggered_at).
 */
export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: campaigns, error } = await supabase
    .from("auto_reply_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get trigger counts + last_triggered_at per campaign
  const { data: stats } = await supabase
    .from("auto_reply_logs")
    .select("campaign_id, created_at")
    .not("campaign_id", "is", null)
    .eq("reply_status", "sent");

  const statsByCampaign = new Map<string, { count: number; last: string | null }>();
  for (const row of stats || []) {
    const existing = statsByCampaign.get(row.campaign_id) || { count: 0, last: null };
    existing.count++;
    if (!existing.last || row.created_at > existing.last) {
      existing.last = row.created_at;
    }
    statsByCampaign.set(row.campaign_id, existing);
  }

  const enriched = (campaigns || []).map((c: any) => {
    const s = statsByCampaign.get(c.id) || { count: 0, last: null };
    return {
      ...c,
      triggers_count: s.count,
      last_triggered_at: s.last,
    };
  });

  return NextResponse.json({ campaigns: enriched });
}

/**
 * POST /api/admin/auto-reply/campaigns
 * Body: campaign fields. Returns created row.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Validation
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!Array.isArray(body.keywords) || body.keywords.length === 0) {
    return NextResponse.json({ error: "at least one keyword required" }, { status: 400 });
  }
  if (!Array.isArray(body.platforms) || body.platforms.length === 0) {
    return NextResponse.json({ error: "at least one platform required" }, { status: 400 });
  }
  if (!body.reply_text?.trim()) {
    return NextResponse.json({ error: "reply_text is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("auto_reply_campaigns")
    .insert({
      name: body.name.trim(),
      keywords: body.keywords.map((k: string) => k.toLowerCase().trim()).filter(Boolean),
      platforms: body.platforms,
      target_mode: body.target_mode || "all",
      target_post_ids: body.target_post_ids || [],
      reply_text: body.reply_text,
      dm_text: body.dm_text || null,
      cta_link: body.cta_link || null,
      is_active: body.is_active ?? true,
      starts_at: body.starts_at || null,
      ends_at: body.ends_at || null,
      match_once_per_user: body.match_once_per_user ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: data });
}
