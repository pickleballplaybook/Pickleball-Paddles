import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reorder-course-nodes
 *
 * Rebuilds sortOrder values for all nodes in a course using a DFS tree walk
 * so that the global sortOrder reflects the correct reading order:
 *   week1_wrapper → week1/START HERE → pages → week1/MINDSET → pages ...
 *   → week2_wrapper → week2/START HERE → pages ...
 *
 * This lets the Flutter flat-loop (which iterates ALL nodes by sortOrder)
 * produce the correct page sequence without needing a DFS-aware Flutter build.
 *
 * Body: { courseId: string }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = (await req.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

  const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";
  if (!courseId) return NextResponse.json({ error: "courseId required." }, { status: 400 });

  const db = getFirebaseFirestore();
  const nodesCol = db.collection("courses").doc(courseId).collection("nodes");
  const snap = await nodesCol.get();

  type Node = { id: string; type: string; parentId: string | null; sortOrder: number };
  const nodes: Node[] = snap.docs.map(d => ({
    id: d.id,
    type: (d.data().type as string) ?? "page",
    parentId: (d.data().parentId as string | null) ?? null,
    sortOrder: (d.data().sortOrder as number) ?? 0,
  }));

  // Group by parentId, preserving relative sortOrder within each group
  const childrenOf = new Map<string | null, Node[]>();
  for (const n of nodes) {
    const key = n.parentId || null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(n);
  }
  childrenOf.forEach((list) => list.sort((a: Node, b: Node) => a.sortOrder - b.sortOrder));

  // DFS walk to collect nodes in the correct reading order, step by 10
  const updates: Array<{ id: string; sortOrder: number }> = [];
  let counter = 10;

  function walk(parentId: string | null) {
    const children = childrenOf.get(parentId) ?? [];
    for (const child of children) {
      updates.push({ id: child.id, sortOrder: counter });
      counter += 10;
      walk(child.id);
    }
  }

  walk(null);

  // Write in batches of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const u of updates.slice(i, i + BATCH_SIZE)) {
      batch.update(nodesCol.doc(u.id), { sortOrder: u.sortOrder });
    }
    await batch.commit();
  }

  return NextResponse.json({ ok: true, nodesReordered: updates.length });
}
