import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { verifyPassword, signSession, SESSION_COOKIE, SESSION_OPTS } from "@/lib/bundle-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let email: string, password: string;
  try {
    const body = await req.json();
    email = (body.email || "").trim().toLowerCase();
    password = body.password || "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const db = getFirebaseFirestore();
  const snap = await db.collection("bundle_members")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const member = snap.docs[0].data();
  const valid = await verifyPassword(password, member.password_hash || "");
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = signSession(email);
  const res = NextResponse.json({
    ok: true,
    must_reset: member.must_reset_password === true,
    bundle_slugs: member.bundle_slugs || [],
  });
  res.cookies.set(SESSION_COOKIE, token, SESSION_OPTS);
  return res;
}
