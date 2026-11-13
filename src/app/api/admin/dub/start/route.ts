import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_LANGS = new Set(["es", "zh", "pt", "vi", "fr", "de", "ja", "ko", "ar", "hi"]);

export async function POST(req: NextRequest) {
  let body: { storagePath?: string; languages?: string[]; hd?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { storagePath, languages = [], hd = false } = body;
  if (!storagePath) return NextResponse.json({ error: "storagePath required" }, { status: 400 });
  if (languages.length === 0) return NextResponse.json({ error: "At least one language required" }, { status: 400 });
  for (const lang of languages) {
    if (!VALID_LANGS.has(lang)) {
      return NextResponse.json({ error: `Unknown language: ${lang}` }, { status: 400 });
    }
  }

  const jobId = randomUUID();
  const db = getFirebaseFirestore();

  await db.collection("dub_jobs").doc(jobId).set({
    jobId,
    status: "queued",
    progress: "Job queued...",
    languages,
    hd,
    video_path: storagePath,
    outputs: {},
    created_at: new Date().toISOString(),
  });

  const modalUrl = process.env.MODAL_ENDPOINT_URL;
  const modalSecret = process.env.MODAL_JOB_SECRET;
  if (!modalUrl || !modalSecret) {
    return NextResponse.json({ error: "MODAL_ENDPOINT_URL or MODAL_JOB_SECRET not configured" }, { status: 500 });
  }

  const triggerRes = await fetch(modalUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: modalSecret,
      job_id: jobId,
      video_storage_path: storagePath,
      languages,
      hd,
    }),
  });

  if (!triggerRes.ok) {
    const text = await triggerRes.text();
    await db.collection("dub_jobs").doc(jobId).update({
      status: "error",
      progress: `Failed to trigger Modal job: ${text}`,
    });
    return NextResponse.json({ error: "Failed to start job" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, jobId });
}
