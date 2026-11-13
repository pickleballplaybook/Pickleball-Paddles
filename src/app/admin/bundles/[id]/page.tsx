import { notFound } from "next/navigation";
import { AdminNav } from "../../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { BundleEditor } from "./_components/BundleEditor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_ORDER = [
  "Dinks",
  "Drops",
  "Drives",
  "Volleys",
  "Ball Machine",
  "Wall",
  "Serves",
  "Resets",
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://playbookpaddles.com";

async function loadData(id: string) {
  const db = getFirebaseFirestore();

  const bundleDoc = await db.collection("drill_bundles").doc(id).get();
  if (!bundleDoc.exists) return null;
  const bundleData = bundleDoc.data()!;
  const bundle = { id: bundleDoc.id, ...bundleData };
  const slug = bundleData.slug as string;

  const drillsSnap = await db
    .collection("programs")
    .where("multi_level", "==", true)
    .get();
  const allDrills = drillsSnap.docs.map((d) => ({
    id: d.id,
    name: d.data().name as string,
    category: d.data().category as string,
    week_number: (d.data().week_number as number) ?? 0,
    is_published: d.data().is_published as boolean,
  }));
  allDrills.sort((a, b) => b.week_number - a.week_number || a.name.localeCompare(b.name));

  const membersSnap = await db
    .collection("bundle_members")
    .where("bundle_slugs", "array-contains", slug)
    .get();
  const members = membersSnap.docs.map((d) => ({
    id: d.id,
    email: d.data().email as string,
    must_reset: d.data().must_reset_password === true,
    reset_link: d.data().reset_token
      ? `${SITE_URL}/members/reset-password?token=${d.data().reset_token}`
      : null,
  }));

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    drills: allDrills.filter((d) => d.category === cat),
  })).filter((g) => g.drills.length > 0);

  return { bundle, grouped, members };
}

export default async function BundleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadData(id);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <AdminNav />
        <BundleEditor
          bundleId={id}
          initialBundle={data.bundle as Parameters<typeof BundleEditor>[0]["initialBundle"]}
          groupedDrills={data.grouped}
          initialMembers={data.members}
        />
      </div>
    </main>
  );
}
