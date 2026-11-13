import { AdminNav } from "../_components/AdminNav";
import DubClient from "./DubClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function DubPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <AdminNav />
        <h1 className="text-2xl font-semibold mb-1">Video Dubbing</h1>
        <p className="text-gray-400 text-sm mb-8">
          Drop a video, pick languages, get dubbed MP4s back — synced frame-by-frame.
        </p>
        <DubClient />
      </div>
    </main>
  );
}
