import Link from "next/link";
import { Download, Users, Zap, UserCheck, UserX, AlertTriangle, Heart, RefreshCw, Mail } from "lucide-react";
import { AdminNav } from "../_components/AdminNav";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { fetchStripeStatusByEmail, type StripeSubInfo } from "@/lib/stripeSubscriptionStatus";
import LocalDateTime from "./LocalDateTime";
import DeleteRowButton from "./DeleteRowButton";

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
      return row.trial_ended_at ?? row.display_date;
    case "canceled":
    case "churned":
      return row.canceled_at ?? row.display_date;
  }
}

type ViewKey = "funnel" | "live" | "winbacks";

// ============================================================================
// Win-back analytics
// ============================================================================

type WinbackEntry = {
  email: string;
  canceledAt: string;       // ISO
  wonBackAt: string;        // ISO
  daysToWinBack: number;
  attributedStep: number | null;     // last drip step before resubscribe
  attributedTag: string | null;
  attributedSentAt: string | null;   // ISO
};

type ChurnStepStat = {
  step: number;
  label: string;
  // # of unique recipients who got this step's email (sent: true).
  recipients: number;
  // # of those recipients who came back and had this step as their LAST
  // received email before resubscribing → credit to this step.
  attributedWinbacks: number;
};

type ChurnWinbackData = {
  winbacks: WinbackEntry[];
  perStep: ChurnStepStat[];
  totalWinbacks: number;
  organicWinbacks: number;     // came back without any drip email attribution
  totalRecipients: number;     // unique emails who got at least one churn email
};

const CHURN_STEP_LABELS: Record<number, string> = {
  1: "Step 1 · Quick question (1hr)",
  2: "Step 2 · 50% off (14d)",
  3: "Step 3 · Last chance (45d)",
};

/**
 * Combines Firestore churn_signups + churn_email_log + live Stripe state
 * to figure out:
 *   - Who got won back (anyone in churn_signups whose email currently has
 *     an active/trialing Stripe sub created AFTER their original cancel)
 *   - Which email gets credit (most recent sent email before the comeback)
 *
 * Catches both drip-detected winbacks (completedReason: "resubscribed")
 * AND organic ones (came back later, after drip moved on).
 */
async function loadChurnWinbackData(
  stripeByEmail: Map<string, StripeSubInfo>,
): Promise<ChurnWinbackData> {
  const db = getFirebaseFirestore();

  // 1. Pull all successful churn email log entries.
  type LogEntry = { email: string; step: number; sentAt: Date; tag: string };
  const logs: LogEntry[] = [];
  try {
    const snap = await db.collection("churn_email_log").where("sent", "==", true).get();
    snap.docs.forEach((d) => {
      const data = d.data() as {
        email?: string;
        step?: number;
        sentAt?: { toDate?: () => Date };
        tag?: string;
      };
      const email = data.email?.toLowerCase().trim();
      const sentAt = data.sentAt?.toDate?.();
      if (!email || !sentAt || typeof data.step !== "number") return;
      logs.push({ email, step: data.step, sentAt, tag: data.tag ?? "" });
    });
  } catch {
    // Firestore unavailable — return empty state rather than erroring page.
  }

  // 2. Pull churn_signups (cancellation records).
  type SignupRec = { email: string; canceledAt: Date };
  const signupsByEmail = new Map<string, SignupRec>();
  try {
    const snap = await db.collection("churn_signups").get();
    snap.docs.forEach((d) => {
      const data = d.data() as {
        email?: string;
        canceledAt?: { toDate?: () => Date };
      };
      const email = data.email?.toLowerCase().trim();
      const canceledAt = data.canceledAt?.toDate?.();
      if (!email || !canceledAt) return;
      signupsByEmail.set(email, { email, canceledAt });
    });
  } catch {
    // Empty — fine.
  }

  // 3. Find winbacks: anyone in churn_signups whose email currently has an
  //    active/trialing Stripe sub created AFTER their cancellation.
  const winbacks: WinbackEntry[] = [];
  signupsByEmail.forEach((signup, email) => {
    const stripeNow = stripeByEmail.get(email);
    if (!stripeNow) return;
    if (stripeNow.status !== "active" && stripeNow.status !== "trial") return;

    const wonBackAt = new Date(stripeNow.subscriptionCreatedAt);
    if (isNaN(wonBackAt.getTime())) return;
    if (wonBackAt <= signup.canceledAt) return; // existing sub, not a comeback

    // Find the most recent email this person got BEFORE coming back.
    const priorLogs = logs
      .filter((l) => l.email === email && l.sentAt <= wonBackAt)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    const lastLog = priorLogs[0];

    const daysToWinBack = Math.max(
      0,
      Math.floor((wonBackAt.getTime() - signup.canceledAt.getTime()) / 86_400_000),
    );

    winbacks.push({
      email,
      canceledAt: signup.canceledAt.toISOString(),
      wonBackAt: wonBackAt.toISOString(),
      daysToWinBack,
      attributedStep: lastLog?.step ?? null,
      attributedTag: lastLog?.tag ?? null,
      attributedSentAt: lastLog?.sentAt.toISOString() ?? null,
    });
  });

  // 4. Per-step aggregates.
  const perStepMap: Record<number, { recipients: Set<string>; winbacks: number }> = {
    1: { recipients: new Set(), winbacks: 0 },
    2: { recipients: new Set(), winbacks: 0 },
    3: { recipients: new Set(), winbacks: 0 },
  };
  for (const log of logs) {
    if (perStepMap[log.step]) perStepMap[log.step].recipients.add(log.email);
  }
  for (const wb of winbacks) {
    if (wb.attributedStep && perStepMap[wb.attributedStep]) {
      perStepMap[wb.attributedStep].winbacks++;
    }
  }
  const perStep: ChurnStepStat[] = [1, 2, 3].map((step) => ({
    step,
    label: CHURN_STEP_LABELS[step],
    recipients: perStepMap[step].recipients.size,
    attributedWinbacks: perStepMap[step].winbacks,
  }));

  const totalRecipients = new Set(logs.map((l) => l.email)).size;
  const organicWinbacks = winbacks.filter((w) => w.attributedStep === null).length;

  // Newest comeback first.
  winbacks.sort((a, b) => b.wonBackAt.localeCompare(a.wonBackAt));

  return {
    winbacks,
    perStep,
    totalWinbacks: winbacks.length,
    organicWinbacks,
    totalRecipients,
  };
}

export default async function EmailAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const winKey = sp.window && WINDOWS[sp.window] ? sp.window : "30";
  const win = WINDOWS[winKey];
  const view: ViewKey =
    sp.view === "live" ? "live" : sp.view === "winbacks" ? "winbacks" : "funnel";

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

  const stripe = await fetchStripeStatusByEmail();
  const hiddenEmails = await loadHiddenEmails();
  // Load winback data unconditionally — it powers the tab badge AND the
  // view content. Two Firestore queries (~50ms total at our volumes).
  const winbackData = await loadChurnWinbackData(stripe.byEmail);
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
  let signupsInWindow = unifiedRows.length;
  if (win.days !== null) {
    const cohortCutoffIso = new Date(Date.now() - win.days * 86_400_000).toISOString();
    signupsInWindow = unifiedRows.filter(
      (r) => r.display_date != null && r.display_date >= cohortCutoffIso,
    ).length;
  }

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
      const becamePaidIso = r.trial_ended_at ?? r.display_date;
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

        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
          Admin · Email
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
          Onboarding signups
        </h1>
        <p className="text-sm md:text-base mb-6" style={{ color: "var(--text-muted)" }}>
          Status is pulled live from Stripe (the source of truth for what happened after
          someone hit the paywall).
        </p>

        {/* View toggle — Funnel (window-scoped events) vs Live (current totals from Stripe) */}
        <div
          className="inline-flex p-1 rounded-xl mb-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--flip-card-border)",
          }}
        >
          {([
            { key: "funnel",   label: "Funnel · this period" },
            { key: "live",     label: "Live totals · all time" },
            { key: "winbacks", label: "Win-backs · churn drip" },
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

        {view === "funnel" && (
          <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-primary)" }}>The funnel:</strong>{" "}
            <span style={{ color: "#60a5fa" }}>Captured</span> (gave email) →{" "}
            <span style={{ color: "#defa32" }}>Trial</span> (in 7-day free trial) →{" "}
            <span style={{ color: "#22c55e" }}>Active</span> (paying) /{" "}
            <span style={{ color: "#f59e0b" }}>Canceled</span> (quit mid-trial) /{" "}
            <span style={{ color: "#ef4444" }}>Churned</span> (paid then canceled).
          </p>
        )}

        {/* Time window — only relevant on the funnel view */}
        {view === "funnel" && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {Object.entries(WINDOWS).map(([key, w]) => {
              const active = key === winKey;
              return (
                <Link
                  key={key}
                  href={`/admin/email?window=${key}`}
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

        {view === "live" ? (
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
        ) : view === "winbacks" ? (
          <WinBacksView data={winbackData} />
        ) : (
          <>
            {/* Total signups headline — answers "how many emails did I collect
                in this window?" up-front so it's not buried in a sum of cards.
                The 5 status buckets below partition this total. */}
            <div
              className="rounded-2xl p-5 mb-4 flex items-baseline justify-between flex-wrap gap-3"
              style={{
                background: "linear-gradient(180deg, rgba(96,165,250,0.10), rgba(96,165,250,0.02))",
                border: "1px solid rgba(96,165,250,0.30)",
              }}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#60a5fa" }}>
                  Total Emails Collected · {win.label.toLowerCase()}
                </p>
                <p className="text-4xl md:text-5xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {signupsInWindow}
                </p>
              </div>
              <p className="text-xs max-w-md" style={{ color: "var(--text-muted)" }}>
                Unique emails captured at onboarding in this window — ties out
                against Firebase signups. The 4 cards below show what
                <em> happened </em>in this window (events), not a breakdown of this total.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard icon={<Zap />}        iconColor="#defa32" label="Trial"    value={counts.trial}    rate={rates.trial}    rateLabel={rateLabels.trial} />
              <StatCard icon={<UserCheck />}  iconColor="#22c55e" label="Active"   value={counts.active}   rate={rates.active}   rateLabel={rateLabels.active} />
              <StatCard icon={<UserX />}      iconColor="#f59e0b" label="Canceled" value={`${counts.canceled} / ${trialStarters}`} rate={rates.canceled} rateLabel={rateLabels.canceled} />
              <StatCard icon={<UserX />}      iconColor="#ef4444" label="Churned"  value={counts.churned}  rate={rates.churned}  rateLabel={rateLabels.churned} />
            </div>
          </>
        )}

        {/* Combined list — only on funnel view. Live view focuses on totals. */}
        {view === "funnel" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
          <div className="flex items-center justify-between gap-4 px-5 py-4" style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
            <h2 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
              All signups ({categorized.length})
            </h2>
            <a
              href={`/api/admin/email/export?window=${winKey}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg transition active:scale-[0.98]"
              style={{ background: "var(--btn-buy-bg)", color: "var(--btn-buy-text)" }}
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </a>
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
// Win-backs view
// ============================================================================

function WinBacksView({ data }: { data: ChurnWinbackData }) {
  // Find the best-performing step (highest conversion %). Used to highlight
  // the winner card with a green accent.
  const stepsWithRate = data.perStep.map((s) => ({
    ...s,
    conversionPct: s.recipients > 0 ? (s.attributedWinbacks / s.recipients) * 100 : 0,
  }));
  const bestStep = stepsWithRate.reduce(
    (best, s) => (s.conversionPct > best.conversionPct ? s : best),
    stepsWithRate[0] ?? { conversionPct: 0, step: 0 },
  );
  const hasAnyWinbacks = data.totalWinbacks > 0;

  return (
    <div className="space-y-5">
      {/* Hero stats — total winbacks + organic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HeroStat
          label="Members won back"
          value={data.totalWinbacks}
          accent="#22c55e"
          tagline={`${data.totalRecipients.toLocaleString()} unique recipients received a churn email · winner = ${bestStep.conversionPct > 0 ? `Step ${bestStep.step}` : "—"}`}
        />
        <HeroStat
          label="Organic comebacks"
          value={data.organicWinbacks}
          accent="#60a5fa"
          tagline="Came back without any drip email attribution (cancelled then resubscribed on their own)"
        />
      </div>

      {/* Per-step performance — the meat. Best step gets a green border. */}
      <div className="rounded-2xl p-6" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Churn drip · per-step performance
          </h2>
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#22c55e" }}>
            Attribution = last email received before resubscribe
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stepsWithRate.map((s) => {
            const isWinner = hasAnyWinbacks && s.step === bestStep.step && s.attributedWinbacks > 0;
            const accent = isWinner ? "#22c55e" : "rgba(255,255,255,0.1)";
            return (
              <div
                key={s.step}
                className="rounded-xl p-5 relative"
                style={{
                  background: "var(--flip-bg-card)",
                  border: `2px solid ${accent}`,
                }}
              >
                {isWinner && (
                  <span
                    className="absolute -top-2 right-3 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider"
                    style={{ background: "#22c55e", color: "#000" }}
                  >
                    Winner
                  </span>
                )}
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </p>
                <p className="text-4xl font-extrabold tabular-nums mb-1" style={{ color: "var(--text-primary)" }}>
                  {s.conversionPct >= 1 ? s.conversionPct.toFixed(1) : s.conversionPct.toFixed(2)}%
                </p>
                <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
                  conversion rate
                </p>
                <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>
                    <strong style={{ color: "var(--text-primary)" }}>{s.attributedWinbacks}</strong>
                    {" "}won back
                  </span>
                  <span>
                    of <strong style={{ color: "var(--text-primary)" }}>{s.recipients}</strong> sent
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent winbacks table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
        <div className="flex items-center justify-between gap-4 px-5 py-4" style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
          <h2 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
            Won-back members ({data.winbacks.length})
          </h2>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Newest first
          </span>
        </div>
        {data.winbacks.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: "var(--text-muted)" }}>
            No win-backs yet. Once a churned member resubscribes, they show up here.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Email</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Canceled</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Won back</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Days</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Attributed to</th>
              </tr>
            </thead>
            <tbody>
              {data.winbacks.map((w) => (
                <tr key={w.email} style={{ borderTop: "1px solid var(--flip-card-border)" }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{w.email}</td>
                  <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                    <LocalDateTime iso={w.canceledAt} />
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                    <LocalDateTime iso={w.wonBackAt} />
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-right" style={{ color: "var(--text-primary)" }}>
                    {w.daysToWinBack}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {w.attributedStep ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded font-bold"
                        style={{
                          background: w.attributedStep === bestStep.step ? "rgba(34,197,94,0.15)" : "rgba(96,165,250,0.15)",
                          color: w.attributedStep === bestStep.step ? "#22c55e" : "#60a5fa",
                          fontSize: 10,
                          letterSpacing: 0.5,
                        }}
                      >
                        STEP {w.attributedStep}
                      </span>
                    ) : (
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        ORGANIC · no email
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  icon, iconColor, label, value, rate, rateLabel,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: number | string;
  rate?: string;
  rateLabel?: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
      <div style={{ color: iconColor }} className="mb-2 [&>svg]:w-4 [&>svg]:h-4">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>
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
