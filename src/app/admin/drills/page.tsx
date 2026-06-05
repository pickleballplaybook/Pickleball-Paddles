import Link from "next/link";
import { AdminNav } from "../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DrillRow = {
  id: string;
  name: string;
  category?: string;
  week_number?: number;
  video_url?: string;
  image?: string | null;
  scheduled_publish_at?: string | null;
  is_published?: boolean;
};

async function loadDrills(): Promise<DrillRow[]> {
  const db = getFirebaseFirestore();
  const snap = await db
    .collection("programs")
    .where("multi_level", "==", true)
    .get();
  const drills = snap.docs.map((d) => d.data() as DrillRow);
  drills.sort((a, b) => {
    const aw = a.week_number ?? 0;
    const bw = b.week_number ?? 0;
    if (aw !== bw) return bw - aw;
    return a.name.localeCompare(b.name);
  });
  return drills;
}

function formatScheduled(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadge(d: DrillRow): { label: string; className: string } {
  if (!d.is_published) {
    return {
      label: "Draft",
      className: "bg-gray-800 text-gray-300",
    };
  }
  if (d.scheduled_publish_at) {
    const when = new Date(d.scheduled_publish_at);
    if (!Number.isNaN(when.getTime()) && when.getTime() > Date.now()) {
      return {
        label: "Scheduled",
        className: "bg-amber-900/60 text-amber-200 border border-amber-700/60",
      };
    }
  }
  return {
    label: "Live",
    className: "bg-emerald-900/60 text-emerald-200 border border-emerald-700/60",
  };
}

export default async function DrillsListPage() {
  const drills = await loadDrills();

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

        {drills.length === 0 ? (
          <div className="rounded border border-gray-800 bg-gray-900 px-6 py-12 text-center text-sm text-gray-400">
            Upload your first drill with the <strong>New drill</strong>{" "}
            button above.
          </div>
        ) : (
          <div className="rounded border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">Drill</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Week</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-950">
                {drills.map((d) => {
                  const status = statusBadge(d);
                  return (
                    <tr
                      key={d.id}
                      className="border-t border-gray-800 hover:bg-gray-900/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {d.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={d.image}
                              alt=""
                              className="h-10 w-10 rounded object-cover bg-gray-800"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-800" />
                          )}
                          <div className="font-medium text-white truncate">
                            {d.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {d.category ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {d.week_number ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatScheduled(d.scheduled_publish_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/drills/${d.id}/edit`}
                          className="text-accent-300 hover:text-accent-200 text-sm"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
