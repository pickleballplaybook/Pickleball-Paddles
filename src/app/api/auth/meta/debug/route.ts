import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "missing";
  const sbProject = url.match(/https?:\/\/([^.]+)/)?.[1] || "unknown";
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { count, error } = await supabase
    .from("social_connections")
    .select("*", { count: "exact", head: true });

  const { data: rows, error: selectError } = await supabase
    .from("social_connections")
    .select("platform, account_id, account_name, is_active");

  return NextResponse.json({
    supabase_project: sbProject,
    has_service_key: hasServiceKey,
    count_result: { count, error: error?.message },
    select_result: {
      row_count: rows?.length || 0,
      first_row: rows?.[0] || null,
      error: selectError?.message,
    },
  });
}
