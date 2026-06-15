import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/trial-signup
 * ----------------------
 * Public endpoint hit by the Pickleball Drills Flutter app's onboarding
 * email-capture screen. Upserts into Supabase `trial_signups` so:
 *   - Austin can export the list as CSV from /admin/email
 *   - The Day-0..6 trial drip in functions/trial_emails.js has somewhere
 *     to read from for web-originated signups (Firestore is the source
 *     of truth for Flutter signups; this row is the marketing-list copy).
 *
 * Body:
 *   { email: string, flutter_user_id?: string, source?: 'app_onboarding' | 'web' }
 *
 * Returns:
 *   200 { success: true, alreadyExisted: boolean }
 *   400 invalid email
 *   500 supabase write failed
 *
 * No auth: this is a public lead-capture endpoint. Rate-limiting is
 * Vercel's default per-IP; if abuse appears we add Turnstile.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  const email = rawEmail.trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const flutterUserId =
    typeof body.flutter_user_id === "string" && body.flutter_user_id.length > 0
      ? body.flutter_user_id
      : null;

  const source =
    body.source === "web" || body.source === "app_onboarding"
      ? (body.source as string)
      : "app_onboarding";

  const supabase = getSupabaseAdmin();

  // Check for existing row so we can report alreadyExisted without
  // resetting their trial_start_at (would mess up the drip).
  const { data: existing, error: lookupErr } = await supabase
    .from("trial_signups")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupErr) {
    console.error("[trial-signup] lookup failed", lookupErr);
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }

  if (existing) {
    // Only update flutter_user_id if it was previously null.
    if (flutterUserId) {
      await supabase
        .from("trial_signups")
        .update({ flutter_user_id: flutterUserId })
        .eq("id", existing.id)
        .is("flutter_user_id", null);
    }
    return NextResponse.json({ success: true, alreadyExisted: true });
  }

  const { error: insertErr } = await supabase.from("trial_signups").insert({
    email,
    flutter_user_id: flutterUserId,
    source,
  });

  if (insertErr) {
    console.error("[trial-signup] insert failed", insertErr);
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }

  return NextResponse.json({ success: true, alreadyExisted: false });
}

// Permissive CORS so the Flutter app (and any future web onboarding form)
// can POST from anywhere. We only accept POST, and the only side effect is
// inserting a row keyed by email — low blast radius.
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
}
