import { NextResponse } from "next/server";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/purge-austin-plus
 * ----------------------------------
 * Hard-deletes every account whose email STARTS WITH "austin+" from:
 *   1. Firebase Auth
 *   2. Firestore users/{uid}
 *   3. Firestore usernames/{lowerName}  — frees the username for re-claim
 *   4. Firestore abandoned_signups
 *   5. Firestore cancellation_reasons
 *   6. Supabase trial_signups
 *   7. Supabase subscription_mirror
 *   8. Firestore hidden_admin_emails (added as a safety net)
 *
 * Admin-gated by the shorts_auth cookie via middleware.ts.
 */

function isAustinPlus(email: string): boolean {
  return email.toLowerCase().startsWith("austin+");
}

export async function POST() {
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();
  const supabase = getSupabaseAdmin();

  const purgedEmails: string[] = [];
const purgedEmailsSet = new Set<string>();
  const log: Record<string, Record<string, string>> = {};

  function mark(email: string, step: string, result: string) {
    if (!log[email]) log[email] = {};
    log[email][step] = result;
    if (!purgedEmailsSet.has(email)) { purgedEmailsSet.add(email); purgedEmails.push(email); }
  }

  // ── 1. Firebase Auth sweep ────────────────────────────────────────────────
  let pageToken: string | undefined;
  do {
    const result = await auth.listUsers(1000, pageToken);
    for (const u of result.users) {
      if (!u.email || !isAustinPlus(u.email)) continue;
      const email = u.email.toLowerCase().trim();

      // Firestore user doc + username lock
      try {
        const ref = db.collection("users").doc(u.uid);
        const snap = await ref.get();
        if (snap.exists) {
          const data = snap.data()!;
          const usernameLower = (data.usernameLower as string | null) ?? null;
          await ref.delete();
          mark(email, "firestoreUser", "deleted");
          if (usernameLower) {
            try {
              await db.collection("usernames").doc(usernameLower).delete();
              mark(email, "firestoreUsername", "deleted");
            } catch {
              mark(email, "firestoreUsername", "error");
            }
          }
        } else {
          mark(email, "firestoreUser", "not_found");
        }
      } catch {
        mark(email, "firestoreUser", "error");
      }

      // Firebase Auth
      try {
        await auth.deleteUser(u.uid);
        mark(email, "auth", "deleted");
      } catch (e: unknown) {
        mark(email, "auth", (e as { code?: string }).code === "auth/user-not-found" ? "not_found" : "error");
      }
    }
    pageToken = result.pageToken;
  } while (pageToken);

  // ── 2. Firestore abandoned_signups sweep ──────────────────────────────────
  try {
    const snap = await db.collection("abandoned_signups").get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const email = ((data.email as string | null) ?? doc.id).toLowerCase().trim();
      if (!isAustinPlus(email)) continue;
      await doc.ref.delete();
      mark(email, "abandonedSignup", "deleted");
    }
  } catch {
    // non-blocking
  }

  // ── 3. Firestore cancellation_reasons sweep ───────────────────────────────
  try {
    const snap = await db.collection("cancellation_reasons").get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const email = ((data.email as string | null) ?? "").toLowerCase().trim();
      if (!isAustinPlus(email)) continue;
      await doc.ref.delete();
      mark(email, "cancellationReason", "deleted");
    }
  } catch {
    // non-blocking
  }

  // ── 4. Supabase trial_signups sweep ──────────────────────────────────────
  // Supabase LIKE filter: 'austin+%'
  try {
    const { data: rows } = await supabase
      .from("trial_signups")
      .select("email")
      .like("email", "austin+%");
    for (const row of rows ?? []) {
      const email = row.email.toLowerCase().trim();
      await supabase.from("trial_signups").delete().eq("email", email);
      mark(email, "trialSignups", "deleted");
    }
  } catch {
    // non-blocking
  }

  // ── 5. Supabase subscription_mirror sweep ─────────────────────────────────
  try {
    const { data: rows } = await supabase
      .from("subscription_mirror")
      .select("email")
      .like("email", "austin+%");
    const seen = new Map<string, boolean>();
    const uniqueEmails: string[] = [];
    for (const r of rows ?? []) {
      const e = (r as { email: string }).email.toLowerCase().trim();
      if (!seen.has(e)) { seen.set(e, true); uniqueEmails.push(e); }
    }
    for (const email of uniqueEmails) {
      await supabase.from("subscription_mirror").delete().eq("email", email);
      mark(email, "subscriptionMirror", "deleted");
    }
  } catch {
    // non-blocking
  }

  // ── 6. Add all to hidden_admin_emails ─────────────────────────────────────
  for (const email of purgedEmails.slice()) {
    try {
      const docId = email.replace(/\//g, "_");
      await db.collection("hidden_admin_emails").doc(docId).set({
        email,
        hiddenAt: new Date(),
        reason: "austin_plus_purge",
      });
      mark(email, "hidden", "added");
    } catch {
      mark(email, "hidden", "error");
    }
  }

  return NextResponse.json({
    purged: purgedEmails.length,
    emails: [...purgedEmails].sort(),
    log,
  });
}
