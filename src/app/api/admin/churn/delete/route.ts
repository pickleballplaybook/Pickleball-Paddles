import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Soft-deletes (actually hard-deletes) a single cancellation_reasons document
// by ID. Admin-gated upstream by the shorts_auth cookie via src/middleware.ts —
// this handler doesn't re-check auth on its own.
export async function POST(req: NextRequest) {
  let id: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    id = typeof body?.id === "string" ? body.id : null;
  } catch {
    /* malformed JSON falls through to the null check */
  }
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }
  try {
    const db = getFirebaseFirestore();
    await db.collection("cancellation_reasons").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
