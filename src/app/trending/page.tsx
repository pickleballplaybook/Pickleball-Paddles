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

function useViewCounts(slugs: string[]) {
  const [views, setViews] = useState<Record<string, number>>({});
  useEffect(() => {
    if (slugs.length === 0) return;
    fetch(`/api/views?slugs=${slugs.join(",")}`)
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === "object") setViews(data); })
      .catch(() => {});
  }, [slugs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  return views;
}

// ── Stat bar ranges (from actual paddle database) ────────────────────────────

const RANGES = {
  weight:      { min: 7.2, max: 9.2, unit: "oz" },
  swingWeight: { min: 95,  max: 125, unit: "" },
  twistWeight: { min: 4.5, max: 7.5, unit: "" },
};

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function StatBar({ label, value, displayValue, min, max, color }: {
  label: string; value: number; displayValue: string; min: number; max: number; color: string;
}) {
  const pct = normalize(value, min, max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold uppercase tracking-wide w-[72px] text-right flex-shrink-0" style={{ color: "rgba(148,195,215,0.6)" }}>
        {label}
      </span>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold font-mono w-[52px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.7)" }}>
        {displayValue}
      </span>
    </div>
  );
}

// ── Card component (1:1 square, screenshot-optimized for Instagram) ──────────

function TrendingCard({ paddle, rank, code, totalCards }: {
  paddle: Paddle; rank: number; code: string; totalCards: number;
}) {
  const hasDiscount = !!paddle.discountLink?.trim() && paddle.amountOff && paddle.amountOff !== "$0";
  const weightNum = parseFloat(paddle.weight) || 0;
  const playLabel = paddle.playStyle
    ? paddle.playStyle === "all-court" ? "All-Court" : paddle.playStyle.charAt(0).toUpperCase() + paddle.playStyle.slice(1)
    : paddle.shape;
  const playColors = {
    power:     { bg: "rgba(239,68,68,0.2)",  border: "rgba(239,68,68,0.4)",  text: "#f87171" },
    control:   { bg: "rgba(74,222,128,0.2)", border: "rgba(74,222,128,0.4)", text: "#4ade80" },
    "all-court": { bg: "rgba(250,204,21,0.2)", border: "rgba(250,204,21,0.4)", text: "#facc15" },
    spin:      { bg: "rgba(251,146,60,0.2)", border: "rgba(251,146,60,0.4)", text: "#fb923c" },
  };
  const pc = playColors[paddle.playStyle as keyof typeof playColors] ?? { bg: "rgba(20,184,166,0.2)", border: "rgba(20,184,166,0.4)", text: "#2dd4bf" };

  return (
    <div
      className="relative flex-shrink-0 snap-start rounded-3xl overflow-hidden w-full min-w-full"
      style={{
        aspectRatio: "1 / 1",
        background: "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #081820 100%)",
      }}
    >
      {/* Rank badge */}
      <div
        className="absolute top-4 left-4 w-12 h-12 rounded-full flex items-center justify-center z-10"
        style={{ background: "rgba(20,184,166,0.25)", border: "2px solid rgba(20,184,166,0.5)" }}
      >
        <span className="text-lg font-extrabold text-white">#{rank}</span>
      </div>

      {/* Header branding */}
      <div className="absolute top-4 left-0 right-0 text-center pointer-events-none z-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-white/70">
          Playbook Reviews
        </p>
      </div>

      {/* ── Top half: paddle image with play style label ────────────────── */}
      <div className="absolute inset-x-0 top-0 h-[52%] flex items-center justify-center">
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center 60%, rgba(20,184,166,0.06) 0%, transparent 60%)" }}
        />
        {paddle.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={paddle.image}
            alt={`${paddle.brand} ${paddle.name}`}
            className="relative z-[1] max-h-[80%] w-auto object-contain"
            style={{ filter: "drop-shadow(0 10px 28px rgba(0,0,0,0.5))" }}
          />
        )}
        {/* Play style badge on the image */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[2]">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{
              background: pc.bg,
              border: `1px solid ${pc.border}`,
              color: pc.text,
              backdropFilter: "blur(8px)",
            }}
          >
            {playLabel}
          </span>
        </div>
      </div>

      {/* ── Bottom half: specs panel ────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 h-[48%] flex flex-col justify-center px-6 pb-10 pt-2">
        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Brand + name */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(148,195,215,0.6)" }}>
              {paddle.brand}
            </p>
            <h2 className="text-xl font-extrabold text-white leading-tight">
              {paddle.name} {paddle.thickness}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(148,195,215,0.5)" }}>
              {paddle.shape} · {paddle.thickness}
            </p>
          </div>

          {/* Stat bars */}
          <div className="flex flex-col gap-2">
            <StatBar
              label="Weight"
              value={weightNum}
              displayValue={paddle.weight}
              min={RANGES.weight.min}
              max={RANGES.weight.max}
              color="#94a3b8"
            />
            {paddle.swingWeight > 0 && (
              <StatBar
                label="Swing Wt"
                value={paddle.swingWeight}
                displayValue={paddle.swingWeight.toFixed(1)}
                min={RANGES.swingWeight.min}
                max={RANGES.swingWeight.max}
                color="#14b8a6"
              />
            )}
            {paddle.twistWeight > 0 && (
              <StatBar
                label="Twist Wt"
                value={paddle.twistWeight}
                displayValue={paddle.twistWeight.toFixed(2)}
                min={RANGES.twistWeight.min}
                max={RANGES.twistWeight.max}
                color="#f59e0b"
              />
            )}
          </div>

          {/* Discount code */}
          {hasDiscount && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg self-start"
              style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)" }}
            >
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Code:</span>
              <span className="text-xs font-extrabold font-mono" style={{ color: "#2dd4bf" }}>{code}</span>
              <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>({paddle.amountOff} off)</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer branding */}
      <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between pointer-events-none z-10">
        <p className="text-[11px] font-bold" style={{ color: "rgba(148,195,215,0.55)" }}>
          Playbook Reviews
        </p>
        <p className="text-[11px] font-semibold" style={{ color: "rgba(148,195,215,0.5)" }}>
          playbookpaddles.com
        </p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1 pointer-events-none z-10">
        {Array.from({ length: totalCards }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: i === rank - 1 ? "#14b8a6" : "rgba(255,255,255,0.15)" }}
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

  // Fetch views for candidate paddles (same as homepage TrendingSection)
  const allTrending = getTrendingPaddles(paddles, heartRecords, paddles.length);
  const candidateSlugs = allTrending
    .filter((t) => t.totalHearts > 0 || (ratingCounts[t.paddle.id]?.count ?? 0) > 0)
    .map((t) => t.paddle.slug);
  const fallbackSlugs = paddles
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 20)
    .map((p) => p.slug);
  const allViewSlugs = Array.from(new Set([...candidateSlugs, ...fallbackSlugs])).slice(0, 50);
  const viewCounts = useViewCounts(allViewSlugs);

  const hasHearts = heartRecords.length > 0;
  const hasRatings = Object.values(ratingCounts).some((r) => r.count > 0);
  const hasViews = Object.values(viewCounts).some((v) => v > 0);

  // Same scoring as homepage: hearts + ratings + views/10
  const top10 = allTrending
    .map((t) => ({
      ...t,
      engagement: t.totalHearts + (ratingCounts[t.paddle.id]?.count ?? 0) + Math.floor((viewCounts[t.paddle.slug] ?? 0) / 10),
    }))
    .sort((a, b) => b.engagement - a.engagement || b.totalHearts - a.totalHearts)
    .filter((t) => (hasHearts || hasRatings || hasViews) ? t.engagement > 0 : true)
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
          inline: "start",
        });
      }
    }
  }

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "#060e1a" }}>
      <div className="max-w-[640px] mx-auto px-4">

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
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
            onScroll={(e) => {
              const el = e.currentTarget;
              if (top10.length === 0) return;
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
                totalCards={top10.length}
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
            {top10.map(({ paddle }, i) => {
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
