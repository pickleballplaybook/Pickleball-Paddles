import Link from "next/link";
import { AdminNav } from "../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Bundle = {
  id: string;
  name: string;
  slug: string;
  drill_ids: string[];
  published: boolean;
};

async function loadBundles(): Promise<Bundle[]> {
  const db = getFirebaseFirestore();
  const snap = await db.collection("drill_bundles").orderBy("created_at", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bundle));
}

export default async function BundlesListPage() {
  const bundles = await loadBundles();

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <AdminNav />

        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Member Bundles</h1>
            <p className="text-sm text-gray-400 mt-1">
              Drill packs — members access via{" "}
              <span className="font-mono text-gray-300">playbookpaddles.com/members/[slug]</span>
            </p>
          </div>
          <Link
            href="/admin/bundles/new"
            className="bg-accent-500 hover:opacity-90 text-black font-medium px-4 py-2 rounded text-sm"
          >
            + New bundle
          </Link>
        </div>

        {bundles.length === 0 ? (
          <div className="rounded border border-gray-800 bg-gray-900 px-6 py-12 text-center text-sm text-gray-400">
            No bundles yet. Create one to get started.
          </div>
        ) : (
          <div className="rounded border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">Bundle</th>
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">Drills</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-950">
                {bundles.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t border-gray-800 hover:bg-gray-900/60"
                  >
                    <td className="px-4 py-3 font-medium text-white">{b.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      /members/{b.slug}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {(b.drill_ids || []).length}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          b.published
                            ? "bg-emerald-900/60 text-emerald-200 border border-emerald-700/60"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {b.published ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-3">
                      <a
                        href={`/members/${b.slug}`}
                        target="_blank"
                        className="text-gray-500 hover:text-gray-300 text-xs"
                      >
                        Preview ↗
                      </a>
                      <Link
                        href={`/admin/bundles/${b.id}`}
                        className="text-accent-300 hover:text-accent-200 text-sm"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
