import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/newsletter-emails
 * ---------------------------------
 * Admin-gated by the shorts_auth cookie via src/middleware.ts (same
 * gating as /admin/shorts and /admin/publish). Returns a CSV of every
 * profile with newsletter_opt_in = true so the user can upload to
 * Substack manually.
 *
 * Columns:
 *   email, opted_in_at, confirmed_subscribed (true/false)
 *
 * Service-role client is used to bypass RLS (admin context).
 */
export async function GET(_req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("email, created_at, newsletter_subscribed_at")
    .eq("newsletter_opt_in", true)
    .order("created_at", { ascending: true });

  if (error) {
    return new Response(`Failed to load profiles: ${error.message}`, { status: 500 });
  }

  const header = "email,opted_in_at,confirmed_subscribed\n";
  const rows = (data ?? []).map((p) => {
    const optedAt = p.created_at ?? "";
    const confirmed = p.newsletter_subscribed_at ? "true" : "false";
    return `${csvEscape(p.email)},${optedAt},${confirmed}`;
  }).join("\n");

  const filename = `playbookpaddles-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;

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
  // Wrap in quotes if it contains comma, quote, or newline.
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
