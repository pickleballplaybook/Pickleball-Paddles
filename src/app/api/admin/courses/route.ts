import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COL = "courses";

export async function GET() {
  try {
    const db = getFirebaseFirestore();
    const snap = await db.collection(COL).orderBy("sortOrder").get();
    const courses = snap.docs.map((d) => {
      const r = d.data();
      return {
        id: d.id,
        title: (r.title as string) ?? "",
        description: (r.description as string) ?? "",
        accessType: (r.accessType as string) ?? "open",
        coverImageUrl: (r.coverImageUrl as string | null) ?? null,
        published: r.published === true,
        sortOrder: (r.sortOrder as number) ?? 0,
      };
    });
    return NextResponse.json({ courses });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "title is required." }, { status: 400 });

  try {
    const db = getFirebaseFirestore();
    const col = db.collection(COL);
    const snap = await col.orderBy("sortOrder", "desc").limit(1).get();
    const maxOrder = snap.empty ? 0 : ((snap.docs[0].data().sortOrder as number) ?? 0);
    const ref = col.doc();
    await ref.set({
      title,
      description: typeof body.description === "string" ? body.description.trim() : "",
      accessType: typeof body.accessType === "string" ? body.accessType : "open",
      coverImageUrl: typeof body.coverImageUrl === "string" && body.coverImageUrl ? body.coverImageUrl : null,
      published: body.published === true,
      sortOrder: maxOrder + 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
