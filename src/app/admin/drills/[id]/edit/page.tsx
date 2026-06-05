import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "../../../_components/AdminNav";
import DrillForm, { type DrillFormInitial } from "../../_components/DrillForm";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadDrill(id: string): Promise<DrillFormInitial | null> {
  const db = getFirebaseFirestore();
  const doc = await db.collection("programs").doc(id).get();
  if (!doc.exists) return null;
  const d = doc.data() ?? {};
  return {
    id,
    name: d.name ?? "",
    description_beginner: d.description_beginner ?? "",
    description_intermediate: d.description_intermediate ?? "",
    description_advanced: d.description_advanced ?? "",
    category: d.category ?? "",
    week_number: d.week_number ?? "",
    video_url: d.video_url ?? "",
    image: d.image ?? null,
    scheduled_publish_at: d.scheduled_publish_at ?? null,
    is_published: !!d.is_published,
  };
}

export default async function EditDrillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initial = await loadDrill(id);
  if (!initial) notFound();

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <AdminNav />

        <div className="mb-6">
          <Link
            href="/admin/drills"
            className="text-xs text-gray-400 hover:text-white"
          >
            ← All drills
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Edit Drill</h1>
          <p className="text-gray-400 text-sm mt-1">
            id: <code className="text-gray-500">{id}</code>
          </p>
        </div>

        <DrillForm mode="edit" drillId={id} initial={initial} />
      </div>
    </main>
  );
}
