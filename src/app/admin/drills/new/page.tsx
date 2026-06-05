import Link from "next/link";
import { AdminNav } from "../../_components/AdminNav";
import DrillForm from "../_components/DrillForm";

export const dynamic = "force-dynamic";

export default function NewDrillPage() {
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
          <h1 className="text-2xl font-semibold mt-2">Upload Drill</h1>
          <p className="text-gray-400 text-sm mt-1">
            Creates one drill record with separate Beginner / Intermediate /
            Advanced descriptions and a single video. Saved with{" "}
            <code className="text-accent-300">multi_level: true</code> so the
            mobile app can distinguish it from older single-level drills.
          </p>
        </div>

        <DrillForm mode="create" />
      </div>
    </main>
  );
}
