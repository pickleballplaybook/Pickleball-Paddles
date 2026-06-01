import Link from "next/link";
import { AdminNav } from "../_components/AdminNav";
import { getLatestWeek } from "../../best-pickleball-paddles/weekly/rankingsData";
import WeeklyThumbnail from "./WeeklyThumbnail";

// Always pull the freshest snapshot — the Monday cron writes a new top 10 and
// this page should reflect it as soon as you visit.
export const dynamic = "force-dynamic";

export default async function WeeklyThumbnailPage() {
  const latest = await getLatestWeek();
  const top1 = latest?.rankings[0]?.paddle ?? null;

  return (
    <main className="min-h-screen bg-black text-white px-8 py-10">
      <AdminNav />

      <div className="max-w-[1400px]">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Weekly #1 Thumbnail</h1>
        <p className="text-gray-400 mb-8 max-w-2xl">
          Auto-pulls the current week&apos;s #1 trending paddle from the latest
          <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-900 text-gray-300 font-mono text-xs">weekly_rankings</code>
          snapshot. Every Monday the cron writes a new top 10 — refresh this page after that to grab a fresh thumbnail.
          One-click PNG download below.
        </p>

        {top1 && latest ? (
          <WeeklyThumbnail paddle={top1} weekDate={latest.weekDate} />
        ) : (
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-8 text-gray-400">
            <p className="mb-2">No weekly ranking snapshot found yet.</p>
            <p className="text-sm">
              Trigger the weekly cron once and return here. (Visit{" "}
              <Link href="/api/cron/weekly-rankings?secret=YOUR_CRON_SECRET" className="text-green-400 underline">
                /api/cron/weekly-rankings?secret=…
              </Link>{" "}
              to generate this week&apos;s snapshot manually.)
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
