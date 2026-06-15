import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/email/export
 * ---------------------------
 * Admin-gated by the shorts_auth cookie via src/middleware.ts.
 * Returns a CSV of every trial signup so Austin can import into his email
 * list (any provider that takes CSV).
 *
 * Columns:
 *   email, source, trial_start_at, flutter_user_id, unsubscribed_at, bounced_at
 *
 * Service-role client bypasses RLS (no public read access on trial_signups).
 */
export async function GET(_req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("trial_signups")
    .select("email, source, trial_start_at, flutter_user_id, unsubscribed_at, bounced_at")
    .order("trial_start_at", { ascending: true });

  if (error) {
    return new Response(`Failed to load trial signups: ${error.message}`, { status: 500 });
  }

  const header = "email,source,trial_start_at,flutter_user_id,unsubscribed_at,bounced_at\n";
  const rows = (data ?? []).map((r) =>
    [
      csvEscape(r.email),
      csvEscape(r.source ?? ""),
      r.trial_start_at ?? "",
      csvEscape(r.flutter_user_id ?? ""),
      r.unsubscribed_at ?? "",
      r.bounced_at ?? "",
    ].join(",")
  ).join("\n");

  const filename = `pbdrills-trial-signups-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(header + rows + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

function csvEscape(value: string): string {
  if (value == null) return "";
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
