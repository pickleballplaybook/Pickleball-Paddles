import { NextRequest } from "next/server";
import Stripe from "stripe";
import { resolveStripeKey } from "@/lib/stripeKey";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Pro caps function timeout at 300s. Hobby caps at 60s — if you're on
// hobby and have >6000 subs, the backfill may need to be split into chunks.
export const maxDuration = 300;

/**
 * POST /api/admin/stripe-backfill
 * -------------------------------
 * One-time backfill: paginates every Stripe subscription on the account and
 * upserts into `subscription_mirror`. Run once after creating the table; the
 * webhook handler keeps it live from that point on.
 *
 * Admin-gated by the shorts_auth cookie via src/middleware.ts.
 *
 * Query params:
 *   ?since=YYYY-MM-DD   (optional) — only backfill subs created on/after this
 *                       date. Useful for re-syncing after a known gap.
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

function planLabel(price?: Stripe.Price): string | null {
  if (!price) return null;
  if (price.nickname) return price.nickname;
  if (typeof price.unit_amount === "number" && price.recurring?.interval) {
    const dollars = (price.unit_amount / 100).toFixed(price.unit_amount % 100 === 0 ? 0 : 2);
    return `$${dollars}/${price.recurring.interval}`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const key = await resolveStripeKey();
  if (!key) return new Response("Stripe key not configured", { status: 500 });

  const sinceParam = req.nextUrl.searchParams.get("since");
  const sinceUnix = sinceParam ? Math.floor(new Date(sinceParam).getTime() / 1000) : undefined;

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
    if (sinceUnix) listParams.created = { gte: sinceUnix };

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

      // Flush every 200 rows. Larger batches risk Supabase request-size
      // limits; smaller wastes round-trips.
      if (batch.length >= 200) await flushBatch();
    }
    await flushBatch();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    errors.push(msg);
  }

  return Response.json({ scanned, upserted, skipped, errors });
}
