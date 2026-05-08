"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Star, Heart } from "lucide-react";
import { Paddle } from "@/types";
import { getTrendingPaddles, getRisingBrands, HeartRecord } from "@/lib/trending";
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

// ── Main export (client component) ────────────────────────────────────────────

export default function TrendingSection({ paddles }: { paddles: Paddle[] }) {
  const [heartRecords, setHeartRecords] = useState<HeartRecord[]>([]);

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

  const hasHearts = heartRecords.length > 0;

  const allTrending = getTrendingPaddles(paddles, heartRecords, paddles.length);
  const allBrands   = getRisingBrands(paddles, heartRecords, paddles.length);

  const trending = hasHearts
    ? allTrending.filter((t) => t.totalHearts > 0).slice(0, 5)
    : allTrending.slice(0, 5);

  const brands = hasHearts
    ? allBrands.filter((b) => b.totalHearts > 0).slice(0, 5)
    : allBrands.slice(0, 5);

  return (
    <section id="trending" className="section-y" style={{ background: "var(--flip-bg)" }}>
      <div className="container-xl">

        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
            Live Intelligence
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "var(--flip-text-head)" }}>
                What&apos;s Trending
              </h2>
              <p className="mt-2 text-base" style={{ color: "var(--flip-text-muted)" }}>
                What players are actually paying attention to right now
              </p>
            </div>
            <Link
              href="/paddles"
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-sm font-semibold transition-colors whitespace-nowrap hover:text-brand-400"
              style={{ color: "#2dd4bf" }}
            >
              Browse all paddles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Trending Paddles ─────────────────────────────────────────── */}
          <ColumnCard
            icon={<TrendingUp className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={2} />}
            title="Trending Paddles"
            subtitle="Trending paddles ranked by what's hot right now"
          >
            {trending.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--flip-text-muted)" }}>
                Heart paddles you like to see them appear here.
              </p>
            ) : (
              trending.map(({ paddle, totalHearts }, i) => (
                <Link
                  key={paddle.id}
                  href={`/paddles/${paddle.slug}`}
                  className="flex items-center gap-3 group"
                >
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                    style={{ background: "var(--flip-divider)", color: "var(--flip-text-muted)" }}
                  >
                    {i + 1}
                  </span>
                  {/* Paddle thumbnail */}
                  <div
                    className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ background: "var(--flip-divider)" }}
                  >
                    {paddle.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={paddle.image}
                        alt={paddle.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-teal-500/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider truncate" style={{ color: "var(--flip-text-muted)" }}>
                      {paddle.brand}
                    </p>
                    <p className="text-sm font-bold truncate group-hover:text-teal-500 transition-colors" style={{ color: "var(--flip-text-head)" }}>
                      {paddle.name}
                    </p>
                    {paddle.playStyle && (
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5"
                        style={{
                          background: paddle.playStyle === "power"
                            ? "rgba(251,146,60,0.15)" : paddle.playStyle === "control"
                            ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.15)",
                          color: paddle.playStyle === "power" ? "#fb923c"
                            : paddle.playStyle === "control" ? "#818cf8" : "#4ade80",
                        }}
                      >
                        {paddle.playStyle === "all-court" ? "All-Court" : paddle.playStyle === "power" ? "Power" : "Control"}
                      </span>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                    style={
                      totalHearts > 0
                        ? { background: "rgba(239,68,68,0.10)", color: "#f87171", border: "1px solid rgba(239,68,68,0.20)" }
                        : { background: "var(--flip-divider)", color: "var(--flip-text-muted)" }
                    }
                  >
                    <Heart className="w-3 h-3" fill={totalHearts > 0 ? "currentColor" : "none"} />
                    {totalHearts}
                  </span>
                </Link>
              ))
            )}
          </ColumnCard>

          {/* ── Rising Brands ────────────────────────────────────────────── */}
          <ColumnCard
            icon={<Star className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={2} />}
            title="Rising Brands"
            subtitle="Brands ranked by total engagement"
          >
            {brands.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--flip-text-muted)" }}>
                Heart paddles you like to see top brands here.
              </p>
            ) : (
              brands.map(({ brand, totalHearts, paddleCount, topSlug }) => (
                <Link
                  key={brand}
                  href={`/paddles/${topSlug}`}
                  className="flex items-center justify-between gap-3 group"
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
