// ─────────────────────────────────────────────────────────────────────────────
//  /specs — admin spec-card index of every paddle in the catalog.
//  Premium redesign: editorial hero, sticky controls bar, floating card grid.
//  All functional machinery (sort, pagination, format toggle, PNG export) is
//  preserved exactly; only the visual presentation changed.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, Search, X } from "lucide-react";
import { toPng } from "html-to-image";
import { paddles } from "@/data/paddles";
import TrendingCard, {
  EXPORT_PIXEL_RATIO,
  EXPORT_WIDTH,
  FORMAT_SPECS,
  getCode,
  type CardFormat,
} from "@/components/TrendingCard";

const PAGE_SIZE = 18;

type SortKey = "az" | "za" | "price-asc" | "price-desc" | "newest" | "oldest";

const SORT_LABELS: Record<SortKey, string> = {
  "az":         "A → Z",
  "za":         "Z → A",
  "price-asc":  "Price: Low → High",
  "price-desc": "Price: High → Low",
  "newest":     "Newest First",
  "oldest":     "Oldest First",
};

function parsePrice(p?: string): number {
  if (!p) return Infinity;
  const n = parseFloat(p.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : Infinity;
}

export default function SpecsPage() {
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [format, setFormat] = useState<CardFormat>("ig");
  const [searchQuery, setSearchQuery] = useState("");
  const { width: cardDesignWidth, height: cardDesignHeight, aspect: cardAspect } = FORMAT_SPECS[format];

  const sorted = useMemo(() => {
    const arr = [...paddles];
    switch (sortKey) {
      case "az":        return arr.sort((a, b) => { const bc = a.brand.localeCompare(b.brand); return bc !== 0 ? bc : a.name.localeCompare(b.name); });
      case "za":        return arr.sort((a, b) => { const bc = b.brand.localeCompare(a.brand); return bc !== 0 ? bc : b.name.localeCompare(a.name); });
      case "price-asc": return arr.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      case "price-desc":return arr.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      case "newest":    return arr.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
      case "oldest":    return arr.sort((a, b) => a.addedAt.localeCompare(b.addedAt));
    }
  }, [sortKey]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) =>
      `${p.brand} ${p.name}`.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const [page, setPage] = useState(1);
  const [jumpValue, setJumpValue] = useState("");

  useEffect(() => { setPage(1); }, [sortKey, searchQuery]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const exportCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState<number | null>(null);

  function fileName(paddleSlug: string, globalIndex: number): string {
    return `${String(globalIndex + 1).padStart(3, "0")}-${paddleSlug}-${format}.png`;
  }

  async function captureCard(visibleIndex: number): Promise<string> {
    const node = exportCardRefs.current[visibleIndex];
    if (!node) throw new Error(`card ${visibleIndex} not mounted`);
    if (document.fonts?.ready) await document.fonts.ready;
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

  useEffect(() => {
    cardRefs.current = [];
    exportCardRefs.current = [];
  }, [page]);

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

  const gridTopRef = useRef<HTMLDivElement | null>(null);
  function changePage(next: number) {
    setPage(next);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ paddingTop: "calc(var(--topbar-h, 0px) + 88px)", paddingBottom: "72px" }}
      >
        {/* Atmospheric glow behind title */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "900px",
            height: "420px",
            background: "radial-gradient(ellipse, rgba(90,157,249,0.11) 0%, transparent 68%)",
            pointerEvents: "none",
          }}
        />
        {/* Subtle horizontal rule above */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "calc(var(--topbar-h, 0px) + 0px)",
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(90,157,249,0.2) 30%, rgba(90,157,249,0.2) 70%, transparent)",
            pointerEvents: "none",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 text-center relative" style={{ zIndex: 1 }}>
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-3 mb-7">
            <span
              aria-hidden
              style={{ height: "1px", width: "48px", background: "linear-gradient(90deg, transparent, rgba(90,157,249,0.55))" }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.50em",
                textTransform: "uppercase",
                color: "#5a9df9",
              }}
            >
              PlaybookPaddles
            </span>
            <span
              aria-hidden
              style={{ height: "1px", width: "48px", background: "linear-gradient(90deg, rgba(90,157,249,0.55), transparent)" }}
            />
          </div>

          {/* Display title */}
          <h1
            style={{
              fontSize: "clamp(58px, 10vw, 108px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 0.88,
              margin: "0 0 32px",
              color: "var(--text-primary)",
            }}
          >
            Spec Sheets
          </h1>

          {/* Meta line */}
          <div
            className="flex items-center justify-center flex-wrap"
            style={{ gap: "16px", fontSize: "13px", color: "var(--text-muted)" }}
          >
            <span>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{filtered.length}</span>
              {searchQuery.trim() ? " results" : " paddles"}
            </span>
            <span aria-hidden style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--text-muted)", opacity: 0.4, display: "inline-block" }} />
            <span>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{PAGE_SIZE}</span>
              {" per page"}
            </span>
            <span aria-hidden style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--text-muted)", opacity: 0.4, display: "inline-block" }} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <kbd style={{ fontFamily: "ui-monospace, monospace", background: "rgba(90,157,249,0.08)", border: "1px solid rgba(90,157,249,0.22)", borderRadius: "5px", padding: "1px 7px", fontSize: "11px", color: "#5a9df9", fontWeight: 700 }}>←</kbd>
              <kbd style={{ fontFamily: "ui-monospace, monospace", background: "rgba(90,157,249,0.08)", border: "1px solid rgba(90,157,249,0.22)", borderRadius: "5px", padding: "1px 7px", fontSize: "11px", color: "#5a9df9", fontWeight: 700 }}>→</kbd>
              <span>flip pages</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Sticky controls bar ───────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: "var(--topbar-h, 0px)",
          zIndex: 30,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          background: "rgba(6,14,26,0.88)",
          borderTop: "1px solid rgba(90,157,249,0.10)",
          borderBottom: "1px solid rgba(90,157,249,0.10)",
        }}
      >
        <div
          className="max-w-7xl mx-auto px-6"
          style={{
            display: "flex",
            alignItems: "center",
            height: "52px",
            gap: "12px",
          }}
        >
          {/* Format toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
              Format
            </span>
            <div
              role="radiogroup"
              aria-label="Export format"
              style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(90,157,249,0.18)", borderRadius: "7px", padding: "3px", gap: "2px" }}
            >
              {([ { key: "ig" as const, label: "IG · 4:5" }, { key: "yt" as const, label: "YT · 16:9" } ]).map((opt) => {
                const active = format === opt.key;
                return (
                  <button
                    key={opt.key}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFormat(opt.key)}
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 11px",
                      borderRadius: "5px",
                      border: "none",
                      cursor: "pointer",
                      background: active ? "rgba(90,157,249,0.20)" : "transparent",
                      color: active ? "#5a9df9" : "rgba(255,255,255,0.38)",
                      letterSpacing: "0.03em",
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 280, margin: "0 16px" }}>
            <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "rgba(90,157,249,0.55)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search paddles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                fontSize: "11px",
                fontWeight: 600,
                padding: "5px 28px 5px 28px",
                borderRadius: "7px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(90,157,249,0.18)",
                color: "var(--text-primary)",
                outline: "none",
                letterSpacing: "0.02em",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.35)", display: "flex" }}
              >
                <X style={{ width: 11, height: 11 }} />
              </button>
            )}
          </div>

          {/* Spacer → pagination in center */}
          <div style={{ flex: 1 }} />

          {/* Center: Pagination controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <button
                onClick={() => changePage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  border: "1px solid rgba(90,157,249,0.18)",
                  background: "rgba(255,255,255,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: page === 1 ? "default" : "pointer",
                  opacity: page === 1 ? 0.22 : 1,
                  color: "rgba(255,255,255,0.75)",
                  transition: "opacity 0.15s",
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.04em",
                  color: "rgba(255,255,255,0.55)",
                  minWidth: "60px",
                  textAlign: "center",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.90)" }}>{page}</span>
                <span style={{ margin: "0 4px", opacity: 0.35 }}>/</span>
                {totalPages}
              </span>

              <button
                onClick={() => changePage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  border: "1px solid rgba(90,157,249,0.18)",
                  background: "rgba(255,255,255,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: page === totalPages ? "default" : "pointer",
                  opacity: page === totalPages ? 0.22 : 1,
                  color: "rgba(255,255,255,0.75)",
                  transition: "opacity 0.15s",
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Spacer ← sort on right */}
          <div style={{ flex: 1 }} />

          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <label htmlFor="specs-sort" style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
              Sort
            </label>
            <select
              id="specs-sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(90,157,249,0.18)",
                color: "#5a9df9",
                outline: "none",
                letterSpacing: "0.03em",
              }}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6" style={{ paddingTop: "48px", paddingBottom: "80px" }}>

        {/* Grid scroll anchor */}
        <div ref={gridTopRef} style={{ scrollMarginTop: "80px" }} />

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "32px", marginBottom: "64px" }}
        >
          {pageItems.map((paddle, i) => {
            const globalIndex = startIdx + i;
            const isExporting = exporting === i;
            return (
              <div key={paddle.id} className="group flex flex-col" style={{ gap: "14px" }}>

                {/* Card shell — hover lifts with a blue rim */}
                <div
                  style={{
                    position: "relative",
                    borderRadius: "18px",
                    overflow: "hidden",
                    boxShadow: "0 2px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(90,157,249,0.07)",
                    transition: "box-shadow 0.22s ease, transform 0.22s ease",
                  }}
                  className="group-hover:shadow-[0_8px_44px_rgba(0,0,0,0.50),0_0_0_1.5px_rgba(90,157,249,0.28)] group-hover:scale-[1.008]"
                >
                  {/* Aspect-ratio wrapper with container-query scale trick */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: cardAspect,
                      containerType: "inline-size",
                    } as React.CSSProperties}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: cardDesignWidth,
                        height: cardDesignHeight,
                        transformOrigin: "top left",
                        transform: `scale(calc(100cqw / ${cardDesignWidth}px))`,
                      }}
                    >
                      <div ref={(el) => { cardRefs.current[i] = el; }}>
                        <TrendingCard
                          paddle={paddle}
                          rank={0}
                          code={getCode(paddle.brand, paddle.discountLink)}
                          totalCards={0}
                          format={format}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caption + download */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "0 2px",
                  }}
                >
                  {/* Name + meta */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {paddle.brand} {paddle.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span style={{ fontFamily: "ui-monospace, monospace", opacity: 0.6 }}>
                        #{String(globalIndex + 1).padStart(3, "0")}
                      </span>
                      {" · "}
                      {paddle.shape} · {paddle.thickness}
                    </p>
                  </div>

                  {/* Download button */}
                  <button
                    onClick={() => downloadOne(i)}
                    disabled={exporting !== null}
                    aria-label={`Download ${paddle.brand} ${paddle.name} card as PNG`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(90,157,249,0.28)",
                      background: isExporting
                        ? "rgba(90,157,249,0.22)"
                        : "rgba(90,157,249,0.07)",
                      color: "#5a9df9",
                      cursor: exporting !== null ? "default" : "pointer",
                      flexShrink: 0,
                      opacity: exporting !== null && !isExporting ? 0.4 : 1,
                      transition: "background 0.15s, opacity 0.15s",
                    }}
                  >
                    {isExporting
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving</>
                      : <><Download className="w-3 h-3" /> PNG</>
                    }
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* ── Bottom pagination + jump-to-page ─────────────────────────── */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {/* Prev / dots / Next */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => changePage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  border: "1px solid rgba(90,157,249,0.18)",
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: page === 1 ? "default" : "pointer",
                  opacity: page === 1 ? 0.22 : 1,
                  color: "var(--text-primary)",
                  transition: "all 0.15s",
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page pills — show up to 7, ellipse the rest */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
                  let p: number;
                  if (totalPages <= 7) {
                    p = idx + 1;
                  } else if (page <= 4) {
                    p = idx < 6 ? idx + 1 : totalPages;
                  } else if (page >= totalPages - 3) {
                    p = idx === 0 ? 1 : totalPages - 6 + idx;
                  } else {
                    const map = [1, page - 2, page - 1, page, page + 1, page + 2, totalPages];
                    p = map[idx];
                  }
                  const isActive = p === page;
                  const isEllipsis =
                    totalPages > 7 &&
                    ((idx === 1 && p !== 2) || (idx === 5 && p !== totalPages - 1));

                  return (
                    <button
                      key={idx}
                      onClick={() => !isEllipsis && changePage(p)}
                      aria-label={isEllipsis ? undefined : `Page ${p}`}
                      aria-current={isActive ? "page" : undefined}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        border: isActive
                          ? "1px solid rgba(90,157,249,0.45)"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: isActive
                          ? "rgba(90,157,249,0.18)"
                          : "rgba(255,255,255,0.02)",
                        color: isActive ? "#5a9df9" : "var(--text-muted)",
                        fontSize: "12px",
                        fontWeight: isActive ? 800 : 600,
                        cursor: isEllipsis ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {isEllipsis ? "…" : p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => changePage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  border: "1px solid rgba(90,157,249,0.18)",
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: page === totalPages ? "default" : "pointer",
                  opacity: page === totalPages ? 0.22 : 1,
                  color: "var(--text-primary)",
                  transition: "all 0.15s",
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Jump to page */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = parseInt(jumpValue, 10);
                if (Number.isFinite(n) && n >= 1 && n <= totalPages) {
                  changePage(n);
                  setJumpValue("");
                }
              }}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="number"
                min={1}
                max={totalPages}
                placeholder="Jump"
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "ui-monospace, monospace",
                  padding: "7px 10px",
                  borderRadius: "7px",
                  width: "68px",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(90,157,249,0.18)",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
              <button
                type="submit"
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "7px 14px",
                  borderRadius: "7px",
                  border: "1px solid rgba(90,157,249,0.25)",
                  background: "rgba(90,157,249,0.08)",
                  color: "#5a9df9",
                  cursor: "pointer",
                }}
              >
                Go
              </button>
            </form>
          </div>
        )}

      </div>

      {/* ── Hidden off-screen export cards (always dark) ─────────────────── */}
      <div aria-hidden style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }}>
        {pageItems.map((paddle, i) => (
          <div
            key={paddle.id}
            ref={(el) => { exportCardRefs.current[i] = el; }}
            style={{ width: FORMAT_SPECS[format].width }}
          >
            <TrendingCard
              paddle={paddle}
              rank={0}
              code={getCode(paddle.brand, paddle.discountLink)}
              totalCards={0}
              format={format}
              forExport={true}
            />
          </div>
        ))}
      </div>

    </div>
  );
}
