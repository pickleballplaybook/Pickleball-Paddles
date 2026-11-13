import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/drills/reorder
// Body: { action: "swap", idA: string, idB: string }
//       { action: "reorder", items: { id: string; week_number: number }[] }

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const db = getFirebaseFirestore();
  const action = (body as { action?: string }).action;

  if (action === "swap") {
    const { idA, idB } = body as { idA: string; idB: string };
    if (!idA || !idB) {
      return NextResponse.json({ error: "idA and idB required." }, { status: 400 });
    }
    try {
      const [snapA, snapB] = await Promise.all([
        db.collection("programs").doc(idA).get(),
        db.collection("programs").doc(idB).get(),
      ]);
      if (!snapA.exists || !snapB.exists) {
        return NextResponse.json({ error: "Drill not found." }, { status: 404 });
      }
      const weekA = snapA.data()!.week_number as number;
      const weekB = snapB.data()!.week_number as number;
      const batch = db.batch();
      batch.update(snapA.ref, { week_number: weekB });
      batch.update(snapB.ref, { week_number: weekA });
      await batch.commit();
      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: (err as Error)?.message ?? "Unknown error." },
        { status: 500 }
      );
    }
  }

  if (action === "reorder") {
    const { items } = body as { items: { id: string; week_number: number }[] };
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required." }, { status: 400 });
    }
    try {
      const batch = db.batch();
      for (const item of items) {
        batch.update(db.collection("programs").doc(item.id), {
          week_number: item.week_number,
        });
      }
      await batch.commit();
      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: (err as Error)?.message ?? "Unknown error." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
