import { NextRequest, NextResponse } from "next/server";

/**
 * Newsletter signup API route
 *
 * Currently stores nothing — returns success so the frontend works immediately.
 *
 * To connect to an email provider, replace the TODO block below:
 *
 * ── Mailchimp ───────────────────────────────────────────────────────────────
 *   const res = await fetch(
 *     `https://us1.api.mailchimp.com/3.0/lists/LIST_ID/members`,
 *     {
 *       method: "POST",
 *       headers: {
 *         "Authorization": `apikey ${process.env.MAILCHIMP_API_KEY}`,
 *         "Content-Type": "application/json",
 *       },
 *       body: JSON.stringify({ email_address: email, status: "subscribed" }),
 *     }
 *   );
 *
 * ── ConvertKit ──────────────────────────────────────────────────────────────
 *   const res = await fetch(
 *     `https://api.convertkit.com/v3/forms/FORM_ID/subscribe`,
 *     {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify({ api_key: process.env.CONVERTKIT_API_KEY, email }),
 *     }
 *   );
 *
 * ── Klaviyo ─────────────────────────────────────────────────────────────────
 *   const res = await fetch("https://a.klaviyo.com/api/profile-import/", {
 *     method: "POST",
 *     headers: {
 *       "Authorization": `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
 *       "Content-Type": "application/json",
 *       "revision": "2024-02-15",
 *     },
 *     body: JSON.stringify({ data: { type: "profile", attributes: { email } } }),
 *   });
 */

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Basic validation
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // ── Substack subscribe (unofficial endpoint, widely used) ───────────────
    // POSTs the email to the Substack publication's free-subscribe API.
    // If this ever breaks (Substack changes the endpoint), the client falls
    // back to opening the Substack subscribe URL in a new tab.
    const SUBSTACK_API = "https://pickleballplaybookreviews.substack.com/api/v1/free";
    let provider = "substack";
    let subscribed = false;
    try {
      const res = await fetch(SUBSTACK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          first_url: req.headers.get("referer") || "https://playbookpaddles.com/",
          first_referrer: req.headers.get("referer") || "",
          current_url: req.headers.get("referer") || "https://playbookpaddles.com/",
          current_referrer: req.headers.get("referer") || "",
          referral_code: "",
          source: "playbookpaddles.com",
        }),
      });
      subscribed = res.ok;
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn(`[Newsletter] Substack returned ${res.status}: ${body.slice(0, 200)}`);
      }
    } catch (err) {
      console.warn("[Newsletter] Substack POST failed:", err);
    }

    if (!subscribed) {
      // Soft-fail: tell the client to redirect the user to the Substack
      // subscribe page with the email prefilled (one-click finish).
      return NextResponse.json({
        success: false,
        fallbackUrl: `https://pickleballplaybookreviews.substack.com/subscribe?email=${encodeURIComponent(trimmed)}&utm_source=playbookpaddles`,
        error: "Direct subscribe failed — please confirm on the next page.",
      }, { status: 502 });
    }

    console.log(`[Newsletter] Subscribed via ${provider}: ${trimmed}`);
    return NextResponse.json({ success: true, provider });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
