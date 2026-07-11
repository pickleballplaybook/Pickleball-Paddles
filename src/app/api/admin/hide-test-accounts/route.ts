import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/hide-test-accounts
 * ----------------------------------
 * One-shot maintenance endpoint. Adds known test / self / promo emails
 * to the `hidden_admin_emails` Firestore collection so they stop
 * appearing in /admin/email counts and CSV exports.
 *
 * Baked-in list is Austin's own testing accounts + a known promo dupe
 * that surfaced in the mirror-diagnostic report. Safe to re-run — Firestore
 * .set() is idempotent, so calling twice adds nothing new.
 *
 * Admin-gated upstream by the shorts_auth cookie via src/middleware.ts.
 */

const TEST_EMAILS = [
  "matthewrice345+free@gmail.com", // 78 dupe subs — promo/testing alias
  "austinhardy4@gmail.com",         // 40 dupe subs — Austin's testing
  "austin@pickleballplaybook.app",  // 15 dupe subs — Austin's testing
  "austinhardy46@gmail.com",        // 10 dupe subs — Austin's testing
  "austinhardy4+123@gmail.com",     // 6 dupe subs — Austin's testing
];

export async function POST(_req: NextRequest) {
  const db = getFirebaseFirestore();
  const results: Array<{ email: string; ok: boolean; error?: string }> = [];

  for (const raw of TEST_EMAILS) {
    const email = raw.toLowerCase().trim();
    try {
      const docId = email.replace(/\//g, "_");
      await db.collection("hidden_admin_emails").doc(docId).set({
        email,
        hiddenAt: new Date(),
        reason: "test_or_promo_account",
      });
      results.push({ email, ok: true });
    } catch (e) {
      results.push({
        email,
        ok: false,
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    hidden: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
