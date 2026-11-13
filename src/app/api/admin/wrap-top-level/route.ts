import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/wrap-top-level
 *
 * Wraps the existing top-level nodes (parentId === null) of a course that
 * match the given IDs into a new wrapper folder, placed at sortOrder 0.
 * The wrapper folder's other siblings are re-sorted to come after it.
 *
 * Body: {
 *   courseId: string;          // which course to operate on
 *   wrapperTitle: string;      // name of the new top-level folder
 *   nodeIdsToWrap: string[];   // IDs of the nodes to move inside the wrapper
 * }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";
  const wrapperTitle = typeof body.wrapperTitle === "string" ? body.wrapperTitle.trim() : "";
  const nodeIdsToWrap = Array.isArray(body.nodeIdsToWrap)
    ? (body.nodeIdsToWrap as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  if (!courseId) return NextResponse.json({ error: "courseId required." }, { status: 400 });
  if (!wrapperTitle) return NextResponse.json({ error: "wrapperTitle required." }, { status: 400 });
  if (nodeIdsToWrap.length === 0) return NextResponse.json({ error: "nodeIdsToWrap must be non-empty." }, { status: 400 });

  const db = getFirebaseFirestore();
  const nodesCol = db.collection("courses").doc(courseId).collection("nodes");

  // Create the wrapper folder at sortOrder 0
  const wrapperRef = nodesCol.doc();
  await wrapperRef.set({
    title: wrapperTitle,
    type: "folder",
    parentId: null,
    sortOrder: 0,
    published: true,
    content: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Re-parent the specified nodes under the wrapper
  const batch = db.batch();
  for (const nodeId of nodeIdsToWrap) {
    batch.update(nodesCol.doc(nodeId), {
      parentId: wrapperRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  return NextResponse.json({ ok: true, wrapperFolderId: wrapperRef.id, wrapped: nodeIdsToWrap.length });
}
