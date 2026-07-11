import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 5 minutes — this writes ~180 Firestore docs
export const maxDuration = 300;

const VALID_CATEGORIES = new Set([
  "Dinks", "Drops", "Drives", "Volleys", "Ball Machine", "Wall", "Serves", "Resets",
]);

type Level = "Beginner" | "Intermediate" | "Advanced";

interface LegacyDrill {
  id: string;
  name: string;
  level: Level;
  subLevel: string;
  weekNumber: number;
  videoUrl?: string;
  description?: string;
  summary?: string;
  image?: string;
  coverUrl?: string;
  isPublished?: boolean;
}

export async function POST(req: NextRequest) {
  // Simple secret guard — pass ?secret=migrate2026 in the URL
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "migrate2026") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const db = getFirebaseFirestore();
    const col = db.collection("programs");

    // 1. Fetch all legacy drills (no multi_level flag)
    const snap = await col.where("multi_level", "==", false).get();
    // Also grab docs without the field at all (older docs)
    const snapAll = await col.get();

    const legacyDocs = snapAll.docs.filter(
      (d) => d.data().multi_level !== true && d.data().name
    );

    // 2. Group by drill name
    const byName = new Map<string, Partial<Record<Level, LegacyDrill>>>();
    for (const doc of legacyDocs) {
      const d = doc.data() as LegacyDrill;
      const name = (d.name ?? "").trim();
      if (!name) continue;
      const level = d.level as Level;
      if (!["Beginner", "Intermediate", "Advanced"].includes(level)) continue;
      if (!byName.has(name)) byName.set(name, {});
      byName.get(name)![level] = { ...d, id: doc.id };
    }

    // 3. Check which names are already migrated (multi_level:true + migrated_from_legacy:true)
    const alreadyMigrated = new Set<string>();
    const migratedSnap = await col
      .where("multi_level", "==", true)
      .where("migrated_from_legacy", "==", true)
      .get();
    for (const doc of migratedSnap.docs) {
      const name = (doc.data().name ?? "").trim();
      if (name) alreadyMigrated.add(name);
    }

    // 4. Write new multi_level docs (skip already done)
    const results: string[] = [];
    let created = 0;
    let skipped = 0;

    for (const [name, group] of Array.from(byName.entries())) {
      if (alreadyMigrated.has(name)) {
        skipped++;
        continue;
      }

      const primary = group.Advanced ?? group.Intermediate ?? group.Beginner!;
      const category = (primary.subLevel ?? "").trim();
      if (!VALID_CATEGORIES.has(category)) {
        results.push(`SKIP "${name}" — bad category "${category}"`);
        skipped++;
        continue;
      }

      // Advanced video only (per user request); fall back if needed
      const video_url =
        group.Advanced?.videoUrl ??
        group.Intermediate?.videoUrl ??
        group.Beginner?.videoUrl ??
        "";

      const ref = col.doc();
      await ref.set({
        id: ref.id,
        name,
        summary: (primary.summary ?? "").trim(),
        video_url,
        description_beginner: (group.Beginner?.description ?? "").trim(),
        description_intermediate: (group.Intermediate?.description ?? "").trim(),
        description_advanced: (group.Advanced?.description ?? "").trim(),
        level: "All",
        category,
        week_number: primary.weekNumber ?? 0,
        image: primary.image ?? primary.coverUrl ?? "",
        scheduled_publish_at: null,
        is_published: primary.isPublished !== false,
        multi_level: true,
        migrated_from_legacy: true,
      });

      created++;
      results.push(`OK "${name}" (${category}, week ${primary.weekNumber ?? 0})`);
    }

    return NextResponse.json({
      ok: true,
      created,
      skipped,
      total_groups: byName.size,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
