import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; nodeId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, nodeId } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  try {
    const db = getFirebaseFirestore();
    const ref = db.collection("courses").doc(id).collection("nodes").doc(nodeId);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (typeof body.title === "string") update.title = body.title.trim() || "Untitled";
    if (typeof body.published === "boolean") update.published = body.published;
    if (typeof body.content === "string") update.content = body.content;
    if (typeof body.sortOrder === "number") update.sortOrder = body.sortOrder;
    if ("parentId" in body) update.parentId = typeof body.parentId === "string" ? body.parentId : null;
    await ref.set(update, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, nodeId } = await params;
  try {
    const db = getFirebaseFirestore();
    const col = db.collection("courses").doc(id).collection("nodes");
    const ref = col.doc(nodeId);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });

    // If this is a folder, also delete its child pages
    const batch = db.batch();
    if ((doc.data()?.type as string) === "folder") {
      const children = await col.where("parentId", "==", nodeId).get();
      children.docs.forEach((d) => batch.delete(d.ref));
    }
    batch.delete(ref);
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
