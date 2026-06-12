// ─────────────────────────────────────────────────────────────────────────────
//  /specs — admin-friendly spec-card index of every paddle in the catalog.
//
//  Layout: 3-column grid (1 col on mobile, 2 on tablet, 3 on desktop),
//  paginated 18 paddles per page (6 rows × 3 columns on desktop). Same 1:1
//  IG-export card the /trending top-10 page uses, but with rank+dot pager
//  hidden — every paddle gets a card, not just the ranked subset.
//
//  Admin extras (unlocked once per device via /specs?export=<secret>):
//    - A small "Download PNG" button below every visible card. Captures
//      that specific card from its on-screen ref via html-to-image, so
//      single-card downloads work without mounting a fixed-size hidden
//      copy of every paddle.
//
//  Not linked from the main nav — this URL is discoverable only by typing
//  /specs directly. No robots block (it's an admin URL, not secret data),
//  but no internal links either.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { paddles } from "@/data/paddles";
import TrendingCard, { getCode } from "@/components/TrendingCard";

// Same unlock pattern as /trending — visit /specs?export=<secret> once on a
// device to flip a localStorage flag and reveal the download buttons. The
// secret intentionally differs from the trending one so revoking one doesn't
// revoke the other.
const EXPORT_SECRET = "sp3cs-export-7k4j";
const EXPORT_UNLOCK_FLAG = "pb-specs-export-unlocked";

// 18 = 6 rows × 3 cols on desktop. Browsing felt a little dense at 24 and a
// little sparse at 12 — 18 is the sweet spot per the request.
const PAGE_SIZE = 18;

export default function SpecsPage() {
  // Alphabetical sort (brand, then name) so the catalog browses predictably
  // and a given paddle is always on the same page across refreshes.
  const sorted = useMemo(
    () => [...paddles].sort((a, b) => {
      const bc = a.brand.localeCompare(b.brand);
      return bc !== 0 ? bc : a.name.localeCompare(b.name);
    }),
    [],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const [page, setPage] = useState(1);
  const [jumpValue, setJumpValue] = useState("");

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(startIdx, startIdx + PAGE_SIZE);

  // ── Owner-only download unlock ─────────────────────────────────────────────
  const [canExport, setCanExport] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("export");
    if (key === EXPORT_SECRET) {
      localStorage.setItem(EXPORT_UNLOCK_FLAG, "1");
      params.delete("export");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    } else if (key === "off") {
      localStorage.removeItem(EXPORT_UNLOCK_FLAG);
    }
    setCanExport(localStorage.getItem(EXPORT_UNLOCK_FLAG) === "1");
  }, []);

  // ── Per-card refs — one slot per visible card on the current page. Reset
  // when the page changes; captureCard reads directly from the visible ref
  // so we don't need to mount fixed-size hidden copies of all 270+ paddles.
  // Quality stays consistent because every card on the page is rendered at
  // the same grid-column width, and pixelRatio: 2 doubles the resolution
  // on capture.
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState<number | null>(null);

  function fileName(paddleSlug: string, globalIndex: number): string {
    return `${String(globalIndex + 1).padStart(3, "0")}-${paddleSlug}.png`;
  }

  async function captureCard(visibleIndex: number): Promise<string> {
    const node = cardRefs.current[visibleIndex];
    if (!node) throw new Error(`card ${visibleIndex} not mounted`);
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

  async function downloadOne(visibleIndex: number) {
    if (exporting !== null) return;
    setExporting(visibleIndex);
    try {
      const paddle = pageItems[visibleIndex];
      const globalIndex = startIdx + visibleIndex;
      triggerDownload(await captureCard(visibleIndex), fileName(paddle.slug, globalIndex));
    } catch (err) {
      console.error("Card export failed:", err);
      alert("Sorry — that card couldn't be exported. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  // Reset the refs array when the page changes so stale refs from the previous
  // page can't get hit by a stray download click during a re-render.
  useEffect(() => {
    cardRefs.current = [];
  }, [page]);

  // Arrow-key page navigation. Skipped when typing in inputs (the jump-to
  // box, etc.) so it doesn't fight with text editing.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft")  setPage((p) => Math.max(1, p - 1));
      if (e.key === "ArrowRight") setPage((p) => Math.min(totalPages, p + 1));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [totalPages]);

  // Smooth-scroll to the top of the grid on page change so the user never
  // lands deep into row 6 of the new page.
  const gridTopRef = useRef<HTMLDivElement | null>(null);
  function changePage(next: number) {
    setPage(next);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "#060e1a" }}>
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
            Catalog
          </p>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3"
            style={{ color: "#fff" }}
          >
            Every Paddle · Spec Cards
          </h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.5)" }}>
            {sorted.length} paddles · {PAGE_SIZE} per page · ← / → to flip pages
            {canExport && " · download buttons unlocked"}
          </p>
        </div>

        {/* Grid anchor — used for scroll-to-top on page change */}
        <div ref={gridTopRef} />

        {/* 3-column grid of cards. Mobile collapses to 1 column, tablet to 2. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {pageItems.map((paddle, i) => {
            const globalIndex = startIdx + i;
            return (
              <div key={paddle.id} className="flex flex-col gap-2">
                <div ref={(el) => { cardRefs.current[i] = el; }}>
                  <TrendingCard
                    paddle={paddle}
                    rank={0}           // hide podium badge — these aren't ranked
                    code={getCode(paddle.brand, paddle.discountLink)}
                    totalCards={0}     // hide bottom dot pager
                  />
                </div>

                {/* Index + name caption below each card so the admin can
                    confirm what they're about to download at a glance. */}
                <div className="flex items-center justify-between gap-3 px-1">
                  <p className="text-sm font-bold truncate" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <span className="font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.40)" }}>
                      #{String(globalIndex + 1).padStart(3, "0")}
                    </span>{" "}
                    {paddle.brand} {paddle.name}
                  </p>
                  {canExport && (
                    <button
                      onClick={() => downloadOne(i)}
                      disabled={exporting !== null}
                      className="inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-lg flex-shrink-0 transition-all hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
                      style={{ background: "rgba(20,184,166,0.18)", border: "1px solid rgba(45,212,191,0.40)", color: "#5eead4" }}
                    >
                      {exporting === i
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                        : <><Download className="w-3.5 h-3.5" /> PNG</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination — prev, current/total, next, plus a small jump-to-page
            box for power browsing. Hidden when there's only one page. */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => changePage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:scale-105"
                style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="text-sm font-bold tabular-nums px-4 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => changePage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:scale-105"
                style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = parseInt(jumpValue, 10);
                if (Number.isFinite(n) && n >= 1 && n <= totalPages) {
                  changePage(n);
                  setJumpValue("");
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                min={1}
                max={totalPages}
                placeholder="Jump"
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                className="text-sm font-mono px-3 py-1.5 rounded-md w-20 text-center tabular-nums"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
              />
              <button
                type="submit"
                className="text-xs font-bold px-3 py-1.5 rounded-md"
                style={{ background: "rgba(20,184,166,0.18)", border: "1px solid rgba(45,212,191,0.35)", color: "#5eead4" }}
              >
                Go
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
