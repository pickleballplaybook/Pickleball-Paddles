"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { paddles } from "@/data/paddles";
import { Paddle } from "@/types";
import { getTrendingPaddles, HeartRecord } from "@/lib/trending";
import { siteConfig } from "@/config/site";
import { supabase } from "@/lib/supabaseClient";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

function useRatingCounts(paddleIds: string[]) {
  const [ratings, setRatings] = useState<Record<string, { count: number; average: number }>>({});
  useEffect(() => {
    if (paddleIds.length === 0) return;
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

// ── Card component (screenshot-optimized) ────────────────────────────────────

function TrendingCard({ paddle, rank, code }: { paddle: Paddle; rank: number; code: string }) {
  const hasDiscount = !!paddle.discountLink?.trim() && paddle.amountOff && paddle.amountOff !== "$0";

  return (
    <div
      className="relative flex-shrink-0 w-full flex flex-col md:flex-row items-center gap-6 md:gap-10 p-8 md:p-10 rounded-3xl overflow-hidden snap-center"
      style={{
        background: "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #081820 100%)",
        minHeight: "480px",
      }}
    >
      {/* Rank badge */}
      <div
        className="absolute top-5 left-5 w-14 h-14 rounded-full flex items-center justify-center z-10"
        style={{ background: "rgba(20,184,166,0.25)", border: "2px solid rgba(20,184,166,0.5)" }}
      >
        <span className="text-xl font-extrabold text-white">#{rank}</span>
      </div>

      {/* Header branding */}
      <div className="absolute top-5 left-0 right-0 text-center pointer-events-none">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
          Playbook Reviews
        </p>
      </div>

      {/* Paddle image */}
      <div className="flex-shrink-0 flex items-center justify-center w-full md:w-[45%] pt-6">
        {paddle.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={paddle.image}
            alt={`${paddle.brand} ${paddle.name}`}
            className="max-h-[320px] w-auto object-contain"
            style={{ filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.5))" }}
          />
        )}
      </div>

      {/* Specs panel */}
      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1"
            style={{ color: "rgba(148,195,215,0.7)" }}
          >
            {paddle.brand}
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            {paddle.name} {paddle.thickness}
          </h2>
          <p className="text-sm mb-3" style={{ color: "rgba(148,195,215,0.6)" }}>
            {paddle.shape} · {paddle.thickness}
          </p>
          <p className="text-base font-semibold text-white/80 mb-5">
            {paddle.weight}
            {paddle.swingWeight ? ` · SW ${paddle.swingWeight}` : ""}
            {paddle.twistWeight ? ` · TW ${paddle.twistWeight}` : ""}
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {paddle.playStyle && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(148,195,215,0.12)", color: "rgba(148,195,215,0.85)", border: "1px solid rgba(148,195,215,0.2)" }}
              >
                {paddle.playStyle.charAt(0).toUpperCase() + paddle.playStyle.slice(1)}
              </span>
            )}
            {paddle.swingWeight >= 118 && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                High Power
              </span>
            )}
            {paddle.twistWeight >= 6.5 && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(250,204,21,0.12)", color: "#fbbf24", border: "1px solid rgba(250,204,21,0.25)" }}
              >
                Great Stability
              </span>
            )}
          </div>

          {/* Discount code */}
          {hasDiscount && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)" }}
            >
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Code:</span>
              <span className="text-sm font-extrabold font-mono" style={{ color: "#2dd4bf" }}>
                {code}
              </span>
              {paddle.amountOff && (
                <span className="text-xs font-bold ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  ({paddle.amountOff} off)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer branding */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between pointer-events-none">
        <p className="text-xs font-semibold" style={{ color: "rgba(148,195,215,0.4)" }}>
          Playbook Reviews
        </p>
        <p className="text-xs font-medium" style={{ color: "rgba(148,195,215,0.35)" }}>
          pickleballplaybook.app
        </p>
      </div>

      {/* Dot indicators (visual only, for screenshot aesthetics) */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: i === rank - 1 ? "#14b8a6" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrendingPage() {
  const [heartRecords, setHeartRecords] = useState<HeartRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("paddle_hearts")
      .select("paddle_id, created_at")
      .then(({ data }) => {
        if (data) {
          setHeartRecords(data.map((row) => ({ paddleId: row.paddle_id, createdAt: row.created_at })));
        }
      });
  }, []);

  const allPaddleIds = paddles.map((p) => p.id);
  const ratingCounts = useRatingCounts(allPaddleIds);

  const allTrending = getTrendingPaddles(paddles, heartRecords, paddles.length);

  const hasHearts = heartRecords.length > 0;
  const hasRatings = Object.values(ratingCounts).some((r) => r.count > 0);

  const top10 = allTrending
    .map((t) => ({
      ...t,
      engagement: t.totalHearts + (ratingCounts[t.paddle.id]?.count ?? 0),
    }))
    .sort((a, b) => b.engagement - a.engagement || b.totalHearts - a.totalHearts)
    .filter((t) => (hasHearts || hasRatings) ? t.engagement > 0 : true)
    .slice(0, 10);

  function scrollTo(index: number) {
    const clamped = Math.max(0, Math.min(index, top10.length - 1));
    setCurrentIndex(clamped);
    if (scrollRef.current) {
      const children = scrollRef.current.children;
      if (children[clamped]) {
        (children[clamped] as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "#060e1a" }}>
      <div className="container-xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
            Weekly Trending
          </p>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3"
            style={{ color: "#fff" }}
          >
            Top 10 Trending Paddles
          </h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.5)" }}>
            Ranked by views, hearts, and ratings combined
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Nav buttons */}
          <button
            onClick={() => scrollTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => scrollTo(currentIndex + 1)}
            disabled={currentIndex >= top10.length - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none" }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const cardWidth = el.scrollWidth / top10.length;
              const idx = Math.round(el.scrollLeft / cardWidth);
              setCurrentIndex(idx);
            }}
          >
            {top10.map(({ paddle }, i) => (
              <TrendingCard
                key={paddle.id}
                paddle={paddle}
                rank={i + 1}
                code={getCode(paddle.brand, paddle.discountLink)}
              />
            ))}
          </div>
        </div>

        {/* Dot navigation */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {top10.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: i === currentIndex ? "#14b8a6" : "rgba(255,255,255,0.2)",
                transform: i === currentIndex ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* List view for quick reference */}
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold mb-6" style={{ color: "#fff" }}>
            Full Rankings
          </h2>
          <div className="flex flex-col gap-3">
            {top10.map(({ paddle, totalHearts, engagement }, i) => {
              const hasLink = !!paddle.discountLink?.trim();
              return (
                <div
                  key={paddle.id}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                    style={{ background: "rgba(20,184,166,0.2)", color: "#2dd4bf" }}
                  >
                    {i + 1}
                  </span>
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                    {paddle.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={paddle.image} alt={paddle.name} className="w-full h-full object-contain p-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {paddle.brand} {paddle.name}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {paddle.shape} · {paddle.thickness} · {paddle.weight}
                      {paddle.swingWeight ? ` · SW ${paddle.swingWeight}` : ""}
                      {paddle.twistWeight ? ` · TW ${paddle.twistWeight}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasLink && (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}>
                        {getCode(paddle.brand, paddle.discountLink)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
