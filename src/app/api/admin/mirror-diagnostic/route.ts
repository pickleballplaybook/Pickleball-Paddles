import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/admin/mirror-diagnostic
 * --------------------------------
 * Read-only sanity check for the subscription_mirror table. Called
 * when the churn / trial-to-paid numbers on /admin/email feel wrong,
 * so we can see WHAT's inflating or deflating them before touching
 * the classification code. No writes, no Stripe hits — just Supabase.
 *
 * Returns:
 *   - status buckets: raw count per Stripe status string
 *   - unpaid: count in `unpaid` (currently bucketed as churn, may be dunning noise)
 *   - null_trial_end_by_status: subs missing trial_end grouped by current status
 *     (these are anti-abuse deny_repeat converts that fall out of
 *     "trial → paid last year" if their signup is > 365 days ago)
 *   - email_dupes: count of emails that appear on 2+ subscriptions
 *   - cancels_by_week: cancellations per ISO week over the last 52 weeks
 *     (spots a bulk-cancel event that would otherwise poison the histogram)
 */

type MirrorRow = {
  email: string;
  stripe_customer_id: string | null;
  status: string;
  subscription_created_at: string;
  trial_end: string | null;
  canceled_at: string | null;
};

async function loadAllMirrorRows(): Promise<MirrorRow[]> {
  const supabase = getSupabaseAdmin();
  const rows: MirrorRow[] = [];
  const PAGE_SIZE = 1000;
  const MAX_ROWS = 100_000;
  let offset = 0;
  while (rows.length < MAX_ROWS) {
    const { data, error } = await supabase
      .from("subscription_mirror")
      .select("email, stripe_customer_id, status, subscription_created_at, trial_end, canceled_at")
      .order("subscription_created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...(data as MirrorRow[]));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

function isoWeekStart(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function GET(_req: NextRequest) {
  const rows = await loadAllMirrorRows();

  // 1. Status buckets — raw Stripe status counts.
  const byStatus: Record<string, number> = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  // 2. null_trial_end grouped by current status. High counts on
  //    `active` / `canceled` = a lot of anti-abuse deny_repeat subs.
  const nullTrialEndByStatus: Record<string, number> = {};
  for (const r of rows) {
    if (r.trial_end === null) {
      nullTrialEndByStatus[r.status] = (nullTrialEndByStatus[r.status] ?? 0) + 1;
    }
  }

  // 3. Same-email dupes: count emails with 2+ rows in the mirror.
  const perEmail = new Map<string, number>();
  for (const r of rows) {
    const key = r.email.toLowerCase().trim();
    perEmail.set(key, (perEmail.get(key) ?? 0) + 1);
  }
  let emailsWithDupes = 0;
  let extraSubsFromDupes = 0;
  const topDupes: { email: string; subs: number }[] = [];
  perEmail.forEach((count, email) => {
    if (count >= 2) {
      emailsWithDupes++;
      extraSubsFromDupes += count - 1;
      topDupes.push({ email, subs: count });
    }
  });
  topDupes.sort((a, b) => b.subs - a.subs);
  const topDupesSample = topDupes.slice(0, 20);

  // 4. Cancellations per week (last 52 weeks). Bucket by canceled_at.
  //    Spots a single spike (data migration, coupon expiry, bulk refund).
  const cutoffIso = new Date(Date.now() - 52 * 7 * 86_400_000).toISOString();
  const cancelsByWeek = new Map<string, number>();
  // Separate count of unpaid vs canceled cancellations to see dunning share.
  const cancelsByWeekCanceled = new Map<string, number>();
  const cancelsByWeekUnpaid = new Map<string, number>();
  for (const r of rows) {
    if (!r.canceled_at || r.canceled_at < cutoffIso) continue;
    // Only count actual churn-relevant cancels (had a trial or no trial and paid).
    // Skip canceled_trial (canceled_at <= trial_end).
    if (
      r.trial_end &&
      new Date(r.canceled_at) <= new Date(r.trial_end)
    ) {
      continue;
    }
    const week = isoWeekStart(r.canceled_at);
    cancelsByWeek.set(week, (cancelsByWeek.get(week) ?? 0) + 1);
    if (r.status === "unpaid") {
      cancelsByWeekUnpaid.set(week, (cancelsByWeekUnpaid.get(week) ?? 0) + 1);
    } else {
      cancelsByWeekCanceled.set(week, (cancelsByWeekCanceled.get(week) ?? 0) + 1);
    }
  }
  const cancelsByWeekSorted = Array.from(cancelsByWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, total]) => ({
      week,
      total,
      canceled: cancelsByWeekCanceled.get(week) ?? 0,
      unpaid: cancelsByWeekUnpaid.get(week) ?? 0,
    }));

  // 5. Rollup: churn-relevant cancellations by broad bucket.
  let churnCountLastYear = 0;
  let churnCountFromUnpaid = 0;
  const yearAgoIso = new Date(Date.now() - 365 * 86_400_000).toISOString();
  for (const r of rows) {
    if (!r.canceled_at || r.canceled_at < yearAgoIso) continue;
    if (
      r.trial_end &&
      new Date(r.canceled_at) <= new Date(r.trial_end)
    ) {
      continue;
    }
    churnCountLastYear++;
    if (r.status === "unpaid") churnCountFromUnpaid++;
  }

  return Response.json({
    total_mirror_rows: rows.length,
    by_status: byStatus,
    null_trial_end_by_status: nullTrialEndByStatus,
    dupes: {
      emails_with_multiple_subs: emailsWithDupes,
      extra_subs_from_dupes: extraSubsFromDupes,
      note:
        "extra_subs_from_dupes = subs above 1 per email. Every one of these inflates trial → paid AND churn counts vs a per-human view.",
      top_20_offenders: topDupesSample,
    },
    churn_last_year: {
      total: churnCountLastYear,
      from_unpaid_dunning: churnCountFromUnpaid,
      from_user_cancel: churnCountLastYear - churnCountFromUnpaid,
      note:
        "If you remove `unpaid` from churn (call it 'At risk' instead), the number on the admin page drops by from_unpaid_dunning.",
    },
    cancels_by_week: cancelsByWeekSorted,
  });
}
