import { AdminNav } from "../_components/AdminNav";
import { getPaddleBySlug } from "@/data/paddles";
import type { Paddle } from "@/types";
import WeeklyThumbnail from "./WeeklyThumbnail";

// Always render fresh — when you edit the slugs below the page reflects it immediately.
export const dynamic = "force-dynamic";

// ── Edit this list when you have new paddle drops to feature ─────────────────
// Order matters: the MIDDLE paddle gets the visually elevated "hero" slot.
const NEW_LAUNCH_SLUGS = [
  "11six24-ultre-power-2-elongated",
  "selkirk-omni-widebody",
  "aireo-cyclone-usap-hybrid",
];

export default function WeeklyThumbnailPage() {
  const paddles = NEW_LAUNCH_SLUGS.map(getPaddleBySlug).filter(Boolean) as Paddle[];

  return (
    <main className="min-h-screen bg-black text-white px-8 py-10">
      <AdminNav />

      <div className="max-w-[1400px]">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">New Launches Thumbnail</h1>
        <p className="text-gray-400 mb-2 max-w-2xl">
          Hype thumbnail for this week&apos;s new paddle drops, with Austin in the frame. The middle
          paddle gets the elevated hero slot, so put your headliner there.
        </p>
        <p className="text-gray-500 text-sm mb-8 max-w-2xl">
          To swap paddles, edit <code className="px-1.5 py-0.5 rounded bg-gray-900 text-gray-300 font-mono text-xs">NEW_LAUNCH_SLUGS</code>{" "}
          in <code className="px-1.5 py-0.5 rounded bg-gray-900 text-gray-300 font-mono text-xs">src/app/admin/weekly-thumbnail/page.tsx</code>{" "}
          (any 1–3 valid paddle slugs).
        </p>

        {paddles.length > 0 ? (
          <WeeklyThumbnail paddles={paddles} />
        ) : (
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-8 text-gray-400">
            <p>No paddles found for the slugs in <code>NEW_LAUNCH_SLUGS</code>. Check the slugs are correct.</p>
          </div>
        )}
      </div>
    </main>
  );
}
