import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const db = getFirebaseFirestore();
    const srcRef = db.collection("courses").doc(id);
    const srcDoc = await srcRef.get();
    if (!srcDoc.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const src = srcDoc.data()!;

    // Find max sortOrder to place the copy at the end
    const allSnap = await db.collection("courses").orderBy("sortOrder", "desc").limit(1).get();
    const maxOrder = allSnap.empty ? 0 : ((allSnap.docs[0].data().sortOrder as number) ?? 0);

    // Create the new course doc
    const newRef = db.collection("courses").doc();
    const now = FieldValue.serverTimestamp();
    await newRef.set({
      title: `Copy of ${(src.title as string) ?? "Untitled"}`,
      description: src.description ?? "",
      accessType: src.accessType ?? "open",
      coverImageUrl: src.coverImageUrl ?? null,
      published: false,
      sortOrder: maxOrder + 10,
      minLevel: src.minLevel ?? null,
      orMemberTierEnabled: src.orMemberTierEnabled ?? false,
      memberTier: src.memberTier ?? null,
      proTier: src.proTier ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // Copy all nodes, remapping parentIds to new IDs
    const nodesSnap = await srcRef.collection("nodes").orderBy("sortOrder").get();
    if (!nodesSnap.empty) {
      // Pre-allocate new IDs for every node so we can remap parentIds
      const idMap = new Map<string, string>();
      for (const d of nodesSnap.docs) {
        idMap.set(d.id, newRef.collection("nodes").doc().id);
      }

      const batch = db.batch();
      for (const d of nodesSnap.docs) {
        const r = d.data();
        const newNodeId = idMap.get(d.id)!;
        const newNodeRef = newRef.collection("nodes").doc(newNodeId);
        const oldParentId = (r.parentId as string | null) ?? null;
        batch.set(newNodeRef, {
          title: r.title ?? "Untitled",
          type: r.type === "folder" ? "folder" : "page",
          parentId: oldParentId ? (idMap.get(oldParentId) ?? null) : null,
          sortOrder: r.sortOrder ?? 0,
          published: r.published !== false,
          content: r.content ?? "",
          thumbnailUrl: r.thumbnailUrl ?? null,
          createdAt: now,
          updatedAt: now,
        });
      }
      await batch.commit();
    }

    return NextResponse.json({ ok: true, id: newRef.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
