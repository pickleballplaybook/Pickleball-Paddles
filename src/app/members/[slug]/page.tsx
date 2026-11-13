import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/bundle-auth";
import { DrillsGrid } from "./_components/DrillsGrid";
import { LogoutButton } from "./_components/LogoutButton";
import { DarkModeToggle } from "./_components/DarkModeToggle";

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

type Drill = {
  id: string;
  name: string;
  category: string;
  video_url: string;
  image?: string;
  description_beginner?: string;
  description_intermediate?: string;
  description_advanced?: string;
  week_number?: number;
};

type Bundle = {
  id: string;
  name: string;
  slug: string;
  description: string;
  drill_ids: string[];
  published: boolean;
};

async function getBundle(slug: string): Promise<Bundle | null> {
  const db = getFirebaseFirestore();
  const snap = await db
    .collection("drill_bundles")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    name: String(data.name || ""),
    slug: String(data.slug || ""),
    description: String(data.description || ""),
    drill_ids: Array.isArray(data.drill_ids) ? (data.drill_ids as string[]).map(String) : [],
    published: Boolean(data.published),
  };
}

async function getDrillsByIds(ids: string[]): Promise<Drill[]> {
  if (ids.length === 0) return [];
  const db = getFirebaseFirestore();
  const docs = await Promise.all(
    ids.map((id) => db.collection("programs").doc(id).get())
  );
  return docs
    .filter((d) => d.exists)
    .map((d) => {
      const data = d.data()!;
      return {
        id: d.id,
        name: String(data.name || ""),
        category: String(data.category || ""),
        video_url: String(data.video_url || ""),
        image: data.image ? String(data.image) : undefined,
        description_beginner: data.description_beginner ? String(data.description_beginner) : undefined,
        description_intermediate: data.description_intermediate ? String(data.description_intermediate) : undefined,
        description_advanced: data.description_advanced ? String(data.description_advanced) : undefined,
        week_number: Number(data.week_number ?? 0),
      };
    });
}

export default async function BundlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Verify session
  const cookieStore = await cookies();
  const token = cookieStore.get("bundle_session")?.value;
  if (!token) redirect(`/members/login?next=/members/${slug}`);

  const session = verifySession(token);
  if (!session) redirect(`/members/login?next=/members/${slug}`);

  // Verify member has access to this bundle
  const db = getFirebaseFirestore();
  const memberSnap = await db
    .collection("bundle_members")
    .where("email", "==", session.email)
    .limit(1)
    .get();

  if (memberSnap.empty) redirect("/members/login");
  const member = memberSnap.docs[0].data();
  if (!(member.bundle_slugs as string[] || []).includes(slug)) {
    redirect("/members/login");
  }

  const bundle = await getBundle(slug);
  if (!bundle || !bundle.published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">
          This bundle is not available yet. Check back soon.
        </p>
      </div>
    );
  }

  const drills = await getDrillsByIds(bundle.drill_ids || []);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    drills: drills.filter((d) => d.category === cat),
  })).filter((g) => g.drills.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Pickleball Drills
            </p>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{bundle.name}</h1>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-sm text-gray-400 dark:text-gray-500 hidden sm:block mr-2">{session.email}</span>
            <DarkModeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {bundle.description && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{bundle.description}</p>
        )}
        {grouped.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-600 text-sm text-center py-16">
            No drills in this bundle yet.
          </p>
        ) : (
          <DrillsGrid grouped={grouped} />
        )}
      </main>
    </div>
  );
}
