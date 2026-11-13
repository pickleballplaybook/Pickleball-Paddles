import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getFirebaseFirestore();
  const doc = await db.collection("drill_bundles").doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bundle: { id: doc.id, ...doc.data() } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = getFirebaseFirestore();
  await db.collection("drill_bundles").doc(id).update(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getFirebaseFirestore();
  await db.collection("drill_bundles").doc(id).delete();
  return NextResponse.json({ ok: true });
}
