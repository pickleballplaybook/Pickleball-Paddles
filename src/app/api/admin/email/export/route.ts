import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { fetchStripeStatusByEmail } from "@/lib/stripeSubscriptionStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/email/export
 * ---------------------------
 * Admin-gated by the shorts_auth cookie via src/middleware.ts.
 *
 * Query params:
 *   window          = 7 | 30 | 90 | 365 | all   (default 30) — filters by created_at
 *   segment         = no_trial | subscribed | all (default all) — splits the export
 *   includePrevious = true                       (default false) — bypass the past-exports
 *                                                  dedup and include emails from prior exports
 *   id              = <firestore doc id>         — re-download a past export verbatim;
 *                                                  overrides window/segment/includePrevious
 *
 * By default we skip emails that appear in ANY past admin_email_exports doc so
 * Austin can upload each CSV to Substack without re-adding people. When id is
 * present we return the frozen email list from that doc — exact same rows as
 * the day it was exported.
 *
 * Every fresh export (i.e. not a re-download) records a Firestore doc so future
 * exports can dedup against it.
 *
 * Status is sourced from Stripe (same logic as /admin/email). If Stripe is
 * unreachable, every row exports as "no_trial" — we don't fall back to
 * Supabase's trial_start_at because it's been bulk-backfilled and lies.
 */

const WINDOWS: Record<string, number | null> = {
  "7": 7,
  "30": 30,
  "90": 90,
  "365": 365,
  all: null,
};

type Segment = "no_trial" | "subscribed" | "all";
type Status = "captured" | "trial" | "active" | "canceled" | "churned";

export async function GET(req: NextRequest) {
  const winKey = req.nextUrl.searchParams.get("window") ?? "30";
  const days = winKey in WINDOWS ? WINDOWS[winKey] : 30;
  const segRaw = req.nextUrl.searchParams.get("segment") ?? "all";
  const segment: Segment =
    segRaw === "no_trial" || segRaw === "subscribed" ? segRaw : "all";
  const includePrevious =
    req.nextUrl.searchParams.get("includePrevious") === "true";
  const reDownloadId = req.nextUrl.searchParams.get("id")?.trim() || null;

  // Re-download path — return the frozen email list from a past export doc
  // as a bare CSV (email column only, matching what got uploaded to
  // Substack). Skip all the Supabase/Stripe/dedup pipeline.
  if (reDownloadId) {
    try {
      const db = getFirebaseFirestore();
      const doc = await db
        .collection("admin_email_exports")
        .doc(reDownloadId)
        .get();
      if (!doc.exists) {
        return new Response("Export not found.", { status: 404 });
      }
      const data = doc.data() as {
        filename?: string;
        emails?: string[];
        createdAt?: { toDate?: () => Date };
      };
      const emails = Array.isArray(data.emails) ? data.emails : [];
      const filename =
        data.filename ??
        `pbdrills-export-${reDownloadId.slice(0, 8)}.csv`;
      const csv = "email\n" + emails.map(csvEscape).join("\n") + (emails.length ? "\n" : "");
      return new Response(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${filename}"`,
          "cache-control": "no-store",
        },
      });
    } catch (err) {
      console.error("[email/export] re-download failed", err);
      return new Response("Failed to load export.", { status: 500 });
    }
  }

  type Row = {
    email: string;
    source: string | null;
    created_at: string | null;
    trial_start_at: string | null;
    flutter_user_id: string | null;
    unsubscribed_at: string | null;
    bounced_at: string | null;
  };

  const supabase = getSupabaseAdmin();
  // Paginate — Supabase caps single .limit() calls at 1000 rows (default
  // max_rows config), so a .limit(5000) call silently returns just 1000.
  // Loop with .range() until we hit a short page.
  const data: Row[] = [];
  {
    const PAGE_SIZE = 1000;
    const MAX_ROWS = 50_000;
    let offset = 0;
    while (data.length < MAX_ROWS) {
      const { data: page, error } = await supabase
        .from("trial_signups")
        .select("email, source, created_at, trial_start_at, flutter_user_id, unsubscribed_at, bounced_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) {
        return new Response(`Failed to load trial signups: ${error.message}`, { status: 500 });
      }
      if (!page || page.length === 0) break;
      data.push(...(page as Row[]));
      if (page.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }

  // Merge in abandoned_signups — Firestore docs written when a user typed
  // their email at onboarding but bailed before completing Firebase Auth.
  // Without this the CSV misses everyone the abandoned drip is currently
  // emailing (they have a Firestore doc but no trial_signups row).
  try {
    const db = getFirebaseFirestore();
    const snap = await db.collection("abandoned_signups").get();
    const existingEmails = new Set(data.map((r) => r.email.toLowerCase().trim()));
    snap.docs.forEach((d) => {
      const docData = d.data() as {
        email?: string;
        source?: string | null;
        capturedAt?: { toDate?: () => Date } | Date;
      };
      const email = (docData.email ?? d.id).toLowerCase().trim();
      if (!email || existingEmails.has(email)) return;
      const raw = docData.capturedAt as { toDate?: () => Date } | Date | undefined;
      const ts =
        raw && typeof (raw as { toDate?: () => Date }).toDate === "function"
          ? (raw as { toDate: () => Date }).toDate()
          : (raw as Date | undefined);
      data.push({
        email,
        source: docData.source ?? null,
        created_at: ts ? ts.toISOString() : null,
        trial_start_at: null,
        flutter_user_id: null,
        unsubscribed_at: null,
        bounced_at: null,
      });
      existingEmails.add(email);
    });
  } catch (err) {
    console.error("[email/export] failed to read abandoned_signups", err);
  }

  // Union with Stripe customers (same logic as /admin/email page). Without
  // the union we'd miss every subscriber whose email isn't in Supabase
  // trial_signups — which is exactly the case for users who signed up
  // before the onboarding email-capture screen existed.
  const stripeResult = await fetchStripeStatusByEmail();
  const stripeByEmail = stripeResult.byEmail;

  const supabaseByEmail = new Map<string, Row>();
  for (const r of (data ?? []) as Row[]) {
    const key = r.email.toLowerCase().trim();
    if (!supabaseByEmail.has(key)) supabaseByEmail.set(key, r);
  }

  const allEmails = new Set<string>();
  Array.from(supabaseByEmail.keys()).forEach((k) => allEmails.add(k));
  Array.from(stripeByEmail.keys()).forEach((k) => allEmails.add(k));

  type EnrichedRow = Row & {
    status: Status;
    canceled_at: string;
    canceled_plan: string;
    display_date: string;
    // Date that the time-window filter uses — per-status event date.
    relevant_date: string;
  };

  function computeRelevant(status: Status, displayDate: string, trialEnd: string, canceledAt: string): string {
    switch (status) {
      case "captured":
      case "trial":
        return displayDate;
      case "active":
        return trialEnd || displayDate;
      case "canceled":
      case "churned":
        return canceledAt || displayDate;
    }
  }

  const enriched: EnrichedRow[] = [];
  Array.from(allEmails).forEach((emailKey) => {
    const supa = supabaseByEmail.get(emailKey);
    const stripe = stripeByEmail.get(emailKey);
    const baseRow: Row = supa ?? {
      email: emailKey,
      source: null,
      created_at: null,
      trial_start_at: null,
      flutter_user_id: null,
      unsubscribed_at: null,
      bounced_at: null,
    };

    if (stripe) {
      const status: Status =
        stripe.status === "trial" ? "trial" :
        stripe.status === "active" ? "active" :
        stripe.status === "canceled_trial" ? "canceled" :
        "churned";
      const canceledAt = stripe.canceledAt ?? "";
      const trialEnd = stripe.trialEndedAt ?? "";
      enriched.push({
        ...baseRow,
        status,
        canceled_at: canceledAt,
        canceled_plan: stripe.plan,
        trial_start_at: stripe.subscriptionCreatedAt,
        display_date: stripe.subscriptionCreatedAt,
        relevant_date: computeRelevant(status, stripe.subscriptionCreatedAt, trialEnd, canceledAt),
      });
    } else {
      const displayDate = baseRow.created_at ?? "";
      enriched.push({
        ...baseRow,
        status: "captured",
        canceled_at: "",
        canceled_plan: "",
        display_date: displayDate,
        relevant_date: displayDate,
      });
    }
  });

  // Load the admin hide-list so deleted emails don't appear in CSV either.
  const hiddenEmails = new Set<string>();
  try {
    const db = getFirebaseFirestore();
    const snap = await db.collection("hidden_admin_emails").get();
    snap.docs.forEach((d) => {
      const e = (d.data() as { email?: string }).email;
      if (typeof e === "string") hiddenEmails.add(e.toLowerCase().trim());
    });
  } catch {
    /* Firestore unavailable — fall through to including all rows */
  }

  const cutoffIso = days === null ? null : new Date(Date.now() - days * 86_400_000).toISOString();
  let filtered = enriched.filter((r) => {
    if (hiddenEmails.has(r.email.toLowerCase().trim())) return false;
    if (cutoffIso !== null && (r.relevant_date || "") < cutoffIso) return false;
    if (segment === "all") return true;
    if (segment === "no_trial") return r.status === "captured";
    return r.status !== "captured";
  });

  // Dedup against every past export unless the caller explicitly asked to
  // include previously-exported emails. This is the whole point of the
  // history table — one CSV upload to Substack shouldn't re-add anyone.
  const previouslyExported = new Set<string>();
  if (!includePrevious) {
    try {
      const db = getFirebaseFirestore();
      const snap = await db.collection("admin_email_exports").get();
      snap.docs.forEach((d) => {
        const emails = (d.data() as { emails?: string[] }).emails;
        if (!Array.isArray(emails)) return;
        emails.forEach((e) => {
          if (typeof e === "string") previouslyExported.add(e.toLowerCase().trim());
        });
      });
    } catch (err) {
      console.error("[email/export] failed to load past exports (proceeding without dedup)", err);
    }
    if (previouslyExported.size > 0) {
      filtered = filtered.filter(
        (r) => !previouslyExported.has(r.email.toLowerCase().trim()),
      );
    }
  }

  const header =
    "email,source,captured_at,trial_start_at,status,canceled_at,canceled_plan,flutter_user_id,unsubscribed_at,bounced_at\n";
  const body = filtered
    .map((r) =>
      [
        csvEscape(r.email),
        csvEscape(r.source ?? ""),
        r.created_at ?? "",
        r.trial_start_at ?? "",
        r.status,
        r.canceled_at,
        csvEscape(r.canceled_plan),
        csvEscape(r.flutter_user_id ?? ""),
        r.unsubscribed_at ?? "",
        r.bounced_at ?? "",
      ].join(",")
    )
    .join("\n");

  const winLabel = days === null ? "all" : `${days}d`;
  const segLabel = segment === "all" ? "all" : segment;
  const filename = `pbdrills-${segLabel}-${winLabel}-${new Date().toISOString().slice(0, 10)}.csv`;

  // Record this export so future ones can dedup against it. Also powers
  // the "Past exports" table on /admin/email. Fire-and-forget with a
  // best-effort log so a Firestore hiccup can't block the download.
  if (filtered.length > 0) {
    try {
      const db = getFirebaseFirestore();
      const emailList = filtered.map((r) => r.email.toLowerCase().trim());
      await db.collection("admin_email_exports").add({
        createdAt: new Date(),
        filename,
        window: winKey,
        segment,
        includePrevious,
        emailCount: emailList.length,
        emails: emailList,
      });
    } catch (err) {
      console.error("[email/export] failed to record export doc", err);
    }
  }

  return new Response(header + body + (body.length > 0 ? "\n" : ""), {
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
