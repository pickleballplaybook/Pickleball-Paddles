import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Reads subscription state from the local `subscription_mirror` table that's
 * kept live by the Stripe webhook at /api/webhooks/stripe. Returns the same
 * shape as the legacy Stripe-API-paginating implementation so all callers
 * (admin email page, CSV export) keep working unchanged.
 *
 * Why the mirror exists: paginating Stripe live for 2000+ subscriptions on
 * every admin page load is 15-30 seconds wall-clock. Reading from Supabase
 * is ~50ms. The webhook keeps the mirror within seconds of Stripe.
 *
 * Setup: see /docs/subscription-mirror.sql + the webhook route comment block.
 */

export type StripeSubStatus = "trial" | "active" | "canceled_trial" | "canceled_membership";

export type StripeSubInfo = {
  status: StripeSubStatus;
  subscriptionCreatedAt: string;
  trialEndedAt: string | null;
  canceledAt: string | null;
  plan: string;
};

export type StripeFetchResult = {
  byEmail: Map<string, StripeSubInfo>;
  scanned: number;
  withEmail: number;
  // Legacy fields preserved so the diagnostic banner in the page still
  // renders cleanly. The mirror is always "resolved" (no key gymnastics),
  // and mode no longer reflects test/live since we just read what Stripe
  // pushed in via webhook.
  keyResolved: boolean;
  keyMode: "live" | "test" | "unknown";
  error: string | null;
  sampleStripeEmails: string[];
};

type MirrorRow = {
  stripe_subscription_id: string;
  email: string;
  stripe_customer_id: string;
  status: string;
  subscription_created_at: string;
  trial_end: string | null;
  canceled_at: string | null;
  plan_label: string | null;
};

function deriveStatus(
  rawStatus: string,
  trialEnd: string | null,
  canceledAt: string | null,
): StripeSubStatus {
  if (rawStatus === "trialing") return "trial";
  if (rawStatus === "active" || rawStatus === "past_due" || rawStatus === "paused") {
    return "active";
  }
  if (rawStatus === "canceled") {
    if (canceledAt && trialEnd && new Date(canceledAt) <= new Date(trialEnd)) {
      return "canceled_trial";
    }
    return "canceled_membership";
  }
  // `unpaid` = sub WAS active but dunning failed. They paid at least once
  // before failing → bucket as churned. (Stripe will eventually flip these
  // to status='canceled' anyway.)
  if (rawStatus === "unpaid") return "canceled_membership";
  // `incomplete` / `incomplete_expired` = initial payment failed, customer
  // never paid a single cycle. Definitionally NOT churned — closer to
  // "signed up, never paid" which is the canceled_trial bucket. Was the
  // single biggest source of churn-count inflation on the admin page.
  return "canceled_trial";
}

export async function fetchStripeStatusByEmail(): Promise<StripeFetchResult> {
  const supabase = getSupabaseAdmin();
  const byEmail = new Map<string, StripeSubInfo>();
  const sampleStripeEmails: string[] = [];

  // Paginate. Supabase's default `db_settings.api.max_rows = 1000` silently
  // caps any single .limit() call at 1000 rows — even .limit(100_000) only
  // returns the first 1000. That dropped 70%+ of our mirror data on read.
  // .range() honors the cap per-call too, so we loop until a short page.
  const PAGE_SIZE = 1000;
  const rows: Omit<MirrorRow, "stripe_subscription_id" | "stripe_customer_id">[] = [];
  try {
    let offset = 0;
    // Safety cap so a runaway iteration can't hang the request.
    const MAX_ROWS = 100_000;
    while (rows.length < MAX_ROWS) {
      const { data, error } = await supabase
        .from("subscription_mirror")
        .select(
          "email, status, subscription_created_at, trial_end, canceled_at, plan_label",
        )
        .order("subscription_created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) {
        return {
          byEmail,
          scanned: 0,
          withEmail: 0,
          keyResolved: false,
          keyMode: "unknown",
          error: error.message,
          sampleStripeEmails: [],
        };
      }
      if (!data || data.length === 0) break;
      rows.push(...(data as typeof rows));
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  } catch (e) {
    return {
      byEmail,
      scanned: 0,
      withEmail: 0,
      keyResolved: false,
      keyMode: "unknown",
      error: e instanceof Error ? e.message : String(e),
      sampleStripeEmails: [],
    };
  }

  try {

    // Per-email dedup: when an email appears on multiple subscriptions (e.g.
    // user signed up twice and we manually canceled the duplicate), the live
    // one wins — never count a manually-canceled dupe against the customer.
    // Priority: active > trial > canceled_membership > canceled_trial.
    // Within the same priority, newest subscription wins.
    const STATUS_PRIORITY: Record<StripeSubStatus, number> = {
      active: 0,
      trial: 1,
      canceled_membership: 2,
      canceled_trial: 3,
    };

    const bestPerEmail = new Map<string, { row: typeof rows[number]; status: StripeSubStatus }>();
    for (const row of rows) {
      const email = row.email.toLowerCase().trim();
      const status = deriveStatus(row.status, row.trial_end, row.canceled_at);
      const existing = bestPerEmail.get(email);
      if (!existing) {
        bestPerEmail.set(email, { row, status });
        continue;
      }
      const newPriority = STATUS_PRIORITY[status];
      const existingPriority = STATUS_PRIORITY[existing.status];
      if (newPriority < existingPriority) {
        bestPerEmail.set(email, { row, status });
      } else if (
        newPriority === existingPriority &&
        row.subscription_created_at > existing.row.subscription_created_at
      ) {
        bestPerEmail.set(email, { row, status });
      }
    }

    Array.from(bestPerEmail.entries()).forEach(([email, { row, status }]) => {
      byEmail.set(email, {
        status,
        subscriptionCreatedAt: row.subscription_created_at,
        trialEndedAt: row.trial_end,
        canceledAt: row.canceled_at,
        plan: row.plan_label ?? "",
      });
      if (sampleStripeEmails.length < 5) sampleStripeEmails.push(email);
    });

    return {
      byEmail,
      scanned: rows.length,
      withEmail: rows.length,
      keyResolved: true,
      keyMode: "live",
      error: null,
      sampleStripeEmails,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      byEmail,
      scanned: 0,
      withEmail: 0,
      keyResolved: false,
      keyMode: "unknown",
      error: msg,
      sampleStripeEmails: [],
    };
  }
}
