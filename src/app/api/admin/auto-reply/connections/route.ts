import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("social_connections")
    .select("id, platform, account_name, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    connections: (data || []).map((c) => ({
      id: c.id,
      platform: c.platform,
      account_name: c.account_name,
      is_active: c.is_active,
      connected_at: c.created_at,
    })),
  });
}
