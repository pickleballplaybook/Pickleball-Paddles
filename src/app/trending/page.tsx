"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { paddles } from "@/data/paddles";
import { Paddle } from "@/types";
import { getTrendingPaddles, engagementScore, isTrendingExcluded, takeTopBySeriesDedup, HeartRecord, MIN_TRENDING_ENGAGEMENT } from "@/lib/trending";
import { siteConfig } from "@/config/site";
import { supabase } from "@/lib/supabaseClient";

// Width each card is rendered at for export; pixelRatio 2 doubles it for a
// crisp ~1200×1200 Instagram-ready PNG. Kept fixed so every export is identical
// regardless of the viewer's screen size.
const EXPORT_WIDTH = 600;

// The download buttons are owner-only. Visiting /trending?export=<secret> once
// per device sets a localStorage flag that reveals them; ?export=off hides them
// again. Normal visitors never see the buttons. (This hides the UI from the
// public; it isn't a hard security boundary — the secret lives in the bundle.)
const EXPORT_SECRET = "tr3nd-export-9f2c";
const EXPORT_UNLOCK_FLAG = "pb-trending-export-unlocked";

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

// Fetches the time-decayed weighted view count per slug for the last N days.
// One round-trip returns the full per-slug map, so we feed it BOTH the
// engagement score AND the candidate pool (avoids the chicken-and-egg where
// /api/views/weighted could only be queried for a set of candidate slugs we
// hadn't picked yet).
function useWeightedViews(days: number) {
  const [views, setViews] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch(`/api/views/weighted?days=${days}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !("error" in data)) setViews(data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [days]);
  return { views, loaded };
}

// ── Stat bar ranges + zone descriptor labels ────────────────────────────────
// `zones` are read by StatBar to render a small uppercase descriptor under
// each value. Same vocabulary the SpecBar component uses on individual
// paddle pages so the language is consistent across surfaces.
//   Balance uses the user-approved trio: HEAD-LIGHT · AVERAGE · HEAD-HEAVY
//   (no 'Neutral' or 'Perfectly Balanced' since each paddle's actual
//    balance varies and 'average' just means 'sits in the typical band'.)

const RANGES = {
  weight:       { min: 7.2, max: 9.2,  unit: "oz", zones: ["Light",      "Average",  "Heavy"]      as const },
  swingWeight:  { min: 95,  max: 125,  unit: "",   zones: ["Whippy",     "Balanced", "Head-Heavy"] as const },
  twistWeight:  { min: 4.5, max: 7.5,  unit: "",   zones: ["Demanding",  "Forgiving","Forgiving+"] as const },
  balancePoint: { min: 22,  max: 26,   unit: "cm", zones: ["Head-Light", "Average",  "Head-Heavy"] as const },
};

// Reference paddle length used to position the balance-point indicator line
// on the trending card. Same constant the BalancePointSpec component uses on
// individual paddle pages — kept as a single canonical reference instead of
// trying to derive it per paddle (which would require accurate per-paddle
// length data we don't have for most paddles yet).
const PADDLE_HEIGHT_CM_REF = 41.0;

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function StatBar({ label, value, displayValue, min, max, fill, glow, zones }: {
  label: string; value: number; displayValue: string; min: number; max: number;
  fill: string; glow: string;
  zones?: readonly [string, string, string];
}) {
  const pct = normalize(value, min, max) * 100;
  // Zone descriptor — simple thirds split since we don't have a per-spec
  // catalog average available here. Picks the matching word from the
  // RANGES.<spec>.zones triple ("Light" / "Average" / "Heavy" etc.) so
  // the language matches the SpecBar component on individual paddle pages.
  const zoneIdx = pct < 33.4 ? 0 : pct > 66.6 ? 2 : 1;
  const descriptor = zones?.[zoneIdx];

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.18em] w-[72px] text-right flex-shrink-0"
        style={{ color: "rgba(186,212,228,0.55)" }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-2 rounded-full overflow-hidden relative"
        style={{
          background: "rgba(255,255,255,0.04)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: fill,
            boxShadow: glow,
          }}
        />
      </div>
      <div className="flex flex-col items-end leading-tight w-[78px] flex-shrink-0">
        <span
          className="text-[11px] font-extrabold font-mono tabular-nums"
          style={{ color: "rgba(255,255,255,0.88)", letterSpacing: "0.02em" }}
        >
          {displayValue}
        </span>
        {descriptor && (
          <span
            className="text-[8px] font-bold uppercase tracking-wider mt-0.5 whitespace-nowrap"
            style={{ color: "rgba(45,212,191,0.78)", letterSpacing: "0.12em" }}
          >
            {descriptor}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Card component (1:1 square, screenshot-optimized for Instagram) ──────────

function TrendingCard({ paddle, rank, code, totalCards }: {
  paddle: Paddle; rank: number; code: string; totalCards: number;
}) {
  const hasRealDiscount = !!paddle.discountLink?.trim() && !!paddle.amountOff && paddle.amountOff !== "$0" && paddle.amountOff !== "";
  const isSelkirk = paddle.brand === "Selkirk" || paddle.brand === "SLK";
  const isSelkirkGiftCard = isSelkirk && !hasRealDiscount && !!paddle.discountLink?.trim() && !paddle.discountLink.includes("lockerroompickleball.com");
  const showCodeChip = hasRealDiscount || isSelkirkGiftCard;
  const weightNum = parseFloat(paddle.weight) || 0;
  const playLabel = paddle.playStyle
    ? paddle.playStyle === "all-court" ? "All-Court" : paddle.playStyle.charAt(0).toUpperCase() + paddle.playStyle.slice(1)
    : paddle.shape;
  const playColors = {
    power:       { dot: "#f87171", text: "rgba(248,113,113,0.95)" },
    control:     { dot: "#4ade80", text: "rgba(74,222,128,0.95)" },
    "all-court": { dot: "#facc15", text: "rgba(250,204,21,0.95)" },
    spin:        { dot: "#fb923c", text: "rgba(251,146,60,0.95)" },
  } as const;
  const pc = playColors[paddle.playStyle as keyof typeof playColors] ?? { dot: "#2dd4bf", text: "rgba(45,212,191,0.95)" };

  // Podium colors — gold for #1, silver for #2, bronze for #3, on-brand
  // teal for everything else. Each variant tunes background, border,
  // shadow, and the numeric color inside the badge so it reads correctly
  // against the metallic gradient.
  const rankStyles: Record<"gold" | "silver" | "bronze" | "teal", {
    bg: string; border: string; shadow: string; num: string;
  }> = {
    gold: {
      bg:     "linear-gradient(135deg, #f4d28a 0%, #d4a35a 100%)",
      border: "rgba(244,210,138,0.75)",
      shadow: "0 8px 24px rgba(212,163,90,0.40), inset 0 1px 0 rgba(255,255,255,0.45)",
      num:    "#1a0f00",
    },
    silver: {
      bg:     "linear-gradient(135deg, #e5e7eb 0%, #94a3b8 100%)",
      border: "rgba(229,231,235,0.75)",
      shadow: "0 8px 24px rgba(148,163,184,0.38), inset 0 1px 0 rgba(255,255,255,0.50)",
      num:    "#0f172a",
    },
    bronze: {
      bg:     "linear-gradient(135deg, #d97a3a 0%, #92451c 100%)",
      border: "rgba(217,122,58,0.80)",
      shadow: "0 8px 24px rgba(146,69,28,0.40), inset 0 1px 0 rgba(255,255,255,0.30)",
      num:    "#1a0a05",
    },
    teal: {
      bg:     "linear-gradient(135deg, rgba(20,184,166,0.55) 0%, rgba(13,148,136,0.30) 100%)",
      border: "rgba(45,212,191,0.55)",
      shadow: "0 6px 20px rgba(20,184,166,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
      num:    "#fff",
    },
  };
  const podium = rank === 1 ? rankStyles.gold
    : rank === 2 ? rankStyles.silver
    : rank === 3 ? rankStyles.bronze
    : rankStyles.teal;
  const isTopRank = rank === 1;  // used elsewhere for the gold dot indicator below

  // All bars use the brand teal — the descriptor under each value carries
  // the meaning (Light / Average / Heavy etc.) so the bar color doesn't
  // need to differentiate. Reads as a cohesive premium dashboard instead
  // of a multi-color stack.
  const TEAL_FILL = "linear-gradient(90deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)";
  const TEAL_GLOW = "0 0 8px rgba(45,212,191,0.40)";
  const BARS = {
    weight:  { fill: TEAL_FILL, glow: TEAL_GLOW },
    swing:   { fill: TEAL_FILL, glow: TEAL_GLOW },
    twist:   { fill: TEAL_FILL, glow: TEAL_GLOW },
    balance: { fill: TEAL_FILL, glow: TEAL_GLOW },
  };
  // Balance line + 'BAL PT' label use the site's yellow-green discount
  // accent (#defa32). It's the one place we let a non-teal color through
  // on the card so the line stays visible against the now all-teal stat
  // bars — the previous teal-on-teal treatment was getting lost.
  const BAL_ACCENT = "rgba(222,250,50,0.75)";

  // Vertical position (% from bottom of paddle image) where the balance
  // line should sit on the paddle. Clamped to leave a little headroom
  // top and bottom so an extreme value never pins the line into the
  // glow at the edge of the image.
  const balancePct = paddle.balancePoint
    ? Math.max(8, Math.min(92, (paddle.balancePoint / PADDLE_HEIGHT_CM_REF) * 100))
    : null;

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        aspectRatio: "1 / 1",
        background: [
          // Soft teal aurora top
          "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(20,184,166,0.16) 0%, transparent 65%)",
          // Subtle warm vignette bottom-right
          "radial-gradient(ellipse 70% 50% at 95% 95%, rgba(212,163,90,0.05) 0%, transparent 60%)",
          // Base gradient
          "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #08182a 100%)",
        ].join(", "),
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.08)",
          "inset 0 0 0 1px rgba(255,255,255,0.04)",
          "inset 0 -60px 100px rgba(0,0,0,0.35)",
          "0 20px 50px rgba(0,0,0,0.45)",
        ].join(", "),
      }}
    >
      {/* Rank badge — podium-colored: gold #1, silver #2, bronze #3, teal else */}
      <div
        className="absolute top-5 left-5 w-14 h-14 rounded-full flex items-center justify-center z-10"
        style={{
          background: podium.bg,
          border: `1.5px solid ${podium.border}`,
          boxShadow: podium.shadow,
        }}
      >
        <span
          className="text-xl font-extrabold tabular-nums"
          style={{
            color: podium.num,
            letterSpacing: "-0.02em",
            textShadow: rank <= 3 ? "0 1px 0 rgba(255,255,255,0.25)" : "none",
          }}
        >
          #{rank}
        </span>
      </div>

      {/* Header branding — with thin decorative rules either side */}
      <div className="absolute top-7 left-0 right-0 flex items-center justify-center gap-3 pointer-events-none z-10">
        <span className="h-px w-6" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25))" }} />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.35em]" style={{ color: "rgba(255,255,255,0.55)" }}>
          PlaybookPaddles.com
        </p>
        <span className="h-px w-6" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.25), transparent)" }} />
      </div>

      {/* ── Main content row — horizontal split: paddle LEFT, specs RIGHT ──
          The header + footer keep their absolute positioning, this row fills
          the space in between. */}
      <div className="absolute inset-x-0 top-[14%] bottom-[10%] flex items-stretch gap-3 px-5">

        {/* ── LEFT: paddle image — height-locked at 96% of the column so
                every paddle renders at the same size regardless of the
                source image's aspect ratio. Wider source images overflow
                horizontally and get clipped by overflow-hidden. */}
        <div className="relative flex-[0.52] flex items-center justify-center overflow-hidden">
          {/* Balance line — sits BEHIND the paddle (z-index 0 vs the
              image's z-index 1) so it's only visible on either side of
              the paddle silhouette. A small 'BAL PT' label sits just
              below the line on the right side, in the same amber tone,
              so the user knows what they're looking at without the
              diagonal leader cutting across the spec card. */}
          {balancePct !== null && (
            <>
              <div
                aria-hidden
                className="absolute left-0 right-0 pointer-events-none z-[0]"
                style={{
                  // Thicker line + explicit dash/gap via repeating-linear-
                  // gradient because CSS `border-style: dashed` doesn't let
                  // us tune dash length or spacing (browser-default looks
                  // like tight little ticks at this size). 14px dash + 10px
                  // gap reads cleanly at the card's scale.
                  bottom: `${balancePct}%`,
                  height: 3,
                  marginBottom: -1.5,
                  backgroundImage: `repeating-linear-gradient(to right, ${BAL_ACCENT} 0 14px, transparent 14px 24px)`,
                }}
              />
              <div
                aria-hidden
                className="absolute pointer-events-none z-[0]"
                style={{
                  // Anchored to the LEFT side of the paddle column, below
                  // the line — there's more empty space there than on the
                  // right, so the label reads cleanly without being clipped
                  // by the paddle silhouette.
                  bottom: `calc(${balancePct}% - 14px)`,
                  left: 4,
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: BAL_ACCENT,
                  textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                }}
              >
                Bal Pt
              </div>
            </>
          )}

          {paddle.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={paddle.image}
              alt={`${paddle.brand} ${paddle.name}`}
              className="relative z-[1] h-[96%] w-auto max-w-none object-contain"
              style={{ filter: "drop-shadow(0 22px 38px rgba(0,0,0,0.60)) drop-shadow(0 4px 12px rgba(0,0,0,0.42))" }}
            />
          )}
          {/* Pedestal glow under the paddle */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-8 w-[68%] h-3 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 75%)", filter: "blur(6px)" }}
          />
          {/* Play-style badge — under the paddle, in its column */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-[2]">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
              style={{
                background: "rgba(8,18,32,0.7)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: pc.text,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc.dot, boxShadow: `0 0 6px ${pc.dot}` }} />
              {playLabel}
            </span>
          </div>
        </div>

        {/* ── RIGHT: stacked specs panel + prominent code chip ─────────── */}
        <div className="relative flex-[0.48] flex flex-col gap-3 self-center">

          {/* Big code chip up top — the prominent placement the user asked for. */}
          {showCodeChip && (
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "linear-gradient(135deg, rgba(20,184,166,0.25) 0%, rgba(20,184,166,0.08) 100%)",
                border: "1.5px solid rgba(45,212,191,0.40)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 14px rgba(20,184,166,0.18)",
              }}
            >
              <p className="text-[9px] font-extrabold uppercase tracking-[0.25em] mb-1" style={{ color: "rgba(255,255,255,0.50)" }}>
                Discount Code
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold font-mono tracking-wider" style={{ color: "#5eead4" }}>{code}</span>
                <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.55)" }}>
                  · {hasRealDiscount ? `${paddle.amountOff} off` : "Free gift card"}
                </span>
              </div>
            </div>
          )}

          {/* Spec panel — glassy, contains brand/name + stat bars */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            {/* Brand + name */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em]" style={{ color: "rgba(45,212,191,0.85)" }}>
                {paddle.brand}
              </p>
              <h2
                className="text-lg font-extrabold text-white leading-tight mt-0.5"
                style={{ letterSpacing: "-0.01em" }}
              >
                {paddle.name}
              </h2>
              <p className="text-[10px] mt-1 font-medium uppercase tracking-[0.12em]" style={{ color: "rgba(186,212,228,0.45)" }}>
                {paddle.shape} · {paddle.thickness}
              </p>
            </div>

            {/* Hairline divider */}
            <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />

            {/* Stat bars */}
            <div className="flex flex-col gap-2">
              <StatBar
                label="Weight"
                value={weightNum}
                displayValue={paddle.weight}
                min={RANGES.weight.min}
                max={RANGES.weight.max}
                fill={BARS.weight.fill}
                glow={BARS.weight.glow}
                zones={RANGES.weight.zones}
              />
              {paddle.swingWeight > 0 && (
                <StatBar
                  label="Swing Wt"
                  value={paddle.swingWeight}
                  displayValue={paddle.swingWeight.toFixed(1)}
                  min={RANGES.swingWeight.min}
                  max={RANGES.swingWeight.max}
                  fill={BARS.swing.fill}
                  glow={BARS.swing.glow}
                  zones={RANGES.swingWeight.zones}
                />
              )}
              {paddle.twistWeight > 0 && (
                <StatBar
                  label="Twist Wt"
                  value={paddle.twistWeight}
                  displayValue={paddle.twistWeight.toFixed(2)}
                  min={RANGES.twistWeight.min}
                  max={RANGES.twistWeight.max}
                  fill={BARS.twist.fill}
                  glow={BARS.twist.glow}
                  zones={RANGES.twistWeight.zones}
                />
              )}
              {typeof paddle.balancePoint === "number" && (
                <StatBar
                  label="Bal Pt"
                  value={paddle.balancePoint}
                  displayValue={`${paddle.balancePoint.toFixed(1)} cm`}
                  min={RANGES.balancePoint.min}
                  max={RANGES.balancePoint.max}
                  fill={BARS.balance.fill}
                  glow={BARS.balance.glow}
                  zones={RANGES.balancePoint.zones}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer branding */}
      <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between pointer-events-none z-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "rgba(186,212,228,0.5)" }}>
          Playbook Reviews
        </p>
        <p className="text-[10px] font-semibold" style={{ color: "rgba(186,212,228,0.4)" }}>
          playbookpaddles.com
        </p>
      </div>

      {/* Dot indicators — refined oval shape */}
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1 pointer-events-none z-10">
        {Array.from({ length: totalCards }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: i === rank - 1 ? 12 : 4,
              height: 3,
              background: i === rank - 1
                ? (isTopRank ? "linear-gradient(90deg, #f4d28a, #d4a35a)" : "linear-gradient(90deg, #2dd4bf, #14b8a6)")
                : "rgba(255,255,255,0.18)",
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
  const [heartsLoaded, setHeartsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    supabase
      .from("paddle_hearts")
      .select("paddle_id, created_at")
      .then(({ data }) => {
        if (data) {
          setHeartRecords(data.map((row) => ({ paddleId: row.paddle_id, createdAt: row.created_at })));
        }
        setHeartsLoaded(true);
      });
  }, []);

  // 30-day window with time-decay (handled inside getTrendingPaddles via
  // getHeartWeight). A heart from today counts 1.0; a heart from 28 days ago
  // counts 0.5. Hearts older than 30 days are dropped entirely so a long-since-
  // popular paddle can't ride its history forever.
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const recentHearts = heartRecords.filter((h) => new Date(h.createdAt).getTime() >= thirtyDaysAgo);

  // Weighted view counts for ALL paddles in the same 30-day window. This is
  // the single biggest correctness fix: the previous implementation used
  // all-time cumulative views, so paddles that had been on the site longest
  // accumulated a permanent advantage even with zero recent traffic.
  const { views: weightedViews, loaded: viewsLoaded } = useWeightedViews(30);

  const allTrending = getTrendingPaddles(paddles, recentHearts, paddles.length);

  // Candidate pool for ratings: anything hearted in window + anything with
  // meaningful recent views. (We can pick those out NOW because the weighted
  // views endpoint returns the full per-slug map up front.) The static
  // trendingScore fallback that used to seed this list is gone — that was
  // what let cold paddles like Trufoam Barrage stay in the candidate pool
  // forever.
  const heartedIds = new Set(recentHearts.map((h) => h.paddleId));
  const topViewedSlugs = Object.entries(weightedViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([slug]) => slug);
  const topViewedIds = topViewedSlugs
    .map((slug) => paddles.find((p) => p.slug === slug)?.id)
    .filter(Boolean) as string[];
  const candidateIds = Array.from(new Set([...Array.from(heartedIds), ...topViewedIds])).slice(0, 40);
  const ratingCounts = useRatingCounts(candidateIds);

  const hasHearts = recentHearts.length > 0;
  const hasRatings = Object.values(ratingCounts).some((r) => r.count > 0);
  const hasViews = Object.keys(weightedViews).length > 0;
  const dataReady = heartsLoaded && viewsLoaded;

  // Sort by combined engagement (weighted hearts via getHeartWeight inside
  // getTrendingPaddles → weightedScore; weighted views from the endpoint;
  // rating counts as before). Use weightedScore as the primary signal, not
  // raw totalHearts — otherwise a paddle hearted 28 days ago at full count
  // outranks one hearted heavily today.
  const top10Pre = allTrending
    .map((t) => ({
      ...t,
      engagement: engagementScore(
        t.weightedScore < 0 ? 0 : t.weightedScore,
        weightedViews[t.paddle.slug] ?? 0,
      ),
    }))
    .sort((a, b) => b.engagement - a.engagement || (b.lastHeart ?? 0) - (a.lastHeart ?? 0))
    // Minimum engagement floor — same single-heart-no-views filter the
    // homepage Trending section uses, kept in lockstep via MIN_TRENDING_ENGAGEMENT
    // so /trending and the homepage never disagree about what qualifies.
    .filter((t) => (hasHearts || hasRatings || hasViews) ? t.engagement >= MIN_TRENDING_ENGAGEMENT : true)
    .filter((t) => !isTrendingExcluded(t.paddle.slug));
  const top10 = takeTopBySeriesDedup(top10Pre, 10);

  // ── PNG export ────────────────────────────────────────────────────────────
  // Hidden, fixed-size copies of every card (below) are the capture source, so
  // single and "all" downloads always produce identical, screen-independent PNGs.
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState<"none" | "all" | number>("none");

  // Owner-only unlock: reveal the download buttons only when the localStorage
  // flag is set (via /trending?export=<secret>). Hidden for everyone else.
  const [canExport, setCanExport] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("export");
    if (key === EXPORT_SECRET) {
      localStorage.setItem(EXPORT_UNLOCK_FLAG, "1");
      params.delete("export"); // strip the secret from the visible URL
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    } else if (key === "off") {
      localStorage.removeItem(EXPORT_UNLOCK_FLAG);
    }
    setCanExport(localStorage.getItem(EXPORT_UNLOCK_FLAG) === "1");
  }, []);

  function fileName(index: number): string {
    const slug = top10[index]?.paddle.slug ?? `paddle-${index + 1}`;
    return `${String(index + 1).padStart(2, "0")}-${slug}.png`;
  }

  async function captureCard(index: number): Promise<string> {
    const node = exportRefs.current[index];
    if (!node) throw new Error(`card ${index} not mounted`);
    // Wait for fonts so text isn't captured in a fallback face.
    if (document.fonts?.ready) await document.fonts.ready;
    // html-to-image's first capture of a node can miss late-loaded images;
    // a warm-up pass makes the real capture reliable.
    const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: "#060e1a" };
    await toPng(node, opts);
    return toPng(node, opts);
  }

  function triggerDownload(href: string, name: string) {
    const link = document.createElement("a");
    link.download = name;
    link.href = href;
    link.click();
  }

  async function downloadOne(index: number) {
    if (exporting !== "none") return;
    setExporting(index);
    try {
      triggerDownload(await captureCard(index), fileName(index));
    } catch (err) {
      console.error("Card export failed:", err);
      alert("Sorry — that card couldn't be exported. Please try again.");
    } finally {
      setExporting("none");
    }
  }

  async function downloadAll() {
    if (exporting !== "none" || top10.length === 0) return;
    setExporting("all");
    try {
      const zip = new JSZip();
      for (let i = 0; i < top10.length; i++) {
        const dataUrl = await captureCard(i);
        zip.file(fileName(i), dataUrl.split(",")[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `playbook-trending-top10-${new Date().toISOString().slice(0, 10)}.zip`);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Bulk export failed:", err);
      alert("Sorry — the bulk export failed. Please try again.");
    } finally {
      setExporting("none");
    }
  }

  // Owner-only hotkey: ⌘I / Ctrl+I instantly downloads the full top-10 zip.
  // A ref keeps the listener pointed at the latest closure (current top10 /
  // exporting state) without re-registering on every render.
  const downloadAllRef = useRef(downloadAll);
  useEffect(() => { downloadAllRef.current = downloadAll; });
  useEffect(() => {
    if (!canExport) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        downloadAllRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canExport]);

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
            Ranked by views, hearts, and ratings — last 30 days
          </p>
        </div>

        {/* Single card display — wait for data to avoid order jumps */}
        {!dataReady && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {dataReady && top10.length > 0 && (
          <>
            {/* Card + side-positioned nav arrows. The arrows sit just
                outside the card's left and right edges so they feel like
                "flip to the next paddle" affordances instead of a separate
                pager block below. The wrapper is relative so the absolute
                arrows anchor to the card itself. */}
            <div className="relative">
              <TrendingCard
                paddle={top10[currentIndex].paddle}
                rank={currentIndex + 1}
                code={getCode(top10[currentIndex].paddle.brand, top10[currentIndex].paddle.discountLink)}
                totalCards={top10.length}
              />

              {/* Prev — left edge */}
              <button
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                aria-label="Previous paddle"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-20 z-20 hover:scale-105"
                style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              {/* Next — right edge */}
              <button
                onClick={() => setCurrentIndex((p) => Math.min(top10.length - 1, p + 1))}
                disabled={currentIndex >= top10.length - 1}
                aria-label="Next paddle"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-20 z-20 hover:scale-105"
                style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Position counter below the card — arrows moved away */}
            <div className="flex items-center justify-center mt-4">
              <span className="text-sm font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>
                {currentIndex + 1} / {top10.length}
              </span>
            </div>

            {/* Download buttons — owner-only (unlocked via ?export=<secret>) */}
            {canExport && <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <button
                onClick={() => downloadOne(currentIndex)}
                disabled={exporting !== "none"}
                className="inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 w-full sm:w-auto"
                style={{ background: "#14b8a6" }}
              >
                {exporting === currentIndex
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Download className="w-4 h-4" /> Download this card (#{currentIndex + 1})</>}
              </button>
              <button
                onClick={downloadAll}
                disabled={exporting !== "none"}
                className="inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 w-full sm:w-auto"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
              >
                {exporting === "all"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Building zip…</>
                  : <><Download className="w-4 h-4" /> Download all {top10.length} (.zip)</>}
              </button>
            </div>}
            {canExport && (
              <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                Tip: press <kbd className="font-mono font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>⌘I</kbd> (or <kbd className="font-mono font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>Ctrl+I</kbd>) to download all {top10.length} instantly.
              </p>
            )}

            {/* Dot navigation */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {top10.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: i === currentIndex ? "#14b8a6" : "rgba(255,255,255,0.2)",
                    transform: i === currentIndex ? "scale(1.3)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* List view for quick reference */}
        {dataReady && <div className="mt-16">
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
        </div>}

      </div>

      {/* Hidden fixed-size copies — the PNG capture source. Positioned off-screen
          (not display:none / opacity:0) so they keep real layout and images load.
          Only mounted for the owner so normal visitors render nothing extra. */}
      {canExport && <div aria-hidden style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }}>
        {top10.map((t, i) => (
          <div
            key={t.paddle.id}
            ref={(el) => { exportRefs.current[i] = el; }}
            style={{ width: EXPORT_WIDTH }}
          >
            <TrendingCard
              paddle={t.paddle}
              rank={i + 1}
              code={getCode(t.paddle.brand, t.paddle.discountLink)}
              totalCards={top10.length}
            />
          </div>
        ))}
      </div>}
    </div>
  );
}
