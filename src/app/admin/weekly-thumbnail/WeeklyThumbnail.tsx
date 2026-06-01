"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { Paddle } from "@/types";

interface Props {
  paddles: Paddle[]; // up to 3 — middle paddle gets the elevated hero slot
}

// Square Instagram-grade format. 1080x1080 source → 2160x2160 retina PNG.
const SIZE = 1080;

// Compute the current week's Monday in UTC, matching the cron's weekDate logic.
function thisWeeksMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((day + 6) % 7));
  return monday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function WeeklyThumbnail({ paddles }: Props) {
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
        width: SIZE,
        height: SIZE,
      };
      await toPng(thumbRef.current, opts); // warm-up
      const dataUrl = await toPng(thumbRef.current, opts);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `weekly-top10-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (err) {
      console.error("Thumbnail export failed:", err);
      alert("Thumbnail export failed. See console for details.");
    } finally {
      setBusy(false);
    }
  }

  const weekOf = thisWeeksMonday();

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
          {busy ? "Building…" : `Download PNG (${SIZE}×${SIZE} @ 2×)`}
        </button>
        <p className="text-xs text-gray-500">
          Week of <span className="text-gray-300 font-semibold">{weekOf}</span> · Featuring:{" "}
          <span className="text-gray-300 font-semibold">{paddles.map((p) => `${p.brand} ${p.name}`).join(" · ")}</span>
        </p>
      </div>

      {/* Live preview — scaled to fit screen */}
      <div
        className="rounded-2xl overflow-hidden border border-gray-800"
        style={{ width: "min(100%, 720px)", aspectRatio: "1 / 1" }}
      >
        <div
          style={{
            width: SIZE,
            height: SIZE,
            transform: "scale(calc(min(100%, 720px) / 1080))",
            transformOrigin: "top left",
          }}
        >
          <ThumbDesign paddles={paddles} weekOf={weekOf} />
        </div>
      </div>

      {/* Capture source — full-size, off-screen */}
      <div aria-hidden style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }}>
        <div ref={thumbRef} style={{ width: SIZE, height: SIZE }}>
          <ThumbDesign paddles={paddles} weekOf={weekOf} />
        </div>
      </div>
    </div>
  );
}

// ── The thumbnail itself — 1080×1080 square ───────────────────────────────────
// Vertical stack: top branding bar → headline block (centered, capped width
// so no overflow) → 3 paddles fanned → Austin badge → footer URL.

function ThumbDesign({ paddles, weekOf }: { paddles: Paddle[]; weekOf: string }) {
  const PAD = 70; // outer padding

  return (
    <div
      style={{
        position: "relative",
        width: SIZE,
        height: SIZE,
        overflow: "hidden",
        background: [
          "radial-gradient(ellipse 75% 55% at 50% -5%, rgba(20,184,166,0.22) 0%, transparent 65%)",
          "radial-gradient(ellipse 65% 55% at 110% 110%, rgba(212,163,90,0.14) 0%, transparent 60%)",
          "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #08182a 100%)",
        ].join(", "),
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.06)",
          "inset 0 0 0 1px rgba(255,255,255,0.03)",
          "inset 0 -100px 160px rgba(0,0,0,0.35)",
        ].join(", "),
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* TOP — branding bar */}
      <div
        style={{
          padding: `40px ${PAD}px 0 ${PAD}px`,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span style={{ display: "inline-block", width: 28, height: 1.5, background: "linear-gradient(90deg, transparent, #d4a574)" }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.32em",
            color: "rgba(212,163,90,0.85)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Playbook Paddles
        </span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(212,163,90,0.18), transparent)" }} />
      </div>

      {/* HEADLINE BLOCK — centered with explicit max-width to prevent overflow */}
      <div
        style={{
          padding: `40px ${PAD}px 0 ${PAD}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
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
            This Week&apos;s Rankings
          </span>
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "-0.025em",
            color: "#ffffff",
            margin: 0,
            maxWidth: SIZE - PAD * 2,
            textShadow: "0 6px 30px rgba(0,0,0,0.5)",
          }}
        >
          The Top 10 Paddles
        </h1>

        {/* Subhead */}
        <p
          style={{
            margin: "16px 0 0 0",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.10em",
            color: "rgba(94,234,212,0.95)",
            textTransform: "uppercase",
          }}
        >
          Week of {weekOf}
        </p>
      </div>

      {/* MIDDLE — 3 paddles fanned (middle = elevated hero) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: `30px ${PAD}px 0 ${PAD}px`,
          perspective: "800px",
        }}
      >
        {paddles.slice(0, 3).map((p, i, arr) => {
          const isCenter = i === 1 && arr.length >= 3;
          const isLeft = i === 0 && arr.length >= 2;
          const isRight = i === arr.length - 1 && arr.length >= 2 && !isCenter;
          const rotate = isLeft ? 6 : isRight ? -6 : 0;
          const translateY = isCenter ? -30 : 0;
          const z = isCenter ? 3 : 1;
          const widthPx = isCenter ? 240 : 200;
          const maxH = isCenter ? 420 : 370;
          return (
            <div
              key={p.slug}
              style={{
                position: "relative",
                width: widthPx,
                marginLeft: i > 0 ? -24 : 0,
                transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
                zIndex: z,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={`${p.brand} ${p.name}`}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: maxH,
                    objectFit: "contain",
                    filter: `drop-shadow(0 ${isCenter ? 30 : 22}px ${isCenter ? 50 : 40}px rgba(0,0,0,0.65)) drop-shadow(0 8px 16px rgba(0,0,0,0.4))`,
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: -10,
                  width: "70%",
                  height: 10,
                  borderRadius: 999,
                  background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 75%)",
                  filter: "blur(8px)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* AUSTIN BADGE — bottom-left */}
      <div
        style={{
          padding: `0 ${PAD}px 20px ${PAD}px`,
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 30,
        }}
      >
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: 18,
            overflow: "hidden",
            border: "2.5px solid rgba(45,212,191,0.55)",
            boxShadow: "0 8px 24px rgba(20,184,166,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
            background: "#0a1628",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/Austin-head-shot.png" alt="Austin Hardy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(45,212,191,0.9)",
            }}
          >
            Reviewed By
          </span>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.01em" }}>Austin Hardy</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
            Founder · Pickleball Playbook
          </span>
        </div>
      </div>

      {/* FOOTER — URL with teal rules */}
      <div
        style={{
          padding: `0 ${PAD}px 32px ${PAD}px`,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.30), transparent)" }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.30em",
            color: "rgba(94,234,212,0.85)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          PlaybookPaddles.com
        </span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.30), transparent)" }} />
      </div>
    </div>
  );
}
