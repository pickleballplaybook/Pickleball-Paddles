"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { paddles } from "@/data/paddles";
import { Paddle } from "@/types";
import { getTrendingPaddles, engagementScore, isTrendingExcluded, HeartRecord } from "@/lib/trending";
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

function StatBar({ label, value, displayValue, min, max, fill, glow }: {
  label: string; value: number; displayValue: string; min: number; max: number; fill: string; glow: string;
}) {
  const pct = normalize(value, min, max) * 100;
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
      <span
        className="text-[11px] font-extrabold font-mono w-[52px] flex-shrink-0 tabular-nums"
        style={{ color: "rgba(255,255,255,0.88)", letterSpacing: "0.02em" }}
      >
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
    power:       { dot: "#f87171", text: "rgba(248,113,113,0.95)" },
    control:     { dot: "#4ade80", text: "rgba(74,222,128,0.95)" },
    "all-court": { dot: "#facc15", text: "rgba(250,204,21,0.95)" },
    spin:        { dot: "#fb923c", text: "rgba(251,146,60,0.95)" },
  } as const;
  const pc = playColors[paddle.playStyle as keyof typeof playColors] ?? { dot: "#2dd4bf", text: "rgba(45,212,191,0.95)" };

  // Premium rank badge: gold for #1, teal otherwise.
  const isTopRank = rank === 1;
  const rankBg = isTopRank
    ? "linear-gradient(135deg, #f4d28a 0%, #d4a35a 100%)"
    : "linear-gradient(135deg, rgba(20,184,166,0.55) 0%, rgba(13,148,136,0.30) 100%)";
  const rankBorder = isTopRank ? "rgba(244,210,138,0.75)" : "rgba(45,212,191,0.55)";
  const rankShadow = isTopRank
    ? "0 8px 24px rgba(212,163,90,0.40), inset 0 1px 0 rgba(255,255,255,0.45)"
    : "0 6px 20px rgba(20,184,166,0.28), inset 0 1px 0 rgba(255,255,255,0.18)";
  const rankNumColor = isTopRank ? "#1a0f00" : "#fff";

  // Refined stat-bar palette — champagne gold replaces the old orange for twist.
  const BARS = {
    weight: {
      fill: "linear-gradient(90deg, #64748b 0%, #94a3b8 60%, #cbd5e1 100%)",
      glow: "0 0 6px rgba(203,213,225,0.25)",
    },
    swing: {
      fill: "linear-gradient(90deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)",
      glow: "0 0 8px rgba(45,212,191,0.40)",
    },
    twist: {
      fill: "linear-gradient(90deg, #b8895a 0%, #d4a574 50%, #f4c980 100%)",
      glow: "0 0 8px rgba(240,201,128,0.38)",
    },
  };

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
      {/* Rank badge — premium */}
      <div
        className="absolute top-5 left-5 w-14 h-14 rounded-full flex items-center justify-center z-10"
        style={{
          background: rankBg,
          border: `1.5px solid ${rankBorder}`,
          boxShadow: rankShadow,
        }}
      >
        <span
          className="text-xl font-extrabold tabular-nums"
          style={{ color: rankNumColor, letterSpacing: "-0.02em", textShadow: isTopRank ? "0 1px 0 rgba(255,255,255,0.25)" : "none" }}
        >
          #{rank}
        </span>
      </div>

      {/* Header branding — with thin decorative rules either side */}
      <div className="absolute top-7 left-0 right-0 flex items-center justify-center gap-3 pointer-events-none z-10">
        <span className="h-px w-6" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25))" }} />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.35em]" style={{ color: "rgba(255,255,255,0.55)" }}>
          Playbook Reviews
        </p>
        <span className="h-px w-6" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.25), transparent)" }} />
      </div>

      {/* ── Top half: paddle image with play style label ────────────────── */}
      <div className="absolute inset-x-0 top-0 h-[56%] flex items-center justify-center">
        {paddle.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={paddle.image}
            alt={`${paddle.brand} ${paddle.name}`}
            className="relative z-[1] max-h-[92%] w-auto object-contain"
            style={{ filter: "drop-shadow(0 20px 34px rgba(0,0,0,0.58)) drop-shadow(0 4px 12px rgba(0,0,0,0.38))" }}
          />
        )}
        {/* Pedestal glow under the paddle */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[58%] h-3 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 75%)", filter: "blur(6px)" }}
        />
        {/* Play style badge */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[2]">
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

      {/* ── Bottom half: specs panel — glassy with subtle top highlight ── */}
      <div className="absolute inset-x-0 bottom-0 h-[44%] flex flex-col justify-center px-6 pb-10 pt-2">
        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
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
              className="text-xl font-extrabold text-white leading-tight mt-0.5"
              style={{ letterSpacing: "-0.01em" }}
            >
              {paddle.name}
            </h2>
            <p className="text-[11px] mt-1 font-medium uppercase tracking-[0.12em]" style={{ color: "rgba(186,212,228,0.45)" }}>
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
              />
            )}
          </div>

          {/* Discount code — refined glassy chip */}
          {hasDiscount && (
            <div
              className="inline-flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-lg self-start"
              style={{
                background: "linear-gradient(135deg, rgba(20,184,166,0.20) 0%, rgba(20,184,166,0.06) 100%)",
                border: "1px solid rgba(45,212,191,0.30)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(20,184,166,0.10)",
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                Code
              </span>
              <span className="text-xs font-extrabold font-mono tracking-wider" style={{ color: "#5eead4" }}>{code}</span>
              <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>· {paddle.amountOff} off</span>
            </div>
          )}
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

  // Filter hearts to last 7 days for trending page
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const recentHearts = heartRecords.filter((h) => new Date(h.createdAt).getTime() >= sevenDaysAgo);

  // Only fetch ratings for top candidates (not all 116+ paddles)
  // Mirror the homepage Trending Paddles section exactly: candidate selection
  // and the hasHearts flag use the SAME last-7-days window as the scoring, so a
  // paddle hearted only outside the window (e.g. Selkirk Boomstik) never becomes
  // a candidate, never picks up its accumulated views, and stays out of the top 10.
  const allTrending = getTrendingPaddles(paddles, recentHearts, paddles.length);
  const heartedIds = new Set(recentHearts.map((h) => h.paddleId));
  const topByScore = [...paddles].sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 20);
  const candidateIds = Array.from(new Set([...Array.from(heartedIds), ...topByScore.map((p) => p.id)])).slice(0, 30);
  const ratingCounts = useRatingCounts(candidateIds);

  const candidateSlugs = candidateIds
    .map((id) => paddles.find((p) => p.id === id)?.slug)
    .filter(Boolean) as string[];
  const viewCounts = useViewCounts(candidateSlugs);

  const hasHearts = recentHearts.length > 0;
  const hasRatings = Object.values(ratingCounts).some((r) => r.count > 0);
  const hasViews = Object.values(viewCounts).some((v) => v > 0);
  const dataReady = heartsLoaded && (hasViews || (!hasHearts && !hasRatings));

  // Same scoring as homepage: hearts + ratings + views/10
  const top10 = allTrending
    .map((t) => ({
      ...t,
      engagement: engagementScore(t.totalHearts, ratingCounts[t.paddle.id]?.count ?? 0, viewCounts[t.paddle.slug] ?? 0),
    }))
    .sort((a, b) => b.engagement - a.engagement || b.totalHearts - a.totalHearts)
    .filter((t) => (hasHearts || hasRatings || hasViews) ? t.engagement > 0 : true)
    .filter((t) => !isTrendingExcluded(t.paddle.slug))
    .slice(0, 10);

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
            Ranked by views, hearts, and ratings — last 7 days
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
            {/* Card */}
            <TrendingCard
              paddle={top10[currentIndex].paddle}
              rank={currentIndex + 1}
              code={getCode(top10[currentIndex].paddle.brand, top10[currentIndex].paddle.discountLink)}
              totalCards={top10.length}
            />

            {/* Nav buttons — below the card, outside the frame */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                {currentIndex + 1} / {top10.length}
              </span>
              <button
                onClick={() => setCurrentIndex((p) => Math.min(top10.length - 1, p + 1))}
                disabled={currentIndex >= top10.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
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
