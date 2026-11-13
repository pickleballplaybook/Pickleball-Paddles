import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getFirebaseFirestore();
  const snap = await db.collection("drill_bundles").orderBy("created_at", "desc").get();
  const bundles = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ bundles });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, slug, description } = body as { name: string; slug: string; description?: string };
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }
  const db = getFirebaseFirestore();
  const existing = await db.collection("drill_bundles").where("slug", "==", slug).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }
  const ref = await db.collection("drill_bundles").add({
    name,
    slug,
    description: description || "",
    drill_ids: [],
    published: false,
    created_at: new Date().toISOString(),
  });
  return NextResponse.json({ id: ref.id });
}
