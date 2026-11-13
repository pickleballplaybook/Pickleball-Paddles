import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { hashPassword, signSession, SESSION_COOKIE, SESSION_OPTS } from "@/lib/bundle-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let token: string, password: string;
  try {
    const body = await req.json();
    token = (body.token || "").trim();
    password = body.password || "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Token and password (min 8 chars) required" }, { status: 400 });
  }

  const db = getFirebaseFirestore();
  const snap = await db.collection("bundle_members")
    .where("reset_token", "==", token)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const doc = snap.docs[0];
  const data = doc.data();
  if (!data.reset_token_expires || Date.now() > data.reset_token_expires) {
    return NextResponse.json({ error: "Reset link has expired" }, { status: 400 });
  }

  const hash = await hashPassword(password);
  await doc.ref.update({
    password_hash: hash,
    reset_token: null,
    reset_token_expires: null,
    must_reset_password: false,
  });

  const sessionToken = signSession(data.email);
  const res = NextResponse.json({ ok: true, bundle_slugs: data.bundle_slugs || [] });
  res.cookies.set(SESSION_COOKIE, sessionToken, SESSION_OPTS);
  return res;
}
