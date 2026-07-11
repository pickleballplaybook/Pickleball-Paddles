import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "cleanup2026") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const db = getFirebaseFirestore();
    const col = db.collection("programs");

    // 1. Fetch all migrated multi-level docs
    const migratedSnap = await col
      .where("multi_level", "==", true)
      .where("migrated_from_legacy", "==", true)
      .get();

    // 2. Fetch all legacy docs (no multi_level flag or multi_level !== true)
    const allSnap = await col.get();
    const legacyDocs = allSnap.docs.filter(
      (d) => d.data().multi_level !== true && d.data().name
    );

    // Build index of legacy docs by name → array of {id, level}
    const legacyByName = new Map<string, Array<{ id: string; level: string }>>();
    for (const doc of legacyDocs) {
      const name = ((doc.data().name as string) ?? "").trim();
      const level = (doc.data().level as string) ?? "";
      if (!name) continue;
      if (!legacyByName.has(name)) legacyByName.set(name, []);
      legacyByName.get(name)!.push({ id: doc.id, level });
    }

    const toDelete: string[] = []; // doc IDs to delete
    const kept: string[] = [];    // doc names kept as-is
    const log: string[] = [];

    for (const mDoc of migratedSnap.docs) {
      const name = ((mDoc.data().name as string) ?? "").trim();
      const legacyGroup = legacyByName.get(name) ?? [];
      const hasAdvanced = legacyGroup.some((d) => d.level === "Advanced");

      if (hasAdvanced) {
        // Delete ALL legacy docs for this drill — multi-level doc replaces them
        for (const legacy of legacyGroup) {
          toDelete.push(legacy.id);
        }
        log.push(`KEEP multi-level + DELETE ${legacyGroup.length} legacy docs for "${name}"`);
      } else {
        // No Advanced version: delete the multi-level doc I created,
        // delete any Intermediate legacy doc, keep Beginner legacy doc.
        toDelete.push(mDoc.id);
        for (const legacy of legacyGroup) {
          if (legacy.level !== "Beginner") {
            toDelete.push(legacy.id);
          } else {
            kept.push(name);
          }
        }
        log.push(`DELETE multi-level + keep Beginner legacy for "${name}"`);
      }
    }

    // 3. Batch-delete in groups of 500 (Firestore limit)
    const BATCH_SIZE = 499;
    let totalDeleted = 0;
    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = toDelete.slice(i, i + BATCH_SIZE);
      for (const id of chunk) {
        batch.delete(col.doc(id));
      }
      await batch.commit();
      totalDeleted += chunk.length;
    }

    return NextResponse.json({
      ok: true,
      deleted: totalDeleted,
      beginner_only_kept: kept.length,
      log,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
