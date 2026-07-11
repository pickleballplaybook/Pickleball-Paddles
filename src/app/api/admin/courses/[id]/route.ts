import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COL = "courses";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const db = getFirebaseFirestore();
    const doc = await db.collection(COL).doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const r = doc.data()!;
    return NextResponse.json({
      course: {
        id: doc.id,
        title: (r.title as string) ?? "",
        description: (r.description as string) ?? "",
        accessType: (r.accessType as string) ?? "open",
        coverImageUrl: (r.coverImageUrl as string | null) ?? null,
        published: r.published === true,
        sortOrder: (r.sortOrder as number) ?? 0,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  try {
    const db = getFirebaseFirestore();
    const ref = db.collection(COL).doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (typeof body.title === "string") update.title = body.title.trim();
    if (typeof body.description === "string") update.description = body.description.trim();
    if (typeof body.accessType === "string") update.accessType = body.accessType;
    if (body.coverImageUrl !== undefined) update.coverImageUrl = body.coverImageUrl || null;
    if (typeof body.published === "boolean") update.published = body.published;
    if (typeof body.sortOrder === "number") update.sortOrder = body.sortOrder;
    await ref.set(update, { merge: true });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const db = getFirebaseFirestore();
    const ref = db.collection(COL).doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
    // Delete all nodes in the subcollection first
    const nodes = await ref.collection("nodes").get();
    const batch = db.batch();
    nodes.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
