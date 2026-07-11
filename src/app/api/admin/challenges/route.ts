import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-gated by the shorts_auth cookie in src/middleware.ts.
//
// GET  /api/admin/challenges  — list all challenges, newest startsAt first
// POST /api/admin/challenges  — create a new challenge (JSON body)

const COLLECTION = "community_challenges";

type ChallengeInput = {
  title?: unknown;
  description?: unknown;
  hashtag?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  active?: unknown;
};

function parseInput(body: ChallengeInput): {
  data?: {
    title: string;
    description: string;
    hashtag: string;
    startsAt: Timestamp;
    endsAt: Timestamp;
    active: boolean;
  };
  error?: string;
} {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  // Strip a leading `#` if the admin typed one by habit so the stored value is
  // always the raw tag — the client renders `#` on top.
  const hashtagRaw =
    typeof body.hashtag === "string" ? body.hashtag.trim() : "";
  const hashtag = hashtagRaw.replace(/^#+/, "");
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
    return { error: `Missing required fields: ${missing.join(", ")}.` };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(hashtag)) {
    return {
      error: "hashtag can only contain letters, numbers, and underscores.",
    };
  }

  const startsAtDate = new Date(startsAtRaw);
  const endsAtDate = new Date(endsAtRaw);
  if (Number.isNaN(startsAtDate.getTime())) {
    return { error: "startsAt is not a valid date." };
  }
  if (Number.isNaN(endsAtDate.getTime())) {
    return { error: "endsAt is not a valid date." };
  }
  if (endsAtDate.getTime() <= startsAtDate.getTime()) {
    return { error: "endsAt must be after startsAt." };
  }

  return {
    data: {
      title,
      description,
      hashtag,
      startsAt: Timestamp.fromDate(startsAtDate),
      endsAt: Timestamp.fromDate(endsAtDate),
      active,
    },
  };
}

export async function GET() {
  try {
    const db = getFirebaseFirestore();
    const snap = await db
      .collection(COLLECTION)
      .orderBy("startsAt", "desc")
      .get();
    const challenges = snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        title: (raw.title as string) ?? "",
        description: (raw.description as string) ?? "",
        hashtag: (raw.hashtag as string) ?? "",
        startsAt: (raw.startsAt as Timestamp | undefined)
          ?.toDate()
          .toISOString() ?? null,
        endsAt: (raw.endsAt as Timestamp | undefined)
          ?.toDate()
          .toISOString() ?? null,
        active: raw.active === true,
        createdAt: (raw.createdAt as Timestamp | undefined)
          ?.toDate()
          .toISOString() ?? null,
        updatedAt: (raw.updatedAt as Timestamp | undefined)
          ?.toDate()
          .toISOString() ?? null,
      };
    });
    return NextResponse.json({ challenges });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Firestore read failed: ${message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: ChallengeInput;
  try {
    body = (await req.json()) as ChallengeInput;
  } catch {
    return NextResponse.json(
      { error: "Expected JSON body." },
      { status: 400 }
    );
  }

  const parsed = parseInput(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json(
      { error: parsed.error ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = db.collection(COLLECTION).doc();
    await docRef.set({
      id: docRef.id,
      ...parsed.data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Firestore write failed: ${message}` },
      { status: 500 }
    );
  }
}
