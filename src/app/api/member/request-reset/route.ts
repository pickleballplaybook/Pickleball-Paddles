import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore, getRemoteConfigString } from "@/lib/firebase-admin";
import { generateResetToken } from "@/lib/bundle-auth";

export const runtime = "nodejs";

const RESET_TTL_MS = 2 * 60 * 60 * 1000;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://playbookpaddles.com";

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (body.email || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const db = getFirebaseFirestore();
  const snap = await db.collection("bundle_members")
    .where("email", "==", email)
    .limit(1)
    .get();

  // Always return ok to prevent email enumeration
  if (snap.empty) return NextResponse.json({ ok: true });

  const token = generateResetToken();
  await snap.docs[0].ref.update({
    reset_token: token,
    reset_token_expires: Date.now() + RESET_TTL_MS,
  });

  const resetUrl = `${SITE_URL}/members/reset-password?token=${token}`;
  const resendKey = await getRemoteConfigString("resend_api_key").catch(() => null);
  if (resendKey) {
    const html = `<p>Click below to reset your Playbook Paddles member password. This link expires in 2 hours.</p><p><a href="${resetUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password →</a></p>`;
    const text = `Reset your Playbook Paddles password:\n\n${resetUrl}\n\nThis link expires in 2 hours.`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: "Playbook Paddles <austin@pbdrills.com>",
        to: [email],
        subject: "Reset your Playbook Paddles password",
        html,
        text,
      }),
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
