"use client";

import { useRef, useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { Paddle } from "@/types";

interface Props {
  paddle: Paddle;
  weekDate: string; // YYYY-MM-DD
}

// ── Dimensions (16:9 standard YouTube / widescreen thumbnail) ────────────────
const W = 1280;
const H = 720;

function formatWeek(date: string): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function WeeklyThumbnail({ paddle, weekDate }: Props) {
  const router = useRouter();
  const thumbRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!thumbRef.current || busy) return;
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const opts = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#06101e",
        width: W,
        height: H,
      };
      // Warm-up pass — html-to-image's first capture sometimes misses fonts/images.
      await toPng(thumbRef.current, opts);
      const dataUrl = await toPng(thumbRef.current, opts);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `weekly-top1-${weekDate}-${paddle.slug}.png`;
      a.click();
    } catch (err) {
      console.error("Thumbnail export failed:", err);
      alert("Thumbnail export failed. See console for details.");
    } finally {
      setBusy(false);
    }
  }

  const dateFormatted = formatWeek(weekDate);
  const specs = [
    paddle.swingWeight > 0 ? `SW ${paddle.swingWeight}` : null,
    paddle.twistWeight > 0 ? `TW ${paddle.twistWeight}` : null,
    paddle.weight || null,
    paddle.thickness || null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-5">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={download}
          disabled={busy}
          className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl bg-green-500 text-black hover:bg-green-400 disabled:opacity-60 transition"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {busy ? "Building…" : `Download PNG (${W}×${H} @ 2×)`}
        </button>
        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 transition"
          title="Refresh — pulls the latest weekly_rankings row in case the cron just ran"
        >
          <RefreshCw className="w-4 h-4" /> Refresh data
        </button>
        <p className="text-xs text-gray-500">
          Week of <span className="text-gray-300 font-semibold">{dateFormatted}</span> ·
          Featured: <span className="text-gray-300 font-semibold">{paddle.brand} {paddle.name}</span>
        </p>
      </div>

      {/* Live preview — exactly what the PNG will look like, sized down to fit on screen */}
      <div
        className="rounded-2xl overflow-hidden border border-gray-800"
        style={{
          width: "min(100%, 1100px)",
          aspectRatio: `${W} / ${H}`,
        }}
      >
        <div
          style={{
            width: W,
            height: H,
            transform: "scale(calc(min(100%, 1100px) / 1280))",
            transformOrigin: "top left",
          }}
        >
          <ThumbDesign paddle={paddle} dateFormatted={dateFormatted} specs={specs} />
        </div>
      </div>

      {/* The capture source — full-size, off-screen, identical markup */}
      <div aria-hidden style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }}>
        <div ref={thumbRef} style={{ width: W, height: H }}>
          <ThumbDesign paddle={paddle} dateFormatted={dateFormatted} specs={specs} />
        </div>
      </div>
    </div>
  );
}

// ── The thumbnail itself ─────────────────────────────────────────────────────
// Premium editorial-magazine treatment: navy + champagne + teal palette,
// paddle on the LEFT (mirrors the typical YouTube thumbnail flow), text on the
// RIGHT, no headshot, no "TOP 10" wordmark — focuses on the single #1 paddle.

function ThumbDesign({
  paddle,
  dateFormatted,
  specs,
}: {
  paddle: Paddle;
  dateFormatted: string;
  specs: string[];
}) {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: [
          // Soft teal aurora — upper-left
          "radial-gradient(ellipse 70% 60% at 25% -10%, rgba(20,184,166,0.20) 0%, transparent 65%)",
          // Champagne warm accent — lower-right
          "radial-gradient(ellipse 60% 55% at 105% 110%, rgba(212,163,90,0.13) 0%, transparent 60%)",
          // Base navy gradient
          "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #08182a 100%)",
        ].join(", "),
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.06)",
          "inset 0 0 0 1px rgba(255,255,255,0.03)",
          "inset 0 -80px 140px rgba(0,0,0,0.35)",
        ].join(", "),
      }}
    >
      {/* Top branding bar with thin gold accent rule */}
      <div className="absolute" style={{ top: 36, left: 60, right: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            display: "inline-block",
            width: 32,
            height: 1.5,
            background: "linear-gradient(90deg, transparent, #d4a574)",
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.35em",
            color: "rgba(212,163,90,0.85)",
            textTransform: "uppercase",
          }}
        >
          Playbook Paddles
        </span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(212,163,90,0.18), transparent)" }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
          }}
        >
          Week of {dateFormatted}
        </span>
      </div>

      {/* Two-column grid: paddle LEFT, headline block RIGHT */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 60,
          right: 60,
          bottom: 80,
          display: "grid",
          gridTemplateColumns: "45% 55%",
          gap: 40,
        }}
      >
        {/* LEFT — paddle image */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {paddle.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={paddle.image}
              alt={`${paddle.brand} ${paddle.name}`}
              style={{
                maxHeight: "100%",
                width: "auto",
                position: "relative",
                zIndex: 1,
                filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.65)) drop-shadow(0 8px 16px rgba(0,0,0,0.4))",
              }}
            />
          )}
          {/* Pedestal glow under the paddle */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 32,
              width: "62%",
              height: 12,
              borderRadius: 999,
              background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 75%)",
              filter: "blur(10px)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* RIGHT — editorial headline block */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#f4d28a",
                boxShadow: "0 0 12px rgba(244,210,138,0.6)",
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "0.32em",
                color: "rgba(244,210,138,0.95)",
                textTransform: "uppercase",
              }}
            >
              This Week&apos;s #1
            </span>
          </div>

          {/* Brand */}
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "rgba(94,234,212,0.95)",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {paddle.brand}
          </p>

          {/* Paddle name — the hero */}
          <h2
            style={{
              fontSize: 96,
              fontWeight: 900,
              lineHeight: 0.93,
              letterSpacing: "-0.025em",
              color: "#ffffff",
              margin: 0,
              textShadow: "0 6px 30px rgba(0,0,0,0.5)",
            }}
          >
            {paddle.name}
          </h2>

          {/* Spec pills */}
          {specs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {specs.map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    color: "rgba(255,255,255,0.7)",
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom footer rule + URL */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 60,
          right: 60,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span
          style={{
            flex: 1,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.30), transparent)",
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.32em",
            color: "rgba(94,234,212,0.85)",
            textTransform: "uppercase",
          }}
        >
          PlaybookPaddles.com
        </span>
        <span
          style={{
            flex: 1,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.30), transparent)",
          }}
        />
      </div>
    </div>
  );
}
