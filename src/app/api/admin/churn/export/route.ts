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
  const base = db.collection("cancellation_reasons");
  const q =
    days === null
      ? base.orderBy("createdAt", "desc")
      : base
          .where("createdAt", ">=", new Date(Date.now() - days * 86_400_000))
          .orderBy("createdAt", "desc");

  const snap = await q.get();

  const headers = ["createdAt", "email", "name", "userId", "reason", "comment", "plan", "platform"];
  const lines = [headers.join(",")];
  for (const d of snap.docs) {
    const data = d.data();
    const created = data.createdAt?.toDate?.()?.toISOString?.() ?? "";
    lines.push(
      [
        created,
        data.email ?? "",
        data.name ?? "",
        data.userId ?? "",
        data.reason ?? "",
        data.comment ?? "",
        data.plan ?? "",
        data.platform ?? "",
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
      "content-disposition": `attachment; filename="churn-reasons-${winKey}.csv"`,
    },
  });
}
