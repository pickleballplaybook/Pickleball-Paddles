import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("social_connections")
      .select(
        "id, platform, account_id, account_name, page_id, token_expires_at, is_active, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[list] supabase error:", error);
      return NextResponse.json(
        { connections: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ connections: data || [] });
  } catch (err: any) {
    console.error("[list] crashed:", err);
    return NextResponse.json(
      { connections: [], error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
