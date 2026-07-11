import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-gated by the shorts_auth cookie in src/middleware.ts.
//
// PATCH  /api/admin/challenges/[id]  — update a challenge (JSON body)
// DELETE /api/admin/challenges/[id]  — delete a challenge

const COLLECTION = "community_challenges";

type ChallengeInput = {
  title?: unknown;
  description?: unknown;
  hashtag?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  active?: unknown;
};

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;

  let body: ChallengeInput;
  try {
    body = (await req.json()) as ChallengeInput;
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const hashtag =
    typeof body.hashtag === "string"
      ? body.hashtag.trim().replace(/^#+/, "")
      : "";
  const startsAtRaw = typeof body.startsAt === "string" ? body.startsAt : "";
  const endsAtRaw = typeof body.endsAt === "string" ? body.endsAt : "";
  const active = body.active === true;

  const missing: string[] = [];
  if (!title) missing.push("title");
  if (!description) missing.push("description");
  if (!hashtag) missing.push("hashtag");
  if (!startsAtRaw) missing.push("startsAt");
  if (!endsAtRaw) missing.push("endsAt");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}.` },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9_]+$/.test(hashtag)) {
    return NextResponse.json(
      { error: "hashtag can only contain letters, numbers, and underscores." },
      { status: 400 }
    );
  }

  const startsAtDate = new Date(startsAtRaw);
  const endsAtDate = new Date(endsAtRaw);
  if (Number.isNaN(startsAtDate.getTime())) {
    return NextResponse.json(
      { error: "startsAt is not a valid date." },
      { status: 400 }
    );
  }
  if (Number.isNaN(endsAtDate.getTime())) {
    return NextResponse.json(
      { error: "endsAt is not a valid date." },
      { status: 400 }
    );
  }
  if (endsAtDate.getTime() <= startsAtDate.getTime()) {
    return NextResponse.json(
      { error: "endsAt must be after startsAt." },
      { status: 400 }
    );
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = db.collection(COLLECTION).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await docRef.set(
      {
        id,
        title,
        description,
        hashtag,
        startsAt: Timestamp.fromDate(startsAtDate),
        endsAt: Timestamp.fromDate(endsAtDate),
        active,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Firestore write failed: ${message}` },
      { status: 500 }
    );
  }
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Firestore delete failed: ${message}` },
      { status: 500 }
    );
  }
}
