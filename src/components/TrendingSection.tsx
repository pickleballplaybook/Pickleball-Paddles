"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Star, Heart, Eye, ExternalLink } from "lucide-react";
import { Paddle } from "@/types";
import { getTrendingPaddles, getRisingBrands, HeartRecord } from "@/lib/trending";
import { siteConfig } from "@/config/site";
import { supabase } from "@/lib/supabaseClient";

// ── Subcomponent ──────────────────────────────────────────────────────────────

function ColumnCard({ icon, title, subtitle, children }: {
  icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col rounded-3xl p-6 gap-5"
      style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.2)" }}
        >
          {icon}
        </div>
        <div>
          <p className="font-extrabold text-base leading-snug" style={{ color: "var(--flip-text-head)" }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--flip-text-muted)" }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ height: 1, background: "var(--flip-divider)" }} />
      <div className="flex flex-col gap-3 flex-1">{children}</div>
    </div>
  );
}

// ── Discount code helper ──────────────────────────────────────────────────────
function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

// ── View count fetcher ────────────────────────────────────────────────────────
function useViewCounts(slugs: string[]) {
  const [views, setViews] = useState<Record<string, number>>({});
  useEffect(() => {
    if (slugs.length === 0) return;
    fetch(`/api/views?slugs=${slugs.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") setViews(data);
      })
      .catch(() => {});
  }, [slugs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  return views;
}

// ── Main export (client component) ────────────────────────────────────────────

// ── Fetch all paddle rating counts ────────────────────────────────────────────
function useRatingCounts(paddleIds: string[]) {
  const [ratings, setRatings] = useState<Record<string, { count: number; average: number }>>({});
  useEffect(() => {
    if (paddleIds.length === 0) return;
    // Fetch ratings for all paddles in parallel (batch of individual calls)
    Promise.all(
      paddleIds.map((id) =>
        fetch(`/api/paddle-ratings?paddleId=${id}&_t=${Date.now()}`, { cache: "no-store" })
          .then((r) => r.json())
          .then((data) => ({ id, count: data.count ?? 0, average: data.average ?? 0 }))
          .catch(() => ({ id, count: 0, average: 0 }))
      )
    ).then((results) => {
      const map: Record<string, { count: number; average: number }> = {};
      for (const r of results) map[r.id] = { count: r.count, average: r.average };
      setRatings(map);
    });
  }, [paddleIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  return ratings;
}

type TimeRange = "7d" | "30d";

function filterByTimeRange<T extends { createdAt: Date | string | number }>(
  records: T[],
  range: TimeRange,
): T[] {
  const days = range === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 86400000;
  return records.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
}

export default function TrendingSection({ paddles }: { paddles: Paddle[] }) {
  const [heartRecords, setHeartRecords] = useState<HeartRecord[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  async function fetchHearts() {
    try {
      const { data, error } = await supabase
        .from("paddle_hearts")
        .select("paddle_id, created_at");
      if (error || !data) return;
      setHeartRecords(data.map((row) => ({ paddleId: row.paddle_id, createdAt: row.created_at })));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchHearts();
    window.addEventListener("hearts-updated", fetchHearts);
    return () => window.removeEventListener("hearts-updated", fetchHearts);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredHearts = filterByTimeRange(heartRecords, timeRange);

  // Fetch star ratings for all paddles
  const allPaddleIds = paddles.map((p) => p.id);
  const ratingCounts = useRatingCounts(allPaddleIds);

  const hasHearts = filteredHearts.length > 0;
  const hasRatings = Object.values(ratingCounts).some((r) => r.count > 0);

  const allTrending = getTrendingPaddles(paddles, filteredHearts, paddles.length);
  const allBrands   = getRisingBrands(paddles, filteredHearts, paddles.length);

  // Re-sort trending by hearts + star rating count combined
  const trendingSorted = allTrending
    .map((t) => ({
      ...t,
      ratingCount: ratingCounts[t.paddle.id]?.count ?? 0,
      ratingAvg: ratingCounts[t.paddle.id]?.average ?? 0,
      // Combined engagement score: hearts + rating count
      engagement: t.totalHearts + (ratingCounts[t.paddle.id]?.count ?? 0),
    }))
    .sort((a, b) => b.engagement - a.engagement || b.totalHearts - a.totalHearts)
    .filter((t) => (hasHearts || hasRatings) ? t.engagement > 0 : true)
    .slice(0, 10);

  // Re-sort brands by total hearts + total rating counts
  const brandRatings = new Map<string, number>();
  for (const p of paddles) {
    const rc = ratingCounts[p.id]?.count ?? 0;
    brandRatings.set(p.brand, (brandRatings.get(p.brand) ?? 0) + rc);
  }

  const brandsSorted = allBrands
    .map((b) => ({
      ...b,
      totalRatings: brandRatings.get(b.brand) ?? 0,
      engagement: b.totalHearts + (brandRatings.get(b.brand) ?? 0),
    }))
    .sort((a, b) => b.engagement - a.engagement || b.totalHearts - a.totalHearts)
    .filter((b) => (hasHearts || hasRatings) ? b.engagement > 0 : true)
    .slice(0, 6);

  const trendingSlugs = trendingSorted.map((t) => t.paddle.slug);
  const viewCounts = useViewCounts(trendingSlugs);

  return (
    <section id="trending" className="section-y" style={{ background: "var(--flip-bg)" }}>
      <div className="container-xl">

        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
            Market Pulse
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "var(--flip-text-head)" }}>
                Top 10 Trending Paddles
              </h2>
              <p className="mt-2 text-base" style={{ color: "var(--flip-text-muted)" }}>
                What players are actually paying attention to right now
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {/* Time range toggle */}
              <div
                className="inline-flex rounded-xl p-0.5"
                style={{ background: "var(--flip-divider)", border: "1px solid var(--flip-card-border)" }}
              >
                {(["7d", "30d"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className="text-xs font-bold px-3.5 py-1.5 rounded-[10px] transition-all"
                    style={
                      timeRange === r
                        ? { background: "#14b8a6", color: "#fff" }
                        : { color: "var(--flip-text-muted)" }
                    }
                  >
                    {r === "7d" ? "7 Days" : "30 Days"}
                  </button>
                ))}
              </div>
              <Link
                href="/trending"
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors whitespace-nowrap hover:text-brand-400"
                style={{ color: "#2dd4bf" }}
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Trending Paddles ─────────────────────────────────────────── */}
          <ColumnCard
            icon={<TrendingUp className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={2} />}
            title="Trending Paddles"
            subtitle={`Top 10 by engagement — last ${timeRange === "7d" ? "7 days" : "30 days"}`}
          >
            {trendingSorted.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--flip-text-muted)" }}>
                Heart paddles you like to see them appear here.
              </p>
            ) : (
              trendingSorted.map(({ paddle, totalHearts, ratingCount, ratingAvg }, i) => {
                const hasLink = !!paddle.discountLink?.trim();
                const code = getCode(paddle.brand, paddle.discountLink);
                const views = viewCounts[paddle.slug] ?? 0;
                return (
                  <div
                    key={paddle.id}
                    className="flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-[var(--flip-divider)]"
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                      style={{ background: "var(--flip-divider)", color: "var(--flip-text-muted)" }}
                    >
                      {i + 1}
                    </span>
                    {/* Thumbnail */}
                    <Link
                      href={`/paddles/${paddle.slug}`}
                      className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ background: "var(--flip-divider)" }}
                    >
                      {paddle.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={paddle.image} alt={paddle.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-teal-500/20" />
                      )}
                    </Link>
                    {/* Info */}
                    <Link href={`/paddles/${paddle.slug}`} className="flex-1 min-w-0 group">
                      <p className="text-sm font-bold truncate group-hover:text-teal-500 transition-colors" style={{ color: "var(--flip-text-head)" }}>
                        {paddle.name}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "var(--flip-text-muted)" }}>
                        {paddle.brand}
                      </p>
                    </Link>
                    {/* Stats + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Views */}
                      <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--flip-text-muted)" }}>
                        <Eye className="w-3 h-3" />
                        {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                      </span>
                      {/* Stars */}
                      {ratingCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(250,204,21,0.12)", color: "#facc15" }}>
                          <Star className="w-3 h-3" fill="currentColor" strokeWidth={0} />
                          {ratingAvg.toFixed(1)}
                        </span>
                      )}
                      {/* Hearts */}
                      {totalHearts > 0 && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: "rgba(239,68,68,0.10)", color: "#f87171" }}
                        >
                          <Heart className="w-3 h-3" fill="currentColor" />
                          {totalHearts}
                        </span>
                      )}
                      {/* Code badge */}
                      {hasLink && (
                        <span
                          className="hidden sm:inline-flex text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md"
                          style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.25)" }}
                        >
                          {code}
                        </span>
                      )}
                      {/* Buy button */}
                      {hasLink && (
                        <a
                          href={paddle.discountLink}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
                          style={{ background: "#14b8a6" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Buy <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </ColumnCard>

          {/* ── Rising Brands ────────────────────────────────────────────── */}
          <ColumnCard
            icon={<Star className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={2} />}
            title="Rising Brands"
            subtitle="Brands ranked by total engagement"
          >
            {brandsSorted.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--flip-text-muted)" }}>
                Heart paddles you like to see top brands here.
              </p>
            ) : (
              brandsSorted.map(({ brand, totalHearts, paddleCount, topSlug, totalRatings }) => (
                <Link
                  key={brand}
                  href={`/paddles/${topSlug}`}
                  className="flex items-center justify-between gap-3 group rounded-xl p-2 -mx-2 transition-colors hover:bg-[var(--flip-divider)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-teal-500 transition-colors" style={{ color: "var(--flip-text-head)" }}>
                      {brand}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--flip-text-muted)" }}>
                      {paddleCount} paddle{paddleCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                      style={
                        totalHearts > 0
                          ? { background: "rgba(239,68,68,0.10)", color: "#f87171", border: "1px solid rgba(239,68,68,0.20)" }
                          : { background: "var(--flip-divider)", color: "var(--flip-text-muted)" }
                      }
                    >
                      <Heart className="w-3 h-3" fill={totalHearts > 0 ? "currentColor" : "none"} />
                      {totalHearts}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 transition-colors group-hover:text-teal-500" style={{ color: "var(--flip-text-faint)" }} />
                  </div>
                </Link>
              ))
            )}
          </ColumnCard>

        </div>
      </div>
    </section>
  );
}
