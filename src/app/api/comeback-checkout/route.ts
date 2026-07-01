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
const DEFAULT_PRO_ANNUAL_PRICE_ID = "price_1TUHhCE6Dp3VkjviwEUqrpa8";
const DEFAULT_COMEBACK_COUPON_ID = "comeback50";

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
  const couponId = process.env.STRIPE_COMEBACK_COUPON_ID || DEFAULT_COMEBACK_COUPON_ID;

  if (!stripeKey) {
    console.error("Stripe key unavailable: not in env or Remote Config.");
    return NextResponse.json(
      { error: "Checkout is misconfigured. Please email austin@pickleballplaybook.app." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // Coupon applies once (= year 1 at 50% off, renews at full price)
      discounts: [{ coupon: couponId }],
      // Prefill email so the user doesn't re-type. Stripe still shows the
      // field but with this value pre-filled and editable.
      customer_email: email,
      // Success → app deep link. Cancel → back to /comeback so they can retry.
      success_url: "https://pballdrills.app/success?tid=comeback",
      cancel_url: "https://playbookpaddles.com/welcome-back?t=" + encodeURIComponent(email),
      // Tag the session so we can attribute conversions in Stripe.
      metadata: {
        source: "abandoned_signup_drip",
        comeback_email: email,
      },
      // NOTE: Cannot set allow_promotion_codes when discounts is set —
      // Stripe rejects the combination. The coupon above is already
      // applied; users can't stack additional promo codes anyway.
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
