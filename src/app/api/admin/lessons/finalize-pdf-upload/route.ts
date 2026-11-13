import { NextRequest, NextResponse } from "next/server";
import { getFirebaseStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { objectPath?: string; downloadToken?: string };
  try {
    body = (await req.json()) as { objectPath?: string; downloadToken?: string };
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  if (typeof body.objectPath !== "string" || typeof body.downloadToken !== "string") {
    return NextResponse.json({ error: "Missing objectPath or downloadToken." }, { status: 400 });
  }

  try {
    const bucket = getFirebaseStorage().bucket();
    const fileRef = bucket.file(body.objectPath);
    await fileRef.setMetadata({
      metadata: { firebaseStorageDownloadTokens: body.downloadToken },
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to finalize upload: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}
