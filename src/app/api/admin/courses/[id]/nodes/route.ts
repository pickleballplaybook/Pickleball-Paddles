import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const db = getFirebaseFirestore();
    const snap = await db
      .collection("courses").doc(id)
      .collection("nodes")
      .orderBy("sortOrder")
      .get();
    const nodes = snap.docs.map((d) => {
      const r = d.data();
      return {
        id: d.id,
        title: (r.title as string) ?? "Untitled",
        type: (r.type as string) === "folder" ? "folder" : "page",
        parentId: (r.parentId as string | null) ?? null,
        sortOrder: (r.sortOrder as number) ?? 0,
        published: r.published !== false,
        content: (r.content as string) ?? "",
      };
    });
    return NextResponse.json({ nodes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  const type = body.type === "folder" ? "folder" : "page";
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : type === "folder"
      ? "New folder"
      : "New page";

  try {
    const db = getFirebaseFirestore();
    const col = db.collection("courses").doc(id).collection("nodes");
    const snap = await col.orderBy("sortOrder", "desc").limit(1).get();
    const maxOrder = snap.empty ? 0 : ((snap.docs[0].data().sortOrder as number) ?? 0);
    const ref = col.doc();
    await ref.set({
      title,
      type,
      parentId: typeof body.parentId === "string" && body.parentId ? body.parentId : null,
      sortOrder: maxOrder + 1,
      published: body.published !== false,
      content: type === "page" ? (typeof body.content === "string" ? body.content : "") : "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
