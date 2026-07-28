import Link from "next/link";
import { Download, UserCheck, UserX, AlertTriangle, Mail, TrendingDown, Clock, Megaphone, Smartphone, BarChart3, Target } from "lucide-react";
import { AdminNav } from "../_components/AdminNav";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { fetchStripeStatusByEmail, type StripeSubInfo } from "@/lib/stripeSubscriptionStatus";
import LocalDateTime from "./LocalDateTime";
import DeleteRowButton from "./DeleteRowButton";
import SyncFromStripeButton from "./SyncFromStripeButton";

// 60-second cache for the Firestore hidden-email set so we don't round-trip
// to Firestore on every admin page load.
let hiddenCache: { set: Set<string>; cachedAt: number } | null = null;
const HIDDEN_CACHE_TTL_MS = 60_000;

async function loadHiddenEmails(): Promise<Set<string>> {
  if (hiddenCache && Date.now() - hiddenCache.cachedAt < HIDDEN_CACHE_TTL_MS) {
    return hiddenCache.set;
  }
  const set = new Set<string>();
  try {
    const db = getFirebaseFirestore();
    const snap = await db.collection("hidden_admin_emails").get();
    snap.docs.forEach((d) => {
      const e = (d.data() as { email?: string }).email;
      if (typeof e === "string") set.add(e.toLowerCase().trim());
    });
    hiddenCache = { set, cachedAt: Date.now() };
  } catch {
    // Firestore unavailable — better to show all rows than to error the page
  }
  return set;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /admin/email
 * ------------
 * One combined list of every onboarding signup, each row labeled with a
 * status sourced live from Stripe:
 *   Active   — past trial, subscription is paying
 *   Trial    — currently inside the 7-day trial window
 *   Canceled — canceled BEFORE trial converted (no money paid)
 *   Churned  — canceled AFTER trial (paid at least once, then quit)
 *   Captured — typed an email at onboarding but never reached Stripe checkout
 */

type Row = {
  email: string;
  source: string | null;
  created_at: string | null;
  trial_start_at: string | null;
  unsubscribed_at: string | null;
  bounced_at: string | null;
};

type Status = "captured" | "trial" | "active" | "canceled" | "churned";

type CategorizedRow = {
  email: string;
  status: Status;
  // The single date to display per row (Stripe sub.created if subscribed,
  // else Supabase created_at when email was captured).
  display_date: string | null;
  // When the trial ended (or will end) in Stripe. Used by the time-window
  // filter so "became active" is bucketed by trial-end date, not sub.created.
  trial_ended_at: string | null;
  // When the Stripe subscription was created. Needed as the "became paid"
  // fallback for anti-abuse deny_repeat converts whose trial_end is null:
  // they were charged the moment the sub was created, so sub.created IS
  // their trial-to-paid moment. Signup date (display_date) is wrong here
  // because email capture can happen days earlier via marketing.
  stripe_sub_created_at: string | null;
  canceled_at: string | null;
  plan: string | null;
  // Source of the row — useful for the diagnostic banner. "stripe" means
  // we picked them up from a Stripe subscription; "supabase" means they
  // were captured at onboarding but never reached Stripe checkout.
  source: "stripe" | "supabase";
};

const WINDOWS: Record<string, { label: string; days: number | null }> = {
  "7": { label: "Last 7 days", days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
  "365": { label: "Last year", days: 365 },
  all: { label: "All time", days: null },
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  captured: { label: "captured", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  trial:    { label: "trial",    color: "#defa32", bg: "rgba(222,250,50,0.15)" },
  active:   { label: "active",   color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  canceled: { label: "canceled", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  churned:  { label: "churned",  color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

// Maps the underlying Stripe-derived sub status (which keeps the longer
// canceled_trial/canceled_membership names) to the user-facing label set.
function stripeToStatus(s: StripeSubInfo["status"]): Status {
  switch (s) {
    case "trial":               return "trial";
    case "active":              return "active";
    case "canceled_trial":      return "canceled";
    case "canceled_membership": return "churned";
  }
}

// Build the unified row set by UNIONing Stripe (source of truth for paid
// state) with Supabase signups (source of truth for paywall abandoners).
// Every email from either side becomes one row. If it exists on both,
// Stripe wins for status + display date.
function buildUnifiedRows(
  supabaseRows: Row[],
  stripeByEmail: Map<string, StripeSubInfo>,
): CategorizedRow[] {
  const supabaseByEmail = new Map<string, Row>();
  for (const r of supabaseRows) {
    const key = r.email.toLowerCase().trim();
    if (!supabaseByEmail.has(key)) supabaseByEmail.set(key, r);
  }

  const allEmails = new Set<string>();
  Array.from(supabaseByEmail.keys()).forEach((k) => allEmails.add(k));
  Array.from(stripeByEmail.keys()).forEach((k) => allEmails.add(k));

  const out: CategorizedRow[] = [];
  Array.from(allEmails).forEach((email) => {
    const stripe = stripeByEmail.get(email);
    const supa = supabaseByEmail.get(email);
    if (stripe) {
      // signup_date = earliest of (Supabase email-capture, Stripe sub.created).
      // Supabase wins when present because email-capture happens BEFORE the
      // paywall — so it's the truer "signed up" timestamp. Falling back to
      // Stripe sub.created handles users who hit Stripe checkout from the
      // old flow (pre-email-capture) where Supabase has no row.
      const supaCreated = supa?.created_at ?? null;
      const stripeCreated = stripe.subscriptionCreatedAt;
      const signupDate =
        supaCreated && supaCreated < stripeCreated ? supaCreated : stripeCreated;
      out.push({
        email: supa?.email ?? email,
        status: stripeToStatus(stripe.status),
        display_date: signupDate,
        trial_ended_at: stripe.trialEndedAt,
        stripe_sub_created_at: stripe.subscriptionCreatedAt,
        canceled_at: stripe.canceledAt,
        plan: stripe.plan,
        source: "stripe",
      });
    } else if (supa) {
      out.push({
        email: supa.email,
        status: "captured",
        display_date: supa.created_at,
        trial_ended_at: null,
        stripe_sub_created_at: null,
        canceled_at: null,
        plan: null,
        source: "supabase",
      });
    }
  });
  return out;
}

// Per-status "when the relevant event happened" date for the time-window
// filter. Reverted to event-based bucketing because cohort math made the
// Active/Canceled/Churned counts feel "off" — those metrics are most useful
// as "what happened in this window" (event view), not "where are this
// window's signups now" (cohort view). The Total Emails Collected metric
// up top is the cohort-style number (captured-in-window), so we keep both
// mental models — total = signups, cards = events.
function relevantDateFor(row: CategorizedRow): string | null {
  switch (row.status) {
    case "captured":
    case "trial":
      return row.display_date;
    case "active":
      // Fallback order:
      //   trial_ended_at → normal trial-to-paid path
      //   stripe_sub_created_at → anti-abuse deny_repeat converts (no trial;
      //     charged immediately on sub creation, so sub.created = "became paid")
      //   display_date → last resort (should never hit for stripe rows)
      return row.trial_ended_at ?? row.stripe_sub_created_at ?? row.display_date;
    case "canceled":
    case "churned":
      return row.canceled_at ?? row.display_date;
  }
}

type ViewKey = "funnel" | "acquisition" | "churn";

// ============================================================================
// Acquisition attribution
// ============================================================================

type AcquisitionRow = {
  email: string | null;
  source: string;
  detail: string | null;
  capturedAt: string | null;
  goal: string | null;
  signupPlatform: string | null;
  playFrequency: string | null;
  onboardingLevel: string | null;
  onboardingWeaknesses: string[] | null;
  onboardingTrainingSetup: string[] | null;
  onboardingDays: string[] | null;
};

type AcquisitionData = {
  rows: AcquisitionRow[];
  total: number;
  bySource: Array<[string, number]>;
  byGoal: Array<[string, number]>;
  byPlatform: Array<[string, number]>;
  byLevel: Array<[string, number]>;
  byFrequency: Array<[string, number]>;
  byWeaknesses: Array<[string, number]>;
  byTrainingSetup: Array<[string, number]>;
  loadError: string | null;
};

async function loadAcquisitionData(windowDays: number | null): Promise<AcquisitionData> {
  const empty: AcquisitionData = {
    rows: [],
    total: 0,
    bySource: [],
    byGoal: [],
    byPlatform: [],
    byLevel: [],
    byFrequency: [],
    byWeaknesses: [],
    byTrainingSetup: [],
    loadError: null,
  };
  try {
    const db = getFirebaseFirestore();
    const snap = await (windowDays !== null
      ? db
          .collection("users")
          .where("acquisitionCapturedAt", ">=", new Date(Date.now() - windowDays * 86_400_000))
          .orderBy("acquisitionCapturedAt", "desc")
          .limit(1000)
          .get()
      : db
          .collection("users")
          .where("acquisitionSource", "!=", null)
          .orderBy("acquisitionSource")
          .orderBy("acquisitionCapturedAt", "desc")
          .limit(1000)
          .get());
    const rows: AcquisitionRow[] = snap.docs.map((d) => {
      const data = d.data();
      const captured = (data.acquisitionCapturedAt as { toDate?: () => Date } | undefined)?.toDate?.();
      return {
        email: (data.email as string | null) ?? null,
        source: (data.acquisitionSource as string) ?? "(unknown)",
        detail: (data.acquisitionDetail as string | null) ?? null,
        capturedAt: captured ? captured.toISOString() : null,
        goal: (data.goal as string | null) ?? null,
        signupPlatform: (data.signupPlatform as string | null) ?? null,
        playFrequency: (data.playFrequency as string | null) ?? null,
        onboardingLevel: (data.onboardingLevel as string | null) ?? (data.skillLevel as string | null) ?? null,
        onboardingWeaknesses: Array.isArray(data.onboardingWeaknesses) ? (data.onboardingWeaknesses as string[]) : null,
        onboardingTrainingSetup: Array.isArray(data.onboardingTrainingSetup) ? (data.onboardingTrainingSetup as string[]) : null,
        onboardingDays: Array.isArray(data.onboardingDays) ? (data.onboardingDays as string[]) : null,
      };
    });

    const tally = (items: Array<string | null>): Array<[string, number]> => {
      const m = new Map<string, number>();
      for (const v of items) {
        const k = v ?? "(not answered)";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    };

    const bySourceMap = new Map<string, number>();
    for (const r of rows) bySourceMap.set(r.source, (bySourceMap.get(r.source) ?? 0) + 1);
    const bySource = Array.from(bySourceMap.entries()).sort((a, b) => b[1] - a[1]);

    // Flatten multi-select array fields into individual items for counting
    const allWeaknesses: Array<string | null> = [];
    const allTrainingSetup: Array<string | null> = [];
    for (const r of rows) {
      if (r.onboardingWeaknesses?.length) allWeaknesses.push(...r.onboardingWeaknesses);
      else allWeaknesses.push(null);
      if (r.onboardingTrainingSetup?.length) allTrainingSetup.push(...r.onboardingTrainingSetup);
      else allTrainingSetup.push(null);
    }

    return {
      rows,
      total: rows.length,
      bySource,
      byGoal: tally(rows.map((r) => r.goal)),
      byPlatform: tally(rows.map((r) => r.signupPlatform)),
      byLevel: tally(rows.map((r) => r.onboardingLevel)),
      byFrequency: tally(rows.map((r) => r.playFrequency)),
      byWeaknesses: tally(allWeaknesses),
      byTrainingSetup: tally(allTrainingSetup),
      loadError: null,
    };
  } catch (e) {
    return {
      ...empty,
      loadError: e instanceof Error ? e.message : "Failed to load acquisition data.",
    };
  }
}


// ============================================================================
// Churn view data (mirrors /admin/churn data)
// ============================================================================

type ChurnViewRow = {
  email: string | null;
  reason: string;
  comment: string | null;
  plan: string | null;
  createdAt: string | null;
  kind: "canceled" | "churned";
};

type ChurnViewData = {
  rows: ChurnViewRow[];
  canceled: ChurnViewRow[];
  churned: ChurnViewRow[];
  countByKind: { canceled: number; churned: number };
  sortedReasons: Array<[string, number]>;
  loadError: string | null;
};

async function loadChurnViewData(windowDays: number | null): Promise<ChurnViewData> {
  const empty: ChurnViewData = {
    rows: [],
    canceled: [],
    churned: [],
    countByKind: { canceled: 0, churned: 0 },
    sortedReasons: [],
    loadError: null,
  };
  try {
    const supabase = getSupabaseAdmin();
    const cutoffIso =
      windowDays !== null
        ? new Date(Date.now() - windowDays * 86_400_000).toISOString()
        : null;
    type MirrorSub = {
      email: string;
      canceled_at: string | null;
      trial_end: string | null;
      subscription_created_at: string;
      plan_label: string | null;
    };
    let cancelQuery = supabase
      .from("subscription_mirror")
      .select("email, canceled_at, trial_end, subscription_created_at, plan_label")
      .eq("status", "canceled")
      .order("canceled_at", { ascending: false })
      .limit(10_000);
    if (cutoffIso) cancelQuery = cancelQuery.gte("canceled_at", cutoffIso);
    const { data: cancels, error } = await cancelQuery;
    if (error) throw new Error(error.message);

    const db = getFirebaseFirestore();
    let reasonsQ = db
      .collection("cancellation_reasons")
      .orderBy("createdAt", "desc")
      .limit(2000);
    if (windowDays !== null) {
      const cutoff = new Date(Date.now() - windowDays * 86_400_000);
      reasonsQ = db
        .collection("cancellation_reasons")
        .where("createdAt", ">=", cutoff)
        .orderBy("createdAt", "desc")
        .limit(2000);
    }
    const reasonsSnap = await reasonsQ.get();
    const reasonByEmail = new Map<string, { reason: string; comment: string | null; plan: string | null }>();
    for (const d of reasonsSnap.docs) {
      const data = d.data();
      const email = (data.email as string | null)?.toLowerCase()?.trim();
      if (!email || reasonByEmail.has(email)) continue;
      reasonByEmail.set(email, {
        reason: (data.reason as string) ?? "(no reason given)",
        comment: (data.comment as string | null) ?? null,
        plan: (data.plan as string | null) ?? null,
      });
    }

    const rows: ChurnViewRow[] = (cancels as MirrorSub[] || []).map((sub) => {
      const email = (sub.email || "").toLowerCase().trim();
      const reason = reasonByEmail.get(email);
      const kind: "canceled" | "churned" = (() => {
        if (!sub.trial_end) return "churned";
        if (!sub.canceled_at) return "churned";
        return new Date(sub.canceled_at) <= new Date(sub.trial_end) ? "canceled" : "churned";
      })();
      return {
        email: sub.email,
        reason: reason?.reason ?? "(no reason given)",
        comment: reason?.comment ?? null,
        plan: reason?.plan ?? sub.plan_label ?? null,
        createdAt: sub.canceled_at,
        kind,
      };
    });

    const canceled = rows.filter((r) => r.kind === "canceled");
    const churned = rows.filter((r) => r.kind === "churned");
    const byReasonMap = new Map<string, number>();
    for (const r of rows) {
      if (r.reason === "(no reason given)") continue;
      byReasonMap.set(r.reason, (byReasonMap.get(r.reason) ?? 0) + 1);
    }
    const sortedReasons = Array.from(byReasonMap.entries()).sort((a, b) => b[1] - a[1]);
    return {
      rows,
      canceled,
      churned,
      countByKind: { canceled: canceled.length, churned: churned.length },
      sortedReasons,
      loadError: null,
    };
  } catch (e) {
    return {
      ...empty,
      loadError: e instanceof Error ? e.message : "Failed to load churn data.",
    };
  }
}

export default async function EmailAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const winKey = sp.window && WINDOWS[sp.window] ? sp.window : "30";
  const win = WINDOWS[winKey];
  // Live is intentionally not in the ViewKey union anymore — the old
  // /admin/email?view=live URL is silently redirected to Signups, which
  // now shows the same all-time state at the top of the page.
  const view: ViewKey =
    sp.view === "acquisition" ? "acquisition"
    : sp.view === "churn" ? "churn"
    : "funnel";

  let rows: Row[] = [];
  let loadError: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    // Paginate. Supabase's default max_rows = 1000 silently caps single
    // queries — even .limit(5000) returns only the first 1000 rows. .range()
    // is per-call so we loop until we hit a short page.
    const PAGE_SIZE = 1000;
    const MAX_ROWS = 50_000;
    let offset = 0;
    while (rows.length < MAX_ROWS) {
      const { data, error } = await supabase
        .from("trial_signups")
        .select("email, source, created_at, trial_start_at, unsubscribed_at, bounced_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...(data as Row[]));
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to read trial_signups.";
  }

  // Merge in abandoned_signups — Firestore docs written when a user typed
  // their email at onboarding but bailed before completing Firebase Auth.
  // Without this they'd never appear on the admin dashboard even though
  // the abandoned drip is still emailing them, and they'd be missing from
  // the CSV export.
  try {
    const db = getFirebaseFirestore();
    const snap = await db.collection("abandoned_signups").get();
    const existingEmails = new Set(rows.map((r) => r.email.toLowerCase().trim()));
    snap.docs.forEach((d) => {
      const data = d.data() as {
        email?: string;
        source?: string | null;
        capturedAt?: { toDate?: () => Date } | Date;
      };
      const email = (data.email ?? d.id).toLowerCase().trim();
      if (!email || existingEmails.has(email)) return;
      const raw = data.capturedAt as { toDate?: () => Date } | Date | undefined;
      const ts =
        raw && typeof (raw as { toDate?: () => Date }).toDate === "function"
          ? (raw as { toDate: () => Date }).toDate()
          : (raw as Date | undefined);
      rows.push({
        email,
        source: data.source ?? null,
        created_at: ts ? ts.toISOString() : null,
        trial_start_at: null,
        unsubscribed_at: null,
        bounced_at: null,
      });
      existingEmails.add(email);
    });
  } catch (err) {
    console.error("[admin/email] failed to read abandoned_signups", err);
  }

  const stripe = await fetchStripeStatusByEmail();
  const hiddenEmails = await loadHiddenEmails();
  const acquisitionData =
    view === "acquisition"
      ? await loadAcquisitionData(win.days)
      : null;
  const churnViewData =
    view === "churn"
      ? await loadChurnViewData(win.days)
      : null;

  // Past-exports history — only load for the funnel view since that's the
  // only place we render the CSV button + history panel. Newest first.
  type PastExport = {
    id: string;
    createdAt: string;
    filename: string;
    window: string;
    segment: string;
    emailCount: number;
    includePrevious: boolean;
  };
  const pastExports: PastExport[] = [];
  if (view === "funnel") {
    try {
      const db = getFirebaseFirestore();
      const snap = await db
        .collection("admin_email_exports")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      snap.docs.forEach((d) => {
        const data = d.data() as {
          createdAt?: { toDate?: () => Date } | Date;
          filename?: string;
          window?: string;
          segment?: string;
          emailCount?: number;
          includePrevious?: boolean;
        };
        const raw = data.createdAt as { toDate?: () => Date } | Date | undefined;
        const ts =
          raw && typeof (raw as { toDate?: () => Date }).toDate === "function"
            ? (raw as { toDate: () => Date }).toDate()
            : (raw as Date | undefined);
        pastExports.push({
          id: d.id,
          createdAt: ts ? ts.toISOString() : "",
          filename: data.filename ?? "export.csv",
          window: data.window ?? "?",
          segment: data.segment ?? "all",
          emailCount: data.emailCount ?? 0,
          includePrevious: !!data.includePrevious,
        });
      });
    } catch (err) {
      console.error("[admin/email] failed to load past exports", err);
    }
  }
  // Unfiltered set — used to compute "paid at start of window" for the
  // Stripe-style churn rate (which needs the denominator from BEFORE the
  // window, not just rows whose events landed in the window).
  const unifiedRows = buildUnifiedRows(rows, stripe.byEmail).filter(
    (r) => !hiddenEmails.has(r.email.toLowerCase().trim()),
  );
  let categorized = unifiedRows;

  // Filter by the per-status event date, so each bucket means "this status
  // change happened in the window":
  //   captured → captured in window
  //   trial    → started a trial in window
  //   active   → trial ended (became active) in window
  //   canceled → canceled during trial in window
  //   churned  → canceled paid subscription in window
  // Without this the 7-day filter shows 0 active because "active" requires
  // 7+ days from sub.created, so the sub.created date is always >7 days old.
  if (win.days !== null) {
    const cutoffIso = new Date(Date.now() - win.days * 86_400_000).toISOString();
    categorized = categorized.filter((r) => {
      const rel = relevantDateFor(r);
      return rel !== null && rel >= cutoffIso;
    });
  }
  // Sort by ORIGINAL signup date (display_date) so a user's row stays in
  // its captured slot even when their status flips (trial → active etc.).
  // Previous sort used relevantDateFor (the per-status event date), which
  // bumped users to the top whenever their status changed — confusing
  // because it made an old user look like a new signup the day their
  // trial ended.
  categorized.sort((a, b) => (b.display_date ?? "").localeCompare(a.display_date ?? ""));

  const counts: Record<Status, number> = {
    captured: 0, trial: 0, active: 0, canceled: 0, churned: 0,
  };
  for (const r of categorized) counts[r.status]++;

  // ── Live state totals (used only by the "Live" view tab) ────────────
  // Counted from unifiedRows (the unfiltered set) so they tie out
  // against Stripe's filtered views exactly. The funnel view keeps
  // window-scoped event counts because that's what funnel analysis
  // requires — mixing all-time active into a 30-day funnel is wrong.
  let liveActiveTotal = 0;
  let liveTrialTotal = 0;
  let liveCanceledTotal = 0; // canceled during trial, ever
  let liveChurnedTotal = 0;  // canceled after paying, ever
  let liveCapturedTotal = 0; // captured emails that never reached Stripe
  for (const r of unifiedRows) {
    if (r.status === "active") liveActiveTotal++;
    else if (r.status === "trial") liveTrialTotal++;
    else if (r.status === "canceled") liveCanceledTotal++;
    else if (r.status === "churned") liveChurnedTotal++;
    else if (r.status === "captured") liveCapturedTotal++;
  }
  const liveTotalEverPaid = liveActiveTotal + liveChurnedTotal;
  const liveAllTimeTrialStarters =
    liveTrialTotal + liveActiveTotal + liveCanceledTotal + liveChurnedTotal;
  const liveAllTimeSignups = liveCapturedTotal + liveAllTimeTrialStarters;

  // Funnel metrics. The trial-to-paid % below uses the WINDOW numbers
  // (counts.*) because conversion rate only makes sense per cohort —
  // mixing all-time active into the denominator would understate the
  // conversion rate for new signups.
  const totalSignups = categorized.length;
  const trialStarters = counts.trial + counts.active + counts.canceled + counts.churned;
  const paidCustomers = counts.active + counts.churned;

  // ── Cohort signups in window (independent of event filter) ────────────
  // counts the same emails Firebase counts — # of unique emails captured
  // in this window regardless of where they ended up in the funnel. This
  // is what powers the "Total Emails Collected · LAST 30 DAYS" header.
  // The 4 event cards below show what happened in the window, not a
  // breakdown of this number — the two are different views by design.
  const _cohortCutoff =
    win.days !== null ? new Date(Date.now() - win.days * 86_400_000).toISOString() : null;
  const cohortRows = _cohortCutoff
    ? unifiedRows.filter((r) => r.display_date != null && r.display_date >= _cohortCutoff)
    : unifiedRows;
  const signupsInWindow = cohortRows.length;
  const cohortTrialStartersInWindow = cohortRows.filter((r) => r.status !== "captured").length;

  // Paid-at-start-of-window count, used for Stripe-style churn. Must come
  // from `unifiedRows` (the pre-time-filter set), not `categorized` —
  // otherwise long-tenured active subscribers whose events fall outside
  // the window are excluded from the denominator and churn ends up
  // mathematically impossible (>100%).
  let paidAtStart = 0;
  if (win.days !== null) {
    const windowStartIso = new Date(Date.now() - win.days * 86_400_000).toISOString();
    for (const r of unifiedRows) {
      if (r.source !== "stripe") continue;
      // Same fallback order as relevantDateFor("active"): trial_end, then
      // sub.created (deny_repeat converts had no trial), then display_date.
      const becamePaidIso = r.trial_ended_at ?? r.stripe_sub_created_at ?? r.display_date;
      if (!becamePaidIso || becamePaidIso > windowStartIso) continue;
      if (r.canceled_at && r.canceled_at <= windowStartIso) continue;
      paidAtStart++;
    }
  }

  function fmtPct(num: number, den: number): string {
    if (den === 0) return "—";
    const v = (num / den) * 100;
    if (v >= 10) return `${Math.round(v)}%`;
    if (v >= 1) return `${v.toFixed(1)}%`;
    return `${v.toFixed(2)}%`;
  }

  // Churn rate is only meaningful as a monthly metric (Stripe-style). 7 days
  // of cancellations against a ~30-day paid base reads as artificially tiny;
  // 90/365/all-time dilutes the denominator the other way. We show the rate
  // ONLY on the 30-day tab. Other windows still show the count — just no
  // misleading rate next to it.
  const showChurnRate = winKey === "30";
  const rates: Record<Status, string> = {
    captured: fmtPct(counts.captured, totalSignups),
    trial:    "",
    active:   fmtPct(paidCustomers, trialStarters),
    canceled: fmtPct(counts.canceled, trialStarters),
    churned:  showChurnRate ? fmtPct(counts.churned, paidAtStart) : "",
  };
  const rateLabels: Record<Status, string> = {
    captured: "never started trial",
    trial:    "",
    active:   "trial → paid",
    canceled: "canceled during trial",
    churned:  showChurnRate ? "monthly churn rate" : "",
  };

  // Sanity check: does Stripe even know about any of these emails? If not,
  // surface a diagnostic banner so the user knows status is broken without
  // having to read Vercel logs. Matched = Stripe rows that survived the
  // window filter (i.e., status came from Stripe and we kept the row).
  const sampleSignupEmails = rows.slice(0, 5).map((r) => r.email.toLowerCase().trim());
  const matchedFromStripe = categorized.filter((r) => r.source === "stripe").length;

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-page)", paddingTop: "calc(var(--topbar-h, 108px) + 1rem)" }}>
      <div className="container-xl py-10 max-w-6xl mx-auto">
        <AdminNav />

        {/* Header row — title left, sync icon right. Everything the user
            needs to orient is in one line: page name + when-refreshed action. */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Email
          </h1>
          <SyncFromStripeButton />
        </div>

        {/* View toggle */}
        <div
          className="inline-flex p-1 rounded-xl mb-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--flip-card-border)",
          }}
        >
          {([
            { key: "funnel",      label: "Signups" },
            { key: "acquisition", label: "Acquisition" },
            { key: "churn",       label: "Churn" },
          ] as const).map((v) => {
            const isActive = view === v.key;
            const href =
              v.key === "funnel"
                ? `/admin/email?window=${winKey}`
                : `/admin/email?view=${v.key}&window=${winKey}`;
            return (
              <Link
                key={v.key}
                href={href}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  background: isActive ? "var(--text-primary)" : "transparent",
                  color: isActive ? "var(--bg-page)" : "var(--text-muted)",
                }}
              >
                {v.label}
              </Link>
            );
          })}
        </div>

        {/* Time window selector — only shows on Win-backs / Landing, which
            are entirely window-scoped. On Signups it's rendered inline below,
            right above the "This period" section, so it's clear that the
            "Right now" block above is unaffected by the window choice. */}
        {view !== "funnel" && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {Object.entries(WINDOWS).map(([key, w]) => {
              const active = key === winKey;
              const href = `/admin/email?view=${view}&window=${key}`;
              return (
                <Link
                  key={key}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    active ? "bg-accent-500 text-black" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    background: active ? undefined : "var(--flip-bg-card)",
                    border: "1px solid var(--flip-card-border)",
                  }}
                >
                  {w.label}
                </Link>
              );
            })}
          </div>
        )}

        {loadError && (
          <Banner kind="error">{loadError}</Banner>
        )}

        {/* Stripe diagnostic — only surfaces when something looks wrong. */}
        <StripeDiagnostic
          stripe={stripe}
          totalRows={rows.length}
          matched={matchedFromStripe}
          sampleSignupEmails={sampleSignupEmails}
        />

        {view === "acquisition" && acquisitionData ? (
          <AcquisitionView data={acquisitionData} />
        ) : view === "churn" && churnViewData ? (
          <ChurnView data={churnViewData} />
        ) : (
          <>
            {/* ── RIGHT NOW ─────────────────────────────────────────
                Live state snapshot — matches Stripe's Subscriptions
                tab. Independent of the window selector below. */}
            <LiveTotalsView
              activeNow={liveActiveTotal}
              trialNow={liveTrialTotal}
              ever={{
                paid: liveTotalEverPaid,
                trialStarters: liveAllTimeTrialStarters,
                signups: liveAllTimeSignups,
                canceledDuringTrial: liveCanceledTotal,
                churnedAfterPaid: liveChurnedTotal,
              }}
            />

            {/* ── THIS PERIOD ───────────────────────────────────────
                Everything below is window-scoped: what happened to
                signups collected inside the selected time window. */}
            <div className="flex items-center justify-between gap-4 mt-10 mb-3 flex-wrap">
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                This period
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(WINDOWS).map(([key, w]) => {
                  const active = key === winKey;
                  return (
                    <Link
                      key={key}
                      href={`/admin/email?window=${key}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        active ? "bg-accent-500 text-black" : "text-gray-400 hover:text-white"
                      }`}
                      style={{
                        background: active ? undefined : "var(--flip-bg-card)",
                        border: "1px solid var(--flip-card-border)",
                      }}
                    >
                      {w.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* 4 window-scoped flow cards. Trial (a state, not a flow)
                was removed — currently-in-trial lives in the Right Now
                row above. Active → "Trial → Paid" because on the funnel
                it represents cohort conversion, not current headcount. */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatCard
                icon={<Mail />}
                iconColor="#60a5fa"
                label="Captured"
                value={signupsInWindow}
                hero
              />
              <StatCard icon={<UserCheck />}  iconColor="#22c55e" label="Trial → Paid" value={counts.active}   rate={rates.active}   rateLabel={rateLabels.active} />
              <StatCard icon={<UserX />}      iconColor="#f59e0b" label="Canceled"     value={`${counts.canceled} / ${trialStarters}`} rate={rates.canceled} rateLabel={rateLabels.canceled} />
              <StatCard icon={<UserX />}      iconColor="#ef4444" label="Churned"      value={counts.churned}  rate={rates.churned}  rateLabel={rateLabels.churned} />
            </div>

            {/* Trial start rate — captured → trial conversion, cohort-based */}
            <div
              className="rounded-2xl px-6 py-5 mb-6 flex items-center justify-between gap-4 flex-wrap"
              style={{
                background: "linear-gradient(90deg, rgba(96,165,250,0.10), rgba(96,165,250,0.02))",
                border: "1px solid rgba(96,165,250,0.30)",
              }}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#60a5fa" }}>
                  Captured → Trial Start Rate
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Of {signupsInWindow} people who gave their email, {cohortTrialStartersInWindow} started a trial
                  {signupsInWindow > 0 && ` · ${signupsInWindow - cohortTrialStartersInWindow} never started`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold tabular-nums" style={{ color: "#60a5fa" }}>
                  {fmtPct(cohortTrialStartersInWindow, signupsInWindow)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Combined list — only on funnel view. Live view focuses on totals. */}
        {view === "funnel" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
          <div className="flex items-center justify-between gap-4 px-5 py-4" style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
            <h2 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
              All signups <span className="font-medium" style={{ color: "var(--text-muted)" }}>({categorized.length})</span>
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={`/api/admin/email/export?window=${winKey}&includePrevious=true`}
                className="text-[11px] font-semibold transition hover:underline"
                style={{ color: "var(--text-muted)" }}
                title="Include everyone in the window, even if they've been exported before"
              >
                Include all
              </a>
              <a
                href={`/api/admin/email/export?window=${winKey}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg transition active:scale-[0.98]"
                style={{ background: "var(--btn-buy-bg)", color: "var(--btn-buy-text)" }}
                title="New emails only — skips anyone already in a past export"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </a>
            </div>
          </div>

          {categorized.length === 0 ? (
            <p className="px-4 py-6 text-sm" style={{ color: "var(--text-muted)" }}>
              No signups in this window.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Email</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Signed up</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Status</th>
                  <th className="px-4 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {categorized.map((r) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <tr key={r.email} style={{ borderTop: "1px solid var(--flip-card-border)" }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{r.email}</td>
                      <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        <LocalDateTime iso={r.display_date} />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className="inline-block px-2 py-0.5 rounded font-bold uppercase tracking-wide"
                          style={{ background: meta.bg, color: meta.color, fontSize: 10, letterSpacing: 0.5 }}
                        >
                          {meta.label}
                        </span>
                        {r.canceled_at && (
                          <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                            <LocalDateTime iso={r.canceled_at} />
                          </span>
                        )}
                        {r.plan && (
                          <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                            · {r.plan}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DeleteRowButton email={r.email} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        )}

        {view === "funnel" && rows.length === 2000 && (
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Showing 2000 most-recent rows. Widen the window or download CSV for the full list.
          </p>
        )}

        {view === "funnel" && (
          <details
            className="rounded-2xl overflow-hidden mt-6 group"
            style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
          >
            <summary
              className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none"
              style={{ borderBottom: "1px solid transparent" }}
            >
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>
                  Past exports
                </h2>
                <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                  ({pastExports.length})
                </span>
              </div>
              <span className="text-[11px] font-semibold group-open:hidden" style={{ color: "var(--text-muted)" }}>
                Show
              </span>
              <span className="text-[11px] font-semibold hidden group-open:inline" style={{ color: "var(--text-muted)" }}>
                Hide
              </span>
            </summary>
            {pastExports.length === 0 ? (
              <p className="px-5 py-6 text-sm" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--flip-card-border)" }}>
                No exports yet. Your first CSV download will appear here.
              </p>
            ) : (
              <table className="w-full text-sm" style={{ borderTop: "1px solid var(--flip-card-border)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Date</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Window</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Segment</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Emails</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Mode</th>
                    <th className="px-4 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {pastExports.map((e) => (
                    <tr key={e.id} style={{ borderTop: "1px solid var(--flip-card-border)" }}>
                      <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-primary)" }}>
                        <LocalDateTime iso={e.createdAt} />
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {e.window === "all" ? "All time" : `${e.window}d`}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {e.segment}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-right" style={{ color: "var(--text-primary)" }}>
                        {e.emailCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[10px] uppercase tracking-wider">
                        <span
                          className="inline-block px-2 py-0.5 rounded font-bold"
                          style={{
                            background: e.includePrevious ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
                            color: e.includePrevious ? "#f59e0b" : "#22c55e",
                            letterSpacing: 0.5,
                          }}
                        >
                          {e.includePrevious ? "all" : "new only"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/api/admin/email/export?id=${e.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold"
                          style={{ color: "var(--text-primary)" }}
                          title="Re-download the exact same emails from this export"
                        >
                          <Download className="w-3 h-3" />
                          Re-download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </details>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Totals view — current state across all time (matches Stripe directly).
// Two-tier layout: hero row with the two numbers founders most want to see
// (active subs + trial), secondary mini-stat row with lifetime funnel context,
// then a visual funnel bar showing the lifetime conversion path.
// ─────────────────────────────────────────────────────────────────────────────
function LiveTotalsView({
  activeNow,
  trialNow,
  ever,
}: {
  activeNow: number;
  trialNow: number;
  ever: {
    paid: number;
    trialStarters: number;
    signups: number;
    canceledDuringTrial: number;
    churnedAfterPaid: number;
  };
}) {
  const trialToPaidLifetime =
    ever.trialStarters > 0 ? Math.round((ever.paid / ever.trialStarters) * 100) : 0;
  const trialStartedRate =
    ever.signups > 0 ? Math.round((ever.trialStarters / ever.signups) * 100) : 0;
  const lifetimeChurn =
    ever.paid > 0 ? Math.round((ever.churnedAfterPaid / ever.paid) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HeroStat
          label="Active subscribers"
          value={activeNow}
          accent="#22c55e"
          tagline="Live from Stripe · ties out against your Subscriptions tab"
        />
        <HeroStat
          label="In free trial"
          value={trialNow}
          accent="#defa32"
          tagline="Currently inside their 7-day Stripe trial"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MiniStat
          label="Emails captured (all-time)"
          value={ever.signups}
          sub={`${trialStartedRate}% started a trial`}
        />
        <MiniStat
          label="Trial → paid (lifetime)"
          value={`${trialToPaidLifetime}%`}
          sub={`${ever.paid.toLocaleString()} of ${ever.trialStarters.toLocaleString()} trial starters paid`}
        />
        <MiniStat
          label="Lifetime churn"
          value={`${lifetimeChurn}%`}
          sub={`${ever.churnedAfterPaid.toLocaleString()} churned of ${ever.paid.toLocaleString()} who ever paid`}
        />
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(180deg, rgba(96,165,250,0.05) 0%, transparent 100%)",
          border: "1px solid var(--flip-card-border)",
        }}
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Lifetime funnel
          </h2>
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#22c55e" }}>
            All-time · matches Stripe
          </span>
        </div>
        <FunnelBar
          segments={[
            { label: "Captured",  value: ever.signups,       color: "#60a5fa" },
            { label: "Trial",     value: ever.trialStarters, color: "#defa32" },
            { label: "Paid ever", value: ever.paid,          color: "#22c55e" },
            { label: "Active",    value: activeNow,          color: "#3b82f6" },
          ]}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Acquisition view
// ============================================================================

function AcquisitionView({ data }: { data: AcquisitionData }) {
  const perUserRows = [...data.rows]
    .sort((a, b) => (b.capturedAt ?? "").localeCompare(a.capturedAt ?? ""))
    .slice(0, 200);

  function BreakdownBar({ title, items, color }: { title: string; items: Array<[string, number]>; color: string }) {
    const filtered = items.filter(([k]) => k !== "(not answered)");
    const answeredTotal = filtered.reduce((s, [, n]) => s + n, 0);
    const barMax = filtered[0]?.[1] ?? 1;
    return (
      <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
        <div className="flex items-baseline justify-between mb-4 gap-2">
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{title}</h3>
          <span className="text-xs tabular-nums font-bold" style={{ color: "var(--text-primary)" }}>{answeredTotal} of {data.total}</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm py-3 text-center" style={{ color: "var(--text-muted)" }}>No data yet</p>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(([label, count]) => {
              const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
              const bar = Math.round((count / barMax) * 100);
              return (
                <div key={label}>
                  <div className="flex items-baseline justify-between mb-1 gap-2">
                    <span className="text-xs font-medium truncate capitalize" style={{ color: "var(--text-primary)" }} title={label}>{label}</span>
                    <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: "var(--text-muted)" }}>{count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full" style={{ width: `${bar}%`, background: `linear-gradient(90deg, ${color}, ${color}88)`, boxShadow: `0 0 8px ${color}40` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.loadError && (
        <div className="rounded-2xl px-5 py-4 text-sm flex items-start gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>{data.loadError}</div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BreakdownBar title="Channel (how they found us)" items={data.bySource} color="#60a5fa" />
        <BreakdownBar title="Goal (what they want to improve)" items={data.byGoal} color="#3cacae" />
        <BreakdownBar title="Platform" items={data.byPlatform} color="#a78bfa" />
        <BreakdownBar title="Skill level" items={data.byLevel} color="#f59e0b" />
        <BreakdownBar title="Play frequency" items={data.byFrequency} color="#22c55e" />
        <BreakdownBar title="Training setup" items={data.byTrainingSetup} color="#f472b6" />
      </div>
      <BreakdownBar title="Areas to improve (weaknesses)" items={data.byWeaknesses} color="#ef4444" />
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
        <div className="flex items-center justify-between gap-4 px-5 py-4" style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
          <h2 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>Recent signups ({perUserRows.length})</h2>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Newest first</span>
        </div>
        {perUserRows.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: "var(--text-muted)" }}>No signups with onboarding data in this window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Email</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Platform</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Channel</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Goal</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Level</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Frequency</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {perUserRows.map((r, i) => {
                  const pk = r.signupPlatform ?? "unknown";
                  const pc = PLATFORM_COLORS[pk] ?? "#94a3b8";
                  const pl = PLATFORM_LABELS[pk] ?? pk;
                  return (
                    <tr key={i} style={{ borderTop: "1px solid var(--flip-card-border)" }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{r.email ?? "—"}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="inline-block px-2 py-0.5 rounded font-bold" style={{ background: `${pc}20`, color: pc, fontSize: 10, letterSpacing: 0.5 }}>{pl}</span>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize" style={{ color: "var(--text-primary)" }}>
                        {r.source}{r.detail && <span className="ml-1" style={{ color: "var(--text-muted)" }}>· {r.detail}</span>}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{r.goal ?? "—"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{r.onboardingLevel ?? "—"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{r.playFrequency ?? "—"}</td>
                      <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{r.capturedAt ? new Date(r.capturedAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
function HeroStat({
  label, value, accent, tagline,
}: {
  label: string;
  value: number;
  accent: string;
  tagline: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent}14 0%, transparent 60%), var(--flip-bg-card)`,
        border: `1px solid ${accent}40`,
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accent }} />
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-5xl md:text-6xl font-extrabold tabular-nums leading-none mb-3" style={{ color: "var(--text-primary)" }}>
        {value.toLocaleString()}
      </p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{tagline}</p>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-extrabold tabular-nums mb-1.5" style={{ color: "var(--text-primary)" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{sub}</p>
    </div>
  );
}

function FunnelBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...segments.map((s) => s.value), 1);
  return (
    <div className="space-y-3">
      {segments.map((s, i) => {
        const widthPct = Math.max((s.value / max) * 100, 4);
        const prev = i > 0 ? segments[i - 1].value : null;
        const conv = prev != null && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        return (
          <div key={s.label} className="flex items-center gap-4">
            <div className="w-28 flex-shrink-0">
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{s.label}</p>
              {conv != null && (
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{conv}% from prev</p>
              )}
            </div>
            <div className="flex-1 relative">
              <div
                className="h-9 rounded-lg transition-all"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${s.color}cc 0%, ${s.color}66 100%)`,
                  border: `1px solid ${s.color}`,
                  boxShadow: `0 0 24px ${s.color}33`,
                }}
              />
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {s.value.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  icon, iconColor, label, value, rate, rateLabel, hero,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: number | string;
  rate?: string;
  rateLabel?: string;
  hero?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 transition"
      style={{
        background: hero
          ? `linear-gradient(180deg, ${iconColor}18, ${iconColor}04)`
          : "var(--flip-bg-card)",
        border: `1px solid ${hero ? `${iconColor}40` : "var(--flip-card-border)"}`,
        boxShadow: hero ? `0 8px 24px -12px ${iconColor}30` : undefined,
      }}
    >
      <div style={{ color: iconColor }} className="mb-2 [&>svg]:w-4 [&>svg]:h-4">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className={`${hero ? "text-4xl" : "text-3xl"} font-extrabold tabular-nums`} style={{ color: "var(--text-primary)" }}>{value}</p>
      {(rate || rateLabel) && (
        <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
          {rate && (
            <span className="text-base font-bold tabular-nums" style={{ color: iconColor }}>{rate}</span>
          )}
          {rateLabel && (
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {rateLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
  macos: "macOS",
  unknown: "Unknown",
};

const PLATFORM_COLORS: Record<string, string> = {
  web: "#60a5fa",
  ios: "#a78bfa",
  android: "#34d399",
  macos: "#f59e0b",
  unknown: "#94a3b8",
};

// ============================================================================
// Churn view
// ============================================================================

function ChurnReasonsBar({
  title,
  subtitle,
  color,
  rows,
  emptyMessage,
  highlight,
}: {
  title: string;
  subtitle: string;
  color: string;
  rows: ChurnViewRow[];
  emptyMessage: string;
  highlight?: boolean;
}) {
  const withReason = rows.filter((r) => r.reason !== "(no reason given)");
  const total = withReason.length;
  const byReason = new Map<string, number>();
  for (const r of withReason) byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
  const sorted = Array.from(byReason.entries()).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <div
      className="rounded-2xl p-6 h-full"
      style={{
        background: highlight
          ? `linear-gradient(180deg, ${color}10, ${color}03)`
          : "linear-gradient(180deg, var(--flip-bg-card), rgba(0,0,0,0.05))",
        border: `1px solid ${highlight ? `${color}40` : "var(--flip-card-border)"}`,
        boxShadow: highlight ? `0 8px 24px -8px ${color}25` : "0 4px 16px -4px rgba(0,0,0,0.15)",
      }}
    >
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <span className="text-xs tabular-nums font-bold" style={{ color }}>{total}</span>
      </div>
      <p className="text-[11px] mb-5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      {sorted.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(([reason, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const bar = Math.round((count / max) * 100);
            return (
              <div key={reason}>
                <div className="flex items-baseline justify-between mb-1.5 gap-2">
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }} title={reason}>
                    {reason}
                  </span>
                  <span className="text-xs tabular-nums font-medium flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {count} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${bar}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                      boxShadow: `0 0 10px ${color}40`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChurnView({ data }: { data: ChurnViewData }) {
  const commented = data.rows.filter((r) => r.comment && r.comment.trim().length > 0);
  const topReason = data.sortedReasons[0];

  return (
    <div className="space-y-6">
      {data.loadError && (
        <div
          className="rounded-2xl px-5 py-4 text-sm flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>{data.loadError}</div>
        </div>
      )}

      {/* Hero stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 mb-3"
               style={{ background: "rgba(148,163,184,0.15)", color: "#94a3b8" }}>
            <TrendingDown />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
            Total cancellations
          </p>
          <p className="text-4xl font-extrabold tabular-nums leading-none mb-2" style={{ color: "var(--text-primary)" }}>
            {data.rows.length}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {commented.length} included a comment
          </p>
        </div>
        <div
          className="rounded-2xl p-6"
          style={{
            background: "linear-gradient(160deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
            border: "1px solid rgba(245,158,11,0.35)",
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 mb-3"
               style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
            <Clock />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
            Canceled during trial
          </p>
          <p className="text-4xl font-extrabold tabular-nums leading-none mb-2" style={{ color: "#f59e0b" }}>
            {data.countByKind.canceled}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Never paid — pre-paywall objections</p>
        </div>
        <div
          className="rounded-2xl p-6"
          style={{
            background: "linear-gradient(160deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
            border: "1px solid rgba(239,68,68,0.35)",
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 mb-3"
               style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
            <TrendingDown />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
            Churned (paid then left)
          </p>
          <p className="text-4xl font-extrabold tabular-nums leading-none mb-2" style={{ color: "#ef4444" }}>
            {data.countByKind.churned}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Lost MRR — retention problem</p>
        </div>
      </div>

      {topReason && (
        <div
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--flip-card-border)",
            color: "var(--text-muted)",
          }}
        >
          Top reason:{" "}
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{topReason[0]}</span>
          <span className="opacity-60">· {topReason[1]} of {data.rows.filter(r => r.reason !== "(no reason given)").length}</span>
        </div>
      )}

      {/* Reasons charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChurnReasonsBar
          title="Why they canceled (trial)"
          subtitle="Pre-paywall objections · never paid"
          color="#f59e0b"
          rows={data.canceled}
          emptyMessage="No trial cancellations in this window."
        />
        <ChurnReasonsBar
          title="Why they churned (paid)"
          subtitle="Lost MRR · most actionable for pricing & product"
          color="#ef4444"
          rows={data.churned}
          emptyMessage="No churned subscribers in this window."
          highlight
        />
      </div>

      {/* Recent cancellations list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
      >
        <div
          className="flex items-center justify-between gap-4 px-5 py-4"
          style={{ borderBottom: "1px solid var(--flip-card-border)" }}
        >
          <h2 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
            Recent cancellations ({data.rows.length})
          </h2>
          <a
            href={`/api/admin/churn/export`}
            className="inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg"
            style={{ background: "var(--btn-buy-bg)", color: "var(--btn-buy-text)" }}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
        {data.rows.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: "var(--text-muted)" }}>
            No cancellations in this window.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Email</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Kind</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Reason</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Comment</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 200).map((r, i) => {
                const kindMeta =
                  r.kind === "canceled"
                    ? { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "CANCELED" }
                    : { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "CHURNED" };
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--flip-card-border)" }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {r.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className="inline-block px-2 py-0.5 rounded font-bold"
                        style={{ background: kindMeta.bg, color: kindMeta.color, fontSize: 10, letterSpacing: 0.5 }}
                      >
                        {kindMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-primary)" }}>
                      {r.reason !== "(no reason given)" ? r.reason : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "var(--text-muted)" }}
                        title={r.comment ?? undefined}>
                      {r.comment ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Banner({ kind, children }: { kind: "error" | "warn"; children: React.ReactNode }) {
  const styles =
    kind === "error"
      ? { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.35)", color: "#ef4444" }
      : { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.35)", color: "#f59e0b" };
  return (
    <div
      className="rounded-2xl px-5 py-4 mb-6 text-sm flex items-start gap-3"
      style={{ background: styles.bg, border: `1px solid ${styles.border}`, color: styles.color }}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function StripeDiagnostic({
  stripe, totalRows, matched, sampleSignupEmails,
}: {
  stripe: Awaited<ReturnType<typeof fetchStripeStatusByEmail>>;
  totalRows: number;
  matched: number;
  sampleSignupEmails: string[];
}) {
  // Don't surface a warning when everything is fine OR there are no signups
  // to match yet. Only flag when there's clearly a config issue.
  if (totalRows === 0) return null;
  const looksHealthy = stripe.keyResolved && stripe.scanned > 0 && (matched > 0 || totalRows === 0);
  if (looksHealthy) return null;

  return (
    <Banner kind="warn">
      <div className="font-bold mb-2">Stripe lookup returned no matches — every row will show as "Captured".</div>
      <ul className="text-xs space-y-1 mb-2" style={{ color: "var(--text-primary)" }}>
        <li>Key resolved: <strong>{stripe.keyResolved ? "yes" : "no"}</strong> · mode: <strong>{stripe.keyMode}</strong></li>
        <li>Subscriptions scanned: <strong>{stripe.scanned}</strong> · with email: <strong>{stripe.withEmail}</strong></li>
        <li>Matched to signups: <strong>{matched}</strong> of {totalRows}</li>
        {stripe.error && <li>Error: <code>{stripe.error}</code></li>}
        {stripe.sampleStripeEmails.length > 0 && (
          <li>Sample Stripe emails: <code>{stripe.sampleStripeEmails.join(", ")}</code></li>
        )}
        {sampleSignupEmails.length > 0 && (
          <li>Sample signup emails: <code>{sampleSignupEmails.join(", ")}</code></li>
        )}
      </ul>
      <div className="text-xs" style={{ color: "var(--text-primary)" }}>
        Most common causes: (1) <code>STRIPE_SECRET_KEY</code> on Vercel points to a different Stripe
        account than the one your Drills app charges, (2) test/live mode mismatch, (3) Connect
        account where customers live under a connected account ID.
      </div>
    </Banner>
  );
}
