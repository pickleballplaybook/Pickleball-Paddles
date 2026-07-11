import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getRemoteConfigString } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/comeback-checkout
 * ---------------------------
 * Creates a Stripe Checkout session for the abandoned-signup win-back
 * landing page (/comeback). Applies the COMEBACK_COUPON_ID coupon to
 * the Pro Annual price so the user gets 50% off year 1, then renews at
 * the regular $299/year.
 *
 * Stripe secret key resolution order:
 *   1. STRIPE_SECRET_KEY env var (Vercel)         — fastest, no Firebase call
 *   2. Firebase Remote Config `stripe_client_secret` — fallback, same key
 *      the Drills Cloud Functions use. Lets us share one Stripe key
 *      across both products without forcing users to re-expose it.
 *
 * The other two values are NOT secrets and can be hardcoded — they live
 * here to keep the route self-documenting. Override via env if needed.
 *
 * Body: { email: string }
 *
 * Returns: { url: string } — redirect target for the browser.
 */

// Hardcoded so the route works the moment it's deployed — no env-var
// setup required on Vercel. Both values are non-secret (price IDs and
// coupon IDs are visible in Stripe to anyone with dashboard access).
// Override via env var if you need to rotate without a code change.
// Dedicated Pro Annual "Comeback" price at $59.80/year (~80% of $299).
// Created 2026-07-02. Rationale: the comeback80 coupon rendered Stripe
// Checkout with a strikethrough $299 and a "-$239.20" discount line,
// which Cal AI's clean "$59.80 per year" presentation doesn't do. A
// dedicated price shows as a single standalone amount — same visual
// as the "$19.99 per year" Cal AI checkout that Austin referenced.
// The old $299 price stays live for full-price signups.
const DEFAULT_PRO_ANNUAL_PRICE_ID = "price_1TomnvE6Dp3Vkjviz3SqyvTI";

async function resolveStripeKey(): Promise<string | null> {
  const fromEnv = process.env.STRIPE_SECRET_KEY;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  try {
    return await getRemoteConfigString("stripe_client_secret");
  } catch (e) {
    console.error("Failed to read Stripe key from Remote Config:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const stripeKey = await resolveStripeKey();
  const priceId = process.env.STRIPE_PRO_ANNUAL_PRICE_ID || DEFAULT_PRO_ANNUAL_PRICE_ID;

  if (!stripeKey) {
    console.error("Stripe key unavailable: not in env or Remote Config.");
    return NextResponse.json(
      { error: "Checkout is misconfigured. Please email austin@pickleballplaybook.app." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeKey);

  // ── Duplicate-sub guard ────────────────────────────────────────────────
  // If the caller already has an active or trialing subscription in Stripe
  // (i.e., they were on trial when they clicked the win-back email — this
  // is a real bug we hit with Almeo 2026-07-01), do NOT create a second
  // sub. Double-charge risk: their trial would auto-renew at full price
  // AFTER we already charged them the discounted annual. Instead, tell
  // the client we already have an active subscription so it can show a
  // "you're already on this" screen.
  try {
    // customers.search is case-insensitive; .list is not. Emails
    // stored in Stripe as mixed/upper case (e.g. RAKESHREDDY2K10@... on
    // 2026-07-02) were escaping this guard because a lowercased .list
    // query returned zero rows. Search fixes that.
    const escapedForSearch = email.replace(/'/g, "\\'");
    const searchResult = await stripe.customers.search({
      query: `email:'${escapedForSearch}'`,
      limit: 10,
    });
    const existingCustomers = { data: searchResult.data };
    for (const c of existingCustomers.data) {
      // Check `active` and `trialing` separately — status="all" returns
      // canceled/incomplete/etc which don't block a new sub.
      for (const status of ["active", "trialing"] as const) {
        const subs = await stripe.subscriptions.list({
          customer: c.id,
          status,
          limit: 5,
        });
        if (subs.data.length > 0) {
          return NextResponse.json(
            {
              error: "already_subscribed",
              message:
                "You're already subscribed with this email — no need to come back! Open the app and sign in.",
              existingStatus: status,
            },
            { status: 409 },
          );
        }
      }
    }
  } catch (e) {
    // Stripe lookup failure — fall through. Better to occasionally
    // over-serve a discount than to block a legitimate comeback because
    // Stripe's list API is having a bad minute.
    console.warn("Comeback dupe-check failed (falling through):", e);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      // Dedicated $59.80/yr price — no coupon. Renders on Stripe Checkout
      // as a single standalone "$59.80 per year" line, matching Cal AI's
      // clean-slate presentation (no strikethrough, no discount breakdown).
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      // Enables the full order summary panel Cal AI shows: line item card,
      // "Billed annually", Subtotal, Tax, Total due today. Without this
      // the left panel is blank below the price header.
      automatic_tax: { enabled: true },
      billing_address_collection: "auto",
      success_url: "https://pballdrills.app/success?tid=comeback",
      cancel_url: "https://playbookpaddles.com/welcome-back?t=" + encodeURIComponent(email),
      metadata: {
        source: "abandoned_signup_drip",
        comeback_email: email,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe returned no checkout URL." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("Stripe checkout error:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "Stripe checkout failed." },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
}
