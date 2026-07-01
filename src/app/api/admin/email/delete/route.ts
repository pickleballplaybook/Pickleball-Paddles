import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/email/delete
 * ----------------------------
 * Hides an email from /admin/email + the email CSV export.
 *
 * Why a hide-list and not a hard delete: rows can come from either Supabase
 * trial_signups OR Stripe customers. We can't safely delete a Stripe
 * customer (paying!) just to clean up the marketing-list view. Instead we
 * record the email in Firestore `hidden_admin_emails` and filter it out
 * everywhere on read. As a cleanup courtesy we also drop the Supabase row
 * if one exists, since the data lives nowhere else useful.
 *
 * Admin-gated upstream by the shorts_auth cookie via src/middleware.ts.
 */
export async function POST(req: NextRequest) {
  let email: string | null = null;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : null;
  } catch {
    /* falls through to the null check */
  }
  if (!email) {
    return NextResponse.json({ error: "missing email" }, { status: 400 });
  }

  let firestoreOk = false;
  try {
    const db = getFirebaseFirestore();
    // Document ID = the email itself. Firestore allows `.` and `@` in IDs
    // so no escaping needed; just guard against the rare illegal `/` char.
    const docId = email.replace(/\//g, "_");
    await db.collection("hidden_admin_emails").doc(docId).set({
      email,
      hiddenAt: new Date(),
    });
    firestoreOk = true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Firestore write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Best-effort Supabase cleanup so the row doesn't linger in the table.
  // Failures here don't undo the hide — the page reads the hidden list
  // anyway, so a Supabase glitch doesn't surface the email again.
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("trial_signups").delete().eq("email", email);
  } catch {
    /* swallow — Firestore hide is the source of truth for visibility */
  }

  return NextResponse.json({ ok: true, hidden: firestoreOk });
}
