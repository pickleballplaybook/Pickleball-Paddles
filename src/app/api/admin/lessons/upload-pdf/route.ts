import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getFirebaseStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data body." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing `file` form field." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${Math.round(file.size / 1024 / 1024)} MB, max 50 MB).` },
      { status: 413 }
    );
  }
  const isPdf =
    file.type === "application/pdf" ||
    file.type === "application/octet-stream" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json(
      { error: `Only PDF files are accepted (received type: "${file.type}", name: "${file.name}").` },
      { status: 415 }
    );
  }

  try {
    const bucket = getFirebaseStorage().bucket();
    const objectPath = `lesson-pdf-attachments/${randomUUID()}.pdf`;
    const fileRef = bucket.file(objectPath);
    const buffer = Buffer.from(await file.arrayBuffer());
    const downloadToken = randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: "application/pdf",
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
      resumable: false,
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      objectPath
    )}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ url, name: file.name, path: objectPath });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Upload failed: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}
