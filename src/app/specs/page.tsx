// ─────────────────────────────────────────────────────────────────────────────
//  /specs — admin-friendly spec-card index of every paddle in the catalog.
//
//  Same 1:1 IG-export card the /trending top-10 page uses, except:
//    - no rank badge (every paddle, not a ranked subset)
//    - no bottom dot indicators (there'd be hundreds)
//    - pager arrows + jump-to-position counter scoped to the whole catalog
//    - download buttons (single + bulk .zip) are admin-only, unlocked via
//      /specs?export=<secret> exactly the way /trending does it. Without the
//      unlock the page is a silent read-only browser of the cards.
//
//  Not linked from the main nav — the user wants this discoverable only by
//  typing /specs directly. No robots block (admin URL, not secret data), but
//  no internal links either.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { paddles } from "@/data/paddles";
import TrendingCard, { EXPORT_WIDTH, getCode } from "@/components/TrendingCard";

// Same unlock pattern as /trending — visit /specs?export=<secret> once on a
// device to flip a localStorage flag and reveal the download buttons. The
// secret intentionally differs from the trending one so revoking one doesn't
// revoke the other.
const EXPORT_SECRET = "sp3cs-export-7k4j";
const EXPORT_UNLOCK_FLAG = "pb-specs-export-unlocked";

export default function SpecsPage() {
  // Sort alphabetically (brand, then name) so browsing the catalog is
  // predictable. The pager indexes into this sorted array directly.
  const sorted = useMemo(
    () => [...paddles].sort((a, b) => {
      const bc = a.brand.localeCompare(b.brand);
      return bc !== 0 ? bc : a.name.localeCompare(b.name);
    }),
    [],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [jumpValue, setJumpValue] = useState("");

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

  // ── PNG export — identical pipeline to /trending ──────────────────────────
  // Hidden, fixed-size copies of every card are the capture source, so single
  // and bulk downloads always produce identical, screen-independent PNGs.
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState<"none" | "all" | number>("none");

  function fileName(index: number): string {
    const slug = sorted[index]?.slug ?? `paddle-${index + 1}`;
    return `${String(index + 1).padStart(3, "0")}-${slug}.png`;
  }

  async function captureCard(index: number): Promise<string> {
    const node = exportRefs.current[index];
    if (!node) throw new Error(`card ${index} not mounted`);
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
    if (exporting !== "none" || sorted.length === 0) return;
    setExporting("all");
    try {
      const zip = new JSZip();
      for (let i = 0; i < sorted.length; i++) {
        const dataUrl = await captureCard(i);
        zip.file(fileName(i), dataUrl.split(",")[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `playbook-specs-all-${new Date().toISOString().slice(0, 10)}.zip`);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Bulk export failed:", err);
      alert("Sorry — the bulk export failed. Please try again.");
    } finally {
      setExporting("none");
    }
  }

  // ⌘I / Ctrl+I downloads the full zip — same hotkey /trending uses, so muscle
  // memory carries over.
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

  // Arrow-key navigation — handy for browsing the catalog one card at a time.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Ignore keypresses inside text inputs (the jump-to box, etc.).
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft")  setCurrentIndex((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setCurrentIndex((p) => Math.min(sorted.length - 1, p + 1));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sorted.length]);

  const current = sorted[currentIndex];

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "#060e1a" }}>
      <div className="max-w-[640px] mx-auto px-4">

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
            {sorted.length} paddles · arrow keys to browse · same card the trending page uses
          </p>
        </div>

        {/* Card + side-positioned nav arrows */}
        {current && (
          <>
            <div className="relative">
              <TrendingCard
                paddle={current}
                rank={0}           // hide podium badge — these aren't ranked
                code={getCode(current.brand, current.discountLink)}
                totalCards={0}     // hide bottom dot pager — too many to render
              />

              {/* Prev */}
              <button
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                aria-label="Previous paddle"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-20 z-20 hover:scale-105"
                style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              {/* Next */}
              <button
                onClick={() => setCurrentIndex((p) => Math.min(sorted.length - 1, p + 1))}
                disabled={currentIndex >= sorted.length - 1}
                aria-label="Next paddle"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-20 z-20 hover:scale-105"
                style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Position counter + jump-to box. The jump field is the practical
                concession to having hundreds of cards instead of 10 — clicking
                through arrows one at a time would be tedious past index 20. */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-sm font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>
                {currentIndex + 1} / {sorted.length}
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = parseInt(jumpValue, 10);
                  if (Number.isFinite(n) && n >= 1 && n <= sorted.length) {
                    setCurrentIndex(n - 1);
                    setJumpValue("");
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="number"
                  min={1}
                  max={sorted.length}
                  placeholder="Jump to #"
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  className="text-sm font-mono px-3 py-1 rounded-md w-24 text-center tabular-nums"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                />
                <button
                  type="submit"
                  className="text-xs font-bold px-3 py-1 rounded-md"
                  style={{ background: "rgba(20,184,166,0.18)", border: "1px solid rgba(45,212,191,0.35)", color: "#5eead4" }}
                >
                  Go
                </button>
              </form>
            </div>

            {/* Current paddle's brand+name spelled out below the pager so the
                admin can confirm what they're about to download without having
                to count from #1. */}
            <p className="text-center text-sm font-bold mt-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              {current.brand} {current.name}
            </p>

            {/* Download buttons — admin-only (unlocked via ?export=<secret>) */}
            {canExport && <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <button
                onClick={() => downloadOne(currentIndex)}
                disabled={exporting !== "none"}
                className="inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 w-full sm:w-auto"
                style={{ background: "#14b8a6" }}
              >
                {exporting === currentIndex
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Download className="w-4 h-4" /> Download this card</>}
              </button>
              <button
                onClick={downloadAll}
                disabled={exporting !== "none"}
                className="inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 w-full sm:w-auto"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
              >
                {exporting === "all"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Building zip…</>
                  : <><Download className="w-4 h-4" /> Download all {sorted.length} (.zip)</>}
              </button>
            </div>}
            {canExport && (
              <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                Tip: press <kbd className="font-mono font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>⌘I</kbd> (or <kbd className="font-mono font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>Ctrl+I</kbd>) for the full zip, or <kbd className="font-mono font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>←</kbd>/<kbd className="font-mono font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>→</kbd> to flip between paddles.
              </p>
            )}
          </>
        )}

      </div>

      {/* Hidden fixed-size copies — the PNG capture source. Positioned off-screen
          (not display:none / opacity:0) so they keep real layout and images load.
          Only mounted for the admin so normal visitors render nothing extra. */}
      {canExport && <div aria-hidden style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }}>
        {sorted.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => { exportRefs.current[i] = el; }}
            style={{ width: EXPORT_WIDTH }}
          >
            <TrendingCard
              paddle={p}
              rank={0}
              code={getCode(p.brand, p.discountLink)}
              totalCards={0}
            />
          </div>
        ))}
      </div>}
    </div>
  );
}
