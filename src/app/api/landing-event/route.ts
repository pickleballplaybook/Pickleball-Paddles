import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/landing-event
 * -----------------------
 * Fire-and-forget analytics beacon for the Pickleball Drills landing
 * pages (currently only /pbdrills). Writes a lightweight Firestore doc
 * to `landing_events` which /admin/email?view=landing reads back to
 * build the top-of-funnel counts.
 *
 * Two event shapes:
 *   { type: 'view',    page: 'pbdrills' }
 *     — fires from LandingViewBeacon on page mount
 *   { type: 'arrival', page: 'pbdrills', ref: 'pbdrills-landing' }
 *     — fires from the Flutter app on cold boot when it sees ?ref=...
 *
 * Public + no auth. Volume ceiling is landing page traffic × 2 (view
 * + arrival) — trivial cost. If bots become a problem, gate behind
 * Turnstile or a signed nonce.
 *
 * Returns 204 for both success and validation failure (silent beacon).
 */

const ALLOWED_TYPES = new Set(["view", "arrival"]);
const ALLOWED_PAGES = new Set(["pbdrills"]);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return silent204();
  }

  const type = typeof body.type === "string" ? body.type : "";
  const page = typeof body.page === "string" ? body.page : "";
  const ref = typeof body.ref === "string" ? body.ref.slice(0, 128) : null;

  if (!ALLOWED_TYPES.has(type) || !ALLOWED_PAGES.has(page)) {
    return silent204();
  }

  try {
    const db = getFirebaseFirestore();
    await db.collection("landing_events").add({
      type,
      page,
      ref,
      ts: new Date(),
    });
  } catch (err) {
    console.error("[landing-event] write failed", err);
  }

  return silent204();
}

function silent204() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
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
