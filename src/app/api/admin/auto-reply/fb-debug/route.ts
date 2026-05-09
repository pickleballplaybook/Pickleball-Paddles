import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const accountId = url.searchParams.get("account_id");
  if (!accountId) {
    return NextResponse.json({ error: "account_id required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: conn, error } = await supabase
    .from("social_connections")
    .select("account_id, account_name, access_token")
    .eq("platform", "facebook")
    .eq("account_id", accountId)
    .single();

  if (error || !conn) {
    return NextResponse.json({ error: error?.message || "not found" }, { status: 404 });
  }

  const subRes = await fetch(
    `${GRAPH}/${conn.account_id}/subscribed_apps?access_token=${encodeURIComponent(conn.access_token)}`
  );
  const subData = await subRes.json();

  return NextResponse.json({
    page_name: conn.account_name,
    page_id: conn.account_id,
    subscribed_apps: subData,
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const accountId = url.searchParams.get("account_id");
  if (!accountId) {
    return NextResponse.json({ error: "account_id required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: conn, error } = await supabase
    .from("social_connections")
    .select("account_id, account_name, access_token")
    .eq("platform", "facebook")
    .eq("account_id", accountId)
    .single();

  if (error || !conn) {
    return NextResponse.json({ error: error?.message || "not found" }, { status: 404 });
  }

  const body = new URLSearchParams({
    subscribed_fields: "feed",
    access_token: conn.access_token,
  });

  const subRes = await fetch(
    `${GRAPH}/${conn.account_id}/subscribed_apps`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );
  const subData = await subRes.json();

  return NextResponse.json({
    page_name: conn.account_name,
    subscribe_response: subData,
    http_status: subRes.status,
  });
}
