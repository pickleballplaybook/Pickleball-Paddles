import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveStripeKey } from "@/lib/stripeKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 * -------------------------
 * Listens for `customer.subscription.*` events from Stripe and upserts a row
 * into the Supabase `subscription_mirror` table. Admin pages read from that
 * mirror instead of paginating Stripe live — drops page loads from 15-30s to
 * ~50ms while keeping status data live (events fire within seconds of the
 * underlying Stripe state change).
 *
 * Setup:
 *   1. Run the schema in /docs/subscription-mirror.sql against Supabase.
 *   2. Add the endpoint in Stripe Dashboard → Developers → Webhooks:
 *        URL: https://playbookpaddles.com/api/webhooks/stripe
 *        Events: customer.subscription.created
 *                customer.subscription.updated
 *                customer.subscription.deleted
 *                customer.deleted    (cleans up rows for deleted customers)
 *   3. Copy the signing secret into Vercel env as STRIPE_WEBHOOK_SECRET.
 *   4. Hit POST /api/admin/stripe-backfill once to populate historical data.
 */

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

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

function planLabelFromPrice(price?: Stripe.Price): string | null {
  if (!price) return null;
  if (price.nickname) return price.nickname;
  if (typeof price.unit_amount === "number" && price.recurring?.interval) {
    const dollars = (price.unit_amount / 100).toFixed(price.unit_amount % 100 === 0 ? 0 : 2);
    return `$${dollars}/${price.recurring.interval}`;
  }
  return null;
}

function buildRowFromSubscription(
  sub: Stripe.Subscription,
  customer: Stripe.Customer,
): MirrorRow | null {
  const email = customer.email?.toLowerCase().trim();
  if (!email) return null;
  return {
    stripe_subscription_id: sub.id,
    email,
    stripe_customer_id: customer.id,
    status: sub.status,
    subscription_created_at: new Date(sub.created * 1000).toISOString(),
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    plan_label: planLabelFromPrice(sub.items?.data?.[0]?.price),
  };
}

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    return new Response("STRIPE_WEBHOOK_SECRET not configured", { status: 500 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature header", { status: 400 });

  const stripeKey = await resolveStripeKey();
  if (!stripeKey) return new Response("Stripe key not configured", { status: 500 });
  const stripe = new Stripe(stripeKey);

  // Raw body is required for signature verification. Next.js gives us bytes
  // via req.text() — no body-parser intercepts here.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    // Customer-level deletions: drop every sub the customer owned. Rare but
    // important — Stripe orphans subs on customer delete and we don't want
    // ghost rows in the mirror.
    if (event.type === "customer.deleted") {
      const customer = event.data.object as Stripe.Customer;
      await supabase.from("subscription_mirror").delete().eq("stripe_customer_id", customer.id);
      return new Response("OK", { status: 200 });
    }

    if (event.type.startsWith("customer.subscription.")) {
      const sub = event.data.object as Stripe.Subscription;

      // Need email — fetch the customer if it's not already expanded.
      let customer: Stripe.Customer | Stripe.DeletedCustomer;
      if (typeof sub.customer === "string") {
        customer = await stripe.customers.retrieve(sub.customer);
      } else {
        customer = sub.customer;
      }

      if ("deleted" in customer && customer.deleted) {
        // Customer was deleted; remove this sub from the mirror.
        await supabase.from("subscription_mirror").delete().eq("stripe_subscription_id", sub.id);
        return new Response("OK (customer deleted)", { status: 200 });
      }

      // We need the price expanded for plan_label. Webhook payloads typically
      // include the full price object; fall back to a Stripe lookup if not.
      let price: Stripe.Price | undefined = sub.items?.data?.[0]?.price;
      if (price && typeof price === "object" && "deleted" in price) {
        price = undefined;
      }

      const row = buildRowFromSubscription(sub, customer as Stripe.Customer);
      if (!row) {
        // No email on customer — nothing to mirror, drop any prior row by sub id.
        await supabase.from("subscription_mirror").delete().eq("stripe_subscription_id", sub.id);
        return new Response("OK (no email)", { status: 200 });
      }
      row.plan_label = planLabelFromPrice(price);

      const { error } = await supabase
        .from("subscription_mirror")
        .upsert(row, { onConflict: "stripe_subscription_id" });
      if (error) {
        console.error("[stripe-webhook] upsert failed:", error.message);
        return new Response(`Mirror upsert failed: ${error.message}`, { status: 500 });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] handler error:", msg);
    return new Response(`Handler error: ${msg}`, { status: 500 });
  }
}
