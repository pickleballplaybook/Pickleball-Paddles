import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/merge-weeks
 *
 * Merges source courses (weeks 2–6) into a target course (week 1) as nested
 * folders. Each source course becomes a top-level folder inside the target,
 * and all nodes from the source are re-parented underneath it.
 *
 * Body: {
 *   targetCourseId: string;        // Week 1 course ID
 *   sourceCourseIds: string[];     // [week2Id, week3Id, ...] in display order
 *   deleteSources?: boolean;       // default false — set true to delete source courses
 * }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const targetCourseId = typeof body.targetCourseId === "string" ? body.targetCourseId.trim() : "";
  const sourceCourseIds = Array.isArray(body.sourceCourseIds)
    ? (body.sourceCourseIds as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const deleteSources = body.deleteSources === true;

  if (!targetCourseId) return NextResponse.json({ error: "targetCourseId is required." }, { status: 400 });
  if (sourceCourseIds.length === 0) return NextResponse.json({ error: "sourceCourseIds must be non-empty." }, { status: 400 });

  const db = getFirebaseFirestore();
  const targetNodesCol = db.collection("courses").doc(targetCourseId).collection("nodes");

  // Determine the next sortOrder to append after existing Week 1 nodes
  const existingSnap = await targetNodesCol.orderBy("sortOrder", "desc").limit(1).get();
  let nextSortOrder = existingSnap.empty ? 1 : ((existingSnap.docs[0].data().sortOrder as number) ?? 0) + 1;

  const results: Array<{ sourceId: string; wrapperFolderId: string; nodesCopied: number }> = [];

  for (const sourceCourseId of sourceCourseIds) {
    // Load source course title
    const courseDoc = await db.collection("courses").doc(sourceCourseId).get();
    if (!courseDoc.exists) {
      return NextResponse.json({ error: `Source course not found: ${sourceCourseId}` }, { status: 404 });
    }
    const courseTitle = (courseDoc.data()?.title as string) ?? "Untitled";

    // Create wrapper folder in target course
    const wrapperRef = targetNodesCol.doc();
    await wrapperRef.set({
      title: courseTitle,
      type: "folder",
      parentId: null,
      sortOrder: nextSortOrder++,
      published: true,
      content: "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Load all nodes from source course
    const sourceNodesSnap = await db
      .collection("courses").doc(sourceCourseId)
      .collection("nodes")
      .orderBy("sortOrder")
      .get();

    const sourceNodes = sourceNodesSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as {
        title: string;
        type: string;
        parentId: string | null;
        sortOrder: number;
        published: boolean;
        content: string;
        thumbnailUrl?: string | null;
        category?: string | null;
        courseTitle?: string | null;
      }),
    }));

    // Build old→new ID map (top-level nodes reparent to wrapper; children keep their relative parent)
    const oldToNew: Record<string, string> = {};
    for (const node of sourceNodes) {
      oldToNew[node.id] = targetNodesCol.doc().id;
    }

    // Write nodes in two passes: top-level first (parentId null → wrapper), then children
    const topLevel = sourceNodes.filter((n) => n.parentId === null);
    const children = sourceNodes.filter((n) => n.parentId !== null);

    const batch = db.batch();

    for (const node of topLevel) {
      const newRef = targetNodesCol.doc(oldToNew[node.id]);
      batch.set(newRef, {
        title: node.title,
        type: node.type,
        parentId: wrapperRef.id,
        sortOrder: node.sortOrder,
        published: node.published,
        content: node.content ?? "",
        thumbnailUrl: node.thumbnailUrl ?? null,
        category: node.category ?? null,
        courseTitle: node.courseTitle ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    for (const node of children) {
      const newRef = targetNodesCol.doc(oldToNew[node.id]);
      const newParentId = node.parentId ? (oldToNew[node.parentId] ?? node.parentId) : wrapperRef.id;
      batch.set(newRef, {
        title: node.title,
        type: node.type,
        parentId: newParentId,
        sortOrder: node.sortOrder,
        published: node.published,
        content: node.content ?? "",
        thumbnailUrl: node.thumbnailUrl ?? null,
        category: node.category ?? null,
        courseTitle: node.courseTitle ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    if (deleteSources) {
      // Delete source nodes first, then the course doc
      const deleteNodesBatch = db.batch();
      for (const nodeDoc of sourceNodesSnap.docs) {
        deleteNodesBatch.delete(nodeDoc.ref);
      }
      await deleteNodesBatch.commit();
      await db.collection("courses").doc(sourceCourseId).delete();
    }

    results.push({ sourceId: sourceCourseId, wrapperFolderId: wrapperRef.id, nodesCopied: sourceNodes.length });
  }

  return NextResponse.json({ ok: true, results });
}
