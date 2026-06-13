// ─────────────────────────────────────────────────────────────────────────────
//  /specs — admin-friendly spec-card index of every paddle in the catalog.
//
//  Layout: 3-column grid (1 col on mobile, 2 on tablet, 3 on desktop),
//  paginated 18 paddles per page (6 rows × 3 columns on desktop). Same 4:5
//  IG-export card the /trending top-10 page uses, but with rank+dot pager
//  hidden — every paddle gets a card, not just the ranked subset.
//
//  Proportion fix: TrendingCard is tuned for a 600 × 750 px design surface
//  (4:5 portrait). In a narrower grid column the absolutely-positioned
//  header overlaps the content row (long paddle names wrap into the
//  discount chip). To preserve the exported look pixel-for-pixel we render
//  each card at its native 600 × 750 px size inside a container-query
//  wrapper that uniformly scales the rendered output to fit the column.
//  Result: every card on /specs looks identical to its PNG export.
//
//  Downloads: a 'PNG' button sits below every card. Captures from the
//  unscaled 600 × 750 ref at pixelRatio 1.8, so exports always render at a
//  consistent 1080 × 1350 (Instagram's preferred portrait feed size),
//  independent of viewport. No unlock secret — /specs is admin-only by
//  virtue of not being linked from the nav.
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
import TrendingCard, { EXPORT_WIDTH, EXPORT_HEIGHT, EXPORT_PIXEL_RATIO, getCode } from "@/components/TrendingCard";

// 18 = 6 rows × 3 cols on desktop. Browsing felt a little dense at 24 and a
// little sparse at 12 — 18 is the sweet spot per the request.
const PAGE_SIZE = 18;

// Sort options surfaced in the dropdown above the grid. A-Z is the default
// because it makes any given paddle land on the same page across refreshes,
// which matters when bulk-exporting cards. Price/date sorts re-shuffle that
// stable order on demand.
type SortKey =
  | "az"
  | "za"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "oldest";

const SORT_LABELS: Record<SortKey, string> = {
  "az":         "A → Z",
  "za":         "Z → A",
  "price-asc":  "Price: Low → High",
  "price-desc": "Price: High → Low",
  "newest":     "Newest → Oldest",
  "oldest":     "Oldest → Newest",
};

// Parse a price string like "$209.99" → 209.99. Returns Infinity for
// missing / unparseable prices so they sort to the *end* on both
// directions instead of randomly clumping at one extreme.
function parsePrice(p?: string): number {
  if (!p) return Infinity;
  const n = parseFloat(p.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : Infinity;
}

export default function SpecsPage() {
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  // Apply the selected sort. A-Z (default) sorts by brand then name so the
  // catalog browses predictably. The other options re-shuffle by the
  // requested key.
  const sorted = useMemo(() => {
    const arr = [...paddles];
    switch (sortKey) {
      case "az":
        return arr.sort((a, b) => {
          const bc = a.brand.localeCompare(b.brand);
          return bc !== 0 ? bc : a.name.localeCompare(b.name);
        });
      case "za":
        return arr.sort((a, b) => {
          const bc = b.brand.localeCompare(a.brand);
          return bc !== 0 ? bc : b.name.localeCompare(a.name);
        });
      case "price-asc":
        return arr.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      case "price-desc":
        return arr.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      case "newest":
        return arr.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
      case "oldest":
        return arr.sort((a, b) => a.addedAt.localeCompare(b.addedAt));
    }
  }, [sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const [page, setPage] = useState(1);
  const [jumpValue, setJumpValue] = useState("");

  // Whenever the sort changes, jump back to page 1 so the user sees the
  // start of the new order instead of landing mid-list.
  useEffect(() => { setPage(1); }, [sortKey]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(startIdx, startIdx + PAGE_SIZE);

  // ── Per-card refs — one slot per visible card on the current page. Reset
  // when the page changes. captureCard reads the unscaled 600 px card via
  // its ref so every export PNG is consistently 1200 × 1200 (pixelRatio 2)
  // regardless of viewport.
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState<number | null>(null);

  function fileName(paddleSlug: string, globalIndex: number): string {
    return `${String(globalIndex + 1).padStart(3, "0")}-${paddleSlug}.png`;
  }

  async function captureCard(visibleIndex: number): Promise<string> {
    const node = cardRefs.current[visibleIndex];
    if (!node) throw new Error(`card ${visibleIndex} not mounted`);
    if (document.fonts?.ready) await document.fonts.ready;
    // Explicitly decode every <img> inside the card before capturing.
    // Without this, the first click can fail because html-to-image starts
    // serializing before the paddle image is fully ready in the renderer
    // — by the second click the browser has cached it and it works.
    await Promise.all(
      Array.from(node.querySelectorAll("img")).map(async (img) => {
        try {
          if (!(img.complete && img.naturalWidth > 0)) {
            await new Promise<void>((resolve) => {
              img.addEventListener("load",  () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            });
          }
          if (img.decode) await img.decode();
        } catch { /* missing image shouldn't block the export */ }
      }),
    );
    // Warm-up pass: html-to-image populates its internal image cache on
    // the first call, so the second call renders reliably. Swallow any
    // warm-up error so a transient failure doesn't abort the real capture.
    const opts = { pixelRatio: EXPORT_PIXEL_RATIO, cacheBust: false, backgroundColor: "#060e1a" };
    try { await toPng(node, opts); } catch { /* warm-up only */ }
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
  // box, etc.) so it doesn't fight text editing.
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
          </p>
        </div>

        {/* Sort dropdown — six options covering name (A-Z / Z-A), price,
            and added-date. Native <select> so it works without extra deps
            and matches OS-level affordances. Reset to page 1 on change is
            handled by an effect higher up. */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <label htmlFor="specs-sort" className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.50)" }}>
            Sort by
          </label>
          <select
            id="specs-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-sm font-bold px-3 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2"
            style={{
              background: "rgba(15,23,42,0.85)",
              border: "1px solid rgba(45,212,191,0.35)",
              color: "#5eead4",
            }}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k} style={{ background: "#0f172a", color: "#fff" }}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        {/* Grid anchor — used for scroll-to-top on page change */}
        <div ref={gridTopRef} />

        {/* 3-column grid of cards. Mobile collapses to 1 column, tablet to 2. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {pageItems.map((paddle, i) => {
            const globalIndex = startIdx + i;
            return (
              <div key={paddle.id} className="flex flex-col gap-2">
                {/* Scaled-card wrapper. The outer div is aspect-ratio 4:5
                    and uses container-type: inline-size so the inner
                    600 × 750 card scales to exactly the column width via
                    `transform: scale(calc(100cqw / 600px))`. Result:
                    proportions are identical to the PNG export at any
                    viewport, no flicker, no JS measurement. */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "4 / 5",
                    containerType: "inline-size",
                  } as React.CSSProperties}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: EXPORT_WIDTH,
                      height: EXPORT_HEIGHT,
                      transformOrigin: "top left",
                      // Modern CSS: dividing a length by a length yields a
                      // unitless number that scale() accepts. Supported in
                      // all evergreen browsers since 2023.
                      transform: `scale(calc(100cqw / ${EXPORT_WIDTH}px))`,
                    }}
                  >
                    <div ref={(el) => { cardRefs.current[i] = el; }}>
                      <TrendingCard
                        paddle={paddle}
                        rank={0}           // hide podium badge — these aren't ranked
                        code={getCode(paddle.brand, paddle.discountLink)}
                        totalCards={0}     // hide bottom dot pager
                      />
                    </div>
                  </div>
                </div>

                {/* Index + name caption + download button. Always visible
                    on /specs — the page is unlinked from nav, so it's
                    admin-discoverable rather than gated by an unlock. */}
                <div className="flex items-center justify-between gap-3 px-1">
                  <p className="text-sm font-bold truncate" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <span className="font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.40)" }}>
                      #{String(globalIndex + 1).padStart(3, "0")}
                    </span>{" "}
                    {paddle.brand} {paddle.name}
                  </p>
                  <button
                    onClick={() => downloadOne(i)}
                    disabled={exporting !== null}
                    aria-label={`Download ${paddle.brand} ${paddle.name} card as PNG`}
                    className="inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-lg flex-shrink-0 transition-all hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
                    style={{ background: "rgba(20,184,166,0.18)", border: "1px solid rgba(45,212,191,0.40)", color: "#5eead4" }}
                  >
                    {exporting === i
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                      : <><Download className="w-3.5 h-3.5" /> PNG</>}
                  </button>
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
