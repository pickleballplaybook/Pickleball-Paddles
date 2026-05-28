import { NextResponse } from "next/server";

const COOKIE = "shorts_auth";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: Request) {
  const expected = process.env.ADMIN_SHORTS_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Server not configured: ADMIN_SHORTS_PASSWORD missing" },
      { status: 500 }
    );
  }

  let body: { password?: string; next?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ignore — handled below
  }
  const password = body.password ?? "";
  const next = body.next && body.next.startsWith("/") ? body.next : "/admin/shorts";

  if (password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, next });
  res.cookies.set(COOKIE, "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
  return res;
}
