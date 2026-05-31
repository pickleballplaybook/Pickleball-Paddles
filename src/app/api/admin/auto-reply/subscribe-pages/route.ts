import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

// One-shot diagnostic + remediation endpoint. Hits each connected FB Page's
// /subscribed_apps with its stored page access token, re-subscribing it to
// the `feed` field. Use this if a Page connection was made before the app's
// webhook config was repaired and the Page never got subscribed.
//
// Auth: requires the same shorts_auth cookie that gates the admin UI (the
// middleware handles this). No additional secret needed.
export async function POST(_req: NextRequest) {
  const supabase = getSupabaseAdmin();

  const { data: connections, error } = await supabase
    .from("social_connections")
    .select("id, platform, account_id, account_name, access_token, is_active")
    .eq("platform", "facebook")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    page: string;
    page_id: string;
    ok: boolean;
    status?: number;
    body?: any;
  }> = [];

  for (const conn of connections || []) {
    const url = `${GRAPH}/${conn.account_id}/subscribed_apps`;
    const body = new URLSearchParams({
      subscribed_fields: "feed",
      access_token: conn.access_token,
    });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await res.json().catch(() => ({}));
      results.push({
        page: conn.account_name,
        page_id: conn.account_id,
        ok: res.ok,
        status: res.status,
        body: data,
      });
    } catch (err: any) {
      results.push({
        page: conn.account_name,
        page_id: conn.account_id,
        ok: false,
        body: { error: err?.message || String(err) },
      });
    }
  }

  return NextResponse.json({
    subscribed_at: new Date().toISOString(),
    page_count: connections?.length || 0,
    results,
  });
}

// GET variant for convenience — same behavior, callable from a browser.
export async function GET(req: NextRequest) {
  return POST(req);
}
