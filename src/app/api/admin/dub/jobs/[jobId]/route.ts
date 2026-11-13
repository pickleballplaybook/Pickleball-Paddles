import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { jobId } = await params;
  try {
    const db = getFirebaseFirestore();
    const doc = await db.collection("dub_jobs").doc(jobId).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc.data());
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
