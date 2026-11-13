/**
 * Backfills videoThumbnailUrl for all course nodes that have a videoStorageUrl
 * but are missing a thumbnail. Uses FFmpeg to extract a frame at 2 seconds.
 *
 * Run from the Pickleball_paddles directory:
 *   npx tsx --env-file=.env.local scripts/backfill-video-thumbnails.ts
 */

import { execFileSync } from "child_process";
import fs from "fs";
import https from "https";
import http from "http";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ?? "pickleball-playbook.appspot.com";

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

const app =
  getApps().length === 0
    ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), storageBucket })
    : getApps()[0];

const db = getFirestore(app);
const storage = getStorage(app);

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        download(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    });
    req.on("error", (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function extractThumbnail(videoPath: string, thumbPath: string): Promise<boolean> {
  try {
    execFileSync("ffmpeg", [
      "-y",
      "-ss", "2",
      "-i", videoPath,
      "-vframes", "1",
      "-q:v", "3",
      "-vf", "scale=1280:-2",
      thumbPath,
    ], { stdio: "pipe" });
    return fs.existsSync(thumbPath) && fs.statSync(thumbPath).size > 0;
  } catch {
    // Try frame at 0 if 2s fails (video may be shorter)
    try {
      execFileSync("ffmpeg", [
        "-y",
        "-i", videoPath,
        "-vframes", "1",
        "-q:v", "3",
        "-vf", "scale=1280:-2",
        thumbPath,
      ], { stdio: "pipe" });
      return fs.existsSync(thumbPath) && fs.statSync(thumbPath).size > 0;
    } catch {
      return false;
    }
  }
}

async function uploadThumbnail(thumbPath: string): Promise<string> {
  const objectPath = `lesson-videos/thumbnails/${randomUUID()}.jpg`;
  const downloadToken = randomUUID();
  const bucket = storage.bucket(storageBucket);
  const fileRef = bucket.file(objectPath);

  await fileRef.save(fs.readFileSync(thumbPath), {
    metadata: {
      contentType: "image/jpeg",
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    },
  });

  return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;
}

async function main() {
  const coursesSnap = await db.collection("courses").get();
  console.log(`Found ${coursesSnap.size} courses`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const courseDoc of coursesSnap.docs) {
    const nodesSnap = await courseDoc.ref.collection("nodes").get();
    for (const nodeDoc of nodesSnap.docs) {
      const d = nodeDoc.data();
      if (!d.videoStorageUrl || d.videoThumbnailUrl) {
        skipped++;
        continue;
      }

      const nodeTitle = (d.title as string) ?? nodeDoc.id;
      console.log(`\nProcessing: "${nodeTitle}" (${nodeDoc.id})`);

      const tmpDir = os.tmpdir();
      const videoPath = path.join(tmpDir, `${randomUUID()}.mp4`);
      const thumbPath = path.join(tmpDir, `${randomUUID()}.jpg`);

      try {
        process.stdout.write("  Downloading video...");
        await download(d.videoStorageUrl as string, videoPath);
        console.log(` ${Math.round(fs.statSync(videoPath).size / 1024 / 1024)}MB`);

        process.stdout.write("  Extracting thumbnail...");
        const ok = await extractThumbnail(videoPath, thumbPath);
        if (!ok) { console.log(" FAILED"); failed++; continue; }
        console.log(" done");

        process.stdout.write("  Uploading thumbnail...");
        const thumbUrl = await uploadThumbnail(thumbPath);
        console.log(" done");

        await nodeDoc.ref.update({ videoThumbnailUrl: thumbUrl });
        console.log(`  ✓ Saved: ${thumbUrl.slice(0, 80)}...`);
        processed++;
      } catch (err) {
        console.log(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
        failed++;
      } finally {
        for (const p of [videoPath, thumbPath]) {
          try { fs.unlinkSync(p); } catch {}
        }
      }
    }
  }

  console.log(`\n--- Done: ${processed} updated, ${skipped} skipped, ${failed} failed ---`);
}

main().catch((err) => { console.error(err); process.exit(1); });
