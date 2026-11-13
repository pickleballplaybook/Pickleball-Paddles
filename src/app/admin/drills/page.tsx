import Link from "next/link";
import { AdminNav } from "../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { DrillsTableClient } from "./DrillsTableClient";
import type { DrillRow } from "./DrillsTableClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Order matches the mobile app's drill grid, with Serves and Resets at the
// end for the newer categories.
const CATEGORY_TABS = [
  "Dinks",
  "Drops",
  "Drives",
  "Volleys",
  "Ball Machine",
  "Wall",
  "Serves",
  "Resets",
] as const;

type CategoryTab = (typeof CATEGORY_TABS)[number];

async function loadDrills(): Promise<DrillRow[]> {
  const db = getFirebaseFirestore();
  const snap = await db
    .collection("programs")
    .where("multi_level", "==", true)
    .get();
  const drills: DrillRow[] = snap.docs.map((d) => {
    const data = d.data();
    // Firestore Timestamps must be serialized before passing to a client component.
    const rawScheduled = data.scheduled_publish_at;
    let scheduled_publish_at: string | null = null;
    if (rawScheduled) {
      if (typeof rawScheduled === "string") {
        scheduled_publish_at = rawScheduled;
      } else if (typeof rawScheduled.toDate === "function") {
        scheduled_publish_at = (rawScheduled.toDate() as Date).toISOString();
      }
    }
    return {
      id: (data.id as string) ?? d.id,
      name: (data.name as string) ?? "",
      category: data.category as string | undefined,
      week_number: data.week_number as number | undefined,
      video_url: data.video_url as string | undefined,
      image: (data.image as string | null | undefined) ?? null,
      scheduled_publish_at,
      is_published: data.is_published as boolean | undefined,
    };
  });
  drills.sort((a, b) => {
    const aw = a.week_number ?? 0;
    const bw = b.week_number ?? 0;
    if (aw !== bw) return aw - bw;
    return a.name.localeCompare(b.name);
  });
  return drills;
}

function isCategoryTab(value: string | undefined): value is CategoryTab {
  return CATEGORY_TABS.includes(value as CategoryTab);
}

export default async function DrillsListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const drills = await loadDrills();
  const { category } = await searchParams;
  const activeTab: CategoryTab | null = isCategoryTab(category) ? category : null;
  const filtered = activeTab
    ? drills.filter((d) => d.category === activeTab)
    : drills;
  const countsByCategory = drills.reduce<Record<string, number>>((acc, d) => {
    if (d.category) acc[d.category] = (acc[d.category] ?? 0) + 1;
    return acc;
  }, {});

  // Group the "All" view by category so the page collapses to one row per
  // category by default — clicking the chevron expands the drills inside.
  // The CATEGORY_TABS order is preserved so the layout matches the tabs row
  // above and the mobile drills grid. Categories with zero drills are
  // skipped. Drills are sorted within each group by week descending (same
  // ordering as loadDrills uses globally).
  const grouped: { category: CategoryTab; drills: DrillRow[] }[] = CATEGORY_TABS
    .map((cat) => ({ category: cat, drills: drills.filter((d) => d.category === cat) }))
    .filter((g) => g.drills.length > 0);

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <AdminNav />

        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Drills</h1>
            <p className="text-sm text-gray-400 mt-1">
              {drills.length === 0
                ? "No drills yet."
                : `${drills.length} drill${drills.length === 1 ? "" : "s"} uploaded.`}
            </p>
          </div>
          <Link
            href="/admin/drills/new"
            className="bg-accent-500 hover:opacity-90 text-black font-medium px-4 py-2 rounded text-sm"
          >
            + New drill
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-800 pb-3">
          <TabLink label="All" count={drills.length} href="/admin/drills" active={activeTab === null} />
          {CATEGORY_TABS.map((cat) => (
            <TabLink
              key={cat}
              label={cat}
              count={countsByCategory[cat] ?? 0}
              href={`/admin/drills?category=${encodeURIComponent(cat)}`}
              active={activeTab === cat}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded border border-gray-800 bg-gray-900 px-6 py-12 text-center text-sm text-gray-400">
            {activeTab
              ? <>No {activeTab.toLowerCase()} drills yet.</>
              : <>Upload your first drill with the <strong>New drill</strong> button above.</>}
          </div>
        ) : activeTab === null ? (
          // All-tab: one collapsed group per category using native <details>
          // so we don't need a client component for the expand/collapse.
          <div className="space-y-3">
            {grouped.map((group) => (
              <CategoryGroup key={group.category} category={group.category} drills={group.drills} />
            ))}
          </div>
        ) : (
          // Single-category tab: keep the flat table — the user already
          // chose the filter via the tab so collapsing would add a click.
          <div className="rounded border border-gray-800 overflow-hidden">
            <DrillsTableClient initialDrills={filtered} />
          </div>
        )}
      </div>
    </main>
  );
}

function CategoryGroup({ category, drills }: { category: CategoryTab; drills: DrillRow[] }) {
  const liveCount = drills.filter((d) => d.is_published).length;
  const scheduledCount = drills.filter(
    (d) =>
      d.is_published &&
      d.scheduled_publish_at &&
      new Date(d.scheduled_publish_at).getTime() > Date.now()
  ).length;
  const draftCount = drills.length - liveCount;
  return (
    <details className="group rounded border border-gray-800 overflow-hidden bg-gray-950 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center gap-4 px-4 py-3 cursor-pointer select-none bg-gray-900 hover:bg-gray-900/70 list-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90"
        >
          <path
            fillRule="evenodd"
            d="M6.22 4.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L10.94 10 6.22 5.28a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-semibold text-white">{category}</span>
        <span className="text-xs text-gray-400">
          {drills.length} drill{drills.length === 1 ? "" : "s"}
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs">
          {liveCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/60">
              {liveCount} live
            </span>
          )}
          {scheduledCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/60">
              {scheduledCount} scheduled
            </span>
          )}
          {draftCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">
              {draftCount} draft
            </span>
          )}
        </span>
      </summary>
      <DrillsTableClient initialDrills={drills} />
    </details>
  );
}

function TabLink({
  label,
  count,
  href,
  active,
}: {
  label: string;
  count: number;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "px-3 py-1.5 rounded text-sm font-medium bg-accent-500 text-black"
          : "px-3 py-1.5 rounded text-sm font-medium text-gray-300 hover:bg-gray-800"
      }
    >
      {label}
      <span className={active ? "ml-1.5 text-black/70" : "ml-1.5 text-gray-500"}>
        {count}
      </span>
    </Link>
  );
}
