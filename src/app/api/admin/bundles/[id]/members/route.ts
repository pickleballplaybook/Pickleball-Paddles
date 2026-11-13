import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore, getRemoteConfigString } from "@/lib/firebase-admin";
import { hashPassword, generateResetToken } from "@/lib/bundle-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://playbookpaddles.com";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getFirebaseFirestore();
  const bundleDoc = await db.collection("drill_bundles").doc(id).get();
  if (!bundleDoc.exists) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  const slug = bundleDoc.data()!.slug as string;

  const snap = await db.collection("bundle_members")
    .where("bundle_slugs", "array-contains", slug)
    .get();

  const members = snap.docs.map((d) => ({
    id: d.id,
    email: d.data().email,
    must_reset: d.data().must_reset_password === true,
    reset_link: d.data().reset_token
      ? `${SITE_URL}/members/reset-password?token=${d.data().reset_token}`
      : null,
  }));

  return NextResponse.json({ members });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();
  const tempPassword: string = body.password || "Playbook123!";

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const db = getFirebaseFirestore();
  const bundleDoc = await db.collection("drill_bundles").doc(id).get();
  if (!bundleDoc.exists) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  const bundleData = bundleDoc.data()!;
  const slug = bundleData.slug as string;
  const bundleName = bundleData.name as string;

  const token = generateResetToken();
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const resetUrl = `${SITE_URL}/members/reset-password?token=${token}`;

  const existing = await db.collection("bundle_members")
    .where("email", "==", email)
    .limit(1)
    .get();

  let memberId: string;
  if (!existing.empty) {
    const doc = existing.docs[0];
    memberId = doc.id;
    const currentSlugs: string[] = doc.data().bundle_slugs || [];
    await doc.ref.update({
      bundle_slugs: currentSlugs.includes(slug) ? currentSlugs : [...currentSlugs, slug],
      reset_token: token,
      reset_token_expires: expires,
      must_reset_password: true,
    });
  } else {
    const hash = await hashPassword(tempPassword);
    const ref = await db.collection("bundle_members").add({
      email,
      password_hash: hash,
      bundle_slugs: [slug],
      must_reset_password: true,
      reset_token: token,
      reset_token_expires: expires,
      created_at: new Date().toISOString(),
    });
    memberId = ref.id;
  }

  // Send access email
  const resendKey = await getRemoteConfigString("resend_api_key").catch(() => null);
  if (resendKey) {
    const html = `<p>You now have access to Pickleball Playbook Drills (${bundleName}).</p><p>Click below to set your password and get started:</p><p><a href="${resetUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Access Your Drills →</a></p><p style="color:#666;font-size:13px;margin-top:16px;">This link expires in 7 days.</p>`;
    const text = `You now have access to Pickleball Playbook Drills (${bundleName}).\n\nSet your password to get started:\n${resetUrl}\n\nExpires in 7 days.`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: "Playbook Paddles <austin@pbdrills.com>",
        to: [email],
        subject: "Your Pickleball Playbook drills are ready",
        html,
        text,
      }),
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, member_id: memberId, reset_link: resetUrl });
}
