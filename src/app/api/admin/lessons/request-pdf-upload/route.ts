import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getFirebaseStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ensure the bucket allows browser PUTs (CORS). Idempotent — safe to call on every cold start.
let corsSet = false;
async function ensureCors(bucket: ReturnType<ReturnType<typeof getFirebaseStorage>["bucket"]>) {
  if (corsSet) return;
  await bucket.setMetadata({
    cors: [
      {
        origin: ["*"],
        method: ["PUT", "OPTIONS"],
        responseHeader: ["Content-Type"],
        maxAgeSeconds: 3600,
      },
    ],
  });
  corsSet = true;
}

export async function POST(req: NextRequest) {
  let body: { filename?: string } = {};
  try {
    body = (await req.json()) as { filename?: string };
  } catch {
    // filename is optional
  }

  const filename = typeof body.filename === "string" ? body.filename : "attachment.pdf";
  const objectPath = `lesson-pdf-attachments/${randomUUID()}.pdf`;
  const downloadToken = randomUUID();

  try {
    const bucket = getFirebaseStorage().bucket();
    await ensureCors(bucket);
    const fileRef = bucket.file(objectPath);

    const [signedUrl] = await fileRef.getSignedUrl({
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: "application/pdf",
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ signedUrl, publicUrl, objectPath, downloadToken, name: filename });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to generate upload URL: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}
