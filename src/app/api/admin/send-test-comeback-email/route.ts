import { NextRequest, NextResponse } from "next/server";
import { getRemoteConfigString } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/send-test-comeback-email
 * ----------------------------------------
 * Sends the abandoned-drip step-2 "80% off" email to a specified
 * address so we can eyeball the actual rendered copy without going
 * through the full onboarding-then-abandon flow.
 *
 * Uses the SAME HTML/text template as functions/abandoned_emails.js so
 * whatever lands in your inbox is exactly what production customers
 * receive on the drip. Only difference: {{comeback_url}} is rendered
 * with the recipient's email so the CTA link works if clicked.
 *
 * Body: { to?: string } — defaults to the user's own email
 *   (austin@pickleballplaybook.app).
 *
 * Admin-gated upstream via shorts_auth cookie in middleware.ts.
 */

const DEFAULT_TEST_RECIPIENT = "austin@pickleballplaybook.app";
const COMEBACK_BASE = "https://playbookpaddles.com/welcome-back";

const HTML_TEMPLATE = `
<p>You didn't start your Pickleball Drills trial — but we've got a better option.</p>
<p>Take 80% off and get full access today.</p>
<p><a href="{{comeback_url}}" style="display:inline-block;background:#000;color:#fff;padding:14px 26px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">👉 Redeem 80% Off</a></p>
<p style="color:#666;font-size:13px;margin-top:24px;">Offer expires in 24 hours.</p>
<p>— Austin</p>`;

const TEXT_TEMPLATE = `Pickleball Drills\n\nYou didn't start your Pickleball Drills trial — but we've got a better option.\n\nTake 80% off and get full access today.\n\n👉 Redeem 80% Off: {{comeback_url}}\n\nOffer expires in 24 hours.\n\n— Austin`;

const SUBJECT = "Jump straight in — no trial needed";

export async function POST(req: NextRequest) {
  let to: string;
  try {
    const body = (await req.json()) as { to?: string };
    to = (body.to || DEFAULT_TEST_RECIPIENT).trim().toLowerCase();
  } catch {
    to = DEFAULT_TEST_RECIPIENT;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Invalid `to` email" }, { status: 400 });
  }

  const resendKey = await getRemoteConfigString("resend_api_key");
  if (!resendKey) {
    return NextResponse.json(
      { error: "resend_api_key missing in Firebase Remote Config" },
      { status: 500 },
    );
  }

  const comebackUrl = `${COMEBACK_BASE}?t=${encodeURIComponent(to)}`;
  const html = HTML_TEMPLATE.replaceAll("{{comeback_url}}", comebackUrl);
  const text = TEXT_TEMPLATE.replaceAll("{{comeback_url}}", comebackUrl);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: "Pickleball Drills <austin@pbdrills.com>",
      to: [to],
      reply_to: "austin@pbdrills.com",
      subject: SUBJECT,
      html,
      text,
      tags: [{ name: "type", value: "admin_test_comeback80" }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: "Resend send failed", status: res.status, detail: data },
      { status: 500 },
    );
  }
  return NextResponse.json({ sent: true, to, resendId: data.id ?? null });
}
