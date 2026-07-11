import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET  /api/admin/lessons  — list all lesson categories
// POST /api/admin/lessons  — create a new category

const COLLECTION = "community_lesson_categories";

type LessonInput = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  minLevel?: unknown;
  requiresPro?: unknown;
  order?: unknown;
  isActive?: unknown;
};

function parseInput(
  body: LessonInput,
  requireId: boolean
): { data?: object; id?: string; error?: string } {
  const id =
    typeof body.id === "string"
      ? body.id.trim().replace(/\s+/g, "_")
      : "";
  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const minLevel =
    typeof body.minLevel === "number" && body.minLevel >= 1
      ? Math.floor(body.minLevel)
      : null;
  const requiresPro = body.requiresPro === true;
  const order =
    typeof body.order === "number" ? Math.floor(body.order) : 0;
  const isActive = body.isActive !== false;

  const missing: string[] = [];
  if (requireId && !id) missing.push("id");
  if (!title) missing.push("title");
  if (minLevel === null) missing.push("minLevel (must be ≥ 1)");
  if (missing.length > 0) {
    return { error: `Missing/invalid fields: ${missing.join(", ")}.` };
  }

  if (requireId && !/^[a-zA-Z0-9_]+$/.test(id)) {
    return {
      error:
        "Category ID can only contain letters, numbers, and underscores.",
    };
  }

  return {
    id,
    data: { title, description, minLevel, requiresPro, order, isActive },
  };
}

export async function GET() {
  try {
    const db = getFirebaseFirestore();
    const snap = await db.collection(COLLECTION).orderBy("order").get();
    const categories = snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        title: (raw.title as string) ?? "",
        description: (raw.description as string) ?? "",
        minLevel: (raw.minLevel as number) ?? 3,
        requiresPro: raw.requiresPro === true,
        order: (raw.order as number) ?? 0,
        isActive: raw.isActive !== false,
      };
    });
    return NextResponse.json({ categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Firestore read failed: ${message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: LessonInput;
  try {
    body = (await req.json()) as LessonInput;
  } catch {
    return NextResponse.json(
      { error: "Expected JSON body." },
      { status: 400 }
    );
  }

  const parsed = parseInput(body, true);
  if (parsed.error || !parsed.data || !parsed.id) {
    return NextResponse.json(
      { error: parsed.error ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = db.collection(COLLECTION).doc(parsed.id);
    const existing = await docRef.get();
    if (existing.exists) {
      return NextResponse.json(
        { error: `A category with ID "${parsed.id}" already exists.` },
        { status: 409 }
      );
    }
    await docRef.set({
      ...parsed.data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: parsed.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Firestore write failed: ${message}` },
      { status: 500 }
    );
  }
}

// Seed the 8 default categories if the collection is empty.
export async function PUT() {
  const defaults = [
    { id: "Dinks", title: "Dinks", description: "Win the kitchen game with precise placement", minLevel: 3, requiresPro: true, order: 1 },
    { id: "Drives", title: "Drives", description: "Speed and power built into your ground strokes", minLevel: 3, requiresPro: true, order: 2 },
    { id: "Drops", title: "Drops", description: "Transition to the net consistently, with ease", minLevel: 3, requiresPro: true, order: 3 },
    { id: "Volleys", title: "Volleys", description: "Dominate the net with clean, decisive volleys", minLevel: 3, requiresPro: true, order: 4 },
    { id: "Resets", title: "Resets", description: "Soft hands and control to neutralize fast attacks", minLevel: 3, requiresPro: true, order: 5 },
    { id: "Overhead", title: "Overhead", description: "Finishing shots from above with maximum power", minLevel: 3, requiresPro: true, order: 6 },
    { id: "Serve", title: "Serve", description: "Techniques to get more serve power and gain the advantage", minLevel: 3, requiresPro: true, order: 7 },
    { id: "Specialty", title: "Specialty", description: "Advanced specialty shots to elevate your game", minLevel: 3, requiresPro: true, order: 8 },
  ];

  try {
    const db = getFirebaseFirestore();
    const col = db.collection(COLLECTION);
    const snap = await col.limit(1).get();
    if (!snap.empty) {
      return NextResponse.json(
        { error: "Collection already has data. Use individual edits to update." },
        { status: 409 }
      );
    }
    const batch = db.batch();
    for (const cat of defaults) {
      const { id, ...data } = cat;
      batch.set(col.doc(id), {
        ...data,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    return NextResponse.json({ ok: true, seeded: defaults.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Seed failed: ${message}` },
      { status: 500 }
    );
  }
}
