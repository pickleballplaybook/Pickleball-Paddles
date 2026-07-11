import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOWS: Record<string, number | null> = {
  "7": 7,
  "30": 30,
  "90": 90,
  all: null,
};

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const winKey = req.nextUrl.searchParams.get("window") ?? "30";
  const days = winKey in WINDOWS ? WINDOWS[winKey] : 30;

  const db = getFirebaseFirestore();
  let q;
  if (days === null) {
    q = db
      .collection("users")
      .where("acquisitionSource", "!=", null)
      .orderBy("acquisitionSource")
      .orderBy("acquisitionCapturedAt", "desc");
  } else {
    q = db
      .collection("users")
      .where("acquisitionCapturedAt", ">=", new Date(Date.now() - days * 86_400_000))
      .orderBy("acquisitionCapturedAt", "desc");
  }

  const snap = await q.get();

  const headers = [
    "capturedAt",
    "email",
    "name",
    "userId",
    "source",
    "detail",
    "goal",
    "blocker",
    "playFrequency",
    "triedOtherApps",
    "skillLevel",
    "sessionLength",
    "weaknesses",
    "days",
    "trainingSetup",
    "signupPlatform",
  ];
  const lines = [headers.join(",")];
  for (const d of snap.docs) {
    const data = d.data();
    const captured = data.acquisitionCapturedAt?.toDate?.()?.toISOString?.() ?? "";
    const joinList = (v: unknown) =>
      Array.isArray(v) ? (v as unknown[]).join("; ") : "";
    lines.push(
      [
        captured,
        data.email ?? "",
        data.name ?? "",
        d.id,
        data.acquisitionSource ?? "",
        data.acquisitionDetail ?? "",
        data.goal ?? "",
        data.blocker ?? "",
        data.playFrequency ?? "",
        data.triedOtherApps ?? "",
        data.onboardingLevel ?? "",
        data.onboardingSessionLength ?? "",
        joinList(data.onboardingWeaknesses),
        joinList(data.onboardingDays),
        joinList(data.onboardingTrainingSetup),
        data.signupPlatform ?? "",
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="acquisition-${winKey}.csv"`,
    },
  });
}
