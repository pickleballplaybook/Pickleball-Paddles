import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getFirebaseFirestore,
  getFirebaseStorage,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-gated by the shorts_auth cookie in src/middleware.ts.
//
// GET    /api/admin/drills/[id]  — fetch a single drill doc
// PUT    /api/admin/drills/[id]  — update a drill (multipart/form-data)
// DELETE /api/admin/drills/[id]  — delete a drill doc

const COLLECTION = "programs";

const CATEGORIES = new Set([
  "Dinks",
  "Drops",
  "Drives",
  "Volleys",
  "Ball Machine",
  "Wall",
]);

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  try {
    const db = getFirebaseFirestore();
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(doc.data());
  } catch (err: any) {
    return NextResponse.json(
      { error: `Firestore read failed: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data body." },
      { status: 400 }
    );
  }

  const name = (formData.get("name") ?? "").toString().trim();
  const summary = (formData.get("summary") ?? "").toString().trim();
  const description_beginner = (
    formData.get("description_beginner") ?? ""
  ).toString();
  const description_intermediate = (
    formData.get("description_intermediate") ?? ""
  ).toString();
  const description_advanced = (
    formData.get("description_advanced") ?? ""
  ).toString();
  const category = (formData.get("category") ?? "").toString().trim();
  const week_number_raw = (formData.get("week_number") ?? "")
    .toString()
    .trim();
  const video_url = (formData.get("video_url") ?? "").toString().trim();
  const is_published = formData.get("is_published") === "true";
  const scheduled_publish_at_raw = (
    formData.get("scheduled_publish_at") ?? ""
  )
    .toString()
    .trim();
  const imageField = formData.get("image");
  const existing_image_url = (
    formData.get("existing_image_url") ?? ""
  ).toString();

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!description_beginner) missing.push("description_beginner");
  if (!description_intermediate) missing.push("description_intermediate");
  if (!description_advanced) missing.push("description_advanced");
  if (!category) missing.push("category");
  if (!video_url) missing.push("video_url");

  const week_number = Number(week_number_raw);
  if (!Number.isFinite(week_number) || !Number.isInteger(week_number)) {
    missing.push("week_number");
  }

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Missing or invalid fields.", fields: missing },
      { status: 400 }
    );
  }

  if (!CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: `Unknown category "${category}".` },
      { status: 400 }
    );
  }

  let scheduled_publish_at: string | null = null;
  if (scheduled_publish_at_raw) {
    const parsed = new Date(scheduled_publish_at_raw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "scheduled_publish_at is not a valid date." },
        { status: 400 }
      );
    }
    scheduled_publish_at = parsed.toISOString();
  }

  const db = getFirebaseFirestore();
  const docRef = db.collection(COLLECTION).doc(id);

  // Verify the doc exists before updating (returns 404 if not).
  const existing = await docRef.get();
  if (!existing.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Image: new upload wins; otherwise keep `existing_image_url` from the
  // client; otherwise (neither provided) clear the field.
  let imageUrl: string | null = null;
  if (imageField instanceof File && imageField.size > 0) {
    try {
      const bucket = getFirebaseStorage().bucket();
      const extFromName = imageField.name.includes(".")
        ? imageField.name.split(".").pop()!.toLowerCase()
        : "bin";
      const ext = extFromName.replace(/[^a-z0-9]/g, "") || "bin";
      const objectPath = `drill-images/${id}-${randomUUID().slice(0, 8)}.${ext}`;
      const fileRef = bucket.file(objectPath);
      const buffer = Buffer.from(await imageField.arrayBuffer());
      const downloadToken = randomUUID();
      await fileRef.save(buffer, {
        metadata: {
          contentType: imageField.type || "application/octet-stream",
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
        resumable: false,
      });
      imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        objectPath
      )}?alt=media&token=${downloadToken}`;
    } catch (err: any) {
      return NextResponse.json(
        { error: `Image upload failed: ${err?.message ?? "unknown error"}` },
        { status: 500 }
      );
    }
  } else if (existing_image_url) {
    imageUrl = existing_image_url;
  }

  const update = {
    id,
    name,
    summary,
    video_url,
    description_beginner,
    description_intermediate,
    description_advanced,
    level: "All",
    category,
    week_number,
    image: imageUrl ?? "",
    scheduled_publish_at,
    is_published,
    multi_level: true,
  };

  try {
    await docRef.set(update, { merge: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Firestore write failed: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  try {
    const db = getFirebaseFirestore();
    const docRef = db.collection(COLLECTION).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await docRef.delete();
    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Firestore delete failed: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}
