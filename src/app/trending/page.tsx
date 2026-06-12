"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { paddles } from "@/data/paddles";
import { getTrendingPaddles, engagementScore, isTrendingExcluded, takeTopBySeriesDedup, HeartRecord, MIN_TRENDING_ENGAGEMENT } from "@/lib/trending";
import { supabase } from "@/lib/supabaseClient";
import TrendingCard, { EXPORT_WIDTH, getCode } from "@/components/TrendingCard";

// The download buttons are owner-only. Visiting /trending?export=<secret> once
// per device sets a localStorage flag that reveals them; ?export=off hides them
// again. Normal visitors never see the buttons. (This hides the UI from the
// public; it isn't a hard security boundary — the secret lives in the bundle.)
const EXPORT_SECRET = "tr3nd-export-9f2c";
const EXPORT_UNLOCK_FLAG = "pb-trending-export-unlocked";

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
