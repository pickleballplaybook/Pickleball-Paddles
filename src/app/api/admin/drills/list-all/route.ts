import { NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirebaseFirestore();
    const snap = await db.collection("programs").orderBy("name").get();
    const drills = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: (data.name as string | undefined) ?? "Untitled",
        imageUrl: (data.image as string | undefined) ?? "",
      };
    });
    return NextResponse.json({ drills });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
