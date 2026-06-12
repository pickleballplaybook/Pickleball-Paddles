"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Star, Bookmark, Eye, ExternalLink } from "lucide-react";
import { Paddle } from "@/types";
import { getTrendingPaddles, getRisingBrands, engagementScore, isTrendingExcluded, takeTopBySeriesDedup, HeartRecord, MIN_TRENDING_ENGAGEMENT } from "@/lib/trending";
import { siteConfig } from "@/config/site";
import { supabase } from "@/lib/supabaseClient";
import { getBrandByName } from "@/data/brands";
import { getReviewSource } from "@/lib/externalReviews";

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
// One request returns the full per-slug map for the active window with time
// decay applied (a view today is worth 1.0; a view 28 days ago, 0.5). The
// previous implementation used /api/views — which returns all-time cumulative
// counts — and that single line was the entire reason old paddles dominated
// the trending surfaces forever.
function useWeightedViews(days: number) {
  const [views, setViews] = useState<Record<string, number>>({});
  useEffect(() => {
    fetch(`/api/views/weighted?days=${days}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !("error" in data)) setViews(data);
      })
      .catch(() => {});
  }, [days]);
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
  // Default to 30d — synced with /trending so the homepage Trending Paddles
  // section shows the same paddles that /trending shows. Users can still
  // toggle to 7d for the recency view, but the out-of-box experience now
  // matches /trending instead of telling two different stories.
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

  const allTrending = getTrendingPaddles(paddles, filteredHearts, paddles.length);
  const allBrands   = getRisingBrands(paddles, filteredHearts, paddles.length);

  // Weighted views for the active window (7 or 30 days), one round-trip for
  // every paddle that's been viewed. We use the full map for both engagement
  // scoring AND candidate seeding — the static `trendingScore` fallback that
  // used to seed candidates is gone; it was anchoring cold paddles in the
  // pool indefinitely.
  const windowDays = timeRange === "7d" ? 7 : 30;
  const viewCounts = useWeightedViews(windowDays);

  // Candidates for the (more expensive) per-paddle ratings fetch: anything
  // hearted in window + anything getting non-trivial recent views.
  const heartedIds = new Set(filteredHearts.map((h) => h.paddleId));
  const topViewedSlugs = Object.entries(viewCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([slug]) => slug);
  const topViewedIds = topViewedSlugs
    .map((slug) => paddles.find((p) => p.slug === slug)?.id)
    .filter(Boolean) as string[];
  const candidateIds = Array.from(new Set([...Array.from(heartedIds), ...topViewedIds])).slice(0, 40);
  const ratingCounts = useRatingCounts(candidateIds);

  const hasHearts = filteredHearts.length > 0;
  const hasRatings = Object.values(ratingCounts).some((r) => r.count > 0);
  const hasViews = Object.values(viewCounts).some((v) => v > 0);

  // Sort by combined engagement. Use weightedScore (recency-decayed hearts)
  // as the heart signal, not raw totalHearts — otherwise older hearts in the
  // window outrank today's activity.
  const trendingPre = allTrending
    .map((t) => ({
      ...t,
      ratingCount: ratingCounts[t.paddle.id]?.count ?? 0,
      ratingAvg: ratingCounts[t.paddle.id]?.average ?? 0,
      views: viewCounts[t.paddle.slug] ?? 0,
      engagement: engagementScore(
        t.weightedScore < 0 ? 0 : t.weightedScore,
        ratingCounts[t.paddle.id]?.count ?? 0,
        viewCounts[t.paddle.slug] ?? 0,
      ),
    }))
    .sort((a, b) => b.engagement - a.engagement || (b.lastHeart ?? 0) - (a.lastHeart ?? 0))
    // Minimum engagement floor: filters out paddles with one stale heart
    // and no other signal (Rebl-Alliance-style) so the list reflects actual
    // momentum, not "one person hearted this once."
    .filter((t) => (hasHearts || hasRatings || hasViews) ? t.engagement >= MIN_TRENDING_ENGAGEMENT : true)
    .filter((t) => !isTrendingExcluded(t.paddle.slug));
  // Dedupe by series so a single series can't fill multiple slots.
  const trendingSorted = takeTopBySeriesDedup(trendingPre, 10);

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

  // Fetch external reviews from Supabase cache
  const [extReviews, setExtReviews] = useState<Record<string, { rating: number; count: number; sourceName: string }>>({});
  useEffect(() => {
    const slugsWithSources = paddles.filter((p) => getReviewSource(p.slug)).map((p) => p.slug);
    if (slugsWithSources.length === 0) return;
    Promise.all(
      slugsWithSources.map((slug) =>
        fetch(`/api/external-reviews?slug=${slug}`)
          .then((r) => r.json())
          .then((d) => d.found ? { slug, rating: d.rating, count: d.count, sourceName: d.sourceName } : null)
          .catch(() => null)
      )
    ).then((results) => {
      const map: Record<string, { rating: number; count: number; sourceName: string }> = {};
      for (const r of results) if (r) map[r.slug] = { rating: r.rating, count: r.count, sourceName: r.sourceName };
      setExtReviews(map);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build "Highest Rated" list — Bayesian weighted, deduplicated by review source
  // Build "Highest Rated" — score = rating × log10(reviews + 1)
  // This heavily rewards review volume: 4.8 with 2300 reviews beats 5.0 with 15.
  const allRated = paddles
    .map((paddle) => {
      const ext = extReviews[paddle.slug];
      const onSite = ratingCounts[paddle.id];
      const ratingAvg = ext?.rating ?? onSite?.average ?? 0;
      const ratingCount = ext?.count ?? onSite?.count ?? 0;
      const sourceName = ext?.sourceName ?? undefined;
      const source = getReviewSource(paddle.slug);
      const dedup = source?.productUrl ?? paddle.id;
      const t = allTrending.find((tr) => tr.paddle.id === paddle.id);
      return { paddle, totalHearts: t?.totalHearts ?? 0, weightedScore: t?.weightedScore ?? 0, ratingCount, ratingAvg, sourceName, dedup };
    })
    .filter((t) => t.ratingCount >= 1);

  // Deduplicate: keep the highest-trending paddle per review source
  const dedupMap = new Map<string, typeof allRated[number]>();
  for (const t of allRated) {
    const existing = dedupMap.get(t.dedup);
    if (!existing || t.totalHearts > existing.totalHearts) {
      dedupMap.set(t.dedup, t);
    }
  }

  const highestRated = Array.from(dedupMap.values())
    .map((t) => ({
      ...t,
      score: t.ratingAvg * Math.log10(t.ratingCount + 1),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <section id="trending" className="section-y" style={{ background: "var(--flip-bg)" }}>
      <div className="container-xl">

        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "var(--flip-text-head)" }}>
                Trending Pickleball Paddles
              </h2>
              <p className="mt-2 text-base" style={{ color: "var(--flip-text-muted)" }}>
                What players are actually paying attention to right now
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* ── Trending Paddles ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={2} />
              <p className="font-extrabold text-base" style={{ color: "var(--flip-text-head)" }}>Trending Paddles</p>
            </div>
            <div className="flex flex-col gap-1">
              {trendingSorted.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--flip-text-muted)" }}>
                  Heart paddles you like to see them appear here.
                </p>
              ) : (
                trendingSorted.slice(0, 6).map(({ paddle, totalHearts }, i) => {
                  const hasLink = !!paddle.discountLink?.trim();
                  const code = getCode(paddle.brand, paddle.discountLink);
                  const views = viewCounts[paddle.slug] ?? 0;
                  return (
                    <div
                      key={paddle.id}
                      className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--flip-divider)]"
                      style={{ border: "1px solid var(--flip-card-border)" }}
                    >
                      <span className="text-sm font-extrabold w-5 text-center flex-shrink-0" style={{ color: "var(--flip-text-muted)" }}>
                        {i + 1}
                      </span>
                      <Link
                        href={`/paddles/${paddle.slug}`}
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ background: "var(--flip-divider)" }}
                      >
                        {paddle.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={paddle.image} alt={paddle.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-teal-500/20" />
                        )}
                      </Link>
                      <Link href={`/paddles/${paddle.slug}`} className="flex-1 min-w-0 group">
                        <p className="text-sm font-bold truncate group-hover:text-teal-500 transition-colors" style={{ color: "var(--flip-text-head)" }}>
                          {paddle.name} {paddle.thickness}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--flip-text-muted)" }}>
                          {paddle.brand}
                        </p>
                      </Link>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--flip-text-muted)" }}>
                          <Eye className="w-3 h-3" />
                          {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                        </span>
                        {hasLink && (
                          <a
                            href={paddle.discountLink}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg text-white transition-all hover:scale-105"
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
            </div>
          </div>

          {/* ── Highest Rated ────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={2} />
              <p className="font-extrabold text-base" style={{ color: "var(--flip-text-head)" }}>Highest Rated</p>
            </div>
            <div className="flex flex-col gap-1">
              {highestRated.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--flip-text-muted)" }}>
                  Rate paddles to see top-rated ones here.
                </p>
              ) : (
                highestRated.map(({ paddle, ratingCount, ratingAvg, sourceName, dedup }, i) => {
                  // If multiple paddles share the same review source, show the series/brand name
                  const source = getReviewSource(paddle.slug);
                  const sharedCount = source ? source.paddleSlugs.length : 0;
                  const displayName = sharedCount > 1
                    ? `${paddle.brand} ${paddle.name.split(" ").slice(0, -1).join(" ") || paddle.name}`
                    : `${paddle.name} ${paddle.thickness}`;
                  return (
                  <Link
                    key={paddle.id}
                    href={`/paddles/${paddle.slug}`}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--flip-divider)] group"
                    style={{ border: "1px solid var(--flip-card-border)" }}
                  >
                    <span className="text-sm font-extrabold w-5 text-center flex-shrink-0" style={{ color: "var(--flip-text-muted)" }}>
                      {i + 1}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ background: "var(--flip-divider)" }}
                    >
                      {paddle.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={paddle.image} alt={paddle.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-teal-500/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-teal-500 transition-colors" style={{ color: "var(--flip-text-head)" }}>
                        {displayName}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "var(--flip-text-muted)" }}>
                        {sourceName ? `via ${sourceName}` : paddle.brand}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold flex-shrink-0" style={{ color: "#facc15" }}>
                      <Star className="w-3 h-3" fill="currentColor" strokeWidth={0} />
                      {ratingAvg.toFixed(1)} ({ratingCount})
                    </span>
                  </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Rising Brands ────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={2} />
              <p className="font-extrabold text-base" style={{ color: "var(--flip-text-head)" }}>Rising Brands</p>
            </div>
            <div className="flex flex-col gap-1">
              {brandsSorted.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--flip-text-muted)" }}>
                  Save paddles you like to see top brands here.
                </p>
              ) : (
                brandsSorted.map(({ brand, totalHearts, paddleCount, topSlug }, i) => {
                  const brandData = getBrandByName(brand);
                  const brandViews = paddles
                    .filter((p) => p.brand === brand)
                    .reduce((sum, p) => sum + (viewCounts[p.slug] ?? 0), 0);
                  const href = brandData ? `/brands/${brandData.slug}` : `/paddles/${topSlug}`;
                  return (
                    <Link
                      key={brand}
                      href={href}
                      className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--flip-divider)] group"
                      style={{ border: "1px solid var(--flip-card-border)" }}
                    >
                      <span className="text-sm font-extrabold w-5 text-center flex-shrink-0" style={{ color: "var(--flip-text-muted)" }}>
                        {i + 1}
                      </span>
                      <div
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ background: "var(--flip-divider)" }}
                      >
                        {brandData?.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={brandData.logo} alt={brand} className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-teal-500/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-teal-500 transition-colors" style={{ color: "var(--flip-text-head)" }}>
                          {brand}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--flip-text-muted)" }}>
                          {paddleCount} paddle{paddleCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] flex-shrink-0" style={{ color: "var(--flip-text-muted)" }}>
                        <Eye className="w-3 h-3" />
                        {brandViews >= 1000 ? `${(brandViews / 1000).toFixed(1)}k` : brandViews}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* View All button */}
        <div className="flex items-center justify-center mt-8">
          <Link
            href="/trending"
            className="inline-flex items-center gap-2 font-bold text-sm px-8 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
            style={{ background: "#14b8a6" }}
          >
            View All Trending Paddles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
