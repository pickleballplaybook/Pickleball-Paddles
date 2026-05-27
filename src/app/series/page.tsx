import { Metadata } from "next";
import Link from "next/link";
import { paddles } from "@/data/paddles";
import { ArrowRight } from "lucide-react";
import type { Paddle } from "@/types";

export const metadata: Metadata = {
  title: "Paddle Series — Compare All Shapes",
  description: "Browse pickleball paddle families and compare every shape side by side. Find the right shape for your game.",
};

interface Series {
  slug: string;
  brand: string;
  title: string;
  paddles: Paddle[];
  shapes: string[];
}

function getAllSeries(): Series[] {
  const map = new Map<string, Paddle[]>();
  for (const p of paddles) {
    if (!p.seriesSlug) continue;
    const arr = map.get(p.seriesSlug) ?? [];
    arr.push(p);
    map.set(p.seriesSlug, arr);
  }

  return Array.from(map.entries())
    .filter(([, arr]) => arr.length >= 2)
    .map(([slug, arr]) => {
      const brand = arr[0].brand;
      const names = arr.map((p) => p.name);
      const commonWords = names[0].split(" ").filter((w) =>
        names.every((n) => n.toLowerCase().includes(w.toLowerCase()))
      );
      const title = commonWords.length > 0
        ? `${brand} ${commonWords.join(" ")}`
        : `${brand} ${names[0]}`;
      const shapes = Array.from(new Set(arr.map((p) => p.shape)));
      return { slug, brand, title, paddles: arr, shapes };
    })
    .sort((a, b) => b.paddles.length - a.paddles.length || a.brand.localeCompare(b.brand));
}

export default function SeriesIndexPage() {
  const allSeries = getAllSeries();

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--flip-bg)" }}>
      <div className="container-xl">

        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
            Compare Shapes
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "var(--flip-text-head)" }}>
            Paddle Series
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--flip-text-muted)" }}>
            {allSeries.length} paddle families — compare every shape side by side.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allSeries.map((series) => {
            const hero = series.paddles.find((p) => p.image) ?? series.paddles[0];
            return (
              <Link
                key={series.slug}
                href={`/series/${series.slug}`}
                className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
                style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
              >
                {/* Images — show up to 3 paddle thumbnails */}
                <div className="relative flex items-center justify-center py-6 px-4 gap-[-10px]" style={{ background: "var(--flip-bg)", minHeight: 180 }}>
                  {series.paddles.slice(0, 3).map((p, i) => (
                    p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={p.image}
                        alt={p.name}
                        className="h-32 w-auto object-contain"
                        style={{
                          marginLeft: i > 0 ? "-20px" : "0",
                          zIndex: i === 1 ? 3 : 1,
                          transform: i === 0 ? "rotate(5deg)" : i === 2 ? "rotate(-5deg)" : "none",
                        }}
                      />
                    )
                  ))}
                </div>

                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#14b8a6" }}>
                    {series.brand} &middot; {series.paddles.length} shapes
                  </p>
                  <h2 className="text-lg font-extrabold group-hover:text-teal-500 transition-colors mb-2" style={{ color: "var(--flip-text-head)" }}>
                    {series.title}
                  </h2>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {series.shapes.map((shape) => (
                      <span
                        key={shape}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}
                      >
                        {shape}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:text-teal-400 transition-colors" style={{ color: "#2dd4bf" }}>
                    Compare Shapes <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
