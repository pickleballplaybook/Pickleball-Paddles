import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getFirebaseStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let corsSet = false;
async function ensureCors(bucket: ReturnType<ReturnType<typeof getFirebaseStorage>["bucket"]>) {
  if (corsSet) return;
  await bucket.setMetadata({
    cors: [
      {
        origin: ["*"],
        method: ["GET", "PUT", "OPTIONS"],
        responseHeader: ["Content-Type", "Authorization", "Accept-Ranges", "Content-Range"],
        maxAgeSeconds: 3600,
      },
    ],
  });
  corsSet = true;
}

export async function POST(req: NextRequest) {
  let body: { filename?: string; contentType?: string } = {};
  try {
    body = (await req.json()) as { filename?: string; contentType?: string };
  } catch {
    // optional
  }

  const ext = (body.filename ?? "video.mp4").split(".").pop() ?? "mp4";
  const contentType = body.contentType ?? "video/mp4";
  const objectPath = `lesson-videos/${randomUUID()}.${ext}`;
  const downloadToken = randomUUID();

  try {
    const bucket = getFirebaseStorage().bucket();
    await ensureCors(bucket);
    const fileRef = bucket.file(objectPath);

    const [signedUrl] = await fileRef.getSignedUrl({
      action: "write",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour for large video files
      contentType,
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ signedUrl, publicUrl, objectPath, downloadToken });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to generate upload URL: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}
