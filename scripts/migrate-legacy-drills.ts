/**
 * One-time migration: convert 392 legacy single-level Programs drills
 * into 181 multi_level:true documents so they appear in the admin panel.
 *
 * Run from the repo root:
 *   npx tsx --env-file=.env.local scripts/migrate-legacy-drills.ts
 */

import * as fs from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ── Firebase init ────────────────────────────────────────────────────────────

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars.");
  process.exit(1);
}

const app =
  getApps().length === 0
    ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
    : getApps()[0];

const db = getFirestore(app);

// ── Load export ──────────────────────────────────────────────────────────────

const EXPORT_PATH = "/Users/austinhardy/Desktop/Pickleball-Paddles/programs_export.json";
const exportData = JSON.parse(fs.readFileSync(EXPORT_PATH, "utf-8")) as {
  legacy_drills: LegacyDrill[];
  multi_level_drills: { name: string }[];
};

interface LegacyDrill {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  subLevel: string;
  weekNumber: number;
  videoUrl?: string;
  description?: string;
  summary?: string;
  image?: string;
  coverUrl?: string;
  isPublished?: boolean;
  isFree?: boolean;
}

// ── Category whitelist (must match admin CATEGORIES set) ──────────────────────

const VALID_CATEGORIES = new Set([
  "Dinks", "Drops", "Drives", "Volleys", "Ball Machine", "Wall", "Serves", "Resets",
]);

// ── Group legacy drills by name ───────────────────────────────────────────────

const byName = new Map<string, Partial<Record<"Beginner" | "Intermediate" | "Advanced", LegacyDrill>>>();

for (const drill of exportData.legacy_drills) {
  const name = drill.name?.trim();
  if (!name) continue; // skip the blank orphan doc
  if (!byName.has(name)) byName.set(name, {});
  byName.get(name)![drill.level] = drill;
}

console.log(`Grouped ${exportData.legacy_drills.length} legacy docs into ${byName.size} unique drills.`);

// ── Migrate ───────────────────────────────────────────────────────────────────

async function migrate() {
  const col = db.collection("programs");
  let created = 0;
  let skipped = 0;

  for (const [name, group] of Array.from(byName.entries())) {
    // Primary source for metadata: prefer Advanced > Intermediate > Beginner
    const primary = group.Advanced ?? group.Intermediate ?? group.Beginner!;

    const category = primary.subLevel?.trim();
    if (!category || !VALID_CATEGORIES.has(category)) {
      console.warn(`  SKIP "${name}" — unknown category "${category}"`);
      skipped++;
      continue;
    }

    // Video: Advanced only per user request; fall back if no Advanced exists
    const videoUrl =
      group.Advanced?.videoUrl ??
      group.Intermediate?.videoUrl ??
      group.Beginner?.videoUrl ??
      "";

    const weekNumber = primary.weekNumber ?? 0;

    const doc = {
      name,
      summary: primary.summary?.trim() ?? "",
      video_url: videoUrl,
      // Descriptions: include all levels, no video for Beginner/Intermediate
      description_beginner: group.Beginner?.description?.trim() ?? "",
      description_intermediate: group.Intermediate?.description?.trim() ?? "",
      description_advanced: group.Advanced?.description?.trim() ?? "",
      level: "All",
      category,
      week_number: weekNumber,
      image: primary.image ?? primary.coverUrl ?? "",
      scheduled_publish_at: null,
      is_published: primary.isPublished !== false,
      multi_level: true,
      migrated_from_legacy: true, // marker so we can identify these docs later
    };

    const ref = col.doc();
    await ref.set({ ...doc, id: ref.id });
    created++;
    process.stdout.write(`\r  Created ${created}…`);
  }

  console.log(`\n\nDone. Created ${created} multi-level drills, skipped ${skipped}.`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
