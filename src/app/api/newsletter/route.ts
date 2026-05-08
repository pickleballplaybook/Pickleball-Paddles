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

    // TODO: Send `trimmed` to your email provider here (see comments above).
    // For now we log server-side and return success.
    console.log(`[Newsletter] New signup: ${trimmed}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
