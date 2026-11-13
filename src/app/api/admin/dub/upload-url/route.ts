import { NextRequest, NextResponse } from "next/server";
import { getFirebaseStorage } from "@/lib/firebase-admin";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { filename?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { filename, contentType } = body;
  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
  }

  const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "mp4";
  const storagePath = `dub-uploads/${randomUUID()}.${ext}`;

  const bucket = getFirebaseStorage().bucket();
  const file = bucket.file(storagePath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
    contentType,
  });

  return NextResponse.json({ uploadUrl, storagePath });
}
