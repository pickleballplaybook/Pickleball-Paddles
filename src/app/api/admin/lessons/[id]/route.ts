import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH  /api/admin/lessons/[id]  — update a lesson category
// DELETE /api/admin/lessons/[id]  — delete a lesson category

const COLLECTION = "community_lesson_categories";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const minLevel =
    typeof body.minLevel === "number" && body.minLevel >= 1
      ? Math.floor(body.minLevel)
      : null;
  const requiresPro = body.requiresPro === true;
  const order =
    typeof body.order === "number" ? Math.floor(body.order) : 0;
  const isActive = body.isActive !== false;

  const missing: string[] = [];
  if (!title) missing.push("title");
  if (minLevel === null) missing.push("minLevel");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing/invalid fields: ${missing.join(", ")}.` },
      { status: 400 }
    );
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = db.collection(COLLECTION).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    await docRef.set(
      { title, description, minLevel, requiresPro, order, isActive, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Firestore write failed: ${message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  try {
    const db = getFirebaseFirestore();
    const docRef = db.collection(COLLECTION).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    await docRef.delete();
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Firestore delete failed: ${message}` },
      { status: 500 }
    );
  }
}
