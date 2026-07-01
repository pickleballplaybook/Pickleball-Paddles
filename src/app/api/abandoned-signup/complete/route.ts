import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/abandoned-signup/complete
 * -----------------------------------
 * Called from user_pod.dart immediately after a successful Firebase Auth
 * signup. Marks the matching `abandoned_signups/{email}` doc as completed
 * so the runAbandonedSignupDrip Cloud Function stops firing win-back
 * emails to a user who already converted.
 *
 * Idempotent: if the doc doesn't exist (user never hit the email-capture
 * screen, e.g., they were re-using a device with a stale install) we
 * return 200 with `noDoc: true` rather than 404 — the caller is a
 * best-effort signal, not a primary auth path.
 *
 * The drip function ALSO short-circuits when it sees a matching user
 * appear in /users by email, so this endpoint is belt-and-suspenders.
 *
 * Body: { email: string, uid?: string }
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

  const uid =
    typeof body.uid === "string" && body.uid.length > 0 ? body.uid : null;

  const db = getFirebaseFirestore();
  const ref = db.collection("abandoned_signups").doc(email);
  const existing = await ref.get();

  if (!existing.exists) {
    return NextResponse.json({ success: true, noDoc: true });
  }

  await ref.set(
    {
      completed: true,
      completedAt: new Date(),
      completedUid: uid,
    },
    { merge: true },
  );

  return NextResponse.json({ success: true, noDoc: false });
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
