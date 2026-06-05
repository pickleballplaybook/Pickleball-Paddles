import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getFirebaseStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-gated by the shorts_auth cookie in src/middleware.ts (same gate as
// the /api/admin/drills POST endpoint, since this path starts with the same
// prefix).
//
// Uploads a single image (or other binary asset) attached to a drill
// description editor — screenshots, inline photos, etc. The browser gets
// back a public Firebase Storage download URL it can embed as <img src>.

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_PREFIXES = ["image/"];

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data body." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Missing `file` form field." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${Math.round(file.size / 1024 / 1024)} MB, max ${MAX_BYTES / 1024 / 1024} MB).` },
      { status: 413 }
    );
  }
  if (!ALLOWED_PREFIXES.some((p) => file.type.startsWith(p))) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}.` },
      { status: 415 }
    );
  }

  try {
    const bucket = getFirebaseStorage().bucket();
    const extFromName = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : "bin";
    const ext = extFromName.replace(/[^a-z0-9]/g, "") || "bin";
    const objectPath = `drill-description-assets/${randomUUID()}.${ext}`;
    const fileRef = bucket.file(objectPath);
    const buffer = Buffer.from(await file.arrayBuffer());

    const downloadToken = randomUUID();
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || "application/octet-stream",
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
      resumable: false,
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      objectPath
    )}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ url, path: objectPath });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Upload failed: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}
