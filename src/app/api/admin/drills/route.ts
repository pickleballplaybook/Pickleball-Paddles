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
// POST: write a new "multi-level" drill document to Firestore. The mobile
// app distinguishes these from older single-level drills by the
// `multi_level: true` flag, so existing records stay untouched.
//
// GET: list all multi-level drills, sorted by week_number desc.

const COLLECTION = "programs";

export async function GET() {
  try {
    const db = getFirebaseFirestore();
    const snap = await db
      .collection(COLLECTION)
      .where("multi_level", "==", true)
      .get();
    const drills = snap.docs.map((d) => d.data());
    drills.sort((a, b) => {
      const aw = (a.week_number as number | undefined) ?? 0;
      const bw = (b.week_number as number | undefined) ?? 0;
      if (aw !== bw) return bw - aw;
      return ((a.name as string) ?? "").localeCompare((b.name as string) ?? "");
    });
    return NextResponse.json({ drills });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Firestore read failed: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}

const CATEGORIES = new Set([
  "Dinks",
  "Drops",
  "Drives",
  "Volleys",
  "Ball Machine",
  "Wall",
  "Serves",
  "Resets",
]);

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

  const name = (formData.get("name") ?? "").toString().trim();
  const summary = (formData.get("summary") ?? "").toString().trim();
  const description_beginner = (formData.get("description_beginner") ?? "").toString();
  const description_intermediate = (formData.get("description_intermediate") ?? "").toString();
  const description_advanced = (formData.get("description_advanced") ?? "").toString();
  const category = (formData.get("category") ?? "").toString().trim();
  const week_number_raw = (formData.get("week_number") ?? "").toString().trim();
  const video_url = (formData.get("video_url") ?? "").toString().trim();
  const is_published = formData.get("is_published") === "true";
  const scheduled_publish_at_raw = (formData.get("scheduled_publish_at") ?? "")
    .toString()
    .trim();
  const imageField = formData.get("image");

  // Optional schedule field. Client converts the datetime-local input to an
  // ISO string before submitting; we re-parse here to validate and to store
  // a canonical ISO-8601 UTC instant.
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

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!category) missing.push("category");
  if (!video_url) missing.push("video_url");
  // Per-level descriptions are optional: some drills have a description,
  // others don't. The mobile app already falls back through the levels.

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

  const db = getFirebaseFirestore();
  const docRef = db.collection(COLLECTION).doc();

  let imageUrl: string | null = null;
  if (imageField instanceof File && imageField.size > 0) {
    try {
      const bucket = getFirebaseStorage().bucket();
      const extFromName = imageField.name.includes(".")
        ? imageField.name.split(".").pop()!.toLowerCase()
        : "bin";
      const ext = extFromName.replace(/[^a-z0-9]/g, "") || "bin";
      const objectPath = `drill-images/${docRef.id}.${ext}`;
      const fileRef = bucket.file(objectPath);
      const buffer = Buffer.from(await imageField.arrayBuffer());

      // Tag the upload so it can be served via the standard Firebase
      // Storage download URL pattern (no signed-URL expiry).
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
  }

  const drill = {
    id: docRef.id,
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
    await docRef.set(drill);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Firestore write failed: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: docRef.id });
}
