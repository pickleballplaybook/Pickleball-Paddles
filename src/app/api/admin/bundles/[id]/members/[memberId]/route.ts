import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { generateResetToken } from "@/lib/bundle-auth";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://playbookpaddles.com";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id, memberId } = await params;
  const db = getFirebaseFirestore();

  const bundleDoc = await db.collection("drill_bundles").doc(id).get();
  if (!bundleDoc.exists) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  const slug = bundleDoc.data()!.slug as string;

  const memberDoc = await db.collection("bundle_members").doc(memberId).get();
  if (!memberDoc.exists) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const slugs: string[] = memberDoc.data()!.bundle_slugs || [];
  const updated = slugs.filter((s) => s !== slug);
  if (updated.length === 0) {
    await memberDoc.ref.delete();
  } else {
    await memberDoc.ref.update({ bundle_slugs: updated });
  }

  return NextResponse.json({ ok: true });
}

// POST = generate a fresh reset link for this member
export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { memberId } = await params;
  const db = getFirebaseFirestore();

  const memberDoc = await db.collection("bundle_members").doc(memberId).get();
  if (!memberDoc.exists) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const token = generateResetToken();
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  await memberDoc.ref.update({
    reset_token: token,
    reset_token_expires: expires,
    must_reset_password: true,
  });

  const resetUrl = `${SITE_URL}/members/reset-password?token=${token}`;
  return NextResponse.json({ ok: true, reset_link: resetUrl });
}
