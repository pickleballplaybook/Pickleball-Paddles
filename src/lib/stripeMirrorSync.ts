import Stripe from "stripe";
import { resolveStripeKey } from "@/lib/stripeKey";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Full paginated sync from Stripe subscriptions → Supabase
 * `subscription_mirror`. Shared between:
 *   - /api/admin/stripe-backfill (admin-triggered POST from the Sync
 *     button on /admin/email)
 *   - /api/cron/stripe-mirror-sync (nightly Vercel Cron)
 *
 * Guarantees the mirror always reflects the CURRENT Stripe state even
 * when individual webhook events get dropped. Returns counts + errors
 * so callers can surface a "N rows fixed" toast or log to Vercel.
 */

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

export type MirrorSyncResult = {
  scanned: number;
  upserted: number;
  skipped: number;
  errors: string[];
};

function planLabel(price?: Stripe.Price): string | null {
  if (!price) return null;
  if (price.nickname) return price.nickname;
  if (typeof price.unit_amount === "number" && price.recurring?.interval) {
    const dollars = (price.unit_amount / 100).toFixed(price.unit_amount % 100 === 0 ? 0 : 2);
    return `$${dollars}/${price.recurring.interval}`;
  }
  return null;
}

export async function syncStripeMirror(opts?: {
  sinceUnix?: number;
}): Promise<MirrorSyncResult> {
  const key = await resolveStripeKey();
  if (!key) {
    return { scanned: 0, upserted: 0, skipped: 0, errors: ["Stripe key not configured"] };
  }

  const stripe = new Stripe(key);
  const supabase = getSupabaseAdmin();

  let scanned = 0;
  let upserted = 0;
  let skipped = 0;
  const errors: string[] = [];
  let batch: MirrorRow[] = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    const { error } = await supabase
      .from("subscription_mirror")
      .upsert(batch, { onConflict: "stripe_subscription_id" });
    if (error) {
      errors.push(error.message);
    } else {
      upserted += batch.length;
    }
    batch = [];
  }

  try {
    const listParams: Stripe.SubscriptionListParams = {
      limit: 100,
      status: "all",
      expand: ["data.customer", "data.items.data.price"],
    };
    if (opts?.sinceUnix) listParams.created = { gte: opts.sinceUnix };

    for await (const sub of stripe.subscriptions.list(listParams)) {
      scanned++;
      const customer = sub.customer;
      if (typeof customer !== "object" || !customer || ("deleted" in customer && customer.deleted)) {
        skipped++;
        continue;
      }
      const email = (customer as Stripe.Customer).email?.toLowerCase().trim();
      if (!email) {
        skipped++;
        continue;
      }
      const customerId = (customer as Stripe.Customer).id;

      batch.push({
        stripe_subscription_id: sub.id,
        email,
        stripe_customer_id: customerId,
        status: sub.status,
        subscription_created_at: new Date(sub.created * 1000).toISOString(),
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        plan_label: planLabel(sub.items?.data?.[0]?.price),
      });

      if (batch.length >= 200) await flushBatch();
    }
    await flushBatch();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    errors.push(msg);
  }

  return { scanned, upserted, skipped, errors };
}
