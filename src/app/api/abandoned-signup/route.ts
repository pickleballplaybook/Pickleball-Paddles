import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/abandoned-signup
 * --------------------------
 * Hit from the Pickleball Drills onboarding email-capture step (which
 * fires after the building animation, before the paywall). Creates a
 * Firestore `abandoned_signups/{email}` doc that the Cloud Function
 * `runAbandonedSignupDrip` watches: if the user doesn't finish signup
 * within a short delay, we fire the Cal AI-style win-back emails.
 *
 * The doc is keyed by lowercased email so the corresponding
 * mark-complete call from signup can do a single get/update by ID.
 *
 * Body:
 *   { email: string, flutter_user_id?: string, source?: string }
 *
 *   `source` is captured by the Flutter app from ?ref= on cold boot
 *   (e.g. "pbdrills-landing"). Stamped onto the Firestore doc so
 *   /admin/email?view=landing can attribute captures by origin.
 *
 * Returns:
 *   200 { success: true, alreadyExisted: boolean }
 *   400 invalid email
 *   500 firestore write failed
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

  // Source is a short slug (e.g. "pbdrills-landing"). Clamp length so
  // a rogue client can't stuff arbitrary data into the doc.
  const source =
    typeof body.source === "string" && body.source.length > 0
      ? body.source.slice(0, 64)
      : null;

  const db = getFirebaseFirestore();
  const ref = db.collection("abandoned_signups").doc(email);
  const existing = await ref.get();

  if (existing.exists) {
    // Don't reset capturedAt — the drip schedule is anchored to the FIRST
    // capture. If they hit onboarding twice on the same email we still
    // want to count from the original visit.
    //
    // If the FIRST capture had no source but a later one does (user
    // revisited via landing page), backfill it. Never overwrite an
    // existing source — first-touch attribution wins.
    if (source && !existing.get("source")) {
      await ref.set({ source }, { merge: true });
    }
    return NextResponse.json({ success: true, alreadyExisted: true });
  }

  await ref.set({
    email,
    flutterUserId,
    source,
    capturedAt: new Date(),
    completed: false,
    completedAt: null,
    emailsSent: 0,
    lastEmailSentAt: null,
  });

  return NextResponse.json({ success: true, alreadyExisted: false });
}

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
