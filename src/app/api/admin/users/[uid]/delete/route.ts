import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/users/{uid}/delete
 * ------------------------------------
 * Hard-deletes a test signup from BOTH:
 *   1. Firestore `users/{uid}` doc (removes from /admin/acquisition)
 *   2. Supabase `trial_signups` by email (removes from /admin/email)
 *
 * Firebase Auth account is left intact on purpose — if you accidentally
 * delete a real user's profile you don't also lock them out. They can
 * re-onboard and the doc gets recreated. The Auth account itself can be
 * deleted manually from Firebase Console if needed.
 *
 * Admin-gated by the shorts_auth cookie via src/middleware.ts. Anyone
 * hitting this endpoint without that cookie gets redirected to login
 * before the handler runs.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  if (!uid) {
    return NextResponse.json({ error: "uid required" }, { status: 400 });
  }

  let email: string | null = null;

  // 1. Firestore — read first to grab the email for the Supabase cleanup,
  //    then delete. Order matters: read before delete so we don't try to
  //    read a doc we just nuked.
  try {
    const db = getFirebaseFirestore();
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (snap.exists) {
      email = (snap.data()?.email as string | null) ?? null;
      await ref.delete();
    }
  } catch (e) {
    console.error("Firestore delete failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Firestore delete failed" },
      { status: 500 },
    );
  }

  // 2. Supabase — best-effort cleanup so /admin/email also reflects the
  //    deletion. Soft-fail because email might not be in trial_signups
  //    (e.g., older signup that never hit the new flow).
  if (email && email.trim().length > 0) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("trial_signups").delete().eq("email", email.trim().toLowerCase());
    } catch (e) {
      console.warn("Supabase delete failed (non-blocking):", e);
    }
  }

  return NextResponse.json({ success: true, email });
}
